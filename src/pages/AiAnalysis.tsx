import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMarketStore } from '@/store/marketStore';
import { computeAllIndicators } from '@/services/indicators';
import { SUPPORTED_SYMBOLS } from '@/services/marketData';
import { getSymbolName, formatPrice } from '@/lib/utils';
import { LineChart, Brain, TrendingUp, ShieldAlert, Coins } from 'lucide-react';

export function AiAnalysis() {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const { tickers, selectedSymbol, selectedTimeframe, candles, setSelectedSymbol, loadCandles } = useMarketStore();

  const currentTicker = tickers[selectedSymbol];
  const currentCandles = candles[`${selectedSymbol}_${selectedTimeframe}`] || [];

  useEffect(() => {
    loadCandles(selectedSymbol, selectedTimeframe);
  }, [selectedSymbol, selectedTimeframe]);

  const indicators = computeAllIndicators(currentCandles);
  const currentPrice = currentTicker?.price || 0;

  return (
    <div className="space-y-6">
      {/* Header with Coin Selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <LineChart className="w-6 h-6 text-[#00d4aa]" />
              {t('nav.aiAnalysis')} — {selectedSymbol.replace('USDT', '')}
            </h1>
            <p className="text-xs text-[#94a3b8] mt-1">
              Quantitative multi-factor synthesis in simple English and Urdu.
            </p>
          </div>

          {/* Direct Cryptocurrency Switcher */}
          <div className="flex items-center gap-2 bg-[#0d1424] p-1.5 rounded-xl border border-[#1e2d45]">
            <Coins className="w-4 h-4 text-[#00d4aa] ml-1" />
            <select
              value={selectedSymbol}
              onChange={e => setSelectedSymbol(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-2"
            >
              {SUPPORTED_SYMBOLS.map(sym => (
                <option key={sym} value={sym} className="bg-[#0d1424] text-white">
                  {sym.replace('USDT', '')} - {getSymbolName(sym)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Comprehensive Analysis breakdown */}
        <div className="lg:col-span-2 space-y-5">
          {/* Market Structure & Trend */}
          <div className="card p-5 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#00d4aa]" />
              {isUrdu ? 'مارکیٹ کا رجحان اور ساخت' : 'Market Trend & Structure'}
            </h2>
            <div className="text-xs text-[#94a3b8] leading-relaxed space-y-2">
              {isUrdu ? (
                <p>
                  موجودہ قیمت <strong className="text-white">${formatPrice(currentPrice)}</strong> ہے۔
                  {indicators.ema9 && indicators.ema21 && indicators.ema9 > indicators.ema21
                    ? ' قلیل مدتی EMA 9، EMA 21 کے اوپر ہے جو کہ مثبت رجحان کی نشاندہی کرتا ہے۔'
                    : ' قلیل مدتی EMA 9، EMA 21 سے نیچے ہے جو کہ دباؤ کی نشاندہی کرتا ہے۔'}
                  {indicators.adx14 && indicators.adx14 > 25
                    ? ` رجحان کی شدت مضبوط ہے (ADX: ${indicators.adx14.toFixed(1)})۔`
                    : ' مارکیٹ رینج باؤنڈ ہے اور رجحان کی شدت کم ہے۔'}
                </p>
              ) : (
                <p>
                  Current reference price is <strong className="text-white">${formatPrice(currentPrice)}</strong>.
                  {indicators.ema9 && indicators.ema21 && indicators.ema9 > indicators.ema21
                    ? ' The short-term EMA 9 is trading above EMA 21, showing bullish momentum.'
                    : ' The short-term EMA 9 is below EMA 21, indicating bearish or consolidation pressure.'}
                  {indicators.adx14 && indicators.adx14 > 25
                    ? ` Trend strength is robust with ADX at ${indicators.adx14.toFixed(1)}.`
                    : ' Market is currently range-bound with low trend momentum.'}
                </p>
              )}
            </div>
          </div>

          {/* Key Support & Resistance Levels */}
          <div className="card p-5 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-purple-400" />
              {isUrdu ? 'اہم سپورٹ اور مزاحمتی لیولز' : 'Key Support & Resistance Levels'}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0d1424] p-3 rounded-lg border border-[#1e2d45]">
                <div className="text-xs text-green-400 font-semibold mb-1">
                  {isUrdu ? 'سپورٹ لیولز (خریداری کا زون)' : 'Support Levels (Demand)'}
                </div>
                {indicators.supportLevels && indicators.supportLevels.length > 0 ? (
                  indicators.supportLevels.map((lvl, idx) => (
                    <div key={idx} className="font-mono text-xs text-white">
                      ${formatPrice(lvl)}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[#64748b]">Calculating dynamic levels...</div>
                )}
              </div>

              <div className="bg-[#0d1424] p-3 rounded-lg border border-[#1e2d45]">
                <div className="text-xs text-red-400 font-semibold mb-1">
                  {isUrdu ? 'مزاحمتی لیولز (فروخت کا زون)' : 'Resistance Levels (Supply)'}
                </div>
                {indicators.resistanceLevels && indicators.resistanceLevels.length > 0 ? (
                  indicators.resistanceLevels.map((lvl, idx) => (
                    <div key={idx} className="font-mono text-xs text-white">
                      ${formatPrice(lvl)}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[#64748b]">Calculating dynamic levels...</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 col: Key Technical Indicators snapshot */}
        <div className="card p-5 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#00d4aa]" />
            {isUrdu ? 'تکنیکی اشارے' : 'Indicator Readings'}
          </h2>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between p-2 rounded bg-[#0d1424] border border-[#1e2d45]">
              <span className="text-[#94a3b8]">RSI (14)</span>
              <span className="font-mono font-bold text-white">
                {indicators.rsi14?.toFixed(2) ?? 'N/A'}
              </span>
            </div>

            <div className="flex justify-between p-2 rounded bg-[#0d1424] border border-[#1e2d45]">
              <span className="text-[#94a3b8]">MACD Histogram</span>
              <span className={`font-mono font-bold ${
                (indicators.macd?.histogram || 0) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {indicators.macd?.histogram?.toFixed(4) ?? 'N/A'}
              </span>
            </div>

            <div className="flex justify-between p-2 rounded bg-[#0d1424] border border-[#1e2d45]">
              <span className="text-[#94a3b8]">EMA 9</span>
              <span className="font-mono font-bold text-white">
                ${indicators.ema9 ? formatPrice(indicators.ema9) : 'N/A'}
              </span>
            </div>

            <div className="flex justify-between p-2 rounded bg-[#0d1424] border border-[#1e2d45]">
              <span className="text-[#94a3b8]">EMA 21</span>
              <span className="font-mono font-bold text-white">
                ${indicators.ema21 ? formatPrice(indicators.ema21) : 'N/A'}
              </span>
            </div>

            <div className="flex justify-between p-2 rounded bg-[#0d1424] border border-[#1e2d45]">
              <span className="text-[#94a3b8]">ATR (Volatility)</span>
              <span className="font-mono font-bold text-white">
                ${indicators.atr14?.toFixed(2) ?? 'N/A'}
              </span>
            </div>

            <div className="flex justify-between p-2 rounded bg-[#0d1424] border border-[#1e2d45]">
              <span className="text-[#94a3b8]">ADX (Trend Strength)</span>
              <span className="font-mono font-bold text-white">
                {indicators.adx14?.toFixed(2) ?? 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
