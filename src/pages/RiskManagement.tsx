import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWalletStore } from '@/store/walletStore';
import { Shield, Calculator, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { formatUSDT } from '@/lib/utils';

export function RiskManagementPage() {
  const { t } = useTranslation();
  const { wallet } = useWalletStore();

  const [accountBalance, setAccountBalance] = useState(wallet?.availableBalance || 10000);
  const [riskPercent, setRiskPercent] = useState(2); // 2% risk
  const [entryPrice, setEntryPrice] = useState(65000);
  const [stopLossPrice, setStopLossPrice] = useState(63700);
  const [targetPrice, setTargetPrice] = useState(68500);

  // Position size calculations
  const riskAmount = (accountBalance * riskPercent) / 100;
  const priceDistance = Math.abs(entryPrice - stopLossPrice);
  const positionSizeUnits = priceDistance > 0 ? riskAmount / priceDistance : 0;
  const positionSizeUSDT = positionSizeUnits * entryPrice;

  const rewardDistance = Math.abs(targetPrice - entryPrice);
  const rewardAmount = positionSizeUnits * rewardDistance;
  const riskRewardRatio = priceDistance > 0 ? (rewardDistance / priceDistance).toFixed(2) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#00d4aa]" />
          {t('risk.title')}
        </h1>
        <p className="text-xs text-[#94a3b8] mt-1">
          {t('risk.disclaimer')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Interactive Calculator */}
        <div className="lg:col-span-2 card p-5 space-y-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#00d4aa]" />
            {t('risk.positionSize')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#64748b] block mb-1">Account Balance (USDT)</label>
              <input
                type="number"
                value={accountBalance}
                onChange={e => setAccountBalance(parseFloat(e.target.value) || 0)}
                className="input font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-xs text-[#64748b] block mb-1">Risk Per Trade (%)</label>
              <input
                type="number"
                value={riskPercent}
                onChange={e => setRiskPercent(parseFloat(e.target.value) || 1)}
                className="input font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-xs text-[#64748b] block mb-1">Planned Entry Price ($)</label>
              <input
                type="number"
                value={entryPrice}
                onChange={e => setEntryPrice(parseFloat(e.target.value) || 0)}
                className="input font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-xs text-[#64748b] block mb-1">Planned Stop Loss ($)</label>
              <input
                type="number"
                value={stopLossPrice}
                onChange={e => setStopLossPrice(parseFloat(e.target.value) || 0)}
                className="input font-mono text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-[#64748b] block mb-1">Profit Target Price ($)</label>
              <input
                type="number"
                value={targetPrice}
                onChange={e => setTargetPrice(parseFloat(e.target.value) || 0)}
                className="input font-mono text-xs"
              />
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="bg-[#0d1424] p-4 rounded-xl border border-[#1e2d45] space-y-3">
            <div className="text-xs text-[#00d4aa] font-bold uppercase tracking-wider">
              Recommended Position Parameters
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[#64748b] block">Max Risk Amount</span>
                <span className="font-mono font-bold text-red-400 text-sm">
                  ${formatUSDT(riskAmount)}
                </span>
              </div>

              <div>
                <span className="text-[#64748b] block">Units to Buy/Sell</span>
                <span className="font-mono font-bold text-white text-sm">
                  {positionSizeUnits.toFixed(4)}
                </span>
              </div>

              <div>
                <span className="text-[#64748b] block">Total Position Value</span>
                <span className="font-mono font-bold text-[#00d4aa] text-sm">
                  ${formatUSDT(positionSizeUSDT)}
                </span>
              </div>

              <div>
                <span className="text-[#64748b] block">Risk : Reward</span>
                <span className="font-mono font-bold text-green-400 text-sm">
                  1 : {riskRewardRatio}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 col: Educational Rules & Guidelines */}
        <div className="card p-5 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Core Risk Rules
          </h2>

          <div className="space-y-3 text-xs text-[#94a3b8]">
            <div className="p-3 bg-[#0d1424] rounded-lg border border-[#1e2d45] space-y-1">
              <strong className="text-white block">1. The 1-2% Rule</strong>
              <p>Never risk more than 1% to 2% of total virtual equity on any single demo trade.</p>
            </div>

            <div className="p-3 bg-[#0d1424] rounded-lg border border-[#1e2d45] space-y-1">
              <strong className="text-white block">2. Invariable Stop-Loss</strong>
              <p>Always decide your invalidation exit point before entering any position.</p>
            </div>

            <div className="p-3 bg-[#0d1424] rounded-lg border border-[#1e2d45] space-y-1">
              <strong className="text-white block">3. Positive Asymmetry (R:R &gt; 1:2)</strong>
              <p>Target setups where potential profit is at least double the potential risk.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
