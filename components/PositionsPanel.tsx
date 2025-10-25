import React, { useState } from 'react';
import type { AccountState, Order, Alert } from '../App';
import { AccountContent } from './AccountPanel';
import Orders from './Orders';

interface PositionsPanelProps {
    accountState: AccountState | null;
    orders: Order[];
    alerts: Alert[];
    isLoading: boolean;
    error: string | null;
    onClearOrders: () => void;
}

type Tab = 'Posições' | 'Ordens Abertas' | 'Histórico de Ordens';

export default function PositionsPanel({ accountState, orders, isLoading, error, onClearOrders }: PositionsPanelProps) {
    const [activeTab, setActiveTab] = useState<Tab>('Posições');

    const tabs: Tab[] = ['Posições', 'Histórico de Ordens', 'Ordens Abertas'];

    return (
        <div className="bg-zinc-900 rounded-lg">
            <div className="flex border-b border-zinc-700 text-sm font-semibold overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-2 whitespace-nowrap ${activeTab === tab ? 'text-amber-300 border-b-2 border-amber-300' : 'text-zinc-400'} ${tab === 'Ordens Abertas' ? 'text-zinc-600 cursor-not-allowed' : 'hover:text-zinc-200'}`}
                        disabled={tab === 'Ordens Abertas'}
                        title={tab === 'Ordens Abertas' ? 'Em breve' : ''}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            <div className="min-h-[200px]">
                {activeTab === 'Posições' && (
                    <AccountContent accountState={accountState} isLoading={isLoading} error={error} />
                )}
                {activeTab === 'Ordens Abertas' && (
                    <div className="text-center text-zinc-500 p-8">Funcionalidade em desenvolvimento.</div>
                )}
                {activeTab === 'Histórico de Ordens' && (
                    <div className="p-2">
                        <Orders.List items={orders} onClear={onClearOrders} />
                    </div>
                )}
            </div>
        </div>
    );
}