import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, LineData, SeriesMarker, LineStyle } from 'lightweight-charts';
import type { BacktestTrade } from './BacktestPanel';

interface BacktestChartProps {
    ohlcv: CandlestickData<Time>[];
    trades: BacktestTrade[];
}

const BacktestChart: React.FC<BacktestChartProps> = ({ ohlcv, trades }) => {
    const ref = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const tradeLineSeriesRef = useRef<ISeriesApi<'Line'>[]>([]);

    useEffect(() => {
        if (!ref.current) return;

        const chart = createChart(ref.current, {
            width: ref.current.clientWidth,
            height: 400,
            layout: {
                background: { color: 'transparent' },
                textColor: '#d4d4d8',
                fontSize: 12,
            },
            grid: {
                vertLines: { color: '#3f3f46' },
                horzLines: { color: '#3f3f46' },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: '#3f3f46',
            },
            rightPriceScale: {
                borderColor: '#3f3f46',
            },
            crosshair: {
                mode: 1, // Magnet
            },
        });
        chartRef.current = chart;

        const series = chart.addCandlestickSeries({
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderDownColor: '#ef4444',
            borderUpColor: '#22c55e',
            wickDownColor: '#ef4444',
            wickUpColor: '#22c55e',
        });
        seriesRef.current = series;

        const resizeObserver = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry) {
                const { width } = entry.contentRect;
                requestAnimationFrame(() => {
                    chart.resize(width, 400);
                });
            }
        });
        resizeObserver.observe(ref.current);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
        };
    }, []);

    useEffect(() => {
        const series = seriesRef.current;
        const chart = chartRef.current;
        if (!series || !chart) return;

        // Clear previous trade lines
        tradeLineSeriesRef.current.forEach(line => chart.removeSeries(line));
        tradeLineSeriesRef.current = [];

        series.setData(ohlcv);

        const markers: SeriesMarker<Time>[] = [];
        trades.forEach(trade => {
            markers.push({
                time: (trade.entry_time / 1000) as Time,
                position: trade.side === 'buy' ? 'belowBar' : 'aboveBar',
                color: trade.side === 'buy' ? '#22c55e' : '#ef4444',
                shape: trade.side === 'buy' ? 'arrowUp' : 'arrowDown',
                text: trade.side === 'buy' ? 'Compra' : 'Venda',
            });
            
            // Draw line for each trade
            const tradeLine = chart.addLineSeries({
                color: trade.pnl >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)',
                lineWidth: 2,
                lineStyle: LineStyle.Dotted,
                priceScaleId: 'right',
                lastValueVisible: false,
                priceLineVisible: false,
            });

            const lineData: LineData<Time>[] = [
                { time: (trade.entry_time / 1000) as Time, value: trade.entry_price },
                { time: (trade.exit_time / 1000) as Time, value: trade.exit_price }
            ];
            tradeLine.setData(lineData);
            tradeLineSeriesRef.current.push(tradeLine);
        });

        series.setMarkers(markers);
        
        if (ohlcv.length > 0) {
            chart.timeScale().fitContent();
        }

    }, [ohlcv, trades]);

    return (
        <div ref={ref} className="w-full h-[400px] relative">
            {ohlcv.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                    Aguardando dados do gráfico...
                </div>
            )}
        </div>
    );
};

export default BacktestChart;