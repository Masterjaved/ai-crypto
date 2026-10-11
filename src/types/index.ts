// ============================================================
// Core Domain Types for AI Crypto Trading Pro
// ============================================================

export type CryptoSymbol =
  | 'BTCUSDT' | 'ETHUSDT' | 'BNBUSDT' | 'SOLUSDT'
  | 'XRPUSDT' | 'DOGEUSDT' | 'ADAUSDT' | 'TRXUSDT'
  | string;

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

export type SignalType = 'BUY' | 'SELL' | 'HOLD';

export type SignalStatus = 'provisional' | 'confirmed' | 'invalidated' | 'expired';

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LOSS' | 'TAKE_PROFIT';

export type OrderSide = 'BUY' | 'SELL';

export type OrderStatus = 'OPEN' | 'FILLED' | 'CANCELLED' | 'PARTIAL';

export type DataStatus = 'live' | 'delayed' | 'cached' | 'unavailable';

export type TrendDirection = 'STRONG_UP' | 'UP' | 'NEUTRAL' | 'DOWN' | 'STRONG_DOWN';

// ---
// Market Data
// ---

export interface Ticker {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
  bidPrice?: number;
  askPrice?: number;
  marketCap?: number;
  openPrice: number;
  lastUpdateTime: number;
  dataStatus: DataStatus;
  source: string;
}

export interface Candle {
  time: number; // Unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed: boolean;
}

export interface OrderBook {
  symbol: string;
  bids: [number, number][]; // [price, quantity][]
  asks: [number, number][];
  timestamp: number;
}

// ---
// Technical Indicators
// ---

export interface IndicatorValues {
  ema9?: number;
  ema21?: number;
  ema50?: number;
  ema200?: number;
  rsi14?: number;
  macd?: { macd: number; signal: number; histogram: number };
  bollingerBands?: { upper: number; middle: number; lower: number; bandwidth: number };
  atr14?: number;
  adx14?: number;
  vwap?: number;
  supportLevels?: number[];
  resistanceLevels?: number[];
  volume?: number;
  avgVolume20?: number;
  volumeRatio?: number;
}

// ---
// Signals
// ---

export interface Signal {
  id: string;
  userId?: string;
  symbol: string;
  timeframe: Timeframe;
  type: SignalType;
  status: SignalStatus;
  confidenceScore: number; // 0-100
  generatedAt: number; // Unix ms
  marketDataTimestamp: number;
  currentPrice: number;
  entryZoneLow?: number;
  entryZoneHigh?: number;
  stopLoss?: number;
  target1?: number;
  target2?: number;
  target3?: number;
  riskRewardRatio?: number;
  trendDirection: TrendDirection;
  indicators: IndicatorValues;
  reasons: string[];
  invalidationConditions: string[];
  risks: string[];
  isSuitableForDemo: boolean;
  isProvisional: boolean;
  // Outcome tracking
  outcome?: 'WIN' | 'LOSS' | 'BREAKEVEN' | 'PENDING';
  outcomePrice?: number;
  outcomeTime?: number;
  pnlPercent?: number;
}

export interface SignalPerformance {
  totalSignals: number;
  completedSignals: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  avgProfitPercent: number;
  avgLossPercent: number;
  profitFactor: number;
  maxDrawdownPercent: number;
  avgRiskReward: number;
  netPnlPercent: number;
  evaluationPeriodStart: number;
  evaluationPeriodEnd: number;
  sampleSize: number;
  bySymbol: Record<string, { wins: number; losses: number; winRate: number }>;
  byTimeframe: Record<string, { wins: number; losses: number; winRate: number }>;
}

// ---
// Demo Wallet & Orders
// ---

export interface DemoWallet {
  id: string;
  userId: string;
  availableBalance: number; // USDT
  reservedBalance: number; // in open orders
  totalDeposited: number;
  realizedPnl: number;
  totalFeesPaid: number;
  createdAt: string;
  updatedAt: string;
}

