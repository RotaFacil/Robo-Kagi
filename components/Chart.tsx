import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, LineStyle, CandlestickData, LineData, PriceLineOptions, IPriceLine, SeriesMarker, Time } from 'lightweight-charts';
import { fetchOhlcv, fetchKagi } from '../lib/api';
import type { Alert, AccountState, AIAnalysis } from '../App';

interface ChartProps {
    focusSymbol: string;
    timeframe: string;
    onTimeframeChange: (tf: string) => void;
    wsStatus: 'connecting' | 'connected' | 'disconnected';
    alerts: Alert[];
    accountState: AccountState | null;
    fibTarget?: number;
    aiAnalyses?: AIAnalysis[];
    isActive: boolean;
    onClick: () => void;
    isMainChart?: boolean;
    latestPrice: { price: number; time: number } | null;
}

interface RemovableChartObject {
    remove: () => void;
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
const TIMEFRAMES = ['5m', '15m', '30m', '1h', '4h', '1D'];

const Chart: React.FC<ChartProps> = ({ 
    focusSymbol, 
    timeframe,
    onTimeframeChange,
    wsStatus, 
    alerts, 
    accountState, 
    fibTarget = 1.618, 
    aiAnalyses = [],
    isActive,
    onClick,
    isMainChart = false,
    latestPrice
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceSeries = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const kagiSeries = useRef<ISeriesApi<'Line'> | null>(null);
  const priceLinesRef = useRef<Map<string, IPriceLine>>(new Map());
  const drawnObjectsRef = useRef<Map<number, RemovableChartObject[]>>(new Map());
  
  const [chartError, setChartError] = useState<string | null>(null);
  const [currentSetup, setCurrentSetup] = useState<Alert | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activePosition, setActivePosition] = useState(accountState?.positions.find(p => p.symbol === focusSymbol) || null);
  const [lastCandle, setLastCandle] = useState<CandlestickData | null>(null);

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
          background: { color: '#09090b' }, 
          textColor: '#d4d4d8',
          fontSize: 12,
      },
      grid: { 
          vertLines: { color: '#27272a' }, 
          horzLines: { color: '#27272a' } 
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        borderColor: '#27272a',
      },
      rightPriceScale: {
        borderColor: '#27272a',
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
            requestAnimationFrame(() => {
                chart.resize(width, height);
            });
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
        if (wsStatus === 'disconnected') {
            priceSeries.current?.setData([]);
            kagiSeries.current?.setData([]);
            setChartError(`Backend desconectado. Aguardando reconexão...`);
        }
        return;
    }
    
