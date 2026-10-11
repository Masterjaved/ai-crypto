import { create } from 'zustand';
import type { Ticker, Candle, Timeframe, SystemHealth } from '@/types';
import { SUPPORTED_SYMBOLS, fetchAllTickers, fetchCandles, wsManager } from '@/services/marketData';

interface MarketState {
  tickers: Record<string, Ticker>;
  candles: Record<string, Candle[]>; // key: `${symbol}_${timeframe}`
  selectedSymbol: string;
  selectedTimeframe: Timeframe;
  health: SystemHealth;
  isLoadingTickers: boolean;
  isLoadingCandles: boolean;
  tickerError: string | null;
  candleError: string | null;

  // Actions
  setSelectedSymbol: (symbol: string) => void;
  setSelectedTimeframe: (tf: Timeframe) => void;
  updateTicker: (symbol: string, ticker: Ticker) => void;
  updateCandle: (symbol: string, timeframe: Timeframe, candle: Candle) => void;
  setCandles: (symbol: string, timeframe: Timeframe, candles: Candle[]) => void;
  updateHealth: (health: Partial<SystemHealth>) => void;
  loadTickers: () => Promise<void>;
  loadCandles: (symbol: string, timeframe: Timeframe) => Promise<void>;
  startWebSocket: () => void;
  stopWebSocket: () => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  tickers: {},
  candles: {},
  selectedSymbol: 'BTCUSDT',
  selectedTimeframe: '1h',
  health: {
    marketDataStatus: 'disconnected',
    webSocketStatus: 'disconnected',
    databaseStatus: 'unknown',
    signalEngineStatus: 'stopped',
    lastDataUpdate: null,
    dataLatencyMs: null,
    apiProvider: 'Binance',
    wsProvider: 'Binance WebSocket',
  },
  isLoadingTickers: false,
  isLoadingCandles: false,
  tickerError: null,
  candleError: null,

  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
  setSelectedTimeframe: (tf) => set({ selectedTimeframe: tf }),

  updateTicker: (symbol, ticker) =>
    set(state => ({
      tickers: { ...state.tickers, [symbol]: ticker },
      health: { ...state.health, lastDataUpdate: Date.now(), marketDataStatus: 'connected' },
    })),

  updateCandle: (symbol, timeframe, candle) => {
    const key = `${symbol}_${timeframe}`;
    set(state => {
      const existing = state.candles[key] || [];
      const lastIdx = existing.findIndex(c => c.time === candle.time);
      let updated: Candle[];
      if (lastIdx >= 0) {
        // Update existing candle (live update)
        updated = [...existing];
        updated[lastIdx] = candle;
      } else {
        // New candle
        updated = [...existing, candle].sort((a, b) => a.time - b.time);
      }
      return { candles: { ...state.candles, [key]: updated } };
    });
  },

  setCandles: (symbol, timeframe, candles) => {
    const key = `${symbol}_${timeframe}`;
    set(state => ({ candles: { ...state.candles, [key]: candles } }));
  },

  updateHealth: (h) => set(state => ({ health: { ...state.health, ...h } })),

  loadTickers: async () => {
    set({ isLoadingTickers: true, tickerError: null });
    const start = Date.now();
    const result = await fetchAllTickers(SUPPORTED_SYMBOLS);
    if (Object.keys(result).length > 0) {
      set(state => ({
        tickers: { ...state.tickers, ...result },
        isLoadingTickers: false,
        health: {
          ...state.health,
          marketDataStatus: 'connected',
          lastDataUpdate: Date.now(),
          dataLatencyMs: Date.now() - start,
        },
      }));
    } else {
      set({
        isLoadingTickers: false,
        tickerError: 'Failed to fetch market data from Binance.',
      });
    }
  },

  loadCandles: async (symbol, timeframe) => {
    set({ isLoadingCandles: true, candleError: null });
    const candles = await fetchCandles(symbol, timeframe, 500);
    if (candles.length > 0) {
      get().setCandles(symbol, timeframe, candles);
      set({ isLoadingCandles: false });
    } else {
      set({ isLoadingCandles: false, candleError: 'Failed to load candle data.' });
    }
  },

  startWebSocket: () => {
    const { selectedSymbol, selectedTimeframe, updateTicker, updateCandle, updateHealth } = get();

    // Subscribe to ticker for all supported symbols
    for (const symbol of SUPPORTED_SYMBOLS) {
      wsManager.subscribe({
        type: 'ticker',
        symbol,
        callback: (ticker) => updateTicker(symbol, ticker),
      });
    }

    // Subscribe to selected symbol kline
    wsManager.subscribe({
      type: 'kline',
      symbol: selectedSymbol,
      timeframe: selectedTimeframe,
      callback: (candle) => updateCandle(selectedSymbol, selectedTimeframe, candle),
    });

    // Track WS status
    wsManager.onStatusChange((status) => {
      updateHealth({ webSocketStatus: status as SystemHealth['webSocketStatus'] });
    });
  },

  stopWebSocket: () => {
    wsManager.disconnect();
  },
}));
