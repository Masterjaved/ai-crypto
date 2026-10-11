-- ============================================================
-- Supabase PostgreSQL Schema for AI Crypto Trading Pro
-- Enables Row-Level Security (RLS) for complete multi-tenant safety
-- ============================================================

-- 1. Demo Wallets
CREATE TABLE IF NOT EXISTS demo_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    available_balance NUMERIC(18, 8) NOT NULL DEFAULT 10000.00000000,
    reserved_balance NUMERIC(18, 8) NOT NULL DEFAULT 0.00000000,
    total_deposited NUMERIC(18, 8) NOT NULL DEFAULT 10000.00000000,
    realized_pnl NUMERIC(18, 8) NOT NULL DEFAULT 0.00000000,
    total_fees_paid NUMERIC(18, 8) NOT NULL DEFAULT 0.00000000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Demo Orders
CREATE TABLE IF NOT EXISTS demo_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES demo_wallets(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL,
    quantity NUMERIC(18, 8) NOT NULL,
    price NUMERIC(18, 8),
    stop_price NUMERIC(18, 8),
    filled_price NUMERIC(18, 8),
    filled_quantity NUMERIC(18, 8),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    fee NUMERIC(18, 8) NOT NULL DEFAULT 0.00000000,
    fee_asset VARCHAR(10) DEFAULT 'USDT',
    slippage NUMERIC(8, 4) DEFAULT 0.05,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    filled_at TIMESTAMPTZ,
    notes TEXT
);

-- 3. Demo Positions
CREATE TABLE IF NOT EXISTS demo_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES demo_wallets(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL,
    quantity NUMERIC(18, 8) NOT NULL,
    avg_entry_price NUMERIC(18, 8) NOT NULL,
    current_price NUMERIC(18, 8) NOT NULL,
    unrealized_pnl NUMERIC(18, 8) NOT NULL DEFAULT 0,
    stop_loss NUMERIC(18, 8),
    take_profit_1 NUMERIC(18, 8),
    take_profit_2 NUMERIC(18, 8),
    total_fees NUMERIC(18, 8) DEFAULT 0,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    closed_at TIMESTAMPTZ,
    close_price NUMERIC(18, 8),
    realized_pnl NUMERIC(18, 8),
    close_reason TEXT
);

-- 4. Demo Transactions (Audited Ledger)
CREATE TABLE IF NOT EXISTS demo_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES demo_wallets(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    amount NUMERIC(18, 8) NOT NULL,
    balance_before NUMERIC(18, 8) NOT NULL,
    balance_after NUMERIC(18, 8) NOT NULL,
    symbol VARCHAR(20),
    order_id UUID,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row-Level Security (RLS)
ALTER TABLE demo_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_transactions ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
CREATE POLICY "Users can only access their own demo wallet"
    ON demo_wallets FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own demo orders"
    ON demo_orders FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own demo positions"
    ON demo_positions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own demo transactions"
    ON demo_transactions FOR ALL USING (auth.uid() = user_id);
