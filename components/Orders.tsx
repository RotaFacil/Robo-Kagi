import React, { useState } from 'react';
import type { Alert, Order } from '../App';
import { sendManualOrder } from '../lib/api';

const getStatusBadge = (status?: Order['status']) => {
    switch (status) {
        case 'TP':
            return <span className="text-xs font-bold bg-green-500 text-black px-2 py-0.5 rounded">TP</span>;
        case 'SL':
            return <span className="text-xs font-bold bg-red-500 text-black px-2 py-0.5 rounded">SL</span>;
        case 'OPEN':
        default:
            return <span className="text-xs font-bold bg-blue-500 text-black px-2 py-0.5 rounded">ABERTA</span>;
    }
}

const getOriginBadge = (origin?: Order['origin']) => {
    switch(origin) {
        case 'kagi':
            return <span className="text-xs font-bold bg-purple-500 text-black px-2 py-0.5 rounded">KAGI</span>;
        case 'ai':
            return <span className="text-xs font-bold bg-cyan-500 text-black px-2 py-0.5 rounded">IA</span>;
        case 'manual':
        default:
             return <span className="text-xs font-bold bg-zinc-500 text-black px-2 py-0.5 rounded">MANUAL</span>;
    }
}

function List({ items, onClear }: { items: Order[], onClear: () => void }) {
  return (
    <div className="bg-zinc-900 rounded-lg p-2">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-md font-semibold text-amber-300">Histórico de Ordens</h2>
        {items.length > 0 && (
            <button 
                onClick={onClear}
                className="text-xs text-zinc-400 hover:text-amber-300 hover:underline"
            >
                Limpar
            </button>
        )}
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {items.length > 0 ? items.map((o, i) => (
          <div key={i} className="bg-zinc-800 rounded p-2 text-xs">
            <div className="flex justify-between font-bold">
                <div className="flex items-center gap-2">
                    <span>{o.symbol}</span>
                    {getStatusBadge(o.status)}
                    {getOriginBadge(o.origin)}
                </div>
                <span className={o.side === 'buy' ? 'text-green-400' : 'text-red-400'}>{o.side?.toUpperCase()}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 mt-1 text-zinc-400">
                <span>E: {o.entry.toFixed(4)}</span>
                <span>S: {o.stop.toFixed(4)}</span>
                <span>TP: {o.tp.toFixed(4)}</span>
            </div>
          </div>
        )) : (
            <div className="text-center text-zinc-500 py-8 text-sm flex flex-col items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                Nenhuma ordem executada.
            </div>
        )}
      </div>
    </div>
  );
}

// FIX: Add ManualButtons component which was missing.
const SpinnerIcon = () => (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

interface ManualButtonsProps {
  signal: Alert;
  wsStatus: 'connecting' | 'connected' | 'disconnected';
}

function ManualButtons({ signal, wsStatus }: ManualButtonsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isConnected = wsStatus === 'connected';

    const handleOrder = async () => {
        if (!isConnected || isLoading) return;
        setIsLoading(true);
        try {
            await sendManualOrder({
                symbol: signal.symbol,
                side: signal.signal,
                entry: signal.entry,
                stop: signal.stop,
                tp: signal.tp,
            });
        } catch (e) {
            console.error('Failed to send manual order', e);
        } finally {
            setIsLoading(false);
        }
    };

    const buttonClass = `w-full text-white font-bold px-2 py-1 rounded text-xs transition-colors disabled:bg-zinc-600 disabled:cursor-not-allowed flex justify-center items-center`;
    const buyClass = 'bg-green-600 hover:bg-green-700';
    const sellClass = 'bg-red-600 hover:bg-red-700';

    return (
        <button
            onClick={handleOrder}
            className={`${buttonClass} ${signal.signal === 'buy' ? buyClass : sellClass}`}
            disabled={!isConnected || isLoading}
            aria-label={`Executar ordem de ${signal.signal === 'buy' ? 'compra' : 'venda'} para ${signal.symbol}`}
        >
            {isLoading ? <SpinnerIcon /> : signal.signal === 'buy' ? 'COMPRAR' : 'VENDER'}
        </button>
    );
}


const Orders = { List, ManualButtons };
export default Orders;