import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMarketStore } from '@/store/marketStore';
import { useWalletStore } from '@/store/walletStore';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { DataStatusBadge } from '@/components/ui/DataStatusBadge';
import { TradingChart } from '@/components/charts/TradingChart';
import { generateSignal } from '@/services/signalEngine';
import { getSymbolName, formatUSDT } from '@/lib/utils';
import { Brain, TrendingUp, Wallet, ShieldAlert, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { t } = useTranslation();
  const {
    tickers,
    selectedSymbol,
    selectedTimeframe,
    candles,
    setSelectedSymbol,
    setSelectedTimeframe,
    loadCandles,
  } = useMarketStore();

  const { getPortfolioSummary } = useWalletStore();
  const portfolio = getPortfolioSummary();

  const currentTicker = tickers[selectedSymbol];
  const currentCandles = candles[`${selectedSymbol}_${selectedTimeframe}`] || [];

  useEffect(() => {
    loadCandles(selectedSymbol, selectedTimeframe);
  }, [selectedSymbol, selectedTimeframe]);

  const signal = useMemo(() => {
    if (!currentTicker || currentCandles.length < 30) return null;
    return generateSignal(selectedSymbol, selectedTimeframe, currentCandles, currentTicker.price);
  }, [selectedSymbol, selectedTimeframe, currentCandles, currentTicker]);

  const topTickers = Object.values(tickers).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Top Header metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Demo Equity */}
        <div className="card p-4 flex items-center justify-between border-l-4 border-l-[#00d4aa]">
          <div>
            <div className="text-xs text-[#94a3b8] uppercase font-semibold">{t('demo.totalEquity')}</div>
            <div className="font-mono text-xl font-bold text-white mt-1">
              ${formatUSDT(portfolio.totalEquity)} <span className="text-xs text-[#94a3b8]">USDT</span>
            </div>
            <div className="text-[11px] text-green-400 mt-0.5">
              P&L: {portfolio.totalPnl >= 0 ? '+' : ''}${formatUSDT(portfolio.totalPnl)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#00d4aa]/10 flex items-center justify-center text-[#00d4aa]">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Win Rate */}
        <div className="card p-4 flex items-center justify-between border-l-4 border-l-blue-500">
          <div>
            <div className="text-xs text-[#94a3b8] uppercase font-semibold">{t('common.winRate')}</div>
            <div className="font-mono text-xl font-bold text-white mt-1">
              {portfolio.winRate.toFixed(1)}%
            </div>
            <div className="text-[11px] text-[#94a3b8] mt-0.5">
              {portfolio.winningTrades}W / {portfolio.losingTrades}L ({portfolio.totalTrades} Total)
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Active AI Signal */}
        <div className="card p-4 flex items-center justify-between border-l-4 border-l-purple-500">
          <div>
            <div className="text-xs text-[#94a3b8] uppercase font-semibold">AI Setup ({selectedSymbol})</div>
            <div className="font-mono text-lg font-bold mt-1 flex items-center gap-1.5">
              <span className={
                signal?.type === 'BUY' ? 'text-green-400' :
                signal?.type === 'SELL' ? 'text-red-400' : 'text-yellow-400'
              }>
                {signal?.type ? t(`signal.${signal.type.toLowerCase()}`) : t('common.loading')}
              </span>
            </div>
            <div className="text-[11px] text-[#94a3b8] mt-0.5">
              Confidence: {signal?.confidenceScore ?? 0}/100
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Brain className="w-5 h-5" />
          </div>
        </div>

        {/* Risk & Safety */}
        <div className="card p-4 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <div className="text-xs text-[#94a3b8] uppercase font-semibold">{t('risk.title')}</div>
            <div className="font-mono text-sm font-semibold text-amber-400 mt-1">
              Max Risk 2% / Trade
            </div>
            <div className="text-[11px] text-[#94a3b8] mt-0.5">
              100% Simulated Trading
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Chart + Market Quick Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 cols: Interactive Chart */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg font-bold text-white flex items-center gap-2">
                  {getSymbolName(selectedSymbol)} ({selectedSymbol})
                </h1>
                <DataStatusBadge
                  status={currentTicker?.dataStatus || 'live'}
                  lastUpdate={currentTicker?.lastUpdateTime}
                  source={currentTicker?.source || 'Binance'}
                />
              </div>
            </div>

            {currentTicker && (
              <PriceDisplay
                price={currentTicker.price}
                changePercent={currentTicker.priceChangePercent}
                size="lg"
              />
            )}
          </div>

          <TradingChart
            candles={currentCandles}
            symbol={selectedSymbol}
            timeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
            stopLoss={signal?.stopLoss}
            target1={signal?.target1}
            target2={signal?.target2}
            target3={signal?.target3}
            height={480}
          />
        </div>

        {/* Right 1 col: Quick Market List */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1e2d45] pb-2">
            <div className="font-semibold text-sm text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00d4aa]" />
              {t('nav.liveMarkets')}
            </div>
            <Link to="/markets" className="text-xs text-[#00d4aa] hover:underline">
              {t('common.seeAll')}
            </Link>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[520px] pr-1">
            {topTickers.map(ticker => {
              const isSelected = ticker.symbol === selectedSymbol;
              const isPos = ticker.priceChangePercent >= 0;

              return (
                <button
                  key={ticker.symbol}
                  onClick={() => setSelectedSymbol(ticker.symbol)}
                  className={`w-full p-2.5 rounded-lg text-left transition-all flex items-center justify-between border ${
                    isSelected
                      ? 'bg-[#00d4aa]/10 border-[#00d4aa]/40 text-white'
                      : 'bg-[#0d1424] border-[#1e2d45] hover:border-[#2e3f5b] text-[#94a3b8] hover:text-white'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-xs text-white">
                      {ticker.symbol.replace('USDT', '')}
                    </div>
                    <div className="text-[10px] text-[#64748b]">
                      {getSymbolName(ticker.symbol)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-xs font-semibold text-white">
                      ${ticker.price.toLocaleString()}
                    </div>
                    <div className={`text-[10px] font-mono flex items-center justify-end gap-0.5 ${
                      isPos ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {isPos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {isPos ? '+' : ''}{ticker.priceChangePercent.toFixed(2)}%
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Signal Brief Section */}
      {signal && (
        <div className="card p-5 space-y-4 border-t-2 border-t-[#00d4aa]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-[#00d4aa]" />
              <h2 className="text-base font-bold text-white">
                {t('signal.title')} — {selectedSymbol} ({selectedTimeframe})
              </h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              signal.type === 'BUY' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              signal.type === 'SELL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}>
              {signal.type} SETUP (Score: {signal.confidenceScore}/100)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#0d1424] p-4 rounded-xl border border-[#1e2d45]">
            <div>
              <div className="text-xs text-[#64748b]">{t('signal.entry')}</div>
              <div className="font-mono text-sm font-bold text-white mt-0.5">
                ${signal.entryZoneLow?.toFixed(2)} - ${signal.entryZoneHigh?.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#64748b]">{t('signal.stopLoss')}</div>
              <div className="font-mono text-sm font-bold text-red-400 mt-0.5">
                ${signal.stopLoss?.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#64748b]">{t('signal.target1')}</div>
              <div className="font-mono text-sm font-bold text-green-400 mt-0.5">
                ${signal.target1?.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#64748b]">{t('signal.riskReward')}</div>
              <div className="font-mono text-sm font-bold text-[#00d4aa] mt-0.5">
                1 : {signal.riskRewardRatio ?? 'N/A'}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link
              to="/signals"
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              {t('common.seeAll')} Signals
            </Link>
            <Link
              to="/demo-trading"
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              Trade This Setup in Demo
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
