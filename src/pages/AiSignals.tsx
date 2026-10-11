import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMarketStore } from '@/store/marketStore';
import { generateSignal } from '@/services/signalEngine';
import { SUPPORTED_SYMBOLS, fetchCandles } from '@/services/marketData';
import { getSymbolName, formatPrice } from '@/lib/utils';
import type { Signal, Timeframe } from '@/types';
import { Brain, ArrowUpRight, ArrowDownRight, RefreshCw, CheckCircle, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const TIMEFRAMES: Timeframe[] = ['15m', '1h', '4h', '1d'];

export function AiSignals() {
  const { t } = useTranslation();
  const { tickers, setSelectedSymbol } = useMarketStore();
  const [selectedTf, setSelectedTf] = useState<Timeframe>('1h');
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const scanAllSignals = async () => {
    setIsLoading(true);
    const newSignals: Signal[] = [];

    for (const sym of SUPPORTED_SYMBOLS.slice(0, 8)) {
      const ticker = tickers[sym];
      if (!ticker) continue;

      try {
        const candles = await fetchCandles(sym, selectedTf, 100);
        if (candles.length >= 30) {
          const sig = generateSignal(sym, selectedTf, candles, ticker.price);
          newSignals.push({
            ...sig,
            id: `${sym}-${selectedTf}-${Date.now()}`,
          });
        }
      } catch (e) {
        console.error('Signal scan failed for', sym, e);
      }
    }

    setSignals(newSignals);
    setIsLoading(false);
  };

  useEffect(() => {
    scanAllSignals();
  }, [selectedTf]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-[#00d4aa]" />
            {t('signal.title')}
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1">
            Algorithmic multi-indicator scoring (EMA, RSI, MACD, BB, ATR, ADX, VWAP). Educational signals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe selector */}
          <div className="flex items-center bg-[#0d1424] p-1 rounded-lg border border-[#1e2d45]">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => setSelectedTf(tf)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  selectedTf === tf
                    ? 'bg-[#00d4aa] text-[#0a0e1a]'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={scanAllSignals}
            disabled={isLoading}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Scan Market
          </button>
        </div>
      </div>

      {/* Signals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {signals.map(sig => {
          const isBuy = sig.type === 'BUY';
          const isSell = sig.type === 'SELL';

          return (
            <div
              key={sig.id}
              className={`card p-5 space-y-4 border-t-4 transition-all duration-200 hover:shadow-xl ${
                isBuy ? 'border-t-green-500 hover:border-green-500/50' :
                isSell ? 'border-t-red-500 hover:border-red-500/50' :
                'border-t-yellow-500 hover:border-yellow-500/50'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-bold text-white flex items-center gap-1.5">
                    {sig.symbol.replace('USDT', '')}
                    <span className="text-[10px] text-[#64748b]">({getSymbolName(sig.symbol)})</span>
                  </div>
                  <div className="text-[11px] text-[#94a3b8] font-mono">
                    ${formatPrice(sig.currentPrice)}
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                  isBuy ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  isSell ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                }`}>
                  {isBuy && <ArrowUpRight className="w-3.5 h-3.5" />}
                  {isSell && <ArrowDownRight className="w-3.5 h-3.5" />}
                  {sig.type}
                </span>
              </div>

              {/* Confidence Meter */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#64748b]">{t('signal.confidence')}</span>
                  <span className="font-mono font-bold text-white">{sig.confidenceScore}%</span>
                </div>
                <div className="w-full bg-[#1e2d45] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isBuy ? 'bg-green-500' : isSell ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${sig.confidenceScore}%` }}
                  />
                </div>
              </div>

              {/* Targets & Levels */}
              {sig.type !== 'HOLD' && (
                <div className="grid grid-cols-2 gap-2 text-xs bg-[#0d1424] p-3 rounded-lg border border-[#1e2d45]">
                  <div>
                    <span className="text-[#64748b] block text-[10px]">{t('signal.stopLoss')}</span>
                    <span className="font-mono font-bold text-red-400">${sig.stopLoss?.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[#64748b] block text-[10px]">{t('signal.target1')}</span>
                    <span className="font-mono font-bold text-green-400">${sig.target1?.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[#64748b] block text-[10px]">{t('signal.target2')}</span>
                    <span className="font-mono font-bold text-green-400">${sig.target2?.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[#64748b] block text-[10px]">{t('signal.riskReward')}</span>
                    <span className="font-mono font-bold text-[#00d4aa]">1:{sig.riskRewardRatio}</span>
                  </div>
                </div>
              )}

              {/* Top Supporting Reasons */}
              <div className="space-y-1.5 text-xs">
                <div className="text-[#64748b] font-semibold text-[11px] uppercase tracking-wider">
                  {t('signal.reasons')}
                </div>
                {sig.reasons.slice(0, 2).map((r, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[#94a3b8] text-[11px]">
                    <CheckCircle className="w-3.5 h-3.5 text-[#00d4aa] flex-shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <Link
                to="/demo-trading"
                onClick={() => setSelectedSymbol(sig.symbol)}
                className="w-full btn-primary text-xs py-2 flex items-center justify-center gap-1.5"
              >
                Execute Demo Trade
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
