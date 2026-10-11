/**
 * AI Signal Generation Engine
 * Transparent weighted scoring model.
 * Never generates BUY/SELL solely on user request.
 * Returns HOLD when evidence is insufficient.
 */

import { v4 as uuidv4 } from 'uuid';
import type { Candle, IndicatorValues, Signal, SignalType, TrendDirection, Timeframe } from '@/types';
import { computeAllIndicators } from './indicators';

interface SignalScore {
  score: number; // -100 to +100, positive = bullish, negative = bearish
  confidence: number; // 0-100
  reasons: string[];
  risks: string[];
  invalidationConditions: string[];
  trendDirection: TrendDirection;
}

/**
 * Determines trend direction from EMA arrangement.
 */
function getTrendDirection(indicators: IndicatorValues): TrendDirection {
  const { ema9, ema21, ema50, ema200, adx14 } = indicators;
  if (!ema9 || !ema21) return 'NEUTRAL';

  const emaBullish = ema9 > ema21;
  const emaBearish = ema9 < ema21;
  const aboveLongTerm = ema50 && ema200 ? ema50 > ema200 : undefined;
  const strong = adx14 !== undefined && adx14 > 25;

  if (emaBullish && aboveLongTerm === true && strong) return 'STRONG_UP';
  if (emaBullish && aboveLongTerm !== false) return 'UP';
  if (emaBearish && aboveLongTerm === false && strong) return 'STRONG_DOWN';
  if (emaBearish) return 'DOWN';
  return 'NEUTRAL';
}

/**
 * Core weighted scoring.
 * Returns score from -100 (very bearish) to +100 (very bullish).
 */
function scoreIndicators(
  indicators: IndicatorValues,
  currentPrice: number
): { score: number; reasons: string[]; risks: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const risks: string[] = [];

  // 1. EMA crossover / arrangement (weight: 25)
  const { ema9, ema21, ema50, ema200, rsi14, macd, bollingerBands, atr14, adx14, vwap, volumeRatio } = indicators;

  if (ema9 && ema21) {
    if (ema9 > ema21) { score += 12; reasons.push(`EMA9 (${ema9.toFixed(2)}) above EMA21 (${ema21.toFixed(2)}) — bullish short-term trend`); }
    else { score -= 12; reasons.push(`EMA9 below EMA21 — bearish short-term trend`); }
  }
  if (ema50 && ema200) {
    if (ema50 > ema200) { score += 8; reasons.push(`EMA50 above EMA200 — bullish long-term structure`); }
    else { score -= 8; reasons.push(`EMA50 below EMA200 — bearish long-term structure`); }
  }
  if (ema21 && currentPrice > ema21) { score += 5; reasons.push(`Price above EMA21`); }
  else if (ema21) { score -= 5; reasons.push(`Price below EMA21`); }

  // 2. RSI (weight: 20)
  if (rsi14 !== undefined) {
    if (rsi14 < 30) { score += 15; reasons.push(`RSI ${rsi14.toFixed(1)} — oversold territory, potential reversal zone`); }
    else if (rsi14 > 70) { score -= 15; reasons.push(`RSI ${rsi14.toFixed(1)} — overbought territory, caution`); risks.push('RSI overbought — pullback risk'); }
    else if (rsi14 > 50 && rsi14 < 70) { score += 8; reasons.push(`RSI ${rsi14.toFixed(1)} — in bullish zone`); }
    else if (rsi14 < 50 && rsi14 > 30) { score -= 8; reasons.push(`RSI ${rsi14.toFixed(1)} — in bearish zone`); }
  }

  // 3. MACD (weight: 20)
  if (macd) {
    if (macd.histogram > 0 && macd.macd > macd.signal) {
      score += 10; reasons.push(`MACD bullish — histogram positive (${macd.histogram.toFixed(4)})`);
    } else if (macd.histogram < 0) {
      score -= 10; reasons.push(`MACD bearish — histogram negative (${macd.histogram.toFixed(4)})`);
    }
    if (macd.macd > 0) { score += 5; reasons.push('MACD line above zero'); }
    else { score -= 5; reasons.push('MACD line below zero'); }
  }

  // 4. Bollinger Bands (weight: 10)
  if (bollingerBands) {
    const { upper, lower, middle, bandwidth } = bollingerBands;
    if (currentPrice < lower) { score += 8; reasons.push(`Price near lower BB (${lower.toFixed(2)}) — potential support`); }
    else if (currentPrice > upper) { score -= 8; reasons.push(`Price near upper BB (${upper.toFixed(2)}) — potential resistance`); risks.push('Price extended above upper Bollinger Band'); }
    if (bandwidth < 2) { risks.push(`Low Bollinger Band width (${bandwidth.toFixed(2)}%) — breakout pending, direction uncertain`); }
    if (currentPrice > middle) { score += 3; }
    else { score -= 3; }
  }

  // 5. ADX (weight: 10)
  if (adx14 !== undefined) {
    if (adx14 > 40) { score += 8; reasons.push(`ADX ${adx14.toFixed(1)} — strong trend`); }
    else if (adx14 > 25) { score += 4; reasons.push(`ADX ${adx14.toFixed(1)} — trending market`); }
    else { risks.push(`ADX ${adx14.toFixed(1)} — weak trend, range-bound conditions`); }
  }

  // 6. VWAP (weight: 7)
  if (vwap) {
    if (currentPrice > vwap) { score += 5; reasons.push(`Price above VWAP (${vwap.toFixed(2)}) — intraday bullish`); }
    else { score -= 5; reasons.push(`Price below VWAP (${vwap.toFixed(2)}) — intraday bearish`); }
  }

  // 7. Volume (weight: 8)
  if (volumeRatio !== undefined) {
    if (volumeRatio > 1.5) { score += 6; reasons.push(`Volume ${(volumeRatio * 100).toFixed(0)}% of average — strong confirmation`); }
    else if (volumeRatio < 0.5) { risks.push('Low volume — signals may lack confirmation'); score -= 3; }
  }

  // Cap at -100 to +100
  score = Math.max(-100, Math.min(100, score));
  return { score, reasons, risks };
}

