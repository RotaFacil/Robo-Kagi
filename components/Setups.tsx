import React, { useState } from 'react';
import type { Alert } from '../App';
import Orders from './Orders';

interface SetupsProps {
  alerts: Alert[];
  wsStatus: 'connecting' | 'connected' | 'disconnected';
  setFocusSymbol: (symbol: string) => void;
}

const calculateRR = (setup: Alert) => {
  if (setup.entry === setup.stop) return 0;
  const rr = Math.abs((setup.tp - setup.entry) / (setup.entry - setup.stop));
  return rr;
};

const getRRColor = (rr: number) => {
  if (rr >= 2) return 'text-green-400';
  if (rr >= 1) return 'text-yellow-400';
  return 'text-red-400';
};

interface SetupCardProps {
    a: Alert;
    setFocusSymbol: (s: string) => void;
    wsStatus: 'connecting' | 'connected' | 'disconnected';
}

// FIX: Explicitly type SetupCard as React.FC<SetupCardProps> to correctly handle the `key` prop provided in the parent's `.map()` function.
const SetupCard: React.FC<SetupCardProps> = ({ a, setFocusSymbol, wsStatus }) => {
    const rr = calculateRR(a);
    return (
        <div className="bg-zinc-800 rounded p-3 flex flex-col justify-between transform hover:scale-105 transition-transform duration-200">
            <div>
                <div className="flex justify-between items-center">
                    <span className="font-bold text-base">{a.symbol}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${a.signal === 'buy' ? 'bg-green-500 text-black' : 'bg-red-500 text-black'}`}>
                        SETUP {a.signal.toUpperCase()}
                    </span>
                </div>
                 <div className="text-xs text-zinc-400 mt-2 grid grid-cols-2 gap-1">
                    <span>Gatilho: {a.entry.toFixed(5)}</span>
                    <span className={`font-bold text-right ${getRRColor(rr)}`}>RR: {rr.toFixed(2)}:1</span>
                    <span>Stop: {a.stop.toFixed(5)}</span>
                    <span className="text-right">Alvo: {a.tp.toFixed(5)}</span>
                </div>
            </div>
            <div className="flex gap-2 mt-3">
                <Orders.ManualButtons signal={a} wsStatus={wsStatus} />
                <button 
                    onClick={() => setFocusSymbol(a.symbol)}
                    className="w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-bold px-2 py-1 rounded text-xs transition-colors"
                    aria-label={`Ver ${a.symbol} no gráfico`}
                >
                    Ver no Gráfico
                </button>
            </div>
        </div>
    )
}

export default function Setups({ alerts, wsStatus, setFocusSymbol }: SetupsProps) {
    const [setupFilter, setSetupFilter] = useState('');

    const filteredAlerts = alerts.filter(a => 
        a.symbol.toLowerCase().includes(setupFilter.toLowerCase())
    );

    return (
        <div className="bg-zinc-900 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-amber-300">Setups de Trade</h2>
                <input 
                    type="text" 
                    placeholder="Filtrar por símbolo..."
                    value={setupFilter}
                    onChange={(e) => setSetupFilter(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    disabled={wsStatus !== 'connected' || alerts.length === 0}
                />
            </div>
            {wsStatus !== 'connected' ? (
                <div className="text-center text-zinc-500 py-8">
                    Conectando ao backend para buscar setups...
                </div>
            ) : alerts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {filteredAlerts.map((a) => (
                    <SetupCard key={`${a.symbol}-${a.entry}`} a={a} setFocusSymbol={setFocusSymbol} wsStatus={wsStatus} />
                ))}
                {filteredAlerts.length === 0 && (
                    <div className="text-center text-zinc-500 py-8 md:col-span-2 xl:col-span-3">
                        Nenhum setup encontrado com o filtro atual.
                    </div>
                )}
              </div>
            ) : (
                <div className="text-center text-zinc-500 py-8 flex flex-col items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    Nenhum setup encontrado. Aguardando scanner...
                </div>
            )}
        </div>
    )
}