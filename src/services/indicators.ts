/**
 * Technical Indicators Engine
 * All calculations are deterministic and look-behind only.
 * No look-ahead bias. All indicators computed from closed candles only.
 */

import type { Candle, IndicatorValues } from '@/types';

// ===== EMA =====
export function calcEMA(prices: number[], period: number): number[] {
  if (prices.length < period) return [];
  const k = 2 / (period + 1);
  const result: number[] = [];
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period - 1; i < prices.length; i++) {
    if (i === period - 1) { result.push(ema); continue; }
    ema = prices[i] * k + ema * (1 - k);
    result.push(ema);
  }
  return result;
}

export function lastEMA(prices: number[], period: number): number | undefined {
  const ema = calcEMA(prices, period);
  return ema.length > 0 ? ema[ema.length - 1] : undefined;
}

// ===== RSI =====
export function calcRSI(prices: number[], period = 14): number[] {
  if (prices.length <= period) return [];
  const result: number[] = [];
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push(100 - 100 / (1 + rs));

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const r = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push(100 - 100 / (1 + r));
  }
  return result;
}

export function lastRSI(prices: number[], period = 14): number | undefined {
  const rsi = calcRSI(prices, period);
  return rsi.length > 0 ? rsi[rsi.length - 1] : undefined;
}

// ===== MACD =====
export function calcMACD(
  prices: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): { macd: number; signal: number; histogram: number }[] {
  const fastEMA = calcEMA(prices, fastPeriod);
  const slowEMA = calcEMA(prices, slowPeriod);

  // Align: fastEMA is longer, slice to match slowEMA length
  const offset = fastEMA.length - slowEMA.length;
  const macdLine = slowEMA.map((s, i) => fastEMA[i + offset] - s);
  const signalLine = calcEMA(macdLine, signalPeriod);
  const signalOffset = macdLine.length - signalLine.length;

  return signalLine.map((sig, i) => ({
    macd: macdLine[i + signalOffset],
    signal: sig,
    histogram: macdLine[i + signalOffset] - sig,
  }));
}

export function lastMACD(
  prices: number[]
): { macd: number; signal: number; histogram: number } | undefined {
  const m = calcMACD(prices);
  return m.length > 0 ? m[m.length - 1] : undefined;
}

// ===== Bollinger Bands =====
export function calcBollingerBands(
  prices: number[],
  period = 20,
  stdDev = 2
): { upper: number; middle: number; lower: number; bandwidth: number }[] {
  if (prices.length < period) return [];
  const result = [];
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const sd = Math.sqrt(variance);
    const upper = mean + stdDev * sd;
    const lower = mean - stdDev * sd;
    result.push({
      upper,
      middle: mean,
      lower,
      bandwidth: mean > 0 ? ((upper - lower) / mean) * 100 : 0,
    });
  }
  return result;
}

export function lastBB(
  prices: number[]
): { upper: number; middle: number; lower: number; bandwidth: number } | undefined {
  const bb = calcBollingerBands(prices);
  return bb.length > 0 ? bb[bb.length - 1] : undefined;
}

// ===== ATR =====
export function calcATR(candles: Candle[], period = 14): number[] {
  if (candles.length < period + 1) return [];
  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trueRanges.push(tr);
  }
  // Wilder's smoothing
  const result: number[] = [];
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(atr);
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
    result.push(atr);
  }
  return result;
}

export function lastATR(candles: Candle[], period = 14): number | undefined {
  const atr = calcATR(candles, period);
  return atr.length > 0 ? atr[atr.length - 1] : undefined;
}

// ===== ADX =====
export function calcADX(candles: Candle[], period = 14): number[] {
  if (candles.length < period * 2) return [];
  const dmPlus: number[] = [];
  const dmMinus: number[] = [];
  const trueRanges: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const up = candles[i].high - candles[i - 1].high;
    const down = candles[i - 1].low - candles[i].low;
    dmPlus.push(up > down && up > 0 ? up : 0);
    dmMinus.push(down > up && down > 0 ? down : 0);
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    trueRanges.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }

  const smoothTR = calcWilderSmooth(trueRanges, period);
  const smoothDMPlus = calcWilderSmooth(dmPlus, period);
  const smoothDMMinus = calcWilderSmooth(dmMinus, period);
  const diPlus = smoothDMPlus.map((d, i) => smoothTR[i] > 0 ? (d / smoothTR[i]) * 100 : 0);
  const diMinus = smoothDMMinus.map((d, i) => smoothTR[i] > 0 ? (d / smoothTR[i]) * 100 : 0);
  const dx = diPlus.map((dp, i) => {
    const sum = dp + diMinus[i];
    return sum > 0 ? (Math.abs(dp - diMinus[i]) / sum) * 100 : 0;
  });
  return calcWilderSmooth(dx, period);
}

