import React, { useState } from 'react';
import { sendMarketOrder } from '../lib/api';
import type { AccountState } from '../App';

interface TradePanelProps {
    focusSymbol: string;
    wsStatus: 'connecting' | 'connected' | 'disconnected';
    accountState: AccountState | null;
}

const SpinnerIcon = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default function TradePanel({ focusSymbol, wsStatus, accountState }: TradePanelProps) {
    const [activeTab, setActiveTab] = useState('Mercado');
    const [size, setSize] = useState('');
    const [takeProfit, setTakeProfit] = useState('');
    const [stopLoss, setStopLoss] = useState('');
    const [percentage, setPercentage] = useState(0);
    const [isLoading, setIsLoading] = useState<'buy' | 'sell' | null>(null);

    const isConnected = wsStatus === 'connected';
    const availableBalance = accountState?.totalBalance ?? 0;

    const setPercentageAndSize = (p: number) => {
        const newPercentage = Math.max(0, Math.min(100, p));
        setPercentage(newPercentage);
        if (availableBalance > 0) {
            const value = (availableBalance * (newPercentage / 100)).toFixed(2);
            setSize(value);
        } else {
            setSize('0.00');
        }
    };

    const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSize = e.target.value;
        setSize(newSize);
        if (availableBalance > 0 && parseFloat(newSize) >= 0) {
            const newPercentage = (parseFloat(newSize) / availableBalance) * 100;
            const finalPercentage = isNaN(newPercentage) ? 0 : Math.max(0, Math.min(100, Math.round(newPercentage)));
            setPercentage(finalPercentage);
        } else {
            setPercentage(0);
        }
    };
    
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPercentageAndSize(parseInt(e.target.value, 10));
    }
    
    const handleTrade = async (side: 'buy' | 'sell') => {
        const sizeNum = parseFloat(size);
        const tpNum = takeProfit ? parseFloat(takeProfit) : undefined;
        const slNum = stopLoss ? parseFloat(stopLoss) : undefined;

        if (!focusSymbol || isNaN(sizeNum) || sizeNum <= 0) {
            // TODO: Basic validation feedback needed
            return;
        }
        setIsLoading(side);
        try {
            await sendMarketOrder({ symbol: focusSymbol, side, size: sizeNum, tp: tpNum, sl: slNum });
            // TODO: Add toast notification on success
        } catch (e) {
            console.error(`Failed to place ${side} order`, e);
            // TODO: Add toast notification on error
        } finally {
            setIsLoading(null);
        }
    }

    return (
        <div className="bg-zinc-900 rounded-lg p-3">
            <div className="flex border-b border-zinc-700 text-sm font-semibold">
                <button
                    onClick={() => setActiveTab('Mercado')}
                    className={`px-4 py-2 ${activeTab === 'Mercado' ? 'text-amber-300 border-b-2 border-amber-300' : 'text-zinc-400'}`}
                >
                    Mercado
                </button>
                 <button
                    className={`px-4 py-2 text-zinc-600 cursor-not-allowed`}
                    disabled
                >
                    Limite
                </button>
            </div>
            <div className="space-y-4 pt-4">
                <div className="text-zinc-400 text-xs">
                    Disponível: <span className="font-mono text-zinc-200">{availableBalance.toFixed(2)} USDT</span>
                </div>
                <div>
                    <label htmlFor="size" className="block text-zinc-400 mb-1 text-xs">Tamanho</label>
                    <div className="relative">
                        <input
                            type="number"
                            id="size"
                            value={size}
                            onChange={handleSizeChange}
                            placeholder="0.00"
                            className="bg-zinc-800 border border-zinc-700 rounded-md p-2 w-full text-right font-mono pr-12 disabled:opacity-50 text-sm"
                            disabled={!isConnected}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">USDT</span>
                    </div>
                </div>

                 <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label htmlFor="takeProfit" className="block text-zinc-400 mb-1 text-xs">Take Profit (Alvo)</label>
                        <input type="number" id="takeProfit" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} placeholder="Preço" className="bg-zinc-800 border border-zinc-700 rounded-md p-2 w-full font-mono disabled:opacity-50 text-sm" disabled={!isConnected} />
                    </div>
                    <div>
                        <label htmlFor="stopLoss" className="block text-zinc-400 mb-1 text-xs">Stop Loss</label>
                        <input type="number" id="stopLoss" value={stopLoss} onChange={e => setStopLoss(e.target.value)} placeholder="Preço" className="bg-zinc-800 border border-zinc-700 rounded-md p-2 w-full font-mono disabled:opacity-50 text-sm" disabled={!isConnected} />
                    </div>
                 </div>
                
                <div className="space-y-2 pt-1">
                    <div className="flex gap-2 mb-2">
                        {[25, 50, 75, 100].map(p => (
                            <button
                                key={p}
                                onClick={() => setPercentageAndSize(p)}
                                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!isConnected || availableBalance <= 0}
                            >
                                {p}%
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-between items-center text-xs text-zinc-400 px-1">
                        <span>Percentual do Saldo</span>
                        <span className="font-mono text-amber-300 bg-zinc-800 px-2 py-0.5 rounded">{percentage}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={percentage}
                        onChange={handleSliderChange}
                        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-lg accent-amber-500 disabled:opacity-50"
                        disabled={!isConnected || availableBalance <= 0}
                        aria-label="Seletor de porcentagem do saldo"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => handleTrade('buy')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold p-2 rounded transition-colors disabled:bg-zinc-600 disabled:cursor-not-allowed flex justify-center items-center"
                        disabled={!isConnected || !!isLoading}
                    >
                        {isLoading === 'buy' ? <SpinnerIcon /> : 'Comprar/Longo'}
                    </button>
                    <button
                        onClick={() => handleTrade('sell')}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold p-2 rounded transition-colors disabled:bg-zinc-600 disabled:cursor-not-allowed flex justify-center items-center"
                        disabled={!isConnected || !!isLoading}
                    >
                        {isLoading === 'sell' ? <SpinnerIcon /> : 'Vender/Curto'}
                    </button>
                </div>
            </div>
        </div>
    );
}