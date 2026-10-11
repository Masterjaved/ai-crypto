import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMarketStore } from '@/store/marketStore';
import { fetchCandles } from '@/services/marketData';
import { calcEMA, calcRSI } from '@/services/indicators';
import { formatUSDT, formatPercent } from '@/lib/utils';
import type { Timeframe } from '@/types';
import { FlaskConical, Play, Download, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

export function BacktestingPage() {
  const { t } = useTranslation();
  const { selectedSymbol, setSelectedSymbol } = useMarketStore();
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [initialCapital, setInitialCapital] = useState(10000);
  const [fastEma, setFastEma] = useState(9);
  const [slowEma, setSlowEma] = useState(21);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    finalEquity: number;
    netPnl: number;
    trades: any[];
  } | null>(null);

  const runBacktest = async () => {
    setIsRunning(true);
    try {
      const candles = await fetchCandles(selectedSymbol, timeframe, 500);
      if (candles.length < 50) {
        toast.error('Insufficient historical data');
        setIsRunning(false);
        return;
      }

      const closes = candles.map(c => c.close);
      const emaFastList = calcEMA(closes, fastEma);
      const emaSlowList = calcEMA(closes, slowEma);

      const offsetFast = candles.length - emaFastList.length;
      const offsetSlow = candles.length - emaSlowList.length;
      const startIdx = Math.max(offsetFast, offsetSlow);

      let capital = initialCapital;
      let inPosition = false;
      let entryPrice = 0;
      let entryTime = 0;
      let winningTrades = 0;
      let losingTrades = 0;
      const trades: any[] = [];

      // No look-ahead loop
      for (let i = startIdx + 1; i < candles.length; i++) {
        const prevFast = emaFastList[i - 1 - offsetFast];
        const prevSlow = emaSlowList[i - 1 - offsetSlow];
        const currFast = emaFastList[i - offsetFast];
        const currSlow = emaSlowList[i - offsetSlow];
        const price = candles[i].close;

        // Bullish Crossover: Buy
        if (!inPosition && prevFast <= prevSlow && currFast > currSlow) {
          inPosition = true;
          entryPrice = price;
          entryTime = candles[i].time;
        }
        // Bearish Crossover: Sell
        else if (inPosition && prevFast >= prevSlow && currFast < currSlow) {
          inPosition = false;
          const exitPrice = price;
          const pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100 - 0.2; // with 0.2% roundtrip fee
          const pnlUSDT = (capital * pnlPercent) / 100;
          capital += pnlUSDT;

          if (pnlPercent > 0) winningTrades++;
          else losingTrades++;

          trades.push({
            id: trades.length + 1,
            entryTime: new Date(entryTime * 1000).toLocaleString(),
            exitTime: new Date(candles[i].time * 1000).toLocaleString(),
            entryPrice,
            exitPrice,
            pnlPercent,
            pnlUSDT,
            balanceAfter: capital,
          });
        }
      }

      const totalTrades = winningTrades + losingTrades;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      const netPnl = capital - initialCapital;

      setResults({
        totalTrades,
        winningTrades,
        losingTrades,
        winRate,
        finalEquity: capital,
        netPnl,
        trades,
      });

      toast.success('Backtest complete!');
    } catch (e) {
      toast.error('Backtesting execution error');
    } finally {
      setIsRunning(false);
    }
  };

  const exportCSV = () => {
    if (!results || results.trades.length === 0) return;
    const csv = Papa.unparse(results.trades);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backtest_${selectedSymbol}_${timeframe}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-[#00d4aa]" />
          {t('backtest.title')}
        </h1>
        <p className="text-xs text-[#94a3b8] mt-1">
          {t('backtest.lookAheadWarning')}
        </p>
      </div>

      {/* Backtest Strategy Controls */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Strategy Configuration (EMA Cross)</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-[#64748b] block mb-1">Timeframe</label>
            <select
              value={timeframe}
              onChange={e => setTimeframe(e.target.value as Timeframe)}
              className="input text-xs"
            >
              <option value="15m">15 Minutes</option>
              <option value="1h">1 Hour</option>
              <option value="4h">4 Hours</option>
              <option value="1d">1 Day</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-[#64748b] block mb-1">Fast EMA Period</label>
            <input
              type="number"
              value={fastEma}
              onChange={e => setFastEma(parseInt(e.target.value) || 9)}
              className="input text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-xs text-[#64748b] block mb-1">Slow EMA Period</label>
            <input
              type="number"
              value={slowEma}
              onChange={e => setSlowEma(parseInt(e.target.value) || 21)}
              className="input text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-xs text-[#64748b] block mb-1">Initial Capital ($)</label>
            <input
              type="number"
              value={initialCapital}
              onChange={e => setInitialCapital(parseFloat(e.target.value) || 10000)}
              className="input text-xs font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={runBacktest}
            disabled={isRunning}
            className="btn-primary text-xs flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isRunning ? 'Running Simulation...' : t('backtest.run')}
          </button>
        </div>
      </div>

      {/* Results View */}
      {results && (
        <div className="space-y-5">
          {/* Summary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4 border-l-4 border-l-[#00d4aa]">
              <div className="text-xs text-[#94a3b8] uppercase">Final Capital</div>
              <div className="font-mono text-xl font-bold text-white mt-1">
                ${formatUSDT(results.finalEquity)}
              </div>
            </div>

            <div className="card p-4 border-l-4 border-l-blue-500">
              <div className="text-xs text-[#94a3b8] uppercase">Net Profit / Loss</div>
              <div className={`font-mono text-xl font-bold mt-1 ${
                results.netPnl >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {results.netPnl >= 0 ? '+' : ''}${formatUSDT(results.netPnl)}
              </div>
            </div>

            <div className="card p-4 border-l-4 border-l-purple-500">
              <div className="text-xs text-[#94a3b8] uppercase">Win Rate</div>
              <div className="font-mono text-xl font-bold text-white mt-1">
                {results.winRate.toFixed(1)}%
              </div>
            </div>

            <div className="card p-4 border-l-4 border-l-amber-500">
              <div className="text-xs text-[#94a3b8] uppercase">Total Closed Trades</div>
              <div className="font-mono text-xl font-bold text-white mt-1">
                {results.totalTrades} ({results.winningTrades}W / {results.losingTrades}L)
              </div>
            </div>
          </div>

          {/* Trades table */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Backtested Trades Log</h3>
              <button
                onClick={exportCSV}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                {t('common.export')}
              </button>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0d1424] text-[#64748b] sticky top-0 border-b border-[#1e2d45]">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Entry Date</th>
                    <th className="p-2.5">Exit Date</th>
                    <th className="p-2.5 text-right">Entry</th>
                    <th className="p-2.5 text-right">Exit</th>
                    <th className="p-2.5 text-right">P&L %</th>
                    <th className="p-2.5 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2d45]">
                  {results.trades.map(t => (
                    <tr key={t.id} className="hover:bg-[#131c2e]/70">
                      <td className="p-2.5 text-[#64748b]">{t.id}</td>
                      <td className="p-2.5 text-[#94a3b8]">{t.entryTime}</td>
                      <td className="p-2.5 text-[#94a3b8]">{t.exitTime}</td>
                      <td className="p-2.5 text-right font-mono text-white">${t.entryPrice.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-mono text-white">${t.exitPrice.toFixed(2)}</td>
                      <td className={`p-2.5 text-right font-mono font-bold ${
                        t.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatPercent(t.pnlPercent)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-white">${formatUSDT(t.balanceAfter)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
