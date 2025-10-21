import React, { useState, useMemo } from 'react';
import type { Alert, MarketType } from '../App';
import { setFocusSymbol as apiSetFocusSymbol, setAIMonitorList } from '../lib/api';

interface AssetListProps {
  symbols: string[];
  alerts: Alert[];
  focusSymbol: string;
  setFocusSymbol: (symbol: string) => void;
  wsStatus: 'connecting' | 'connected' | 'disconnected';
  market: MarketType;
  setMarket: (market: MarketType) => void;
  monitoredSymbols: string[];
  setMonitoredSymbols: (symbols: string[]) => void;
}

const MEME_COINS = ['PEPE', 'DOGE', 'SHIB', 'BONK', 'WIF', 'FLOKI'];
const CATEGORIES = ['TODOS', 'Robô IA', 'USDT', 'BTC', 'ALTS', 'MEME'];

const PinIcon = ({ isPinned }: { isPinned: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-colors ${isPinned ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5.586l2.293-2.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L9 9.586V4a1 1 0 011-1z" clipRule="evenodd" />
        <path d="M2 12a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2z" />
    </svg>
);


const AssetRow = React.memo(({ symbol, hasAlert, isFocused, isPinned, onSelect, onPin }: { symbol: string, hasAlert: boolean, isFocused: boolean, isPinned: boolean, onSelect: (s: string) => void, onPin: (s: string) => void }) => {
    return (
        <div 
            className={`flex justify-between items-center p-1.5 cursor-pointer rounded-md group ${isFocused ? 'bg-amber-500/20' : 'hover:bg-zinc-700/50'}`}
        >
            <span onClick={() => onSelect(symbol)} className={`font-semibold flex-grow ${isFocused ? 'text-amber-300' : ''}`}>{symbol}</span>
            <div className="flex items-center gap-2">
                {hasAlert && <span className="w-2 h-2 bg-amber-400 rounded-full" title="Setup Kagi Ativo"></span>}
                <button onClick={(e) => {e.stopPropagation(); onPin(symbol); }} className="opacity-50 group-hover:opacity-100" title="Monitorar com Robô IA">
                    <PinIcon isPinned={isPinned} />
                </button>
            </div>
        </div>
    );
});

export default function AssetList({ symbols, alerts, focusSymbol, setFocusSymbol, wsStatus, market, setMarket, monitoredSymbols, setMonitoredSymbols }: AssetListProps) {
    const [activeTab, setActiveTab] = useState('USDT');
    const [searchTerm, setSearchTerm] = useState('');

    const alertSymbols = useMemo(() => new Set(alerts.map(a => a.symbol)), [alerts]);
    const monitoredSymbolsSet = useMemo(() => new Set(monitoredSymbols), [monitoredSymbols]);

    const filteredSymbols = useMemo(() => {
        return symbols
            .filter(s => {
                const upperSearch = searchTerm.toUpperCase();
                const matchesSearch = s.toUpperCase().includes(upperSearch);
                if (!matchesSearch) return false;

                switch (activeTab) {
                    case 'Robô IA':
                        return monitoredSymbolsSet.has(s);
                    case 'MEME':
                        return MEME_COINS.some(meme => s.startsWith(meme));
                    case 'ALTS':
                        return !s.endsWith('USDT') && !s.endsWith('USDC') && !s.endsWith('BTC') && !s.endsWith('BNB') && !s.endsWith('ETH');
                    case 'USDT':
                    case 'USDC':
                    case 'BNB':
                    case 'BTC':
                    case 'ETH':
                        return s.endsWith(activeTab);
                    case 'TODOS':
                    default:
                        return true;
                }
            })
            .sort((a, b) => {
                const aIsMonitored = monitoredSymbolsSet.has(a);
                const bIsMonitored = monitoredSymbolsSet.has(b);
                const aHasAlert = alertSymbols.has(a);
                const bHasAlert = alertSymbols.has(b);

                if (aIsMonitored && !bIsMonitored) return -1;
                if (!aIsMonitored && bIsMonitored) return 1;
                if (aHasAlert && !bHasAlert) return -1;
                if (!aHasAlert && bHasAlert) return 1;
                return a.localeCompare(b);
            });
    }, [symbols, activeTab, searchTerm, alertSymbols, monitoredSymbolsSet]);
    
    const handleSelectSymbol = async (symbol: string) => {
        setFocusSymbol(symbol);
        await apiSetFocusSymbol(symbol);
    };

    const handlePinSymbol = async (symbol: string) => {
        const newSet = new Set(monitoredSymbols);
        if (newSet.has(symbol)) {
            newSet.delete(symbol);
        } else {
            newSet.add(symbol);
        }
        const newMonitoredList = Array.from(newSet);
        setMonitoredSymbols(newMonitoredList); // Optimistic UI update
        try {
            await setAIMonitorList(newMonitoredList);
        } catch (error) {
            console.error("Failed to update AI monitor list", error);
            // Revert on error if needed
            setMonitoredSymbols(monitoredSymbols);
        }
    };

    return (
        <div className="bg-zinc-900 rounded-lg p-2 flex flex-col h-[50vh] lg:h-[calc(100vh-60px)]">
            <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setMarket('futures')} className={`px-3 py-1 text-sm font-bold rounded-md flex-1 transition-colors ${market === 'futures' ? 'bg-amber-500 text-black' : 'bg-zinc-800 hover:bg-zinc-700'}`}>Futuros</button>
                <button onClick={() => setMarket('spot')} className={`px-3 py-1 text-sm font-bold rounded-md flex-1 transition-colors ${market === 'spot' ? 'bg-amber-500 text-black' : 'bg-zinc-800 hover:bg-zinc-700'}`}>Spot (À Vista)</button>
            </div>
            <input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 mb-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500 w-full transition-all duration-300 focus:w-full"
                disabled={wsStatus !== 'connected'}
            />
            <div className="flex items-center border-b border-zinc-700 mb-2 text-sm overflow-x-auto">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={`px-3 py-1.5 font-semibold transition-colors whitespace-nowrap ${activeTab === cat ? 'text-amber-300 border-b-2 border-amber-300' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                        {cat}{cat === 'Robô IA' && <span className="ml-1.5 bg-cyan-500 text-black text-xs font-bold rounded-full px-1.5 py-0.5">{monitoredSymbols.length}</span>}
                    </button>
                ))}
            </div>
            <div className="flex-grow overflow-y-auto">
                {wsStatus !== 'connected' ? (
                    <div className="text-center text-zinc-500 pt-10">Conectando...</div>
                ) : filteredSymbols.length > 0 ? (
                    filteredSymbols.map(s => (
                        <AssetRow 
                            key={s}
                            symbol={s}
                            hasAlert={alertSymbols.has(s)}
                            isFocused={s === focusSymbol}
                            isPinned={monitoredSymbolsSet.has(s)}
                            onSelect={handleSelectSymbol}
                            onPin={handlePinSymbol}
                        />
                    ))
                ) : (
                    <div className="text-center text-zinc-500 pt-10">Nenhum ativo encontrado.</div>
                )}
            </div>
        </div>
    );
}