import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/pages/Dashboard';
import { LiveMarkets } from '@/pages/LiveMarkets';
import { AiSignals } from '@/pages/AiSignals';
import { AdvancedChartsPage } from '@/pages/AdvancedCharts';
import { DemoTrading } from '@/pages/DemoTrading';
import { DemoWalletPage } from '@/pages/DemoWallet';
import { PortfolioPage } from '@/pages/Portfolio';
import { AiAnalysis } from '@/pages/AiAnalysis';
import { BacktestingPage } from '@/pages/Backtesting';
import { RiskManagementPage } from '@/pages/RiskManagement';
import { PriceAlertsPage } from '@/pages/PriceAlerts';
import { LearningCenterPage } from '@/pages/LearningCenter';
import { SettingsPage } from '@/pages/Settings';
import { SystemHealthPage } from '@/pages/SystemHealth';

export function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#131c2e',
            color: '#e2e8f0',
            border: '1px solid #1e2d45',
            borderRadius: '12px',
            fontSize: '13px',
          },
        }}
      />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/markets" element={<LiveMarkets />} />
          <Route path="/signals" element={<AiSignals />} />
          <Route path="/charts" element={<AdvancedChartsPage />} />
          <Route path="/demo-trading" element={<DemoTrading />} />
          <Route path="/demo-wallet" element={<DemoWalletPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/analysis" element={<AiAnalysis />} />
          <Route path="/backtest" element={<BacktestingPage />} />
          <Route path="/risk" element={<RiskManagementPage />} />
          <Route path="/alerts" element={<PriceAlertsPage />} />
          <Route path="/learning" element={<LearningCenterPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/system-health" element={<SystemHealthPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
