/**
 * Market Data Service
 * Integrates with Binance public REST API and WebSocket.
 * All data is real from Binance; nothing is fabricated.
 * Falls back to REST polling if WebSocket is unavailable.
 */

import axios from 'axios';
import type { Candle, Ticker, Timeframe } from '@/types';

const BINANCE_REST = 'https://api.binance.com/api/v3';
const BINANCE_WS = 'wss://stream.binance.com:9443/ws';
const BINANCE_WS_COMBINED = 'wss://stream.binance.com:9443/stream?streams=';

// Supported symbols
export const SUPPORTED_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT',
  'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'TRXUSDT',
  'AVAXUSDT', 'DOTUSDT', 'LINKUSDT', 'MATICUSDT',
  'LTCUSDT', 'UNIUSDT', 'ATOMUSDT',
];

// Timeframe to Binance interval map
export const TIMEFRAME_MAP: Record<Timeframe, string> = {
  '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
  '1h': '1h', '4h': '4h', '1d': '1d', '1w': '1w',
};

const api = axios.create({
  baseURL: BINANCE_REST,
  timeout: 10000,
});

let lastSuccessfulFetch: number | null = null;

// ===== REST Endpoints =====

export async function fetchTicker(symbol: string): Promise<Ticker | null> {
  try {
    const [tickerRes, bookRes] = await Promise.allSettled([
      api.get('/ticker/24hr', { params: { symbol } }),
      api.get('/ticker/bookTicker', { params: { symbol } }),
    ]);

    if (tickerRes.status !== 'fulfilled') throw new Error('Ticker fetch failed');

    const t = tickerRes.value.data;
    const book = bookRes.status === 'fulfilled' ? bookRes.value.data : null;
    lastSuccessfulFetch = Date.now();

    return {
      symbol: t.symbol,
      baseAsset: t.symbol.replace('USDT', ''),
      quoteAsset: 'USDT',
      price: parseFloat(t.lastPrice),
      priceChange: parseFloat(t.priceChange),
      priceChangePercent: parseFloat(t.priceChangePercent),
      high24h: parseFloat(t.highPrice),
      low24h: parseFloat(t.lowPrice),
      volume24h: parseFloat(t.volume),
      quoteVolume24h: parseFloat(t.quoteVolume),
      openPrice: parseFloat(t.openPrice),
      bidPrice: book ? parseFloat(book.bidPrice) : undefined,
      askPrice: book ? parseFloat(book.askPrice) : undefined,
      lastUpdateTime: Date.now(),
      dataStatus: 'live',
      source: 'Binance',
    };
  } catch (err) {
    console.error(`[MarketData] Failed to fetch ticker for ${symbol}:`, err);
    return null;
  }
}

export async function fetchAllTickers(symbols: string[]): Promise<Record<string, Ticker>> {
  const results: Record<string, Ticker> = {};
  try {
    const [tickersRes] = await Promise.allSettled([
      api.get('/ticker/24hr'),
    ]);

    if (tickersRes.status !== 'fulfilled') throw new Error('All tickers fetch failed');

    const allTickers: Record<string, Ticker> = {};
    for (const t of tickersRes.value.data) {
      if (!symbols.includes(t.symbol)) continue;
      allTickers[t.symbol] = {
        symbol: t.symbol,
        baseAsset: t.symbol.replace('USDT', ''),
        quoteAsset: 'USDT',
        price: parseFloat(t.lastPrice),
        priceChange: parseFloat(t.priceChange),
        priceChangePercent: parseFloat(t.priceChangePercent),
        high24h: parseFloat(t.highPrice),
        low24h: parseFloat(t.lowPrice),
        volume24h: parseFloat(t.volume),
        quoteVolume24h: parseFloat(t.quoteVolume),
        openPrice: parseFloat(t.openPrice),
        lastUpdateTime: Date.now(),
        dataStatus: 'live',
        source: 'Binance',
      };
    }
    lastSuccessfulFetch = Date.now();
    return allTickers;
  } catch (err) {
    console.error('[MarketData] Failed to fetch all tickers:', err);
    return results;
  }
}

export async function fetchCandles(
  symbol: string,
  timeframe: Timeframe,
  limit = 500
): Promise<Candle[]> {
  try {
    const interval = TIMEFRAME_MAP[timeframe];
    const res = await api.get('/klines', {
      params: { symbol, interval, limit },
    });

    const candles: Candle[] = res.data.map((k: unknown[]) => ({
      time: Math.floor((k[0] as number) / 1000), // Unix seconds
      open: parseFloat(k[1] as string),
      high: parseFloat(k[2] as string),
      low: parseFloat(k[3] as string),
      close: parseFloat(k[4] as string),
      volume: parseFloat(k[5] as string),
      isClosed: (k[6] as number) < Date.now(),
    }));

    // Validate: no duplicate timestamps, correct ordering
    const deduped: Candle[] = [];
    const seen = new Set<number>();
    for (const c of candles) {
      if (!seen.has(c.time)) {
        seen.add(c.time);
        deduped.push(c);
      }
    }
    deduped.sort((a, b) => a.time - b.time);

    lastSuccessfulFetch = Date.now();
    return deduped;
  } catch (err) {
    console.error(`[MarketData] Failed to fetch candles for ${symbol}/${timeframe}:`, err);
    return [];
  }
}

