import { useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  IPriceLine,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  CandlestickData,
  Time
} from 'lightweight-charts';
import type { Candle, Timeframe } from '@/types';
import { calcEMA } from '@/services/indicators';

interface TradingChartProps {
  candles: Candle[];
  symbol: string;
  timeframe: Timeframe;
  onTimeframeChange?: (tf: Timeframe) => void;
  showIndicators?: boolean;
  stopLoss?: number;
  target1?: number;
  target2?: number;
  target3?: number;
  height?: number;
}

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];

export function TradingChart({
  candles,
  timeframe,
  onTimeframeChange,
  showIndicators = true,
  stopLoss,
  target1,
  target2,
  target3,
  height = 450,
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ema9SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema21SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clear previous elements
    chartContainerRef.current.innerHTML = '';

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0d1424' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e2d45' },
        horzLines: { color: '#1e2d45' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#00d4aa', width: 1, style: 3 },
        horzLine: { color: '#00d4aa', width: 1, style: 3 },
      },
      rightPriceScale: {
        borderColor: '#1e2d45',
      },
      timeScale: {
        borderColor: '#1e2d45',
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth || 600,
      height,
    });

    // Main Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    // Volume histogram series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#3b82f6',
      priceFormat: { type: 'volume' },
      priceScaleId: '', // overlay
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    // EMA lines
    const ema9Series = chart.addSeries(LineSeries, {
      color: '#38bdf8',
      lineWidth: 1,
      title: 'EMA 9',
    });

    const ema21Series = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 1,
      title: 'EMA 21',
    });

    const ema50Series = chart.addSeries(LineSeries, {
      color: '#a855f7',
      lineWidth: 1,
      title: 'EMA 50',
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    ema9SeriesRef.current = ema9Series;
    ema21SeriesRef.current = ema21Series;
    ema50SeriesRef.current = ema50Series;

    // Resize handler
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      try {
        chart.remove();
      } catch (e) {
        // ignore
      }
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [height]);

  // Update candle & volume data
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || candles.length === 0) return;

    try {
      const formattedCandles: CandlestickData<Time>[] = candles.map(c => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      const formattedVolume = candles.map(c => ({
        time: c.time as Time,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)',
      }));

      candleSeriesRef.current.setData(formattedCandles);
      volumeSeriesRef.current.setData(formattedVolume);

      // Indicator calculations & display
      if (showIndicators) {
        const closes = candles.map(c => c.close);
        
        const ema9 = calcEMA(closes, 9);
        if (ema9SeriesRef.current && ema9.length > 0) {
          const offset = candles.length - ema9.length;
          ema9SeriesRef.current.setData(
            ema9.map((val, idx) => ({ time: candles[idx + offset].time as Time, value: val }))
          );
        }

        const ema21 = calcEMA(closes, 21);
        if (ema21SeriesRef.current && ema21.length > 0) {
          const offset = candles.length - ema21.length;
          ema21SeriesRef.current.setData(
            ema21.map((val, idx) => ({ time: candles[idx + offset].time as Time, value: val }))
          );
        }

        const ema50 = calcEMA(closes, 50);
        if (ema50SeriesRef.current && ema50.length > 0) {
          const offset = candles.length - ema50.length;
          ema50SeriesRef.current.setData(
            ema50.map((val, idx) => ({ time: candles[idx + offset].time as Time, value: val }))
          );
        }
      }

      // Remove existing price lines
      priceLinesRef.current.forEach(pl => {
        try {
          candleSeriesRef.current?.removePriceLine(pl);
        } catch (e) {
          // ignore
        }
      });
      priceLinesRef.current = [];

      // Set price lines for SL & Targets
      if (stopLoss && candleSeriesRef.current) {
        const line = candleSeriesRef.current.createPriceLine({
          price: stopLoss,
          color: '#ef4444',
          lineWidth: 2,
          lineStyle: 2,
          title: 'Stop Loss',
        });
        priceLinesRef.current.push(line);
      }

      if (target1 && candleSeriesRef.current) {
        const line = candleSeriesRef.current.createPriceLine({
          price: target1,
          color: '#22c55e',
          lineWidth: 2,
          lineStyle: 2,
          title: 'Target 1',
        });
        priceLinesRef.current.push(line);
      }

      if (target2 && candleSeriesRef.current) {
        const line = candleSeriesRef.current.createPriceLine({
          price: target2,
          color: '#10b981',
          lineWidth: 1,
          lineStyle: 3,
          title: 'Target 2',
        });
        priceLinesRef.current.push(line);
      }

      if (target3 && candleSeriesRef.current) {
        const line = candleSeriesRef.current.createPriceLine({
          price: target3,
          color: '#059669',
          lineWidth: 1,
          lineStyle: 3,
          title: 'Target 3',
        });
        priceLinesRef.current.push(line);
      }
    } catch (err) {
      console.warn('TradingChart data update error:', err);
    }
  }, [candles, showIndicators, stopLoss, target1, target2, target3]);

  return (
    <div className="card p-3 flex flex-col gap-3">
      {/* Timeframe selector header */}
      {onTimeframeChange && (
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#1e2d45]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-[#64748b] font-medium mr-1">Timeframe:</span>
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  timeframe === tf
                    ? 'bg-[#00d4aa] text-[#0a0e1a]'
                    : 'bg-[#1e2d45]/60 text-[#94a3b8] hover:text-white hover:bg-[#1e2d45]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {showIndicators && (
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-[#38bdf8]">
                <span className="w-2 h-0.5 bg-[#38bdf8]" /> EMA 9
              </span>
              <span className="flex items-center gap-1 text-[#f59e0b]">
                <span className="w-2 h-0.5 bg-[#f59e0b]" /> EMA 21
              </span>
              <span className="flex items-center gap-1 text-[#a855f7]">
                <span className="w-2 h-0.5 bg-[#a855f7]" /> EMA 50
              </span>
            </div>
          )}
        </div>
      )}

      {/* Chart container */}
      <div ref={chartContainerRef} className="w-full rounded-lg overflow-hidden relative" />
    </div>
  );
}
