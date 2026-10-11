/**
 * Demo Trading Engine
 * All orders are simulated. No real money is involved.
 * Market orders use real market prices from Binance.
 * Limit/Stop orders fill when price conditions are met.
 */

import type {
  DemoWallet, DemoPosition, DemoOrder, DemoTransaction,
  OrderSide, OrderType, OrderStatus
} from '@/types';
import { generateId } from '@/lib/utils';

const DEFAULT_BALANCE = 10_000; // USDT
const DEFAULT_FEE_PERCENT = 0.1; // 0.1% per trade
const DEFAULT_SLIPPAGE_PERCENT = 0.05; // 0.05%

export interface PlaceOrderParams {
  userId: string;
  walletId: string;
  wallet: DemoWallet;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  marketPrice: number; // current real market price
  limitPrice?: number;
  stopPrice?: number;
  stopLoss?: number;
  takeProfit1?: number;
  takeProfit2?: number;
  takeProfit3?: number;
  signalId?: string;
  feePercent?: number;
  slippagePercent?: number;
}

export interface OrderResult {
  success: boolean;
  order?: DemoOrder;
  position?: DemoPosition;
  transactions: DemoTransaction[];
  updatedWallet?: Partial<DemoWallet>;
  error?: string;
}

/**
 * Apply slippage to market orders.
 * BUY: price increases by slippage. SELL: price decreases.
 */
export function applySlippage(
  price: number,
  side: OrderSide,
  slippagePercent: number
): number {
  const factor = slippagePercent / 100;
  return side === 'BUY' ? price * (1 + factor) : price * (1 - factor);
}

/**
 * Calculate trading fee.
 */
export function calcFee(amount: number, feePercent: number): number {
  return (amount * feePercent) / 100;
}

/**
 * Validate order before placement.
 */
export function validateOrder(params: PlaceOrderParams): string | null {
  if (params.quantity <= 0) return 'Quantity must be greater than 0';
  if (params.marketPrice <= 0) return 'Invalid market price';

  const cost = params.quantity * params.marketPrice;
  const fee = calcFee(cost, params.feePercent ?? DEFAULT_FEE_PERCENT);
  const totalCost = cost + fee;

  if (params.side === 'BUY' && params.wallet.availableBalance < totalCost) {
    return `Insufficient demo balance. Need ${totalCost.toFixed(2)} USDT, have ${params.wallet.availableBalance.toFixed(2)} USDT`;
  }
  if (params.type === 'LIMIT' && !params.limitPrice) return 'Limit price required for limit orders';
  if (params.type === 'STOP' && !params.stopPrice) return 'Stop price required for stop orders';

  return null;
}

/**
 * Simulate market order execution.
 * Returns order, position update, wallet update, and audit transactions.
 */
export function executeMarketOrder(params: PlaceOrderParams): OrderResult {
  const feePercent = params.feePercent ?? DEFAULT_FEE_PERCENT;
  const slippagePercent = params.slippagePercent ?? DEFAULT_SLIPPAGE_PERCENT;

  const error = validateOrder(params);
  if (error) return { success: false, transactions: [], error };

  const filledPrice = applySlippage(params.marketPrice, params.side, slippagePercent);
  const cost = params.quantity * filledPrice;
  const fee = calcFee(cost, feePercent);
  const totalCost = params.side === 'BUY' ? cost + fee : cost - fee;

  const now = new Date().toISOString();
  const orderId = generateId();
  const positionId = generateId();

  const order: DemoOrder = {
    id: orderId,
    userId: params.userId,
    walletId: params.walletId,
    symbol: params.symbol,
    side: params.side,
    type: 'MARKET',
    quantity: params.quantity,
    filledPrice,
    filledQuantity: params.quantity,
    status: 'FILLED' as OrderStatus,
    fee,
    feeAsset: 'USDT',
    slippage: slippagePercent,
    createdAt: now,
    filledAt: now,
    signalId: params.signalId,
    positionId,
    notes: `Demo market order — slippage ${slippagePercent}%, fee ${feePercent}%`,
  };

  const position: DemoPosition = {
    id: positionId,
    userId: params.userId,
    walletId: params.walletId,
    symbol: params.symbol,
    side: params.side,
    quantity: params.quantity,
    avgEntryPrice: filledPrice,
    currentPrice: params.marketPrice,
    unrealizedPnl: 0,
    unrealizedPnlPercent: 0,
    stopLoss: params.stopLoss,
    takeProfit1: params.takeProfit1,
    takeProfit2: params.takeProfit2,
    takeProfit3: params.takeProfit3,
    totalFees: fee,
    openedAt: now,
    signalId: params.signalId,
    status: 'OPEN',
  };

  // Wallet updates
  const balanceBefore = params.wallet.availableBalance;
  let newBalance = balanceBefore;
  let newReserved = params.wallet.reservedBalance;

  if (params.side === 'BUY') {
    newBalance -= totalCost;
    newReserved += cost; // mark position value as reserved
  } else {
    newBalance += cost - fee;
  }

  const updatedWallet: Partial<DemoWallet> = {
    availableBalance: newBalance,
    reservedBalance: newReserved,
    totalFeesPaid: params.wallet.totalFeesPaid + fee,
    updatedAt: now,
  };

  const transactions: DemoTransaction[] = [
    {
      id: generateId(),
      userId: params.userId,
      walletId: params.walletId,
      type: params.side === 'BUY' ? 'BUY' : 'SELL',
      amount: -totalCost,
      balanceBefore,
      balanceAfter: newBalance,
      symbol: params.symbol,
      orderId,
      description: `Demo ${params.side} ${params.quantity} ${params.symbol} @ ${filledPrice.toFixed(4)} USDT`,
      timestamp: now,
    },
    {
      id: generateId(),
      userId: params.userId,
      walletId: params.walletId,
      type: 'FEE',
      amount: -fee,
      balanceBefore: newBalance,
      balanceAfter: newBalance,
      symbol: params.symbol,
      orderId,
      description: `Demo trading fee: ${feePercent}% of ${cost.toFixed(2)} USDT`,
      timestamp: now,
    },
  ];

  return { success: true, order, position, transactions, updatedWallet };
}