/**
 * Computes signal confidence (0-100) from score.
 * Higher magnitude = higher confidence.
 * Below threshold → HOLD.
 */
function computeConfidence(score: number): number {
  return Math.round(Math.min(100, Math.abs(score)));
}

/**
 * Main signal generator.
 * Returns HOLD when confidence < 40 or indicators conflict.
 */
export function generateSignal(
  symbol: string,
  timeframe: Timeframe,
  candles: Candle[],
  currentPrice: number
): Omit<Signal, 'id' | 'userId'> {
  const indicators = computeAllIndicators(candles);
  const trendDirection = getTrendDirection(indicators);
  const { score, reasons, risks } = scoreIndicators(indicators, currentPrice);
  const confidence = computeConfidence(score);

  // Classify signal type
  let type: SignalType = 'HOLD';
  const SIGNAL_THRESHOLD = 35; // minimum score magnitude for BUY/SELL

  if (score >= SIGNAL_THRESHOLD) type = 'BUY';
  else if (score <= -SIGNAL_THRESHOLD) type = 'SELL';
  else {
    reasons.push('Conflicting or insufficient indicator evidence — waiting for clearer setup');
  }

  // Entry zone, stop-loss, targets
  const atr = indicators.atr14 || currentPrice * 0.01;
  let entryZoneLow: number | undefined;
  let entryZoneHigh: number | undefined;
  let stopLoss: number | undefined;
  let target1: number | undefined;
  let target2: number | undefined;
  let target3: number | undefined;
  let riskRewardRatio: number | undefined;

  if (type === 'BUY') {
    entryZoneLow = currentPrice - atr * 0.5;
    entryZoneHigh = currentPrice + atr * 0.3;
    stopLoss = currentPrice - atr * 2;
    target1 = currentPrice + atr * 2;
    target2 = currentPrice + atr * 3.5;
    target3 = currentPrice + atr * 5;
    const risk = currentPrice - (stopLoss || 0);
    const reward = (target1 || 0) - currentPrice;
    riskRewardRatio = risk > 0 ? parseFloat((reward / risk).toFixed(2)) : undefined;
  } else if (type === 'SELL') {
    entryZoneLow = currentPrice - atr * 0.3;
    entryZoneHigh = currentPrice + atr * 0.5;
    stopLoss = currentPrice + atr * 2;
    target1 = currentPrice - atr * 2;
    target2 = currentPrice - atr * 3.5;
    target3 = currentPrice - atr * 5;
    const risk = (stopLoss || 0) - currentPrice;
    const reward = currentPrice - (target1 || 0);
    riskRewardRatio = risk > 0 ? parseFloat((reward / risk).toFixed(2)) : undefined;
  }

  // Invalidation conditions
  const invalidationConditions: string[] = [];
  if (type === 'BUY') {
    invalidationConditions.push(`Close below stop-loss level (${stopLoss?.toFixed(4)}) invalidates the setup`);
    invalidationConditions.push('RSI drops below 30 with increasing momentum may indicate breakdown');
    if (indicators.ema21) invalidationConditions.push(`Strong close below EMA21 (${indicators.ema21.toFixed(2)}) weakens bullish case`);
  } else if (type === 'SELL') {
    invalidationConditions.push(`Close above stop-loss level (${stopLoss?.toFixed(4)}) invalidates the setup`);
    invalidationConditions.push('RSI surges above 70 with rising volume indicates reversal risk');
  }
  if (type === 'HOLD') {
    invalidationConditions.push('Wait for clear indicator alignment before entry');
    invalidationConditions.push('Do not enter on a single-indicator signal');
  }

  // Provisional vs confirmed: last candle must be closed
  const lastCandle = candles[candles.length - 1];
  const isProvisional = lastCandle ? !lastCandle.isClosed : true;

  risks.push('Cryptocurrency markets are highly volatile. Never risk more than you can afford to lose.');
  risks.push('This signal is for educational demo trading only. Not financial advice.');

  return {
    symbol,
    timeframe,
    type,
    status: isProvisional ? 'provisional' : 'confirmed',
    confidenceScore: confidence,
    generatedAt: Date.now(),
    marketDataTimestamp: lastCandle ? lastCandle.time * 1000 : Date.now(),
    currentPrice,
    entryZoneLow,
    entryZoneHigh,
    stopLoss,
    target1,
    target2,
    target3,
    riskRewardRatio,
    trendDirection,
    indicators,
    reasons,
    invalidationConditions,
    risks,
    isSuitableForDemo: type !== 'HOLD' && confidence >= 50,
    isProvisional,
  };
}

/**
 * Evaluate signal outcome after the fact.
 * Only call once price has moved past a decisive level.
 */
export function evaluateSignalOutcome(
  signal: Signal,
  currentPrice: number
): Partial<Signal> {
  if (!signal.target1 || !signal.stopLoss) return { outcome: 'PENDING' };

  if (signal.type === 'BUY') {
    if (currentPrice >= signal.target1) return { outcome: 'WIN', outcomePrice: currentPrice, outcomeTime: Date.now() };
    if (currentPrice <= signal.stopLoss) return { outcome: 'LOSS', outcomePrice: currentPrice, outcomeTime: Date.now() };
  } else if (signal.type === 'SELL') {
    if (currentPrice <= signal.target1) return { outcome: 'WIN', outcomePrice: currentPrice, outcomeTime: Date.now() };
    if (currentPrice >= signal.stopLoss) return { outcome: 'LOSS', outcomePrice: currentPrice, outcomeTime: Date.now() };
  }

  return { outcome: 'PENDING' };
}

export function createSignalId(): string {
  return uuidv4();
}