    setIsLoading(true);
    setLastCandle(null); // Reset last candle on full refresh
    try {
      setChartError(null);
      const [oc, kg] = await Promise.all([
        fetchOhlcv(focusSymbol, timeframe),
        fetchKagi(focusSymbol, timeframe)
      ]);

      if (priceSeries.current && oc.candles) {
        const data: CandlestickData[] = oc.candles.map((c: any[]) => ({ time: c[0] / 1000, open: c[1], high: c[2], low: c[3], close: c[4] }));
        priceSeries.current.setData(data);
        if (data.length > 0) {
            setLastCandle(data[data.length - 1]);
        }
      }
      if (kagiSeries.current && kg.kagi) {
        const data: LineData[] = kg.kagi.map((p: any[]) => ({ time: p[0] / 1000, value: p[1] }));
        kagiSeries.current.setData(data);
      }
      if (oc.candles.length > 0) {
        chartRef.current?.timeScale().fitContent();
      }
      
    } catch (e) {
      setChartError(`Falha ao carregar dados do gráfico para ${focusSymbol}.`);
    } finally {
        setIsLoading(false);
    }
  }, [focusSymbol, wsStatus, timeframe]);
  
  useEffect(() => {
    if(!focusSymbol || wsStatus !== 'connected') return;
    updateChartData(); 
  }, [updateChartData, focusSymbol, wsStatus]);

  // Real-time price update effect
  useEffect(() => {
    if (latestPrice && priceSeries.current && lastCandle) {
        if (latestPrice.time >= (lastCandle.time as number)) {
            const newCandle = { ...lastCandle };
            newCandle.close = latestPrice.price;
            newCandle.high = Math.max(newCandle.high, latestPrice.price);
            newCandle.low = Math.min(newCandle.low, latestPrice.price);
            priceSeries.current.update(newCandle);
        }
    }
  }, [latestPrice, lastCandle]);
  
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
    
    const allLineIds = new Set<string>();

    if (activePosition) {
        const id = 'position-entry';
        allLineIds.add(id);
        drawPriceLine(series, id, createPriceLine(activePosition.entryPrice, '#a78bfa', 'Preço Entrada', LineStyle.Solid, 2));
    }

    if (currentSetup) {
        const { signal, entry, stop } = currentSetup;
        
        const entryId = 'setup-entry';
        const stopId = 'setup-stop';
        allLineIds.add(entryId);
        allLineIds.add(stopId);

        drawPriceLine(series, entryId, createPriceLine(entry, '#facc15', 'Gatilho (0%)', LineStyle.Dashed, 2));
        drawPriceLine(series, stopId, createPriceLine(stop, '#ef4444', 'Stop Loss (100%)', LineStyle.Dashed, 2));
        
        const range = Math.abs(entry - stop);
        const fibColor = '#60a5fa'; // Light blue
        
        FIB_LEVELS.forEach(level => {
            const id = `fib-${level}`;
            allLineIds.add(id);
            const price = signal === 'buy' ? entry - (range * level) : entry + (range * level);
            drawPriceLine(series, id, createPriceLine(price, fibColor, `Alvo (${level})`, LineStyle.Dotted));
        });
        if (fibTarget) {
            const targetId = 'fib-target';
            allLineIds.add(targetId);
            const targetPrice = signal === 'buy' ? entry + (range * fibTarget) : entry - (range * fibTarget);
            drawPriceLine(series, targetId, createPriceLine(targetPrice, '#3b82f6', `Alvo (${fibTarget})`, LineStyle.Dashed, 2));
        }
    }

    if(aiAnalyses) {
        aiAnalyses.forEach((analysis) => {
            const id = `ai-analysis-${analysis.time}`;
            allLineIds.add(id);
            drawPriceLine(series, id, createPriceLine(analysis.entry, '#0ea5e9', `IA: ${analysis.reason}`, LineStyle.Solid, 1));
        });
    }

    priceLinesRef.current.forEach((_, id) => {
        if (!allLineIds.has(id)) {
            removePriceLine(series, id);
        }
    });

  }, [currentSetup, activePosition, fibTarget, aiAnalyses, drawPriceLine, removePriceLine]);

  useEffect(() => {
        const chart = chartRef.current;
        const priceSeriesApi = priceSeries.current;
        if (!chart || !priceSeriesApi) return;

        const activeAnalysisTimes = new Set(aiAnalyses.map(a => a.time));

        drawnObjectsRef.current.forEach((objects, time) => {
            if (!activeAnalysisTimes.has(time)) {
                objects.forEach(obj => obj.remove());
                drawnObjectsRef.current.delete(time);
            }
        });

        aiAnalyses.forEach(analysis => {
            if (!analysis.drawings || drawnObjectsRef.current.has(analysis.time)) {
                return;
            }

            const newObjects: RemovableChartObject[] = [];
            analysis.drawings.forEach(d => {
                switch (d.type) {
                    case 'RECTANGLE_ZONE': {
                        if (d.startPrice && d.endPrice) {
                            const zoneColor = d.color || '#2563eb'; // Blue
                            const topPrice = Math.max(d.startPrice, d.endPrice);
                            const bottomPrice = Math.min(d.startPrice, d.endPrice);
                            const topLine = priceSeriesApi.createPriceLine(createPriceLine(topPrice, zoneColor, d.label || '', LineStyle.Dotted));
                            const bottomLine = priceSeriesApi.createPriceLine(createPriceLine(bottomPrice, zoneColor, '', LineStyle.Dotted));
                            newObjects.push({ remove: () => priceSeriesApi.removePriceLine(topLine) });
                            newObjects.push({ remove: () => priceSeriesApi.removePriceLine(bottomLine) });
                        }
                        break;
                    }
                    case 'HORIZONTAL_LINE': {
                        if (d.price) {
                            const lineColor = d.color || '#f59e0b'; // Amber
                            const line = priceSeriesApi.createPriceLine(createPriceLine(d.price, lineColor, d.label || '', LineStyle.Solid, 1));
                            newObjects.push({ remove: () => priceSeriesApi.removePriceLine(line) });
                        }
                        break;
                    }
                    case 'TREND_LINE': {
                        if (d.points && d.points.length >= 2) {
                            const lineSeries = chart.addLineSeries({
                                color: d.color || '#60a5fa', lineWidth: 1, lineStyle: LineStyle.Dashed,
                                priceScaleId: 'right', lastValueVisible: false, priceLineVisible: false,
                            });
                            const lineData: LineData<Time>[] = d.points.map(p => ({ time: p.time / 1000, value: p.price }));
                            lineSeries.setData(lineData);
                            newObjects.push({ remove: () => chart.removeSeries(lineSeries) });
                        }
                        break;
                    }
                }
            });
            if (newObjects.length > 0) {
              drawnObjectsRef.current.set(analysis.time, newObjects);
            }
        });

        const allMarkers: SeriesMarker<Time>[] = [];
        aiAnalyses.forEach(analysis => {
            analysis.drawings?.forEach(d => {
                if (d.type === 'PIVOT_MARKER' && d.time) {
                    allMarkers.push({
                        time: (d.time / 1000) as Time, position: d.position || 'aboveBar',
                        color: d.color || '#facc15', shape: 'circle', text: d.label,
                    });
                }
            });
        });
        priceSeriesApi.setMarkers(allMarkers);

    }, [aiAnalyses]);

  return (
    <div 
        className={`bg-zinc-900 rounded-lg p-2 relative flex flex-col min-h-0 border-2 transition-colors shadow-md ${isActive ? 'border-amber-500' : 'border-transparent'}`}
        onClick={onClick}
    >
      <div className="flex items-center justify-between px-2 py-1 flex-shrink-0">
        <div className={`text-amber-300 font-bold ${isMainChart ? 'text-base' : 'text-sm'}`}>{focusSymbol}</div>
        <div className="flex items-center gap-1">
            {TIMEFRAMES.map(tf => (
                <button 
                    key={tf}
                    onClick={(e) => {
                        e.stopPropagation();
                        onTimeframeChange(tf);
                    }}
                    className={`px-2 py-0.5 text-xs font-semibold rounded ${timeframe === tf ? 'bg-amber-500 text-black' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}`}
                >
                    {tf}
                </button>
            ))}
        </div>
      </div>
      <div ref={ref} className="w-full relative flex-grow">
        {isLoading && (
            <div className="absolute inset-0 bg-zinc-950 bg-opacity-80 flex flex-col items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                <p className="text-zinc-500 mt-3 text-xs">Carregando {timeframe}...</p>
            </div>
        )}
        {wsStatus === 'connecting' && !isLoading && !chartError && (
             <div className="absolute inset-0 bg-zinc-950 bg-opacity-80 flex flex-col items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                <p className="text-zinc-500 mt-3 text-xs">Conectando...</p>
            </div>
        )}
        {chartError && !isLoading && (
            <div className="absolute inset-0 bg-zinc-950 bg-opacity-80 flex items-center justify-center z-10">
                <p className="text-red-500 text-center p-4 text-xs">{chartError}</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Chart;