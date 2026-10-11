import { useTranslation } from 'react-i18next';
import { useWalletStore } from '@/store/walletStore';
import { formatUSDT, formatPrice, formatPercent } from '@/lib/utils';
import { BookOpen, TrendingUp, XCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import toast from 'react-hot-toast';

export function PortfolioPage() {
  const { t } = useTranslation();
  const { positions, orders, closePosition } = useWalletStore();

  const openPositions = positions.filter(p => p.status === 'OPEN');
  const closedPositions = positions.filter(p => p.status === 'CLOSED');

  const handleClose = (positionId: string, currentPrice: number) => {
    closePosition(positionId, currentPrice, 'Manual User Close');
    toast.success('Position closed successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-[#00d4aa]" />
          {t('portfolio.title')}
        </h1>
        <p className="text-xs text-[#94a3b8] mt-1">
          Open positions, execution order history, and simulated realized profits.
        </p>
      </div>

      {/* Open Positions Section */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 pulse-dot" />
            {t('portfolio.openPositions')} ({openPositions.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1424] text-[#64748b] uppercase font-semibold border-b border-[#1e2d45]">
              <tr>
                <th className="p-3">{t('common.symbol')}</th>
                <th className="p-3">Side</th>
                <th className="p-3 text-right">{t('common.quantity')}</th>
                <th className="p-3 text-right">Avg Entry</th>
                <th className="p-3 text-right">Current Price</th>
                <th className="p-3 text-right">Unrealized P&L</th>
                <th className="p-3 text-center">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d45]">
              {openPositions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-[#64748b]">
                    No open demo positions.
                  </td>
                </tr>
              ) : (
                openPositions.map(p => {
                  const isPos = p.unrealizedPnl >= 0;

                  return (
                    <tr key={p.id} className="hover:bg-[#131c2e]/70 transition-colors">
                      <td className="p-3 font-bold text-white">
                        {p.symbol}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.side === 'BUY'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {p.side}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-white">
                        {p.quantity.toFixed(4)}
                      </td>
                      <td className="p-3 text-right font-mono text-[#94a3b8]">
                        ${formatPrice(p.avgEntryPrice)}
                      </td>
                      <td className="p-3 text-right font-mono text-white">
                        ${formatPrice(p.currentPrice)}
                      </td>
                      <td className={`p-3 text-right font-mono font-bold ${
                        isPos ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {isPos ? '+' : ''}${formatUSDT(p.unrealizedPnl)} ({formatPercent(p.unrealizedPnlPercent)})
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleClose(p.id, p.currentPrice)}
                          className="btn-danger text-xs py-1 px-2.5"
                        >
                          Close Position
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Closed Positions History */}
      <div className="card p-5 space-y-4">
        <h2 className="text-base font-bold text-white">
          {t('portfolio.tradeHistory')} ({closedPositions.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1424] text-[#64748b] uppercase font-semibold border-b border-[#1e2d45]">
              <tr>
                <th className="p-3">{t('common.date')}</th>
                <th className="p-3">{t('common.symbol')}</th>
                <th className="p-3">Side</th>
                <th className="p-3 text-right">Entry Price</th>
                <th className="p-3 text-right">Exit Price</th>
                <th className="p-3 text-right">Realized P&L</th>
                <th className="p-3">Exit Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d45]">
              {closedPositions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-[#64748b]">
                    No closed trades recorded yet.
                  </td>
                </tr>
              ) : (
                closedPositions.map(p => {
                  const isPos = (p.realizedPnl || 0) >= 0;

                  return (
                    <tr key={p.id} className="hover:bg-[#131c2e]/70 transition-colors">
                      <td className="p-3 text-[#94a3b8] font-mono">
                        {p.closedAt ? new Date(p.closedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-3 font-bold text-white">
                        {p.symbol}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.side === 'BUY'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {p.side}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-[#94a3b8]">
                        ${formatPrice(p.avgEntryPrice)}
                      </td>
                      <td className="p-3 text-right font-mono text-white">
                        ${formatPrice(p.closePrice || 0)}
                      </td>
                      <td className={`p-3 text-right font-mono font-bold ${
                        isPos ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {isPos ? '+' : ''}${formatUSDT(p.realizedPnl || 0)}
                      </td>
                      <td className="p-3 text-[#94a3b8]">
                        {p.closeReason || 'Standard exit'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
