import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PSX_STOCKS, type PSXStock } from '@/services/psxData';
import {
  TrendingUp,
  Search,
  CheckCircle,
  Building2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  BookOpen,
  Filter,
  Sparkles
} from 'lucide-react';
import { formatPrice, formatPercent, formatVolume } from '@/lib/utils';
import toast from 'react-hot-toast';

export function PSXMarketPage() {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'KMI30' | 'KSE100'>('KMI30'); // Default to Shariah
  const [selectedStock, setSelectedStock] = useState<PSXStock>(PSX_STOCKS[0]);
  const [orderQuantity, setOrderQuantity] = useState('500');
  const [virtualPkrBalance, setVirtualPkrBalance] = useState(1000000); // 1 Million PKR default demo balance
  const [psxPortfolio, setPsxPortfolio] = useState<Array<{
    symbol: string;
    name: string;
    shares: number;
    avgPrice: number;
    currentPrice: number;
    pnl: number;
  }>>([
    {
      symbol: 'SYS',
      name: 'Systems Limited',
      shares: 200,
      avgPrice: 420.00,
      currentPrice: 432.50,
      pnl: 2500,
    },
    {
      symbol: 'OGDC',
      name: 'Oil & Gas Development Company Limited',
      shares: 1000,
      avgPrice: 135.00,
      currentPrice: 138.45,
      pnl: 3450,
    }
  ]);

  const filteredStocks = useMemo(() => {
    return PSX_STOCKS.filter(stock => {
      const matchesSearch =
        stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.sector.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedFilter === 'KMI30') return stock.isKMI30;
      if (selectedFilter === 'KSE100') return stock.isKSE100;
      return true;
    });
  }, [searchTerm, selectedFilter]);

  const shariahCount = PSX_STOCKS.filter(s => s.isKMI30).length;
  const kse100Count = PSX_STOCKS.filter(s => s.isKSE100).length;

  const handleBuyPSX = () => {
    const qty = parseInt(orderQuantity, 10);
    if (!qty || qty <= 0) {
      toast.error(isUrdu ? 'برائے مہربانی درست شیئرز کی تعداد لکھیں' : 'Enter valid number of shares');
      return;
    }
    const totalCost = qty * selectedStock.price;
    if (totalCost > virtualPkrBalance) {
      toast.error(isUrdu ? 'آپ کا ورچوئل بیلنس ناکافی ہے' : 'Insufficient virtual PKR balance');
      return;
    }

    setVirtualPkrBalance(prev => prev - totalCost);
    setPsxPortfolio(prev => {
      const existing = prev.find(p => p.symbol === selectedStock.symbol);
      if (existing) {
        const totalShares = existing.shares + qty;
        const newAvg = (existing.shares * existing.avgPrice + totalCost) / totalShares;
        return prev.map(p => p.symbol === selectedStock.symbol ? {
          ...p,
          shares: totalShares,
          avgPrice: newAvg,
          currentPrice: selectedStock.price,
          pnl: (selectedStock.price - newAvg) * totalShares
        } : p);
      } else {
        return [...prev, {
          symbol: selectedStock.symbol,
          name: selectedStock.name,
          shares: qty,
          avgPrice: selectedStock.price,
          currentPrice: selectedStock.price,
          pnl: 0
        }];
      }
    });

    toast.success(
      isUrdu
        ? `${selectedStock.symbol} کے ${qty} شیئرز ڈیمو والٹ میں خرید لیے گئے!`
        : `Simulated Buy of ${qty} shares of ${selectedStock.symbol} successful!`
    );
  };

  const handleSellPSX = (symbol: string) => {
    const item = psxPortfolio.find(p => p.symbol === symbol);
    if (!item) return;

    const returnAmount = item.shares * item.currentPrice;
    setVirtualPkrBalance(prev => prev + returnAmount);
    setPsxPortfolio(prev => prev.filter(p => p.symbol !== symbol));

    toast.success(
      isUrdu
        ? `${symbol} کے تمام شیئرز فروخت ہو گئے اور رقم والٹ میں جمع ہو گئی!`
        : `Sold ${item.shares} shares of ${symbol} successfully!`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card p-6 bg-gradient-to-r from-[#0d1424] via-[#132238] to-[#0d1424] border-emerald-500/30 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {isUrdu ? 'پاکستان اسٹاک ایکسچینج لائیو' : 'PSX Official Portal Ready'}
            </span>
            <span className="text-xs text-[#94a3b8]">Karachi Stock Exchange</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
            🇵🇰 {isUrdu ? 'پاکستان اسٹاک ایکسچینج (PSX) اور شریعہ انڈیکس' : 'Pakistan Stock Exchange (PSX & KMI-30)'}
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1">
            {isUrdu
              ? 'KSE-100 اور KMI-30 (شریعہ کمپلائنٹ اسلامی شیئرز) کا مکمل لائیو ڈیٹا اور 10 لاکھ ورچوئل PKR پیپر ٹریڈنگ'
              : 'Complete KSE-100 & KMI-30 Shariah-compliant equities intelligence with 1 Million PKR virtual paper trading.'}
          </p>
        </div>

        {/* Virtual PKR Wallet Glance */}
        <div className="card p-3.5 bg-[#0a0e1a]/80 border-emerald-500/40 text-right min-w-[200px]">
          <div className="text-[10px] text-[#64748b] font-semibold uppercase">
            {isUrdu ? 'ڈیمو بیلنس (PKR)' : 'Virtual PKR Balance'}
          </div>
          <div className="font-mono text-xl font-black text-emerald-400">
            Rs. {virtualPkrBalance.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#94a3b8] mt-0.5">
            {isUrdu ? '100% سیمولیٹڈ پیپر ٹریڈنگ' : 'Risk-Free Paper Trading'}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Stock Selector / Right Detail & Execution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Stocks Table with Filters */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Tabs */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* Filter Pills */}
              <div className="flex items-center gap-2 bg-[#0d1424] p-1 rounded-xl border border-[#1e2d45]">
                <button
                  onClick={() => setSelectedFilter('KMI30')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedFilter === 'KMI30'
                      ? 'bg-emerald-500 text-[#0a0e1a] shadow-md shadow-emerald-500/20'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {isUrdu ? 'شریعہ کمپلائنٹ (KMI-30)' : 'Shariah (KMI-30)'}
                  <span className="text-[10px] opacity-75">({shariahCount})</span>
                </button>

                <button
                  onClick={() => setSelectedFilter('KSE100')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedFilter === 'KSE100'
                      ? 'bg-[#00d4aa] text-[#0a0e1a]'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  KSE-100 ({kse100Count})
                </button>

                <button
                  onClick={() => setSelectedFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedFilter === 'ALL'
                      ? 'bg-blue-500 text-white'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  {isUrdu ? 'تمام شیئرز' : 'All PSX Stocks'}
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[200px] flex-1 max-w-xs">
                <Search className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={isUrdu ? 'کمپنی یا سمبل تلاش کریں...' : 'Search OGDC, SYS, LUCK...'}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="input pl-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Stocks List Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto max-h-[560px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0d1424] text-[#64748b] sticky top-0 uppercase font-semibold border-b border-[#1e2d45]">
                  <tr>
                    <th className="p-3.5">{isUrdu ? 'سمبل / کمپنی' : 'Symbol / Company'}</th>
                    <th className="p-3.5">{isUrdu ? 'سیکٹر' : 'Sector'}</th>
                    <th className="p-3.5 text-right">{isUrdu ? 'قیمت (PKR)' : 'Price (PKR)'}</th>
                    <th className="p-3.5 text-right">{isUrdu ? 'تبدیلی' : '24h Change'}</th>
                    <th className="p-3.5 text-right hidden sm:table-cell">{isUrdu ? 'حجم' : 'Volume'}</th>
                    <th className="p-3.5 text-center">{isUrdu ? 'اقدام' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2d45]">
                  {filteredStocks.map(stock => {
                    const isPos = stock.changePercent >= 0;
                    const isSelected = selectedStock.symbol === stock.symbol;

                    return (
                      <tr
                        key={stock.symbol}
                        onClick={() => setSelectedStock(stock)}
                        className={`hover:bg-[#131c2e] transition-colors cursor-pointer ${
                          isSelected ? 'bg-[#00d4aa]/10 border-l-2 border-l-[#00d4aa]' : ''
                        }`}
                      >
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-bold text-white text-sm flex items-center gap-1.5">
                                {stock.symbol}
                                {stock.isKMI30 && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" title="Shariah Compliant (KMI-30)">
                                    حلال KMI-30
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#94a3b8] truncate max-w-[180px]">
                                {stock.name}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 text-[#94a3b8]">
                          {stock.sector}
                        </td>

                        <td className="p-3.5 text-right font-mono font-bold text-sm text-white">
                          Rs. {stock.price.toFixed(2)}
                        </td>

                        <td className="p-3.5 text-right">
                          <span className={`inline-flex items-center gap-1 font-mono font-semibold px-2 py-0.5 rounded text-[11px] ${
                            isPos ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
                          }`}>
                            {isPos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {isPos ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </span>
                        </td>

                        <td className="p-3.5 text-right font-mono text-[#94a3b8] hidden sm:table-cell">
                          {formatVolume(stock.volume)}
                        </td>

                        <td className="p-3.5 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStock(stock);
                            }}
                            className="btn-primary text-xs py-1 px-3"
                          >
                            {isUrdu ? 'تجزیہ / ٹریڈ' : 'Select'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Selected Stock Profile & Paper Trade Execution */}
        <div className="space-y-5">
          {/* Selected Stock Box */}
          <div className="card p-5 space-y-4 border-t-4 border-t-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xl font-black text-white">{selectedStock.symbol}</span>
                <span className="text-xs text-[#94a3b8] block">{selectedStock.name}</span>
              </div>
              {selectedStock.isKMI30 && (
                <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {isUrdu ? 'شریعہ تصدیق شدہ' : 'Shariah Compliant'}
                </div>
              )}
            </div>

            {/* Price Row */}
            <div className="p-3 bg-[#0d1424] rounded-xl border border-[#1e2d45] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#64748b] block">{isUrdu ? 'موجودہ قیمت' : 'Current Market Price'}</span>
                <span className="text-2xl font-black text-white font-mono">Rs. {selectedStock.price.toFixed(2)}</span>
              </div>
              <div className={`font-mono text-sm font-bold ${selectedStock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)} ({selectedStock.changePercent.toFixed(2)}%)
              </div>
            </div>

            {/* Stock Statistics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-[#0d1424] rounded-lg border border-[#1e2d45]">
                <span className="text-[10px] text-[#64748b] block">{isUrdu ? 'دن کا بلند ترین' : 'Day High'}</span>
                <span className="font-mono text-white font-bold">Rs. {selectedStock.high.toFixed(2)}</span>
              </div>
              <div className="p-2.5 bg-[#0d1424] rounded-lg border border-[#1e2d45]">
                <span className="text-[10px] text-[#64748b] block">{isUrdu ? 'دن کا کم ترین' : 'Day Low'}</span>
                <span className="font-mono text-white font-bold">Rs. {selectedStock.low.toFixed(2)}</span>
              </div>
              <div className="p-2.5 bg-[#0d1424] rounded-lg border border-[#1e2d45]">
                <span className="text-[10px] text-[#64748b] block">{isUrdu ? 'اوپن پرائس' : 'Open Price'}</span>
                <span className="font-mono text-white font-bold">Rs. {selectedStock.open.toFixed(2)}</span>
              </div>
              <div className="p-2.5 bg-[#0d1424] rounded-lg border border-[#1e2d45]">
                <span className="text-[10px] text-[#64748b] block">{isUrdu ? 'والیوم' : 'Total Volume'}</span>
                <span className="font-mono text-white font-bold">{selectedStock.volume.toLocaleString()}</span>
              </div>
            </div>

            {/* Simulated Order Execution Form */}
            <div className="pt-2 border-t border-[#1e2d45] space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                {isUrdu ? 'ورچوئل پیپر ٹریڈنگ آرڈر' : 'Simulated Paper Order'}
              </div>

              <div>
                <label className="text-[11px] text-[#94a3b8] block mb-1">
                  {isUrdu ? 'شیئرز کی تعداد (Shares)' : 'Number of Shares'}
                </label>
                <input
                  type="number"
                  value={orderQuantity}
                  onChange={e => setOrderQuantity(e.target.value)}
                  className="input font-mono text-sm font-bold"
                  placeholder="e.g. 500"
                />
              </div>

              <div className="p-2.5 bg-[#0d1424] rounded-lg border border-[#1e2d45] flex justify-between text-xs">
                <span className="text-[#64748b]">{isUrdu ? 'کل رقم:' : 'Estimated Cost:'}</span>
                <span className="font-mono font-bold text-emerald-400">
                  Rs. {((parseInt(orderQuantity, 10) || 0) * selectedStock.price).toLocaleString()} PKR
                </span>
              </div>

              <button
                onClick={handleBuyPSX}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-[#0a0e1a] shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                {isUrdu ? `خریدیں (Buy ${selectedStock.symbol})` : `Simulate Buy (${selectedStock.symbol})`}
              </button>
            </div>
          </div>

          {/* Active PSX Portfolio Holdings */}
          <div className="card p-5 space-y-3">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>{isUrdu ? 'آپ کے PSX شیئرز' : 'Your PSX Holdings'}</span>
              <span className="text-emerald-400 font-mono text-[11px]">{psxPortfolio.length} Active</span>
            </h2>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {psxPortfolio.map(pos => (
                <div key={pos.symbol} className="p-2.5 bg-[#0d1424] rounded-lg border border-[#1e2d45] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{pos.symbol}</div>
                    <div className="text-[10px] text-[#64748b]">{pos.shares} shares @ Rs. {pos.avgPrice.toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-400">
                      Rs. {(pos.shares * pos.currentPrice).toLocaleString()}
                    </div>
                    <button
                      onClick={() => handleSellPSX(pos.symbol)}
                      className="text-[10px] text-red-400 hover:text-red-300 font-bold block ml-auto mt-0.5"
                    >
                      {isUrdu ? 'فروخت کریں (Sell)' : 'Close Position'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