export interface DemoPosition {
  id: string;
  userId: string;
  walletId: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  avgEntryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  stopLoss?: number;
  takeProfit1?: number;
  takeProfit2?: number;
  takeProfit3?: number;
  totalFees: number;
  openedAt: string;
  signalId?: string;
  status: 'OPEN' | 'CLOSED';
  closedAt?: string;
  closePrice?: number;
  realizedPnl?: number;
  closeReason?: string;
}

export interface DemoOrder {
  id: string;
  userId: string;
  walletId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number; // for limit/stop
  stopPrice?: number;
  filledPrice?: number;
  filledQuantity?: number;
  status: OrderStatus;
  fee: number;
  feeAsset: string;
  slippage: number; // percent
  createdAt: string;
  filledAt?: string;
  cancelledAt?: string;
  signalId?: string;
  positionId?: string;
  notes?: string;
}

export interface DemoTransaction {
  id: string;
  userId: string;
  walletId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'BUY' | 'SELL' | 'FEE' | 'RESET' | 'PNL_CLOSE';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  symbol?: string;
  orderId?: string;
  description: string;
  timestamp: string;
}

// ---
// Portfolio & Performance
// ---

export interface PortfolioSummary {
  totalEquity: number;
  availableBalance: number;
  openPositionValue: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalPnl: number;
  totalPnlPercent: number;
  totalFeesPaid: number;
  winningTrades: number;
  losingTrades: number;
  totalTrades: number;
  winRate: number;
  maxDrawdown: number;
}

export interface EquityPoint {
  time: number; // unix seconds
  equity: number;
  drawdown: number;
}

// ---
// Alerts
// ---

export interface PriceAlert {
  id: string;
  userId: string;
  symbol: string;
  condition: 'ABOVE' | 'BELOW' | 'PERCENT_CHANGE';
  targetPrice: number;
  currentPrice?: number;
  isTriggered: boolean;
  triggeredAt?: string;
  createdAt: string;
  isActive: boolean;
  notes?: string;
}

// ---
// Backtest
// ---

export interface BacktestConfig {
  symbol: string;
  timeframe: Timeframe;
  startDate: string;
  endDate: string;
  initialCapital: number;
  feePercent: number;
  slippagePercent: number;
  strategy: BacktestStrategy;
}

export interface BacktestStrategy {
  name: string;
  entryRules: StrategyRule[];
  exitRules: StrategyRule[];
  stopLossPercent?: number;
  takeProfitPercent?: number;
  maxPositions: number;
}

export interface StrategyRule {
  indicator: string;
  condition: string;
  value: number | string;
}

export interface BacktestTrade {
  id: string;
  entryTime: number;
  exitTime: number;
  side: OrderSide;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  fee: number;
  exitReason: string;
}

export interface BacktestResult {
  id: string;
  config: BacktestConfig;
  trades: BacktestTrade[];
  equityCurve: EquityPoint[];
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  netPnl: number;
  netPnlPercent: number;
  maxDrawdown: number;
  profitFactor: number;
  avgRiskReward: number;
  sharpeRatio?: number;
  completedAt: string;
  disclaimer: string;
}

// ---
// Risk
// ---

export interface RiskCalculation {
  accountBalance: number;
  riskPercent: number;
  entryPrice: number;
  stopLossPrice: number;
  positionSize: number;
  riskAmount: number;
  rewardTarget?: number;
  rewardAmount?: number;
  riskRewardRatio?: number;
}

// ---
// System Health
// ---

export interface SystemHealth {
  marketDataStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  webSocketStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  databaseStatus: 'ok' | 'error' | 'unknown';
  signalEngineStatus: 'running' | 'stopped' | 'error';
  lastDataUpdate: number | null;
  dataLatencyMs: number | null;
  lastError?: string;
  apiProvider: string;
  wsProvider: string;
}

// ---
// User Preferences
// ---

export interface UserPreferences {
  language: 'en' | 'ur';
  theme: 'dark' | 'light';
  defaultSymbol: string;
  defaultTimeframe: Timeframe;
  feePercent: number;
  slippagePercent: number;
  maxDailyLossPercent: number;
  maxOpenPositions: number;
  emailAlerts: boolean;
  soundAlerts: boolean;
  showDemoLabel: boolean;
  riskPercent: number;
}
