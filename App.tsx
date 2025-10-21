import React, { useEffect, useState } from 'react';
import { connectWS } from './lib/ws';
import { fetchAccountInfo, fetchSymbols, fetchConfig, fetchAIMonitorList } from './lib/api';
import Chart from './components/Chart';
import ControlPanel from './components/ControlPanel';
import PositionsPanel from './components/PositionsPanel';
import AssetList from './components/AssetList';
import TradePanel from './components/TradePanel';
import AIPanel from './components/AIPanel';
import type { Config } from './components/ControlPanel';

export interface Alert {
  symbol: string;
  signal: 'buy' | 'sell';
  entry: number;
  stop: number;
  tp: number;
}

export interface Order {
  symbol: string;
  side: 'buy' | 'sell';
  entry: number;
  stop: number;
  tp: number;
  status?: 'OPEN' | 'TP' | 'SL';
  pnl?: number;
  origin?: 'kagi' | 'ai' | 'manual';
}

export interface Position {
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  margin: number;
}

export interface AccountState {
  totalBalance: number;
  totalUnrealizedPnl: number;
  positions: Position[];
}

type WsStatus = 'connecting' | 'connected' | 'disconnected';
export type MarketType = 'futures' | 'spot';

export default function App() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [kagiBotRunning, setKagiBotRunning] = useState<boolean>(false);
  const [aiBotRunning, setAiBotRunning] = useState<boolean>(false);
  const [focusSymbol, setFocusSymbol] = useState<string>('BTC/USDT');
  const [wsStatus, setWsStatus] = useState<WsStatus>('connecting');
  const [accountState, setAccountState] = useState<AccountState | null>(null);
  const [isAccountLoading, setIsAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [allSymbols, setAllSymbols] = useState<string[]>([]);
  const [market, setMarket] = useState<MarketType>('futures');
  const [config, setConfig] = useState<Partial<Config>>({});
  const [isAiPanelVisible, setAiPanelVisible] = useState(false);
  const [aiMonitoredSymbols, setAiMonitoredSymbols] = useState<string[]>([]);

  useEffect(() => {
    const ws = connectWS((msg: any) => {
      if (msg.type === 'kagi_bot_state') {
        setKagiBotRunning(msg.data.running);
        if (msg.data.focus) setFocusSymbol(msg.data.focus);
      }
      if (msg.type === 'ai_bot_state') {
        setAiBotRunning(msg.data.running);
      }
      if (msg.type === 'ai_monitor_list') {
        setAiMonitoredSymbols(msg.data.symbols);
      }
      if (msg.type === 'tick') {
        setAlerts(msg.data.alerts);
        if (msg.data.focus) setFocusSymbol(msg.data.focus);
      }
      if (msg.type === 'order') {
        const newOrder: Order = { ...msg.data, status: msg.data.status || 'OPEN' };
        setOrders((o) => [newOrder, ...o]);
      }
      if (msg.type === 'account') {
        setAccountState(msg.data);
        if (isAccountLoading) setIsAccountLoading(false);
        if (accountError) setAccountError(null);
      }
    }, setWsStatus);
    return () => ws.close();
  }, [isAccountLoading, accountError]);

  useEffect(() => {
    if (wsStatus !== 'connected') {
        setIsAccountLoading(true);
        setAccountState(null);
        setAccountError(null);
        setAllSymbols([]);
        setAiMonitoredSymbols([]);
        return;
    }

    const fetchInitialData = async () => {
        setIsAccountLoading(true);
        try {
            // Fetch account info and config only once, symbols can be refetched
            if (!accountState) {
                const [accountData, configData, monitorListData] = await Promise.all([
                    fetchAccountInfo(),
                    fetchConfig(),
                    fetchAIMonitorList()
                ]);
                setAccountState(accountData);
                setConfig(configData);
                setAiMonitoredSymbols(monitorListData.symbols);
            }
            const symbolsData = await fetchSymbols(market);
            setAllSymbols(symbolsData.symbols);
            setAccountError(null);
        } catch (e) {
            if (e instanceof Error) {
                setAccountError(e.message);
            } else {
                setAccountError("Ocorreu um erro desconhecido ao buscar dados da conta.");
            }
            setAccountState(null);
        } finally {
            setIsAccountLoading(false);
        }
    };
    
    fetchInitialData();
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsStatus, market]);

  return (
    <div className="min-h-screen font-sans text-xs">
      <header className="bg-zinc-900 p-2 border-b border-zinc-800 flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-xl font-bold text-amber-300">Robô Kagi + Fibo</h1>
        <ControlPanel
            kagiBotRunning={kagiBotRunning}
            aiBotRunning={aiBotRunning}
            wsStatus={wsStatus}
            setKagiBotRunning={setKagiBotRunning}
            setAiBotRunning={setAiBotRunning}
            onConfigSave={(newConfig) => setConfig(newConfig)}
            isAiPanelVisible={isAiPanelVisible}
            onToggleAiPanel={() => setAiPanelVisible(!isAiPanelVisible)}
        />
      </header>
      <main className="p-2 grid grid-cols-1 lg:grid-cols-12 gap-2">
        {wsStatus === 'disconnected' ? (
            <div className="col-span-12 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
              <div className="text-center">
                <p className="font-bold text-lg">Conexão Perdida</p>
                <p className="text-sm">Não foi possível conectar ao servidor backend.</p>
                <div className="mt-4 text-center">
                    <button 
                        onClick={() => window.location.reload()}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded transition-colors"
                        aria-label="Recarregar a página"
                    >
                        Recarregar Página
                    </button>
                </div>
              </div>
            </div>
        ) : (
            <>
                <div className="col-span-1 lg:col-span-2 space-y-2">
                    <AssetList 
                        symbols={allSymbols}
                        alerts={alerts}
                        focusSymbol={focusSymbol}
                        setFocusSymbol={setFocusSymbol}
                        wsStatus={wsStatus}
                        market={market}
                        setMarket={setMarket}
                        monitoredSymbols={aiMonitoredSymbols}
                        setMonitoredSymbols={setAiMonitoredSymbols}
                    />
                </div>
                <div className="col-span-1 lg:col-span-7 space-y-2">
                    <Chart 
                        focusSymbol={focusSymbol} 
                        wsStatus={wsStatus} 
                        alerts={alerts} 
                        accountState={accountState}
                        fibTarget={config.fib_target}
                    />
                    {isAiPanelVisible && <AIPanel focusSymbol={focusSymbol} aiStrategy={config.ai_strategy} />}
                </div>
                <div className="col-span-1 lg:col-span-3 space-y-2">
                    <TradePanel focusSymbol={focusSymbol} wsStatus={wsStatus} accountState={accountState} />
                    <PositionsPanel
                        accountState={accountState}
                        orders={orders}
                        alerts={alerts}
                        isLoading={isAccountLoading}
                        error={accountError}
                        onClearOrders={() => setOrders([])}
                    />
                </div>
            </>
        )}
      </main>
    </div>
  );
}