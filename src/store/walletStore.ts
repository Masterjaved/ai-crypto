import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DemoWallet, DemoPosition, DemoOrder, DemoTransaction, PortfolioSummary } from '@/types';
import { createDefaultWallet, updatePositionPnl, checkExitConditions, closePosition } from '@/services/demoTrading';
import { generateId } from '@/lib/utils';

interface WalletState {
  wallet: DemoWallet | null;
  positions: DemoPosition[];
  orders: DemoOrder[];
  transactions: DemoTransaction[];
  isInitialized: boolean;

  // Actions
  initWallet: (userId: string) => void;
  resetWallet: (userId: string) => void;
  addOrder: (order: DemoOrder) => void;
  addPosition: (position: DemoPosition) => void;
  updateWallet: (updates: Partial<DemoWallet>) => void;
  addTransactions: (txs: DemoTransaction[]) => void;
  closePosition: (positionId: string, currentPrice: number, reason: string) => void;
  updatePositionPrices: (prices: Record<string, number>) => void;
  getPortfolioSummary: () => PortfolioSummary;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallet: null,
      positions: [],
      orders: [],
      transactions: [],
      isInitialized: false,

      initWallet: (userId) => {
        const state = get();
        if (!state.wallet || state.wallet.userId !== userId) {
          const wallet = createDefaultWallet(userId);
          set({ wallet, isInitialized: true });
        } else {
          set({ isInitialized: true });
        }
      },

      resetWallet: (userId) => {
        const wallet = createDefaultWallet(userId);
        const tx: DemoTransaction = {
          id: generateId(),
          userId,
          walletId: wallet.id,
          type: 'RESET',
          amount: wallet.availableBalance,
          balanceBefore: 0,
          balanceAfter: wallet.availableBalance,
          description: 'Demo wallet reset to 10,000 USDT',
          timestamp: new Date().toISOString(),
        };
        set({ wallet, positions: [], orders: [], transactions: [tx], isInitialized: true });
      },

      addOrder: (order) => set(state => ({ orders: [order, ...state.orders] })),

      addPosition: (position) => set(state => ({ positions: [position, ...state.positions] })),

      updateWallet: (updates) =>
        set(state => ({ wallet: state.wallet ? { ...state.wallet, ...updates } : null })),

      addTransactions: (txs) =>
        set(state => ({ transactions: [...txs, ...state.transactions] })),

      closePosition: (positionId, currentPrice, reason) => {
        const state = get();
        if (!state.wallet) return;
        const position = state.positions.find(p => p.id === positionId && p.status === 'OPEN');
        if (!position) return;

        const result = closePosition(position, currentPrice, state.wallet, reason);
        const updatedPositions = state.positions.map(p =>
          p.id === positionId ? result.updatedPosition : p
        );

        set({
          positions: updatedPositions,
          orders: [result.order, ...state.orders],
          wallet: { ...state.wallet, ...result.updatedWallet } as DemoWallet,
          transactions: [...result.transactions, ...state.transactions],
        });
      },

      updatePositionPrices: (prices) => {
        const state = get();
        if (!state.wallet) return;
        let updatedWallet = { ...state.wallet };

        const updatedPositions = state.positions.map(p => {
          if (p.status !== 'OPEN') return p;
          const price = prices[p.symbol];
          if (!price) return p;

          const updated = updatePositionPnl(p, price);
          // Check SL/TP
          const exitReason = checkExitConditions(updated, price);
          if (exitReason) {
            const closeResult = closePosition(updated, price, updatedWallet, exitReason);
            updatedWallet = { ...updatedWallet, ...closeResult.updatedWallet } as DemoWallet;
            return closeResult.updatedPosition;
          }
          return updated;
        });

        set({ positions: updatedPositions, wallet: updatedWallet });
      },

      getPortfolioSummary: () => {
        const { wallet, positions, orders } = get();
        if (!wallet) return {
          totalEquity: 0, availableBalance: 0, openPositionValue: 0,
          unrealizedPnl: 0, realizedPnl: 0, totalPnl: 0, totalPnlPercent: 0,
          totalFeesPaid: 0, winningTrades: 0, losingTrades: 0,
          totalTrades: 0, winRate: 0, maxDrawdown: 0,
        };

        const openPositions = positions.filter(p => p.status === 'OPEN');
        const closedPositions = positions.filter(p => p.status === 'CLOSED');

        const openPositionValue = openPositions.reduce(
          (sum, p) => sum + p.quantity * p.currentPrice, 0
        );
        const unrealizedPnl = openPositions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
        const realizedPnl = wallet.realizedPnl;
        const totalPnl = unrealizedPnl + realizedPnl;
        const totalEquity = wallet.availableBalance + openPositionValue;
        const totalPnlPercent = wallet.totalDeposited > 0
          ? ((totalEquity - wallet.totalDeposited) / wallet.totalDeposited) * 100
          : 0;

        const completedOrders = orders.filter(o => o.status === 'FILLED');
        const winningTrades = closedPositions.filter(p => (p.realizedPnl || 0) > 0).length;
        const losingTrades = closedPositions.filter(p => (p.realizedPnl || 0) < 0).length;
        const totalTrades = closedPositions.length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

        // Simple max drawdown from wallet balance history
        let peak = wallet.totalDeposited;
        let maxDrawdown = 0;
        for (const tx of get().transactions) {
          if (tx.balanceAfter > peak) peak = tx.balanceAfter;
          const dd = (peak - tx.balanceAfter) / peak * 100;
          if (dd > maxDrawdown) maxDrawdown = dd;
        }

        return {
          totalEquity,
          availableBalance: wallet.availableBalance,
          openPositionValue,
          unrealizedPnl,
          realizedPnl,
          totalPnl,
          totalPnlPercent,
          totalFeesPaid: wallet.totalFeesPaid,
          winningTrades,
          losingTrades,
          totalTrades,
          winRate,
          maxDrawdown,
        };
      },
    }),
    {
      name: 'demo-wallet-storage',
      // Only persist in localStorage as fallback; primary is Supabase
      partialize: (state) => ({
        wallet: state.wallet,
        positions: state.positions,
        orders: state.orders,
        transactions: state.transactions,
      }),
    }
  )
);