export function getLastSuccessfulFetch(): number | null {
  return lastSuccessfulFetch;
}

// ===== WebSocket Manager =====

type TickerCallback = (ticker: Ticker) => void;
type CandleCallback = (candle: Candle, symbol: string, timeframe: Timeframe) => void;

interface WSSubscription {
  type: 'ticker' | 'kline';
  symbol: string;
  timeframe?: Timeframe;
  callback: TickerCallback | CandleCallback;
}

class BinanceWebSocketManager {
  private ws: WebSocket | null = null;
  private subscriptions: WSSubscription[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 2000;
  private maxReconnectDelay = 30000;
  private isConnecting = false;
  private status: 'connected' | 'connecting' | 'disconnected' | 'error' = 'disconnected';
  private statusCallbacks: ((status: string) => void)[] = [];

  getStatus() { return this.status; }

  onStatusChange(cb: (status: string) => void) {
    this.statusCallbacks.push(cb);
    return () => { this.statusCallbacks = this.statusCallbacks.filter(c => c !== cb); };
  }

  private emitStatus(s: 'connected' | 'connecting' | 'disconnected' | 'error') {
    this.status = s;
    this.statusCallbacks.forEach(cb => cb(s));
  }

  subscribe(sub: WSSubscription) {
    this.subscriptions.push(sub);
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
    } else {
      this.sendSubscribe(sub);
    }
    return () => { this.unsubscribe(sub); };
  }

  unsubscribe(sub: WSSubscription) {
    this.subscriptions = this.subscriptions.filter(s => s !== sub);
    if (this.subscriptions.length === 0) this.disconnect();
  }

  private buildStreamNames(): string[] {
    return this.subscriptions.map(s => {
      const sym = s.symbol.toLowerCase();
      if (s.type === 'ticker') return `${sym}@ticker`;
      return `${sym}@kline_${s.timeframe}`;
    });
  }

  private connect() {
    if (this.isConnecting) return;
    this.isConnecting = true;
    this.emitStatus('connecting');

    const streams = this.buildStreamNames();
    if (streams.length === 0) { this.isConnecting = false; return; }

    const url = streams.length === 1
      ? `${BINANCE_WS}/${streams[0]}`
      : `${BINANCE_WS_COMBINED}${streams.join('/')}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectDelay = 2000;
        this.emitStatus('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const data = msg.data || msg;
          if (data.e === '24hrTicker') this.handleTicker(data);
          if (data.e === 'kline') this.handleKline(data);
        } catch (e) {
          console.error('[WS] Parse error:', e);
        }
      };

      this.ws.onerror = () => {
        this.emitStatus('error');
        this.scheduleReconnect();
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        if (this.status !== 'disconnected') {
          this.emitStatus('disconnected');
          this.scheduleReconnect();
        }
      };
    } catch (e) {
      this.isConnecting = false;
      this.emitStatus('error');
      this.scheduleReconnect();
    }
  }

  private sendSubscribe(_sub: WSSubscription) {
    // For combined streams we reconnect to add new streams
    this.reconnect();
  }

  private reconnect() {
    this.disconnect();
    setTimeout(() => this.connect(), 100);
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      this.connect();
    }, this.reconnectDelay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.isConnecting = false;
    this.emitStatus('disconnected');
  }

  private handleTicker(data: Record<string, unknown>) {
    const symbol = (data.s as string);
    const ticker: Ticker = {
      symbol,
      baseAsset: symbol.replace('USDT', ''),
      quoteAsset: 'USDT',
      price: parseFloat(data.c as string),
      priceChange: parseFloat(data.p as string),
      priceChangePercent: parseFloat(data.P as string),
      high24h: parseFloat(data.h as string),
      low24h: parseFloat(data.l as string),
      volume24h: parseFloat(data.v as string),
      quoteVolume24h: parseFloat(data.q as string),
      openPrice: parseFloat(data.o as string),
      bidPrice: parseFloat(data.b as string),
      askPrice: parseFloat(data.a as string),
      lastUpdateTime: Date.now(),
      dataStatus: 'live',
      source: 'Binance WS',
    };

    for (const sub of this.subscriptions) {
      if (sub.type === 'ticker' && sub.symbol === symbol) {
        (sub.callback as TickerCallback)(ticker);
      }
    }
  }

  private handleKline(data: Record<string, unknown>) {
    const k = data.k as Record<string, unknown>;
    const symbol = data.s as string;
    const candle: Candle = {
      time: Math.floor((k.t as number) / 1000),
      open: parseFloat(k.o as string),
      high: parseFloat(k.h as string),
      low: parseFloat(k.l as string),
      close: parseFloat(k.c as string),
      volume: parseFloat(k.v as string),
      isClosed: k.x as boolean,
    };
    const interval = k.i as Timeframe;

    for (const sub of this.subscriptions) {
      if (sub.type === 'kline' && sub.symbol === symbol && sub.timeframe === interval) {
        (sub.callback as CandleCallback)(candle, symbol, interval);
      }
    }
  }
}

export const wsManager = new BinanceWebSocketManager();
