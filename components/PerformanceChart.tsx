import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, LineData, Time } from 'lightweight-charts';

interface PerformanceChartProps {
    data: LineData<Time>[];
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
    const ref = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);

    useEffect(() => {
        if (!ref.current) return;

        const chart = createChart(ref.current, {
            width: ref.current.clientWidth,
            height: ref.current.clientHeight,
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

        const series = chart.addAreaSeries({
            lineColor: '#f59e0b',
            topColor: 'rgba(245, 158, 11, 0.4)',
            bottomColor: 'rgba(245, 158, 11, 0.05)',
            lineWidth: 2,
            priceFormat: {
                type: 'price',
                precision: 2,
                minMove: 0.01,
            },
        });
        seriesRef.current = series;

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

    useEffect(() => {
        if (seriesRef.current) {
            seriesRef.current.setData(data);
            if (data.length > 0) {
                chartRef.current?.timeScale().fitContent();
            }
        }
    }, [data]);

    return (
        <div ref={ref} className="w-full h-[300px] md:h-[400px]">
            {data.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                    Aguardando ordens fechadas para gerar o gráfico.
                </div>
            )}
        </div>
    );
};

export default PerformanceChart;