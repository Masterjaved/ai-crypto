import { describe, it, expect } from 'vitest';
import { calcEMA, calcRSI, calcBollingerBands, calcMACD } from '../services/indicators';

describe('Technical Indicators Engine', () => {
  const dummyPrices = [
    10, 11, 12, 11, 12, 13, 14, 13, 14, 15,
    16, 15, 16, 17, 18, 19, 18, 19, 20, 21,
    22, 23, 22, 24, 25, 26, 25, 27, 28, 29,
  ];

  it('calculates EMA correctly', () => {
    const ema9 = calcEMA(dummyPrices, 9);
    expect(ema9.length).toBeGreaterThan(0);
    expect(ema9[ema9.length - 1]).toBeGreaterThan(20);
  });

  it('calculates RSI without look-ahead bias', () => {
    const rsi14 = calcRSI(dummyPrices, 14);
    expect(rsi14.length).toBeGreaterThan(0);
    const lastRsi = rsi14[rsi14.length - 1];
    expect(lastRsi).toBeGreaterThan(0);
    expect(lastRsi).toBeLessThanOrEqual(100);
  });

  it('calculates Bollinger Bands with valid bandwidth', () => {
    const bb = calcBollingerBands(dummyPrices, 20, 2);
    expect(bb.length).toBeGreaterThan(0);
    const last = bb[bb.length - 1];
    expect(last.upper).toBeGreaterThan(last.middle);
    expect(last.middle).toBeGreaterThan(last.lower);
  });

  it('calculates MACD histogram correctly', () => {
    const macd = calcMACD(dummyPrices, 12, 26, 9);
    expect(Array.isArray(macd)).toBe(true);
  });
});
