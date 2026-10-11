import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMarketStore } from '@/store/marketStore';
import { useWalletStore } from '@/store/walletStore';
import { TradingChart } from '@/components/charts/TradingChart';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { executeMarketOrder } from '@/services/demoTrading';
import { generateSignal } from '@/services/signalEngine';
import { SUPPORTED_SYMBOLS } from '@/services/marketData';
import { getSymbolName, formatUSDT } from '@/lib/utils';
import type { OrderSide, OrderType } from '@/types';
import { ShoppingBag, ArrowUpRight, ArrowDownRight, Coins } from 'lucide-react';
import toast from 'react-hot-toast';

export function DemoTrading() {
  const { t } = useTranslation();
  const { tickers, selectedSymbol, selectedTimeframe, candles, setSelectedSymbol, setSelectedTimeframe, loadCandles } = useMarketStore();
  const { wallet, addOrder, addPosition, updateWallet, addTransactions } = useWalletStore();

  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [amountUSDT, setAmountUSDT] = useState<string>('500');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');

  const currentTicker = tickers[selectedSymbol];
  const currentCandles = candles[`${selectedSymbol}_${selectedTimeframe}`] || [];

  useEffect(() => {
    loadCandles(selectedSymbol, selectedTimeframe);
  }, [selectedSymbol, selectedTimeframe]);

  const currentPrice = currentTicker?.price || 0;
  const quantity = currentPrice > 0 ? parseFloat(amountUSDT || '0') / currentPrice : 0;

  // Auto-fill SL/TP based on AI signals
  const fillAiLevels = () => {
    if (currentCandles.length < 30 || currentPrice === 0) return;
    const sig = generateSignal(selectedSymbol, selectedTimeframe, currentCandles, currentPrice);
    if (sig.stopLoss) setStopLoss(sig.stopLoss.toFixed(2));
    if (sig.target1) setTakeProfit(sig.target1.toFixed(2));
    toast.success('Filled SL & Target from AI Signal!');
  };

  const handlePlaceOrder = () => {
    if (!wallet) {
      toast.error('Wallet not initialized');
      return;
    }

    if (quantity <= 0 || isNaN(quantity)) {
      toast.error('Please enter a valid amount');
      return;
    }

    const res = executeMarketOrder({
      userId: wallet.userId,
      walletId: wallet.id,
      wallet,
      symbol: selectedSymbol,
      side,
      type: orderType,
      quantity,
      marketPrice: currentPrice,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit1: takeProfit ? parseFloat(takeProfit) : undefined,
    });

    if (res.success && res.order && res.position && res.updatedWallet) {
      addOrder(res.order);
      addPosition(res.position);
      updateWallet(res.updatedWallet);
      addTransactions(res.transactions);
      toast.success(`Demo ${side} Order Executed! Filled @ $${res.order.filledPrice?.toFixed(2)}`);
    } else {
      toast.error(res.error || 'Failed to place demo order');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#00d4aa]" />
            {t('demo.placeOrder')}
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1">
            Real-time paper trading execution with realistic fees & slippage simulation.
          </p>
        </div>

        {wallet && (
          <div className="card px-4 py-2 flex items-center gap-3">
            <span className="text-xs text-[#64748b]">{t('demo.balance')}:</span>
            <span className="font-mono font-bold text-sm text-[#00d4aa]">
              ${formatUSDT(wallet.availableBalance)} USDT
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Chart + Pair Header */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {/* Coin selector */}
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#00d4aa]" />
                <select
                  value={selectedSymbol}
                  onChange={e => setSelectedSymbol(e.target.value)}
                  className="bg-[#0d1424] border border-[#1e2d45] rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-[#00d4aa]"
                >
                  {SUPPORTED_SYMBOLS.map(sym => (
                    <option key={sym} value={sym}>
                      {sym.replace('USDT', '')} / USDT ({getSymbolName(sym)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {currentTicker && (
              <PriceDisplay
                price={currentTicker.price}
                changePercent={currentTicker.priceChangePercent}
                size="md"
              />
            )}
          </div>

          <TradingChart
            candles={currentCandles}
            symbol={selectedSymbol}
            timeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
            stopLoss={stopLoss ? parseFloat(stopLoss) : undefined}
            target1={takeProfit ? parseFloat(takeProfit) : undefined}
            height={460}
          />
        </div>

        {/* Right 1 col: Order Form */}
        <div className="card p-5 space-y-5">
          {/* Active Symbol Switcher in Order Panel */}
          <div className="space-y-1.5">
            <label className="text-xs text-[#94a3b8] font-medium block">
              Trading Cryptocurrency
            </label>
            <select
              value={selectedSymbol}
              onChange={e => setSelectedSymbol(e.target.value)}
              className="input font-bold text-xs"
            >
              {SUPPORTED_SYMBOLS.map(sym => (
                <option key={sym} value={sym}>
                  {sym.replace('USDT', '')} - {getSymbolName(sym)}
                </option>
              ))}
            </select>
          </div>

          {/* Order Side Selector (BUY/SELL) */}
          <div className="grid grid-cols-2 gap-2 bg-[#0d1424] p-1 rounded-xl border border-[#1e2d45]">
            <button
              onClick={() => setSide('BUY')}
              className={`py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                side === 'BUY'
                  ? 'bg-green-500 text-[#0a0e1a] shadow-lg shadow-green-500/20'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              BUY (LONG)
            </button>
            <button
              onClick={() => setSide('SELL')}
              className={`py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                side === 'SELL'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              SELL (SHORT)
            </button>
          </div>

          {/* Amount input */}
          <div className="space-y-1.5">
            <label className="text-xs text-[#94a3b8] font-medium flex justify-between">
              <span>Order Amount (USDT)</span>
              <span className="text-[11px] text-[#64748b]">
                Qty: ~{quantity.toFixed(4)} {selectedSymbol.replace('USDT', '')}
              </span>
            </label>
            <input
              type="number"
              value={amountUSDT}
              onChange={e => setAmountUSDT(e.target.value)}
              className="input font-mono text-sm font-bold"
              placeholder="e.g. 500"
            />
          </div>

          {/* Quick preset buttons */}
          <div className="flex gap-2">
            {[100, 250, 500, 1000, 2500].map(val => (
              <button
                key={val}
                onClick={() => setAmountUSDT(val.toString())}
                className="flex-1 py-1 text-[11px] font-mono bg-[#1e2d45]/60 hover:bg-[#1e2d45] rounded text-[#94a3b8] hover:text-white transition-colors"
              >
                ${val}
              </button>
            ))}
          </div>

          {/* Risk Management / SL & TP */}
          <div className="space-y-3 pt-2 border-t border-[#1e2d45]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Risk Parameters</span>
              <button
                onClick={fillAiLevels}
                className="text-[11px] text-[#00d4aa] hover:underline"
              >
                Auto-fill AI Levels
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-[#64748b]">Stop-Loss (USDT)</label>
              <input
                type="number"
                value={stopLoss}
                onChange={e => setStopLoss(e.target.value)}
                placeholder="Optional SL price"
                className="input text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-[#64748b]">Take-Profit Target (USDT)</label>
              <input
                type="number"
                value={takeProfit}
                onChange={e => setTakeProfit(e.target.value)}
                placeholder="Optional TP price"
                className="input text-xs font-mono"
              />
            </div>
          </div>

          {/* Order Summary Breakdown */}
          <div className="bg-[#0d1424] p-3 rounded-lg border border-[#1e2d45] space-y-1.5 text-xs">
            <div className="flex justify-between text-[#64748b]">
              <span>Estimated Fee (0.1%):</span>
              <span className="font-mono text-white">
                ${((parseFloat(amountUSDT || '0') * 0.001) || 0).toFixed(2)} USDT
              </span>
            </div>
            <div className="flex justify-between text-[#64748b]">
              <span>Simulated Slippage (0.05%):</span>
              <span className="font-mono text-white">~0.05%</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handlePlaceOrder}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-150 shadow-lg ${
              side === 'BUY'
                ? 'bg-green-500 hover:bg-green-600 text-[#0a0e1a] shadow-green-500/20'
                : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
            }`}
          >
            {side === 'BUY' ? `Execute Demo Buy (${selectedSymbol.replace('USDT', '')})` : `Execute Demo Sell (${selectedSymbol.replace('USDT', '')})`}
          </button>
        </div>
      </div>
    </div>
  );
}
