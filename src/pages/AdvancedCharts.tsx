import { useEffect } from 'react';
import { useMarketStore } from '@/store/marketStore';
import { TradingChart } from '@/components/charts/TradingChart';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { SUPPORTED_SYMBOLS } from '@/services/marketData';
import { getSymbolName } from '@/lib/utils';
import { BarChart2, Coins } from 'lucide-react';

export function AdvancedChartsPage() {
  const {
    tickers,
    selectedSymbol,
    selectedTimeframe,
    candles,
    setSelectedSymbol,
    setSelectedTimeframe,
    loadCandles,
  } = useMarketStore();

  const currentTicker = tickers[selectedSymbol];
  const currentCandles = candles[`${selectedSymbol}_${selectedTimeframe}`] || [];

  useEffect(() => {
    loadCandles(selectedSymbol, selectedTimeframe);
  }, [selectedSymbol, selectedTimeframe]);

  return (
    <div className="space-y-6">
      {/* Header with Coin Selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-[#00d4aa]" />
              Advanced Candlestick Charting
            </h1>
            <p className="text-xs text-[#94a3b8] mt-1">
              TradingView Lightweight Engine with EMA 9/21/50, real volume bars, and responsive timeframes.
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
                  {sym.replace('USDT', '')} / USDT ({getSymbolName(sym)})
                </option>
              ))}
            </select>
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
        showIndicators={true}
        height={600}
      />
    </div>
  );
}
