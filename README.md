# AI Crypto Trading Pro — Live Market Intelligence & Demo Trading Platform

A production-grade, responsive, educational cryptocurrency terminal with real-time Binance market feeds, TradingView Lightweight Charts, transparent quantitative AI signals, simulated demo trading wallet with audited ledger, strategy backtesting, risk management, and bilingual (English & Urdu) support.

---

## 🌟 Core Features

### 1. 📊 Live Real-Time Market Data
- Direct connection to **Binance Public WebSocket (`wss://stream.binance.com:9443`)** and **REST API (`/api/v3`)**.
- Displays Real-time Prices, 24h High/Low, Volume, Bid/Ask spread, and data integrity status indicators (**LIVE**, **DELAYED**, **CACHED**, **UNAVAILABLE**).
- Zero fabricated numbers. True market data only.

### 2. 📈 Professional Interactive Candlestick Charts
- Built with **TradingView Lightweight Charts v4**.
- Full multi-timeframe capability: `1m`, `5m`, `15m`, `30m`, `1h`, `4h`, `1d`, `1w`.
- Dynamic indicator overlays: **EMA 9 (Sky Blue)**, **EMA 21 (Amber)**, **EMA 50 (Purple)**.
- Real volume bars and dynamic Stop-Loss / Take-Profit reference price lines.

### 3. 🧠 Transparent AI Signal Engine
- Multi-factor deterministic scoring model (-100 to +100) based on:
  - **EMA 9/21/50/200** structure
  - **RSI (14)** momentum
  - **MACD (12, 26, 9)** histogram
  - **Bollinger Bands (20, 2)**
  - **ATR (14)** volatility
  - **ADX (14)** trend strength
  - **VWAP**
- Generates **BUY SETUP**, **SELL / EXIT SETUP**, or **HOLD / WAIT** (when evidence is insufficient).
- Includes dynamic Stop-Loss, Target 1, Target 2, Target 3, Risk-to-Reward ratio, and invalidation rules.

### 4. 💼 Virtual Demo Wallet & Paper Trading Execution
- Preloaded with **$10,000 virtual USDT**.
- Realistic order execution modeling simulated **0.1% trading fee** and **0.05% slippage**.
- Complete Position Management: Unrealized P&L, Realized P&L, Total Equity, and Auditable Ledger history.
- Automatic Stop-Loss and Take-Profit execution tracking.

### 5. 🔬 Strategy Backtesting Engine
- Fast historical backtester with zero look-ahead bias.
- Customizable Fast EMA / Slow EMA crossover strategies.
- Generates Win Rate, Total P&L, Trade-by-trade logs, and **CSV Export**.

### 6. 🛡️ Risk Management & Educational Center
- Interactive **Position Size Calculator** based on account balance and risk-per-trade percentage.
- Risk-to-Reward calculation and core capital preservation rules.
- Comprehensive educational modules.

### 7. 🌐 Complete English & Urdu Interface
- Seamless bilingual toggle (EN / اردو).
- Full Right-to-Left (RTL) alignment and native Urdu typography when Urdu is selected.

### 8. 🗄️ Supabase PostgreSQL Backend & RLS
- Full database schema with Row-Level Security (RLS) for multi-tenant privacy.
- Resilient local browser state persistence when backend credentials are not set.

---

## 🚀 Quick Start Instructions

### Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **npm**: v9+

### Installation
```bash
# 1. Clone or navigate to the project directory
cd ai-crypto-trading-pro

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. (Optional) Copy environment variables
cp .env.example .env

# 4. Start local development server
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 🧪 Running Unit Tests
```bash
npm test
```

---

## ☁️ Deployment (Netlify)
1. Link your GitHub repository to Netlify.
2. Set Build Command: `npm run build`
3. Set Publish Directory: `dist`
4. Set Environment Variables (if using Supabase):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

---

## ⚠️ Disclaimer
**AI Crypto Trading Pro is an educational analysis and paper-trading platform.** Real-money execution, deposits, withdrawals, and live exchange execution are strictly disabled. Market signals are generated algorithmically for practice and educational purposes and do not constitute financial advice.
"# ai-crypto" 
