import { useState } from 'react';
import { Menu, Globe, Bell, User, Wifi, WifiOff, ChevronDown, Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMarketStore } from '@/store/marketStore';
import { useWalletStore } from '@/store/walletStore';
import { SUPPORTED_SYMBOLS } from '@/services/marketData';
import { cn, formatUSDT, getSymbolName } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const { health, selectedSymbol, setSelectedSymbol, tickers } = useMarketStore();
  const wallet = useWalletStore(s => s.wallet);
  const isConnected = health.webSocketStatus === 'connected' || health.marketDataStatus === 'connected';

  const [isCoinSelectorOpen, setIsCoinSelectorOpen] = useState(false);

  const toggleLanguage = () => {
    const next = i18n.language === 'en' ? 'ur' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('language', next);
    document.documentElement.dir = next === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
  };

  const currentTicker = tickers[selectedSymbol];

  return (
    <header className="sticky top-0 z-30 bg-[#0d1424]/95 backdrop-blur-md border-b border-[#1e2d45] px-4 py-2 flex items-center justify-between">
      {/* Left side: Menu + Logo + Coin Selector Dropdown */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1e2d45] transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 mr-2">
          <span className="text-white font-bold text-sm lg:text-base tracking-wide">
            AI CRYPTO <span className="text-[#00d4aa]">PRO</span>
          </span>
          <span className="demo-label">DEMO</span>
        </div>

        {/* Global Active Cryptocurrency Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsCoinSelectorOpen(!isCoinSelectorOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131c2e] hover:bg-[#1e2d45] border border-[#1e2d45] hover:border-[#00d4aa]/50 transition-all text-xs font-bold text-white shadow-sm"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#00d4aa] to-blue-500 flex items-center justify-center text-[9px] font-black text-[#0a0e1a]">
              {selectedSymbol.slice(0, 2)}
            </div>
            <div className="text-left">
              <span className="font-mono text-white text-xs">{selectedSymbol.replace('USDT', '')}</span>
              <span className="text-[10px] text-[#64748b] ml-1 hidden md:inline">/USDT</span>
            </div>
            {currentTicker && (
              <span className="font-mono text-[#00d4aa] text-xs ml-1 hidden lg:inline">
                ${currentTicker.price.toLocaleString()}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-[#94a3b8]" />
          </button>

          {isCoinSelectorOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsCoinSelectorOpen(false)}
              />
              <div className="absolute left-0 mt-2 w-64 bg-[#0d1424] border border-[#1e2d45] rounded-xl shadow-2xl p-2 z-50 max-h-80 overflow-y-auto space-y-1">
                <div className="text-[10px] uppercase font-bold text-[#64748b] px-2 py-1 flex items-center gap-1.5">
                  <Coins className="w-3 h-3 text-[#00d4aa]" />
                  Select Active Pair
                </div>
                {SUPPORTED_SYMBOLS.map(sym => {
                  const t = tickers[sym];
                  const isSelected = sym === selectedSymbol;
                  const isPos = (t?.priceChangePercent || 0) >= 0;

                  return (
                    <button
                      key={sym}
                      onClick={() => {
                        setSelectedSymbol(sym);
                        setIsCoinSelectorOpen(false);
                      }}
                      className={`w-full p-2 rounded-lg text-left transition-all flex items-center justify-between text-xs ${
                        isSelected
                          ? 'bg-[#00d4aa]/15 text-white font-bold border border-[#00d4aa]/30'
                          : 'hover:bg-[#131c2e] text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="text-white font-semibold">
                          {sym.replace('USDT', '')}
                          <span className="text-[10px] text-[#64748b] ml-1">USDT</span>
                        </div>
                        <div className="text-[10px] text-[#64748b]">{getSymbolName(sym)}</div>
                      </div>

                      {t && (
                        <div className="text-right font-mono">
                          <div className="text-white font-semibold">${t.price.toLocaleString()}</div>
                          <div className={`text-[10px] ${isPos ? 'text-green-400' : 'text-red-400'}`}>
                            {isPos ? '+' : ''}{t.priceChangePercent.toFixed(2)}%
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2">
        {/* Demo Wallet quick glance */}
        {wallet && (
          <Link
            to="/demo-wallet"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#131c2e] border border-[#1e2d45] hover:border-[#00d4aa]/40 transition-colors"
          >
            <div className="text-[11px] text-[#64748b]">{t('demo.balance')}:</div>
            <div className="font-mono font-bold text-xs text-[#00d4aa]">
              ${formatUSDT(wallet.availableBalance)} <span className="text-[10px] text-[#94a3b8]">USDT</span>
            </div>
          </Link>
        )}

        {/* Connection status badge */}
        <div className={cn(
          'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all',
          isConnected
            ? 'text-green-400 border-green-500/30 bg-green-500/10'
            : 'text-red-400 border-red-500/30 bg-red-500/10'
        )}>
          {isConnected
            ? <Wifi className="w-3.5 h-3.5" />
            : <WifiOff className="w-3.5 h-3.5" />}
          <span className="font-medium hidden sm:inline">
            {isConnected ? t('market.connected') : t('market.disconnected')}
          </span>
          {isConnected && (
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full pulse-dot" />
          )}
        </div>

        {/* Language switch button */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e2d45] hover:bg-[#243350] text-[#94a3b8] hover:text-white text-xs font-semibold transition-all border border-[#2e3f5b]"
          title="Toggle English / اردو"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{i18n.language === 'en' ? 'اردو' : 'English'}</span>
        </button>

        {/* Alert Bell */}
        <Link
          to="/alerts"
          className="p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1e2d45] relative transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00d4aa] rounded-full" />
        </Link>

        {/* User icon */}
        <Link
          to="/settings"
          className="p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1e2d45] transition-colors"
        >
          <User className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
}
