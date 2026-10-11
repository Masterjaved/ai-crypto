import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMarketStore } from '@/store/marketStore';
import { Bell, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AlertItem {
  id: string;
  symbol: string;
  condition: 'ABOVE' | 'BELOW';
  targetPrice: number;
  createdAt: string;
  isTriggered: boolean;
}

export function PriceAlertsPage() {
  const { t } = useTranslation();
  const { selectedSymbol, tickers } = useMarketStore();

  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: '1',
      symbol: 'BTCUSDT',
      condition: 'ABOVE',
      targetPrice: 70000,
      createdAt: new Date().toLocaleString(),
      isTriggered: false,
    },
  ]);

  const [targetPriceInput, setTargetPriceInput] = useState('');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');

  const currentPrice = tickers[selectedSymbol]?.price || 0;

  const handleAddAlert = () => {
    const price = parseFloat(targetPriceInput);
    if (!price || isNaN(price)) {
      toast.error('Please enter a valid target price');
      return;
    }

    const newAlert: AlertItem = {
      id: Date.now().toString(),
      symbol: selectedSymbol,
      condition,
      targetPrice: price,
      createdAt: new Date().toLocaleString(),
      isTriggered: false,
    };

    setAlerts([newAlert, ...alerts]);
    setTargetPriceInput('');
    toast.success('Price alert created successfully!');
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
    toast.success('Alert deleted');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bell className="w-6 h-6 text-[#00d4aa]" />
          {t('alerts.title')}
        </h1>
        <p className="text-xs text-[#94a3b8] mt-1">
          In-app smart price notifications and signal invalidation trackers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 col: Add Alert Form */}
        <div className="card p-5 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#00d4aa]" />
            {t('alerts.add')}
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#64748b] block mb-1">Target Symbol</label>
              <input
                type="text"
                disabled
                value={selectedSymbol}
                className="input text-xs font-bold opacity-80"
              />
              <span className="text-[10px] text-[#64748b] mt-0.5 block">
                Current: ${formatPrice(currentPrice)}
              </span>
            </div>

            <div>
              <label className="text-xs text-[#64748b] block mb-1">Trigger Condition</label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value as 'ABOVE' | 'BELOW')}
                className="input text-xs"
              >
                <option value="ABOVE">Price Rises Above (&gt;=)</option>
                <option value="BELOW">Price Drops Below (&lt;=)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-[#64748b] block mb-1">Target Price ($)</label>
              <input
                type="number"
                value={targetPriceInput}
                onChange={e => setTargetPriceInput(e.target.value)}
                placeholder="e.g. 68000"
                className="input font-mono text-xs"
              />
            </div>

            <button
              onClick={handleAddAlert}
              className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-1.5 mt-2"
            >
              Set In-App Alert
            </button>
          </div>
        </div>

        {/* Right 2 cols: Active Alerts Table */}
        <div className="lg:col-span-2 card p-5 space-y-4">
          <h2 className="text-base font-bold text-white">Configured Alerts ({alerts.length})</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0d1424] text-[#64748b] uppercase font-semibold border-b border-[#1e2d45]">
                <tr>
                  <th className="p-3">Symbol</th>
                  <th className="p-3">Condition</th>
                  <th className="p-3 text-right">Target Price</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2d45]">
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-[#64748b]">
                      {t('alerts.noAlerts')}
                    </td>
                  </tr>
                ) : (
                  alerts.map(a => (
                    <tr key={a.id} className="hover:bg-[#131c2e]/70 transition-colors">
                      <td className="p-3 font-bold text-white">{a.symbol}</td>
                      <td className="p-3 text-[#94a3b8]">
                        {a.condition === 'ABOVE' ? 'Price ≥ Target' : 'Price ≤ Target'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-[#00d4aa]">
                        ${formatPrice(a.targetPrice)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="badge-teal text-[10px]">
                          {t('alerts.active')}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteAlert(a.id)}
                          className="text-red-400 hover:text-red-300 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
