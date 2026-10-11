import { describe, it, expect } from 'vitest';
import { executeMarketOrder, closePosition, createDefaultWallet } from '../services/demoTrading';

describe('Demo Trading Engine & Audited Ledger', () => {
  it('creates default wallet with 10,000 USDT', () => {
    const wallet = createDefaultWallet('test-user');
    expect(wallet.availableBalance).toBe(10000);
    expect(wallet.realizedPnl).toBe(0);
  });

  it('executes BUY market order with fee and slippage', () => {
    const wallet = createDefaultWallet('test-user');
    const result = executeMarketOrder({
      userId: 'test-user',
      walletId: wallet.id,
      wallet,
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: 'MARKET',
      quantity: 0.1,
      marketPrice: 60000,
      feePercent: 0.1,
      slippagePercent: 0.05,
    });

    expect(result.success).toBe(true);
    expect(result.order).toBeDefined();
    expect(result.position).toBeDefined();
    expect(result.transactions.length).toBe(2); // BUY + FEE
    expect(result.updatedWallet?.availableBalance).toBeLessThan(10000);
  });

  it('prevents order placement with insufficient balance', () => {
    const wallet = createDefaultWallet('test-user');
    wallet.availableBalance = 10; // only 10 USDT

    const result = executeMarketOrder({
      userId: 'test-user',
      walletId: wallet.id,
      wallet,
      symbol: 'BTCUSDT',
      side: 'BUY',
      type: 'MARKET',
      quantity: 1, // requires 60,000 USDT
      marketPrice: 60000,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Insufficient');
  });
});
