import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useMarketStore } from '@/store/marketStore';
import { useWalletStore } from '@/store/walletStore';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { loadTickers, startWebSocket, stopWebSocket, tickers } = useMarketStore();
  const { initWallet, updatePositionPrices } = useWalletStore();

  useEffect(() => {
    initWallet('default-user-id');
    loadTickers();
    startWebSocket();

    // Poll REST every 20s as fallback
    const interval = setInterval(loadTickers, 20_000);

    return () => {
      clearInterval(interval);
      stopWebSocket();
    };
  }, []);

  // Sync latest market prices to open positions
  useEffect(() => {
    const prices: Record<string, number> = {};
    for (const [sym, t] of Object.entries(tickers)) {
      prices[sym] = t.price;
    }
    if (Object.keys(prices).length > 0) {
      updatePositionPrices(prices);
    }
  }, [tickers]);

  return (
    <div className="flex h-screen bg-[#0a0e1a] overflow-hidden text-[#e2e8f0]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