/**
 * Close a demo position and calculate realized P&L.
 */
export function closePosition(
  position: DemoPosition,
  currentPrice: number,
  wallet: DemoWallet,
  reason: string,
  feePercent = DEFAULT_FEE_PERCENT,
  slippagePercent = DEFAULT_SLIPPAGE_PERCENT
): {
  updatedPosition: DemoPosition;
  order: DemoOrder;
  transactions: DemoTransaction[];
  updatedWallet: Partial<DemoWallet>;
  realizedPnl: number;
} {
  const closeSide: OrderSide = position.side === 'BUY' ? 'SELL' : 'BUY';
  const closePrice = applySlippage(currentPrice, closeSide, slippagePercent);
  const grossValue = position.quantity * closePrice;
  const fee = calcFee(grossValue, feePercent);
  const netValue = grossValue - fee;

  let realizedPnl: number;
  if (position.side === 'BUY') {
    realizedPnl = netValue - (position.quantity * position.avgEntryPrice) - position.totalFees;
  } else {
    realizedPnl = (position.quantity * position.avgEntryPrice) - netValue - position.totalFees;
  }

  const now = new Date().toISOString();
  const orderId = generateId();

  const closeOrder: DemoOrder = {
    id: orderId,
    userId: position.userId,
    walletId: position.walletId,
    symbol: position.symbol,
    side: closeSide,
    type: 'MARKET',
    quantity: position.quantity,
    filledPrice: closePrice,
    filledQuantity: position.quantity,
    status: 'FILLED',
    fee,
    feeAsset: 'USDT',
    slippage: slippagePercent,
    createdAt: now,
    filledAt: now,
    positionId: position.id,
    notes: `Close position: ${reason}`,
  };

  const updatedPosition: DemoPosition = {
    ...position,
    status: 'CLOSED',
    closedAt: now,
    closePrice,
    realizedPnl,
    closeReason: reason,
    currentPrice,
    unrealizedPnl: 0,
    unrealizedPnlPercent: 0,
    totalFees: position.totalFees + fee,
  };

  const balanceBefore = wallet.availableBalance;
  const newBalance = balanceBefore + netValue;
  const newReserved = Math.max(0, wallet.reservedBalance - position.quantity * position.avgEntryPrice);

  const updatedWallet: Partial<DemoWallet> = {
    availableBalance: newBalance,
    reservedBalance: newReserved,
    realizedPnl: wallet.realizedPnl + realizedPnl,
    totalFeesPaid: wallet.totalFeesPaid + fee,
    updatedAt: now,
  };

  const transactions: DemoTransaction[] = [
    {
      id: generateId(),
      userId: position.userId,
      walletId: position.walletId,
      type: 'PNL_CLOSE',
      amount: realizedPnl,
      balanceBefore,
      balanceAfter: newBalance,
      symbol: position.symbol,
      orderId,
      description: `Close ${position.side} ${position.quantity} ${position.symbol} @ ${closePrice.toFixed(4)} — P&L: ${realizedPnl >= 0 ? '+' : ''}${realizedPnl.toFixed(2)} USDT (${reason})`,
      timestamp: now,
    },
    {
      id: generateId(),
      userId: position.userId,
      walletId: position.walletId,
      type: 'FEE',
      amount: -fee,
      balanceBefore: newBalance,
      balanceAfter: newBalance,
      symbol: position.symbol,
      orderId,
      description: `Close position fee: ${fee.toFixed(4)} USDT`,
      timestamp: now,
    },
  ];

  return { updatedPosition, order: closeOrder, transactions, updatedWallet, realizedPnl };
}

/**
 * Update unrealized P&L for an open position.
 */
export function updatePositionPnl(
  position: DemoPosition,
  currentPrice: number
): DemoPosition {
  let unrealizedPnl: number;
  if (position.side === 'BUY') {
    unrealizedPnl = (currentPrice - position.avgEntryPrice) * position.quantity - position.totalFees;
  } else {
    unrealizedPnl = (position.avgEntryPrice - currentPrice) * position.quantity - position.totalFees;
  }
  const unrealizedPnlPercent = position.avgEntryPrice > 0
    ? (unrealizedPnl / (position.avgEntryPrice * position.quantity)) * 100
    : 0;

  return { ...position, currentPrice, unrealizedPnl, unrealizedPnlPercent };
}

/**
 * Create a fresh demo wallet.
 */
export function createDefaultWallet(userId: string): DemoWallet {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    userId,
    availableBalance: DEFAULT_BALANCE,
    reservedBalance: 0,
    totalDeposited: DEFAULT_BALANCE,
    realizedPnl: 0,
    totalFeesPaid: 0,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Check if stop-loss or take-profit conditions are triggered.
 * Returns the exit reason or null.
 */
export function checkExitConditions(
  position: DemoPosition,
  currentPrice: number
): string | null {
  if (position.side === 'BUY') {
    if (position.stopLoss && currentPrice <= position.stopLoss) return 'Stop-Loss triggered';
    if (position.takeProfit1 && currentPrice >= position.takeProfit1) return 'Take-Profit 1 reached';
  } else {
    if (position.stopLoss && currentPrice >= position.stopLoss) return 'Stop-Loss triggered';
    if (position.takeProfit1 && currentPrice <= position.takeProfit1) return 'Take-Profit 1 reached';
  }
  return null;
}
