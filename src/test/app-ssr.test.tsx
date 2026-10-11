import { describe, it, expect } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Dashboard } from '../pages/Dashboard';
import '../i18n';

describe('App Components Test', () => {
  it('renders Dashboard without crashing', () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(
          Routes,
          null,
          React.createElement(
            Route,
            { element: React.createElement(AppLayout) },
            React.createElement(Route, { path: '/', element: React.createElement(Dashboard) })
          )
        )
      )
    );
    expect(html).toContain('AI CRYPTO');
    expect(html).toContain('USDT');
  });
});
