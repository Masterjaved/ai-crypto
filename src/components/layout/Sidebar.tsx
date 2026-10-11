import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, TrendingUp, Brain, BarChart2, ShoppingBag,
  Wallet, BookOpen, LineChart, FlaskConical, Shield,
  Bell, GraduationCap, Settings, Activity, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, path: '/' },
  { key: 'liveMarkets', icon: TrendingUp, path: '/markets' },
  { key: 'aiSignals', icon: Brain, path: '/signals' },
  { key: 'charts', icon: BarChart2, path: '/charts' },
  { key: 'demoTrading', icon: ShoppingBag, path: '/demo-trading' },
  { key: 'demoWallet', icon: Wallet, path: '/demo-wallet' },
  { key: 'portfolio', icon: BookOpen, path: '/portfolio' },
  { key: 'aiAnalysis', icon: LineChart, path: '/analysis' },
  { key: 'backtest', icon: FlaskConical, path: '/backtest' },
  { key: 'risk', icon: Shield, path: '/risk' },
  { key: 'alerts', icon: Bell, path: '/alerts' },
  { key: 'learning', icon: GraduationCap, path: '/learning' },
  { key: 'settings', icon: Settings, path: '/settings' },
  { key: 'systemHealth', icon: Activity, path: '/system-health' },
] as const;

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ur';

  return (
    <>
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        'fixed top-0 z-50 h-full w-64 bg-[#0d1424] border-r border-[#1e2d45]',
        'flex flex-col transition-transform duration-300 ease-in-out',
        'lg:translate-x-0 lg:static lg:z-auto flex-shrink-0',
        isRTL ? 'right-0 border-l border-r-0' : 'left-0',
        isOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full'),
      )}>
        {/* Logo Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1e2d45]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-[#00d4aa] to-[#3b82f6] rounded-xl flex items-center justify-center shadow-md shadow-[#00d4aa]/20">
              <Brain className="w-5 h-5 text-[#0a0e1a]" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight flex items-center gap-1.5">
                AI CRYPTO <span className="text-[#00d4aa]">PRO</span>
              </div>
              <div className="text-[#64748b] text-[10px] uppercase font-semibold tracking-wider">Trading Intelligence</div>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="lg:hidden text-[#64748b] hover:text-white p-1 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Demo Warning Badge */}
        <div className="mx-3 mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="text-yellow-400 text-[10px] font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1">
            <span>⚠️</span> {t('common.demo')} / {t('common.virtual')}
          </div>
          <div className="text-yellow-400/70 text-[9px] text-center mt-0.5">
            {t('demo.disclaimer')}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(({ key, icon: Icon, path }) => (
            <NavLink
              key={key}
              to={path}
              end={path === '/'}
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                'text-[#94a3b8] hover:text-white hover:bg-[#1e2d45]/70',
                isActive && 'text-[#00d4aa] bg-[#00d4aa]/10 hover:bg-[#00d4aa]/15 border-l-2 border-[#00d4aa] font-semibold',
                isRTL && 'flex-row-reverse border-l-0 border-r-2'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{t(`nav.${key}`)}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer info */}
        <div className="p-3 border-t border-[#1e2d45] bg-[#0a0e1a]/50">
          <div className="text-[10px] text-[#64748b] text-center flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa]" />
            v1.0.0 • Live Binance API
          </div>
        </div>
      </aside>
    </>
  );
}
