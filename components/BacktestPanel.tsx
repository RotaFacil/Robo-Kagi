import React, { useState, useEffect } from 'react';
import { runBacktest, fetchSymbols, fetchOhlcv } from '../lib/api';
import { aiStrategyOptions, AIStrategy } from '../lib/aiStrategies';
import BacktestChart from './BacktestChart';
import type { CandlestickData } from 'lightweight-charts';


// Re-using StatCard logic from Dashboard
const StatCard = ({ title, value, description, valueColor }: { title: string, value: string | number, description?: string, valueColor?: string }) => (
    <div className="bg-zinc-800/50 rounded-lg p-4 flex flex-col justify-between h-full">
        <div>
            <h3 className="text-sm text-zinc-400 font-medium">{title}</h3>
            <p className={`text-2xl font-bold mt-1 ${valueColor || 'text-zinc-100'}`}>{value}</p>
        </div>
        {description && <p className="text-xs text-zinc-500 mt-2">{description}</p>}
    </div>
);

const Spinner = () => (
    <div className="flex items-center justify-center gap-2">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-400"></div>
        <span>Executando...</span>
    </div>
);

// Define interfaces for backtest results
export interface BacktestTrade {
  entry_time: number;
  exit_time: number;
  side: 'buy' | 'sell';
  entry_price: number;
  exit_price: number;
  pnl: number;
  reason: string;
}

// FIX: Export the BacktestResult interface to be used in other modules.
export interface BacktestResult {
  total_pnl: number;
  win_rate: number;
  profit_factor: number;
  total_trades: number;
  trades: BacktestTrade[];
}

