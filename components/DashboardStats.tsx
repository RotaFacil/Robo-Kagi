import React from 'react';
import type { Alert, Order } from '../App';

interface DashboardStatsProps {
  alerts: Alert[];
  orders: Order[];
}

const calculateStats = (orders: Order[]) => {
  const closedOrders = orders.filter(o => o.status === 'TP' || o.status === 'SL');
  const wins = closedOrders.filter(o => o.status === 'TP').length;
  const winRate = closedOrders.length > 0 ? (wins / closedOrders.length) * 100 : 0;
  const totalPnl = closedOrders.reduce((acc, o) => acc + (o.pnl || 0), 0);

  // Como o backend ainda não informa o resultado das ordens, usamos placeholders.
  return {
    winRate: closedOrders.length > 0 ? winRate.toFixed(1) : '--',
    totalPnl: closedOrders.length > 0 ? totalPnl.toFixed(2) : '--.--'
  };
}

export default function DashboardStats({ alerts, orders }: DashboardStatsProps) {
  const stats = calculateStats(orders);

  return (
    <div className="bg-zinc-900 rounded-xl p-4">
      <h2 className="text-lg font-semibold text-amber-300 mb-3">Estatísticas da Sessão</h2>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex flex-col">
          <span className="text-zinc-400">Setups Encontrados</span>
          <span className="text-xl font-bold">{alerts.length}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-zinc-400">Ordens Executadas</span>
          <span className="text-xl font-bold">{orders.length}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-zinc-400">Taxa de Acerto</span>
          <span className="text-xl font-bold">{stats.winRate}{stats.winRate !== '--' && '%'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-zinc-400">P/L (USD)</span>
          <span className={`text-xl font-bold ${stats.totalPnl === '--.--' ? 'text-zinc-200' : parseFloat(stats.totalPnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.totalPnl}
          </span>
        </div>
      </div>
    </div>
  );
}