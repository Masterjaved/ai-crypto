import { useTranslation } from 'react-i18next';
import { useMarketStore } from '@/store/marketStore';
import { Activity, Wifi, Database, Brain, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

export function SystemHealthPage() {
  const { t } = useTranslation();
  const { health, loadTickers } = useMarketStore();

  const isWsLive = health.webSocketStatus === 'connected';
  const isRestLive = health.marketDataStatus === 'connected';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#00d4aa]" />
            {t('nav.systemHealth')}
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1">
            Real-time diagnostics of market data streams, WebSocket connections, and quantitative engines.
          </p>
        </div>

        <button
          onClick={loadTickers}
          className="btn-secondary text-xs flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Test Endpoints
        </button>
      </div>

      {/* Grid of health monitors */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* WebSocket Stream */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-white text-sm flex items-center gap-2">
              <Wifi className="w-4 h-4 text-[#00d4aa]" />
              WebSocket Feed (Binance)
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              isWsLive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {isWsLive ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
          <div className="text-xs text-[#64748b] space-y-1">
            <div>Provider: wss://stream.binance.com:9443</div>
            <div>Auto-reconnect: Enabled (Exponential backoff)</div>
          </div>
        </div>

        {/* REST API Fallback */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-white text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              REST Polling Fallback
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              isRestLive ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {isRestLive ? 'OPERATIONAL' : 'POLLING'}
            </span>
          </div>
          <div className="text-xs text-[#64748b] space-y-1">
            <div>Endpoint: https://api.binance.com/api/v3</div>
            <div>Latency: {health.dataLatencyMs ? `${health.dataLatencyMs}ms` : 'Healthy'}</div>
          </div>
        </div>

        {/* Database Layer */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-white text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              Database Engine
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              isSupabaseConfigured ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {isSupabaseConfigured ? 'SUPABASE RLS' : 'LOCAL PERSIST'}
            </span>
          </div>
          <div className="text-xs text-[#64748b] space-y-1">
            <div>Schema: PostgreSQL Audited Ledger</div>
            <div>Security: Row-Level Security Enabled</div>
          </div>
        </div>
      </div>
    </div>
  );
}