export default function BacktestPanel() {
    const [allSymbols, setAllSymbols] = useState<string[]>([]);
    const [symbol, setSymbol] = useState('BTC/USDT');
    const [strategy, setStrategy] = useState<AIStrategy>('SMART_MONEY');
    
    const today = new Date().toISOString().split('T')[0];
    const oneYearAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(oneYearAgo);
    const [endDate, setEndDate] = useState(today);

    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<BacktestResult | null>(null);
    const [chartData, setChartData] = useState<CandlestickData[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadSymbols = async () => {
            try {
                const data = await fetchSymbols('futures');
                setAllSymbols(data.symbols);
            } catch (e) {
                console.error("Failed to load symbols for backtester", e);
            }
        };
        loadSymbols();
    }, []);

    const handleRunBacktest = async () => {
        setIsLoading(true);
        setError(null);
        setResults(null);
        setChartData([]);

        try {
            const [backtestData, ohlcvData] = await Promise.all([
                runBacktest(symbol, strategy, startDate, endDate),
                fetchOhlcv(symbol, '1h') // Use a default timeframe for backtest chart
            ]);
            
            setResults(backtestData);

            if (ohlcvData.candles) {
                const formattedCandles: CandlestickData[] = ohlcvData.candles.map((c: any[]) => ({ 
                    time: c[0] / 1000, 
                    open: c[1], 
                    high: c[2], 
                    low: c[3], 
                    close: c[4] 
                }));
                setChartData(formattedCandles);
            }

        } catch (e) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError("Ocorreu um erro desconhecido durante o backtest.");
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const pnlColor = results && results.total_pnl > 0 ? 'text-green-400' : results && results.total_pnl < 0 ? 'text-red-400' : 'text-zinc-100';
    const profitFactorColor = results && results.profit_factor >= 1.5 ? 'text-green-400' : results && results.profit_factor >= 1 ? 'text-yellow-400' : 'text-red-400';

    return (
        <div className="bg-zinc-900 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-amber-300 mb-4">Ferramenta de Backtesting</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-6">
                <label className="flex flex-col gap-1">
                    <span className="text-sm text-zinc-400">Ativo</span>
                    <input 
                        list="symbols-datalist"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                        className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:bg-zinc-700 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    />
                    <datalist id="symbols-datalist">
                        {allSymbols.map(s => <option key={s} value={s} />)}
                    </datalist>
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-sm text-zinc-400">Estratégia IA</span>
                    <select
                        value={strategy}
                        onChange={(e) => setStrategy(e.target.value as AIStrategy)}
                        className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:bg-zinc-700 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    >
                        {aiStrategyOptions.filter(opt => opt.value !== 'AI_AUTO_SELECT').map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </label>

                <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-zinc-400">Data Início</span>
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:bg-zinc-700 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-zinc-400">Data Fim</span>
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:bg-zinc-700 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        />
                    </label>
                </div>

                <button
                    onClick={handleRunBacktest}
                    disabled={isLoading || !symbol}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded transition-colors h-10 disabled:opacity-50 disabled:cursor-wait"
                >
                    {isLoading ? <Spinner /> : 'Executar Backtest'}
                </button>
            </div>

            {error && <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded-lg text-sm mb-4"><p className="font-bold">Erro no Backtest</p><p>{error}</p></div>}
            
            {results && (
                <div className="animate-fade-in-up">
                    <h3 className="text-md font-semibold text-zinc-200 mb-3">Resultados para <span className="text-amber-300">{symbol}</span> com <span className="text-amber-300">{aiStrategyOptions.find(o => o.value === strategy)?.label}</span></h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <StatCard title="P/L Total (USD)" value={results.total_pnl.toFixed(2)} valueColor={pnlColor} />
                        <StatCard title="Taxa de Acerto" value={`${results.win_rate.toFixed(1)}%`} />
                        <StatCard title="Fator de Lucro" value={isFinite(results.profit_factor) ? results.profit_factor.toFixed(2) : '∞'} valueColor={profitFactorColor} />
                        <StatCard title="Total de Trades" value={results.total_trades} />
                    </div>

                    {chartData.length > 0 && (
                        <div className="mt-6">
                             <h3 className="text-md font-semibold text-zinc-200 mb-3">Gráfico de Trades Simulados</h3>
                             <div className="bg-zinc-800/50 rounded-lg p-2">
                                <BacktestChart ohlcv={chartData} trades={results.trades} />
                             </div>
                        </div>
                    )}


                    <h3 className="text-md font-semibold text-zinc-200 mt-6 mb-3">Histórico de Trades Simulados</h3>
                    <div className="max-h-96 overflow-y-auto">
                        <table className="min-w-full divide-y divide-zinc-800 text-sm">
                            <thead className="bg-zinc-800/50 sticky top-0">
                                <tr>
                                    <th className="p-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Entrada</th>
                                    <th className="p-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Saída</th>
                                    <th className="p-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Lado</th>
                                    <th className="p-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Preço Entrada</th>
                                    <th className="p-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Preço Saída</th>
                                    <th className="p-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">P/L (USD)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {results.trades.map((trade, index) => (
                                    <tr key={index}>
                                        <td className="p-3 whitespace-nowrap font-mono">{new Date(trade.entry_time).toLocaleString()}</td>
                                        <td className="p-3 whitespace-nowrap font-mono">{new Date(trade.exit_time).toLocaleString()}</td>
                                        <td className={`p-3 whitespace-nowrap font-bold ${trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>{trade.side.toUpperCase()}</td>
                                        <td className="p-3 whitespace-nowrap text-right font-mono">{trade.entry_price.toFixed(4)}</td>
                                        <td className="p-3 whitespace-nowrap text-right font-mono">{trade.exit_price.toFixed(4)}</td>
                                        <td className={`p-3 whitespace-nowrap text-right font-mono font-bold ${trade.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>{trade.pnl.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {results.trades.length === 0 && <p className="text-center text-zinc-500 py-8">Nenhum trade foi executado no período analisado.</p>}
                    </div>
                </div>
            )}

            {!isLoading && !results && !error && (
                <div className="text-center text-zinc-500 py-16 border-2 border-dashed border-zinc-800 rounded-lg">
                    <p>Selecione um ativo e uma estratégia para iniciar o backtest.</p>
                </div>
            )}
        </div>
    );
}