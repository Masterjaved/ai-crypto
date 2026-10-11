import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, decimals = 2): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(decimals);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(8);
}

export function formatPercent(pct: number, showSign = true): string {
  const sign = showSign && pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

export function formatVolume(vol: number): string {
  if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
  if (vol >= 1e3) return `${(vol / 1e3).toFixed(2)}K`;
  return vol.toFixed(2);
}

export function formatUSDT(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatTimestamp(ts: number): string {
  return format(new Date(ts), 'MMM dd, HH:mm:ss');
}

export function formatRelativeTime(ts: number): string {
  return formatDistanceToNow(new Date(ts), { addSuffix: true });
}

export function pctChange(from: number, to: number): number {
  if (from === 0) return 0;
  return ((to - from) / Math.abs(from)) * 100;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getSymbolName(symbol: string): string {
  const names: Record<string, string> = {
    BTCUSDT: 'Bitcoin',
    ETHUSDT: 'Ethereum',
    BNBUSDT: 'BNB',
    SOLUSDT: 'Solana',
    XRPUSDT: 'XRP',
    DOGEUSDT: 'Dogecoin',
    ADAUSDT: 'Cardano',
    TRXUSDT: 'TRON',
    AVAXUSDT: 'Avalanche',
    DOTUSDT: 'Polkadot',
    LINKUSDT: 'Chainlink',
    MATICUSDT: 'Polygon',
    LTCUSDT: 'Litecoin',
    UNIUSDT: 'Uniswap',
    ATOMUSDT: 'Cosmos',
  };
  return names[symbol] || symbol.replace('USDT', '');
}

export function getBaseAsset(symbol: string): string {
  return symbol.replace('USDT', '');
}

export function isStaleData(timestamp: number, maxAgeMs = 60000): boolean {
  return Date.now() - timestamp > maxAgeMs;
}
