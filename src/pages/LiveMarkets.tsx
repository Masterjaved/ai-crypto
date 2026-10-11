import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMarketStore } from '@/store/marketStore';
import { getSymbolName, formatPrice, formatPercent, formatVolume } from '@/lib/utils';
import { Search, TrendingUp, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LiveMarkets() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tickers, setSelectedSymbol } = useMarketStore();
  const [searchTerm, setSearchTerm] = useState('');

  const tickerList = Object.values(tickers).filter(t =>
    t.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getSymbolName(t.symbol).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectSymbol = (symbol: string) => {
    setSelectedSymbol(symbol);
    navigate('/');
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#00d4aa]" />
            {t('market.title')}
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1">
            Real-time cryptocurrency market feeds directly from Binance API
          </p>
        </div>

        {/* Search input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input pl-9 text-xs"
          />
        </div>
      </div>

      {/* Markets Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1424] text-[#64748b] uppercase font-semibold border-b border-[#1e2d45]">
              <tr>
                <th className="p-4">{t('common.symbol')}</th>
                <th className="p-4 text-right">{t('common.price')}</th>
                <th className="p-4 text-right">{t('market.change24h')}</th>
                <th className="p-4 text-right hidden sm:table-cell">{t('market.high24h')}</th>
                <th className="p-4 text-right hidden sm:table-cell">{t('market.low24h')}</th>
                <th className="p-4 text-right hidden md:table-cell">{t('market.volume24h')}</th>
                <th className="p-4 text-center">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d45]">
              {tickerList.map(ticker => {
                const isPos = ticker.priceChangePercent >= 0;

                return (
                  <tr
                    key={ticker.symbol}
                    className="hover:bg-[#131c2e]/70 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1e2d45] flex items-center justify-center font-bold text-white text-xs">
                          {ticker.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">
                            {ticker.symbol.replace('USDT', '')}
                            <span className="text-[10px] text-[#64748b] ml-1">/USDT</span>
                          </div>
                          <div className="text-[11px] text-[#94a3b8]">
                            {getSymbolName(ticker.symbol)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-right font-mono font-bold text-sm text-white">
                      ${formatPrice(ticker.price)}
                    </td>

                    <td className="p-4 text-right">
                      <span className={`inline-flex items-center gap-1 font-mono font-semibold px-2 py-0.5 rounded ${
                        isPos
                          ? 'text-green-400 bg-green-500/10'
                          : 'text-red-400 bg-red-500/10'
                      }`}>
                        {isPos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {formatPercent(ticker.priceChangePercent)}
                      </span>
                    </td>

                    <td className="p-4 text-right font-mono text-[#94a3b8] hidden sm:table-cell">
                      ${formatPrice(ticker.high24h)}
                    </td>

                    <td className="p-4 text-right font-mono text-[#94a3b8] hidden sm:table-cell">
                      ${formatPrice(ticker.low24h)}
                    </td>

                    <td className="p-4 text-right font-mono text-[#94a3b8] hidden md:table-cell">
                      ${formatVolume(ticker.quoteVolume24h)}
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleSelectSymbol(ticker.symbol)}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        Trade
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
  );
}
