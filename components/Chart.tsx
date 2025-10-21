import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, LineStyle, CandlestickData, LineData, PriceLineOptions, IPriceLine } from 'lightweight-charts';
import { fetchOhlcv, fetchKagi } from '../lib/api';
import type { Alert, AccountState } from '../App';

interface ChartProps {
    focusSymbol: string;
    wsStatus: 'connecting' | 'connected' | 'disconnected';
    alerts: Alert[];
    accountState: AccountState | null;
    fibTarget?: number;
}

const createPriceLine = (price: number, color: string, title: string, style: LineStyle = LineStyle.Dashed, lineWidth: 1 | 2 | 3 | 4 = 1): PriceLineOptions => ({
    price,
    color,
    lineWidth,
    lineStyle: style,
    axisLabelVisible: true,
    title,
});

const FIB_LEVELS = [-0.5];

export default function Chart({ focusSymbol, wsStatus, alerts, accountState, fibTarget = 1.618 }: ChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceSeries = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const kagiSeries = useRef<ISeriesApi<'Line'> | null>(null);
  const priceLinesRef = useRef<Map<string, IPriceLine>>(new Map());
  
  const [chartError, setChartError] = useState<string | null>(null);
  const [currentSetup, setCurrentSetup] = useState<Alert | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activePosition, setActivePosition] = useState(accountState?.positions.find(p => p.symbol === focusSymbol) || null);

  useEffect(() => {
    const setup = alerts.find(a => a.symbol === focusSymbol) || null;
    setCurrentSetup(setup);
  }, [alerts, focusSymbol]);

  useEffect(() => {
    const position = accountState?.positions.find(p => p.symbol === focusSymbol) || null;
    setActivePosition(position);
  }, [accountState, focusSymbol]);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      width: ref.current.clientWidth,
      height: ref.current.clientHeight,
      layout: { 
          background: { color: '#18181b' }, 
          textColor: '#e4e4e7',
          fontSize: 12,
      },
      grid: { 
          vertLines: { color: '#27272a' }, 
          horzLines: { color: '#27272a' } 
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        borderColor: '#3f3f46',
      },
      rightPriceScale: {
        borderColor: '#3f3f46',
      },
      crosshair: {
        mode: 1, // Magnet
      }
    });
    
    priceSeries.current = chart.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        wickUpColor: '#22c55e',
    });
    kagiSeries.current = chart.addLineSeries({ color: '#f59e0b', lineWidth: 2 });
    
    chartRef.current = chart;

    const resizeObserver = new ResizeObserver(entries => {
        const entry = entries[0];
        if (entry) {
            const { width, height } = entry.contentRect;
            chart.resize(width, height);
        }
    });

    resizeObserver.observe(ref.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  const updateChartData = useCallback(async () => {
    if (wsStatus !== 'connected' || !priceSeries.current || !focusSymbol) {
        priceSeries.current?.setData([]);
        kagiSeries.current?.setData([]);
        if (wsStatus === 'disconnected') {
            setChartError(`Backend desconectado. Aguardando reconexão...`);
        }
        return;
    }
    
    setIsLoading(true);
    try {
      setChartError(null);
      const [oc, kg] = await Promise.all([
        fetchOhlcv(focusSymbol),
        fetchKagi(focusSymbol)
      ]);

      if (priceSeries.current && oc.candles) {
        const data: CandlestickData[] = oc.candles.map((c: any[]) => ({ time: c[0] / 1000, open: c[1], high: c[2], low: c[3], close: c[4] }));
        priceSeries.current.setData(data);
      }
      if (kagiSeries.current && kg.kagi) {
        const data: LineData[] = kg.kagi.map((p: any[]) => ({ time: p[0] / 1000, value: p[1] }));
        kagiSeries.current.setData(data);
      }
      if (oc.candles.length > 0) {
        chartRef.current?.timeScale().scrollToPosition(oc.candles.length - 1, false);
      }
      
    } catch (e) {
      setChartError(`Falha ao carregar dados do gráfico para ${focusSymbol}. Verifique a conexão com o backend.`);
    } finally {
        setIsLoading(false);
    }
  }, [focusSymbol, wsStatus]);
  
  useEffect(() => {
    if(!focusSymbol || wsStatus !== 'connected') return;
    updateChartData(); 
    const id = setInterval(updateChartData, 5000);
    return () => clearInterval(id);
  }, [updateChartData, focusSymbol, wsStatus]);
  
  const drawPriceLine = useCallback((series: ISeriesApi<'Candlestick'>, id: string, options: PriceLineOptions) => {
    if (priceLinesRef.current.has(id)) {
        const existingLine = priceLinesRef.current.get(id);
        if (existingLine) {
            existingLine.applyOptions(options);
            return;
        }
    }
    const newLine = series.createPriceLine(options);
    priceLinesRef.current.set(id, newLine);
  }, []);

  const removePriceLine = useCallback((series: ISeriesApi<'Candlestick'>, id: string) => {
    if (priceLinesRef.current.has(id)) {
        const line = priceLinesRef.current.get(id);
        if (line) series.removePriceLine(line);
        priceLinesRef.current.delete(id);
    }
  }, []);

  useEffect(() => {
    if (!priceSeries.current) return;
    const series = priceSeries.current;
    
    // Clear all lines before redrawing
    priceLinesRef.current.forEach(line => series.removePriceLine(line));
    priceLinesRef.current.clear();

    // Draw active position line
    if (activePosition) {
        drawPriceLine(series, 'position-entry', createPriceLine(activePosition.entryPrice, '#a78bfa', 'Preço Entrada', LineStyle.Solid, 2));
    }

    // Draw setup lines and Fibonacci levels
    if (currentSetup) {
        const { signal, entry, stop } = currentSetup;
        
        // Main lines (0% and 100%)
        drawPriceLine(series, 'setup-entry', createPriceLine(entry, '#facc15', 'Gatilho (0%)', LineStyle.Dashed, 2));
        drawPriceLine(series, 'setup-stop', createPriceLine(stop, '#ef4444', 'Stop Loss (100%)', LineStyle.Dashed, 2));
        
        // Fibonacci lines
        const range = Math.abs(entry - stop);
        const fibColor = '#60a5fa'; // Light blue
        
        FIB_LEVELS.forEach(level => {
            const price = signal === 'buy' ? entry - (range * level) : entry + (range * level);
            drawPriceLine(series, `fib-${level}`, createPriceLine(price, fibColor, `Alvo (${level})`, LineStyle.Dotted));
        });

        // Fibonacci Projection (Target)
        const targetPrice = signal === 'buy' ? entry + (range * fibTarget) : entry - (range * fibTarget);
        drawPriceLine(series, 'fib-target', createPriceLine(targetPrice, '#3b82f6', `Alvo (${fibTarget})`, LineStyle.Dashed, 2));

    }
  }, [currentSetup, activePosition, fibTarget, drawPriceLine, removePriceLine]);

  return (
    <div className="bg-zinc-900 rounded-lg p-2 relative">
      <div className="flex items-center justify-between px-2 py-1">
        <div className="text-amber-300 font-bold text-lg">{focusSymbol}</div>
      </div>
      <div ref={ref} className="w-full relative h-[350px] md:h-[460px]">
        {isLoading && (
            <div className="absolute inset-0 bg-zinc-900 bg-opacity-80 flex flex-col items-center justify-center z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
                <p className="text-zinc-400 mt-4 text-sm">Carregando dados do gráfico...</p>
            </div>
        )}
        {chartError && !isLoading && (
            <div className="absolute inset-0 bg-zinc-900 bg-opacity-80 flex items-center justify-center z-10">
                <p className="text-red-400 text-center p-4">{chartError}</p>
            </div>
        )}
      </div>
    </div>
  );
}