function calcWilderSmooth(data: number[], period: number): number[] {
  if (data.length < period) return [];
  const result: number[] = [];
  let smooth = data.slice(0, period).reduce((a, b) => a + b, 0);
  result.push(smooth / period);
  for (let i = period; i < data.length; i++) {
    smooth = smooth - smooth / period + data[i];
    result.push(smooth / period);
  }
  return result;
}

export function lastADX(candles: Candle[]): number | undefined {
  const adx = calcADX(candles);
  return adx.length > 0 ? adx[adx.length - 1] : undefined;
}

// ===== VWAP =====
export function calcVWAP(candles: Candle[]): number | undefined {
  if (candles.length === 0) return undefined;
  let sumPV = 0;
  let sumV = 0;
  for (const c of candles) {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    sumPV += typicalPrice * c.volume;
    sumV += c.volume;
  }
  return sumV > 0 ? sumPV / sumV : undefined;
}

// ===== Support & Resistance =====
export function calcSupportResistance(
  candles: Candle[],
  lookback = 20
): { support: number[]; resistance: number[] } {
  const recentCandles = candles.slice(-lookback);
  const highs = recentCandles.map(c => c.high);
  const lows = recentCandles.map(c => c.low);

  const resistance: number[] = [];
  const support: number[] = [];
  const threshold = 0.005; // 0.5% tolerance for clustering

  // Swing highs
  for (let i = 2; i < highs.length - 2; i++) {
    if (
      highs[i] > highs[i - 1] && highs[i] > highs[i - 2] &&
      highs[i] > highs[i + 1] && highs[i] > highs[i + 2]
    ) {
      resistance.push(highs[i]);
    }
  }

  // Swing lows
  for (let i = 2; i < lows.length - 2; i++) {
    if (
      lows[i] < lows[i - 1] && lows[i] < lows[i - 2] &&
      lows[i] < lows[i + 1] && lows[i] < lows[i + 2]
    ) {
      support.push(lows[i]);
    }
  }

  // Cluster nearby levels
  function cluster(levels: number[]): number[] {
    if (levels.length === 0) return [];
    levels.sort((a, b) => a - b);
    const clustered: number[] = [levels[0]];
    for (let i = 1; i < levels.length; i++) {
      const last = clustered[clustered.length - 1];
      if (Math.abs(levels[i] - last) / last > threshold) {
        clustered.push(levels[i]);
      } else {
        clustered[clustered.length - 1] = (last + levels[i]) / 2;
      }
    }
    return clustered.slice(-3); // top 3
  }

  return { support: cluster(support), resistance: cluster(resistance) };
}

// ===== Volume Analysis =====
export function calcAvgVolume(candles: Candle[], period = 20): number {
  const recent = candles.slice(-period);
  if (recent.length === 0) return 0;
  return recent.reduce((a, c) => a + c.volume, 0) / recent.length;
}

// ===== All Indicators =====
export function computeAllIndicators(
  candles: Candle[],
  includeLiveCandle = false
): IndicatorValues {
  // Only use closed candles for indicator calculations (prevent look-ahead / repainting)
  const closed = includeLiveCandle
    ? candles
    : candles.filter(c => c.isClosed);

  if (closed.length < 30) return {};

  const closes = closed.map(c => c.close);

  const ema9 = lastEMA(closes, 9);
  const ema21 = lastEMA(closes, 21);
  const ema50 = lastEMA(closes, 50);
  const ema200 = lastEMA(closes, 200);
  const rsi14 = lastRSI(closes);
  const macd = lastMACD(closes);
  const bollingerBands = lastBB(closes);
  const atr14 = lastATR(closed);
  const adx14 = lastADX(closed);
  const vwap = calcVWAP(closed.slice(-288)); // ~1 day of 5m candles
  const { support: supportLevels, resistance: resistanceLevels } = calcSupportResistance(closed);
  const volume = closed[closed.length - 1]?.volume;
  const avgVolume20 = calcAvgVolume(closed);
  const volumeRatio = avgVolume20 > 0 ? (volume || 0) / avgVolume20 : undefined;

  return {
    ema9, ema21, ema50, ema200,
    rsi14, macd, bollingerBands,
    atr14, adx14, vwap,
    supportLevels, resistanceLevels,
    volume, avgVolume20, volumeRatio,
  };
}
