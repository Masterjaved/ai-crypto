import { describe, it, expect } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Dashboard } from '../pages/Dashboard';
import { LiveMarkets } from '../pages/LiveMarkets';
import { AiSignals } from '../pages/AiSignals';
import { DemoTrading } from '../pages/DemoTrading';
import { DemoWalletPage } from '../pages/DemoWallet';
import { PortfolioPage } from '../pages/Portfolio';
import { AiAnalysis } from '../pages/AiAnalysis';
import { BacktestingPage } from '../pages/Backtesting';
import { RiskManagementPage } from '../pages/RiskManagement';
import { PriceAlertsPage } from '../pages/PriceAlerts';
import { LearningCenterPage } from '../pages/LearningCenter';
import { SettingsPage } from '../pages/Settings';
import { SystemHealthPage } from '../pages/SystemHealth';
import '../i18n';

describe('All Pages Render Test', () => {
  const pages = [
    { name: 'Dashboard', comp: Dashboard },
    { name: 'LiveMarkets', comp: LiveMarkets },
    { name: 'AiSignals', comp: AiSignals },
    { name: 'DemoTrading', comp: DemoTrading },
    { name: 'DemoWallet', comp: DemoWalletPage },
    { name: 'Portfolio', comp: PortfolioPage },
    { name: 'AiAnalysis', comp: AiAnalysis },
    { name: 'Backtesting', comp: BacktestingPage },
    { name: 'RiskManagement', comp: RiskManagementPage },
    { name: 'PriceAlerts', comp: PriceAlertsPage },
    { name: 'LearningCenter', comp: LearningCenterPage },
    { name: 'Settings', comp: SettingsPage },
    { name: 'SystemHealth', comp: SystemHealthPage },
  ];

  for (const p of pages) {
    it(`renders ${p.name} cleanly`, () => {
      const html = ReactDOMServer.renderToString(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(p.comp)
        )
      );
      expect(html.length).toBeGreaterThan(50);
    });
  }
});
