import React, { useState, useEffect } from 'react';
import { fetchMarketOverview } from '../../lib/api';

const MarketHeatmap: React.FC = () => {
    const [marketData, setMarketData] = useState<{ symbol: string; change: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchMarketOverview();
                setMarketData(data.overview);
            } catch (e) {
                setError("Falha ao buscar dados do mercado.");
                console.error("Failed to fetch market overview", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
        const intervalId = setInterval(fetchData, 60000); // Refresh every minute
        return () => clearInterval(intervalId);
    }, []);

    const getTileColor = (change: number) => {
        if (change > 2) return 'bg-green-600 hover:bg-green-500';
        if (change > 0) return 'bg-green-800 hover:bg-green-700';
        if (change < -2) return 'bg-red-600 hover:bg-red-500';
        if (change < 0) return 'bg-red-800 hover:bg-red-700';
        return 'bg-zinc-700 hover:bg-zinc-600';
    };

    return (
         <div className="bg-zinc-900 rounded-lg p-4 h-full">
            <h2 className="text-lg font-semibold text-amber-300 mb-3">Heatmap do Mercado (24h)</h2>
            {isLoading && marketData.length === 0 && (
                <div className="text-center text-zinc-500">Carregando heatmap...</div>
            )}
            {error && (
                 <div className="text-center text-red-400">{error}</div>
            )}
            {!isLoading && !error && marketData.length === 0 && (
                <div className="text-center text-zinc-500">Nenhum dado de mercado disponível.</div>
            )}
            {marketData.length > 0 && (
                <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2">
                    {marketData.map(({ symbol, change }) => (
                        <div key={symbol} className={`p-2 rounded-md text-center transition-colors ${getTileColor(change)}`}>
                            <div className="font-bold text-xs truncate">{symbol.replace('/USDT', '')}</div>
                            <div className="text-sm font-mono">{change.toFixed(2)}%</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default React.memo(MarketHeatmap);