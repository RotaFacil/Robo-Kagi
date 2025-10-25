import React, { useMemo } from 'react';
import type { Order, AccountState, VisibleComponents } from '../App';
import PerformanceChart from './PerformanceChart';
import NotesPanel from './NotesPanel';
import BacktestPanel from './BacktestPanel';

// Import memoized components
import AccountHealth from './dashboard/AccountHealth';
import MarketHeatmap from './dashboard/MarketHeatmap';
import StatCard from './dashboard/StatCard';
import PerformanceTable from './dashboard/PerformanceTable';
import { TrendingUpIcon, CheckCircleIcon, ListIcon, CurrencyDollarIcon } from './icons/UIIcons';


const getOriginName = (origin?: Order['origin']) => {
    switch(origin) {
        case 'kagi': return 'Robô Kagi';
        case 'ai': return 'Robô IA';
        case 'manual': return 'Manual';
        default: return 'Desconhecido';
    }
};

// FIX: Added missing DashboardProps interface definition.
interface DashboardProps {
    orders: Order[];
    accountState: AccountState | null;
    visibleComponents: VisibleComponents;
}

export default function Dashboard({ orders, accountState, visibleComponents }: DashboardProps) {

    const performanceData = useMemo(() => {
        const closedOrders = orders.filter(o => o.status === 'TP' || o.status === 'SL');
        if (closedOrders.length === 0) {
            return {
                totalPnl: 0, winRate: 0, profitFactor: 0, avgPnl: 0, totalTrades: 0,
                equityCurve: [], bySymbol: [], byStrategy: []
            };
        }

        let cumulativePnl = 0;
        const equityCurve = closedOrders.slice().reverse().map(o => {
            cumulativePnl += o.pnl || 0;
            return { time: (o.timestamp || 0) / 1000, value: cumulativePnl };
        });

        const wins = closedOrders.filter(o => o.status === 'TP').length;
        const totalPnl = closedOrders.reduce((acc, o) => acc + (o.pnl || 0), 0);
        const totalProfit = closedOrders.filter(o => (o.pnl || 0) > 0).reduce((acc, o) => acc + (o.pnl || 0), 0);
        const totalLoss = Math.abs(closedOrders.filter(o => (o.pnl || 0) < 0).reduce((acc, o) => acc + (o.pnl || 0), 0));

        const bySymbol: Record<string, { pnl: number, wins: number, trades: number }> = {};
        const byStrategy: Record<string, { pnl: number, wins: number, trades: number }> = {};

        for (const order of closedOrders) {
            if (!bySymbol[order.symbol]) bySymbol[order.symbol] = { pnl: 0, wins: 0, trades: 0 };
            bySymbol[order.symbol].pnl += order.pnl || 0;
            bySymbol[order.symbol].trades += 1;
            if (order.status === 'TP') bySymbol[order.symbol].wins += 1;

            const origin = getOriginName(order.origin);
            if (!byStrategy[origin]) byStrategy[origin] = { pnl: 0, wins: 0, trades: 0 };
            byStrategy[origin].pnl += order.pnl || 0;
            byStrategy[origin].trades += 1;
            if (order.status === 'TP') byStrategy[origin].wins += 1;
        }

        return {
            totalPnl,
            winRate: (wins / closedOrders.length) * 100,
            profitFactor: totalLoss > 0 ? totalProfit / totalLoss : Infinity,
            avgPnl: totalPnl / closedOrders.length,
            totalTrades: closedOrders.length,
            equityCurve,
            bySymbol: Object.entries(bySymbol).map(([symbol, data]) => ({
                symbol, ...data, winRate: (data.wins / data.trades) * 100
            })).sort((a,b) => b.pnl - a.pnl),
            byStrategy: Object.entries(byStrategy).map(([strategy, data]) => ({
                strategy, ...data, winRate: (data.wins / data.trades) * 100
            })).sort((a,b) => b.pnl - a.pnl)
        };
    }, [orders]);

    const pnlColor = performanceData.totalPnl > 0 ? 'text-green-400' : performanceData.totalPnl < 0 ? 'text-red-400' : 'text-zinc-100';
    
    return (
        <div className="grid grid-cols-12 gap-4 animate-fade-in-up p-2">
            
            {visibleComponents.accountHealth && (
                <div className="col-span-12 lg:col-span-3">
                    <AccountHealth accountState={accountState} />
                </div>
            )}

            {visibleComponents.marketHeatmap && (
                <div className="col-span-12 lg:col-span-9">
                    <MarketHeatmap />
                </div>
            )}
            
            {visibleComponents.realizedPnl && (
                <div className="col-span-12 sm:col-span-6 lg:col-span-3">
                    <StatCard 
                        title="P/L Realizado (USD)" 
                        value={performanceData.totalPnl.toFixed(2)} 
                        valueColor={pnlColor}
                        icon={<TrendingUpIcon />} 
                    />
                </div>
            )}
            {visibleComponents.winRate && (
                <div className="col-span-12 sm:col-span-6 lg:col-span-3">
                    <StatCard 
                        title="Taxa de Acerto" 
                        value={`${performanceData.winRate.toFixed(1)}%`}
                        icon={<CheckCircleIcon />}
                    />
                </div>
            )}
            {visibleComponents.totalTrades && (
                <div className="col-span-12 sm:col-span-6 lg:col-span-3">
                    <StatCard 
                        title="Total de Trades" 
                        value={performanceData.totalTrades}
                        icon={<ListIcon />}
                    />
                </div>
            )}
            {visibleComponents.avgPnl && (
                <div className="col-span-12 sm:col-span-6 lg:col-span-3">
                    <StatCard 
                        title="P/L Médio / Trade" 
                        value={performanceData.avgPnl.toFixed(2)} 
                        valueColor={performanceData.avgPnl > 0 ? 'text-green-400' : 'text-red-400'}
                        icon={<CurrencyDollarIcon />} 
                    />
                </div>
            )}
            
            {visibleComponents.capitalCurve && (
                <div className="col-span-12 lg:col-span-8 bg-zinc-900 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-amber-300 mb-2">Curva de Capital</h2>
                    <PerformanceChart data={performanceData.equityCurve} />
                </div>
            )}
            {visibleComponents.notesPanel && (
                 <div className="col-span-12 lg:col-span-4 bg-zinc-900 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-amber-300 mb-2">Painel de Anotações</h2>
                    <NotesPanel />
                </div>
            )}

            {visibleComponents.performanceByAsset && (
                <div className="col-span-12 lg:col-span-6 bg-zinc-900 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-amber-300 mb-2">Desempenho por Ativo</h2>
                    <PerformanceTable 
                        headers={['Ativo', 'P/L (USD)', 'Trades', 'Acerto (%)']}
                        data={performanceData.bySymbol.map(item => [item.symbol, item.pnl, item.trades, `${item.winRate.toFixed(1)}%`])}
                        emptyMessage="Nenhum dado de trade por ativo."
                    />
                </div>
            )}
            {visibleComponents.performanceByStrategy && (
                <div className="col-span-12 lg:col-span-6 bg-zinc-900 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-amber-300 mb-2">Desempenho por Estratégia</h2>
                     <PerformanceTable 
                        headers={['Estratégia', 'P/L (USD)', 'Trades', 'Acerto (%)']}
                        data={performanceData.byStrategy.map(item => [item.strategy, item.pnl, item.trades, `${item.winRate.toFixed(1)}%`])}
                        emptyMessage="Nenhum dado de trade por estratégia."
                    />
                </div>
            )}

            {visibleComponents.backtestPanel && (
                <div className="col-span-12">
                    <BacktestPanel />
                </div>
            )}
        </div>
    );
}
