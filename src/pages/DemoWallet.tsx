import { useTranslation } from 'react-i18next';
import { useWalletStore } from '@/store/walletStore';
import { formatUSDT, formatPercent } from '@/lib/utils';
import { Wallet, RefreshCw, ArrowUpRight, ArrowDownRight, ShieldCheck, History, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

export function DemoWalletPage() {
  const { t } = useTranslation();
  const { wallet, transactions, positions, resetWallet } = useWalletStore();

  const handleReset = () => {
    if (!wallet) return;
    if (confirm(t('demo.resetConfirm'))) {
      resetWallet(wallet.userId);
      toast.success('Wallet successfully reset to $10,000 USDT');
    }
  };

  const openPositions = positions.filter(p => p.status === 'OPEN');
  const totalOpenValue = openPositions.reduce((acc, p) => acc + p.quantity * p.currentPrice, 0);
  const totalUnrealizedPnl = openPositions.reduce((acc, p) => acc + p.unrealizedPnl, 0);
  const totalEquity = (wallet?.availableBalance || 0) + totalOpenValue;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#00d4aa]" />
            {t('demo.wallet')}
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1">
            Audited virtual demo balance for realistic paper trading simulation.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="btn-danger text-xs flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t('demo.resetWallet')}
        </button>
      </div>

      {/* Balances Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-l-[#00d4aa]">
          <div className="text-xs text-[#94a3b8] uppercase font-semibold">{t('demo.balance')}</div>
          <div className="font-mono text-2xl font-bold text-white mt-1">
            ${formatUSDT(wallet?.availableBalance || 0)}
          </div>
          <div className="text-[11px] text-[#64748b] mt-1">Liquid USDT available</div>
        </div>

        <div className="card p-5 border-l-4 border-l-blue-500">
          <div className="text-xs text-[#94a3b8] uppercase font-semibold">{t('demo.totalEquity')}</div>
          <div className="font-mono text-2xl font-bold text-white mt-1">
            ${formatUSDT(totalEquity)}
          </div>
          <div className="text-[11px] text-[#64748b] mt-1">Cash + Open Positions</div>
        </div>

        <div className="card p-5 border-l-4 border-l-purple-500">
          <div className="text-xs text-[#94a3b8] uppercase font-semibold">{t('demo.unrealizedPnl')}</div>
          <div className={`font-mono text-2xl font-bold mt-1 ${
            totalUnrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {totalUnrealizedPnl >= 0 ? '+' : ''}${formatUSDT(totalUnrealizedPnl)}
          </div>
          <div className="text-[11px] text-[#64748b] mt-1">From active positions</div>
        </div>

        <div className="card p-5 border-l-4 border-l-amber-500">
          <div className="text-xs text-[#94a3b8] uppercase font-semibold">{t('demo.feesPaid')}</div>
          <div className="font-mono text-2xl font-bold text-amber-400 mt-1">
            ${formatUSDT(wallet?.totalFeesPaid || 0)}
          </div>
          <div className="text-[11px] text-[#64748b] mt-1">Simulated 0.1% fees</div>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-[#00d4aa]" />
          <h2 className="text-base font-bold text-white">Auditable Wallet Ledger</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1424] text-[#64748b] uppercase font-semibold border-b border-[#1e2d45]">
              <tr>
                <th className="p-3">{t('common.date')}</th>
                <th className="p-3">Type</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">{t('common.amount')}</th>
                <th className="p-3 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d45]">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[#64748b]">
                    No wallet activity recorded yet.
                  </td>
                </tr>
              ) : (
                transactions.map(tx => {
                  const isPos = tx.amount >= 0;

                  return (
                    <tr key={tx.id} className="hover:bg-[#131c2e]/70 transition-colors">
                      <td className="p-3 text-[#94a3b8] font-mono">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className="badge-teal font-mono text-[10px]">
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-3 text-white">
                        {tx.description}
                      </td>
                      <td className={`p-3 text-right font-mono font-bold ${
                        isPos ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {isPos ? '+' : ''}${formatUSDT(tx.amount)}
                      </td>
                      <td className="p-3 text-right font-mono text-white">
                        ${formatUSDT(tx.balanceAfter)}
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
