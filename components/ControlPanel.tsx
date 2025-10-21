import React, { useEffect, useState, useCallback } from 'react';
import { startBot, stopBot, saveConfig, fetchConfig, startAIBot, stopAIBot } from '../lib/api';
import Modal from './Modal';

const EyeOpenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);
const EyeClosedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 .847 0 1.67 .127 2.456 .36m4.214 2.43A9.973 9.973 0 0121.542 12c-1.274 4.057-5.064 7-9.542 7a10.025 10.025 0 01-2.456-.36" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15a3 3 0 110-6 3 3 0 010 6z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
    </svg>
);

const Toast = ({ message, type, onDismiss }: { message: string, type: 'success' | 'error', onDismiss: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 5000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const baseClasses = "flex items-center w-full max-w-xs p-4 mb-4 text-zinc-200 bg-zinc-800 rounded-lg shadow-lg border border-zinc-700";
    const successClasses = "text-green-400 bg-green-900/50";
    const errorClasses = "text-red-400 bg-red-900/50";

    return (
        <div className={baseClasses} role="alert">
            <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${type === 'success' ? successClasses : errorClasses} rounded-lg`}>
                {type === 'success' ? (
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/></svg>
                ) : (
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z"/></svg>
                )}
            </div>
            <div className="ms-3 text-sm font-normal">{message}</div>
            <button type="button" onClick={onDismiss} className="ms-auto -mx-1.5 -my-1.5 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg focus:ring-2 focus:ring-zinc-600 p-1.5 hover:bg-zinc-700 inline-flex items-center justify-center h-8 w-8" aria-label="Close">
                <span className="sr-only">Close</span>
                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/></svg>
            </button>
        </div>
    );
};
interface ToastMessage { id: number; message: string; type: 'success' | 'error'; }

export interface Config {
  binance_api_key: string;
  binance_api_secret: string;
  risk_mode: 'PERCENTUAL' | 'MINIMO' | 'FIXED_CAPITAL';
  risk_per_trade: number;
  risk_fixed_capital_base: number;
  timeframe: string;
  kagi_mode: 'ATR' | 'PCT';
  kagi_rev_atr: number;
  kagi_rev_pct: number;
  max_pending_candles: number;
  mode: 'MANUAL' | 'AUTO';
  live: boolean;
  validity_mode: 'FIXED' | 'DYNAMIC_ATR';
  base_validity_candles: number;
  fib_target: number;
  stop_management_mode: 'FIXED' | 'DYNAMIC_KAGI';
  ai_strategy: 'KAGI_REVERSAL' | 'ELLIOTT_WAVE_3' | 'SMART_MONEY';
}

interface ControlPanelProps { 
    kagiBotRunning: boolean;
    aiBotRunning: boolean;
    wsStatus: 'connecting' | 'connected' | 'disconnected';
    setKagiBotRunning: (running: boolean) => void;
    setAiBotRunning: (running: boolean) => void;
    onConfigSave: (config: Partial<Config>) => void;
    isAiPanelVisible: boolean;
    onToggleAiPanel: () => void;
}

export default function ControlPanel({ kagiBotRunning, aiBotRunning, wsStatus, setKagiBotRunning, setAiBotRunning, onConfigSave, isAiPanelVisible, onToggleAiPanel }: ControlPanelProps) {
  const [kagiMode, setKagiMode] = useState<'MANUAL'|'AUTO'>('MANUAL');
  const [live, setLive] = useState(false);
  const [cfg, setCfg] = useState<Partial<Config>>({});
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showSecret, setShowSecret] = useState(false);
  const [isCredModalOpen, setCredModalOpen] = useState(false);
  const [isParamsModalOpen, setParamsModalOpen] = useState(false);
  
  const isConnected = wsStatus === 'connected';
  
  const addToast = (message: string, type: 'success' | 'error') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  };

  const fetchConfigData = useCallback(async () => {
    try {
        const configData = await fetchConfig();
        setCfg(configData);
        if (configData.mode) setKagiMode(configData.mode);
        if (typeof configData.live === 'boolean') setLive(configData.live);
    } catch(e) {
        if (e instanceof Error) addToast(e.message, 'error');
    }
  }, []);

  useEffect(() => { if (isConnected) { fetchConfigData(); } }, [isConnected, fetchConfigData]);

  const startKagi = async () => {
    try {
        const data = await startBot(kagiMode, live);
        addToast(data.msg || "Robô Kagi iniciado com sucesso!", 'success');
        setKagiBotRunning(true);
    } catch (e) {
        if (e instanceof Error) addToast(e.message, 'error');
    }
  };

  const stopKagi = async () => {
    try {
        const data = await stopBot();
        addToast(data.msg || "Robô Kagi parado.", 'success');
        setKagiBotRunning(false);
    } catch (e) {
        if (e instanceof Error) addToast(e.message, 'error');
    }
  };
  
  const startAI = async () => {
    try {
        const data = await startAIBot();
        addToast(data.msg || "Robô IA iniciado com sucesso!", 'success');
        setAiBotRunning(true);
    } catch (e) {
        if (e instanceof Error) addToast(e.message, 'error');
    }
  }

  const stopAI = async () => {
    try {
        const data = await stopAIBot();
        addToast(data.msg || "Robô IA parado.", 'success');
        setAiBotRunning(false);
    } catch (e) {
        if (e instanceof Error) addToast(e.message, 'error');
    }
  }

  const save = async () => {
    try {
        const data = await saveConfig(cfg);
        setCfg(data);
        onConfigSave(data);
        addToast("Configuração salva!", 'success');
        setCredModalOpen(false);
        setParamsModalOpen(false);
    } catch (e) {
        if (e instanceof Error) addToast(e.message, 'error');
    }
  };

  const handleCfgChange = (key: keyof Config, value: any) => {
    setCfg({ ...cfg, [key]: value });
  };
  
  const statusIndicator = {
    connecting: { text: 'CONECTANDO...', color: 'text-yellow-400', ring: 'ring-yellow-400/50' },
    connected: { text: 'CONECTADO', color: 'text-green-400', ring: 'ring-green-400/50' },
    disconnected: { text: 'DESCONECTADO', color: 'text-red-400', ring: 'ring-red-400/50' },
  };

  const BotStatusIndicator = ({ running }: { running: boolean }) => (
    <div className="flex items-center gap-2" title={`Status do bot: ${running ? 'Rodando' : 'Parado'}`}>
        <div className="relative flex h-3 w-3">
            {running && <span className="animate-ping absolute inline-flex h-full w-full rounded-full ring-green-400/50 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${running ? 'bg-green-500' : 'bg-zinc-500'}`}></span>
        </div>
        <span className={running ? 'text-green-400' : 'text-zinc-400'}>{running ? 'ATIVO' : 'PARADO'}</span>
    </div>
  );

  return (
    <>
      <div className="fixed top-20 right-4 z-[100] space-y-2">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onDismiss={() => setToasts(t => t.filter(item => item.id !== toast.id))} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm w-full justify-end">
        <div className="flex items-center gap-2" title={`Status da conexão: ${statusIndicator[wsStatus].text}`}>
            <div className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusIndicator[wsStatus].ring} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${statusIndicator[wsStatus].color.replace('text-', 'bg-')}`}></span>
            </div>
            <span className={statusIndicator[wsStatus].color}>{statusIndicator[wsStatus].text}</span>
        </div>

        <div className="w-px h-6 bg-zinc-700 hidden md:block"></div>

        {/* Kagi Bot Controls */}
        <div className="flex items-center gap-3 p-1 rounded-md bg-zinc-800/50">
            <div className="text-zinc-400 font-bold pl-2">Robô Kagi</div>
            <BotStatusIndicator running={kagiBotRunning} />
            <select value={kagiMode} onChange={e => setKagiMode(e.target.value as any)} className="bg-zinc-800 rounded px-2 py-1 border border-zinc-700 disabled:opacity-50" disabled={!isConnected}>
                <option>MANUAL</option><option>AUTO</option>
            </select>
            <div className="flex gap-2">
                <button onClick={startKagi} className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded transition-colors disabled:opacity-50" disabled={!isConnected}>Start</button>
                <button onClick={stopKagi} className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded transition-colors disabled:opacity-50" disabled={!isConnected}>Stop</button>
            </div>
        </div>
        
        {/* AI Bot Controls */}
        <div className="flex items-center gap-3 p-1 rounded-md bg-zinc-800/50">
            <div className="text-zinc-400 font-bold pl-2">Robô IA</div>
            <BotStatusIndicator running={aiBotRunning} />
             <button 
                onClick={onToggleAiPanel}
                className={`px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 ${isAiPanelVisible ? 'bg-amber-500 text-black' : 'bg-zinc-700 hover:bg-zinc-600'}`} disabled={!isConnected}
                title="Abrir painel de análise manual da IA"
            >
                Análise Manual
            </button>
            <div className="flex gap-2">
                <button onClick={startAI} className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded transition-colors disabled:opacity-50" disabled={!isConnected}>Start</button>
                <button onClick={stopAI} className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded transition-colors disabled:opacity-50" disabled={!isConnected}>Stop</button>
            </div>
        </div>

        <div className="w-px h-6 bg-zinc-700 hidden md:block"></div>
        
        <div className="flex items-center gap-2">
             <input type="checkbox" id="live-mode" checked={live} onChange={e => setLive(e.target.checked)} className="h-4 w-4 text-amber-500 bg-zinc-800 border-zinc-700 rounded focus:ring-amber-500 disabled:opacity-50" disabled={!isConnected}/>
            <label htmlFor="live-mode" className="text-zinc-300">Conta Real</label>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => setCredModalOpen(true)} className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50" disabled={!isConnected}>Credenciais</button>
            <button onClick={() => setParamsModalOpen(true)} className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50" disabled={!isConnected}>Parâmetros</button>
        </div>
      </div>
      <Modal isOpen={isCredModalOpen} onClose={() => setCredModalOpen(false)} title="Credenciais da Exchange">
        <div className="space-y-4 text-sm">
            <label className="flex flex-col gap-1"><span>Binance API Key</span><input className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:bg-zinc-700 disabled:cursor-not-allowed font-mono text-xs" value={cfg.binance_api_key || ''} onChange={e => handleCfgChange('binance_api_key', e.target.value)} disabled={!isConnected} placeholder="Sua API Key" /></label>
            <label className="flex flex-col gap-1"><span>Binance API Secret</span><div className="relative flex items-center"><input type={showSecret ? 'text' : 'password'} className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:bg-zinc-700 disabled:cursor-not-allowed font-mono text-xs" value={cfg.binance_api_secret || ''} onChange={e => handleCfgChange('binance_api_secret', e.target.value)} disabled={!isConnected} placeholder="Seu API Secret" /><button onClick={() => setShowSecret(!showSecret)} className="absolute right-2 text-zinc-400 hover:text-zinc-200 disabled:cursor-not-allowed" type="button" disabled={!isConnected} aria-label={showSecret ? "Ocultar chave" : "Mostrar chave"}>{showSecret ? <EyeClosedIcon /> : <EyeOpenIcon />}</button></div></label>
            <div className="flex justify-end pt-2"><button onClick={save} className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded transition-colors disabled:opacity-50" disabled={!isConnected}>Salvar Credenciais</button></div>
        </div>
      </Modal>
      <Modal isOpen={isParamsModalOpen} onClose={() => setParamsModalOpen(false)} title="Parâmetros da Estratégia">
        <div className="space-y-4 text-sm">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="md:col-span-2">
                    <label className="flex flex-col gap-1">
                        <span>Modo de Risco</span>
                        <select className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:bg-zinc-700 disabled:cursor-not-allowed" value={cfg.risk_mode || 'PERCENTUAL'} onChange={e => handleCfgChange('risk_mode', e.target.value)} disabled={!isConnected}>
                            <option value="PERCENTUAL">Percentual (Saldo Total)</option>
                            <option value="FIXED_CAPITAL">Capital Fixo (USD)</option>
                            <option value="MINIMO">Mínimo da Exchange</option>
                        </select>
                    </label>
                </div>

                {cfg.risk_mode === 'FIXED_CAPITAL' ? (
                    <>
                        <label className="flex flex-col gap-1">
                            <span>Capital do Robô (USD)</span>
                            <input type="number" step="0.01" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:bg-zinc-700 disabled:cursor-not-allowed" value={cfg.risk_fixed_capital_base || ''} onChange={e => handleCfgChange('risk_fixed_capital_base', parseFloat(e.target.value))} disabled={!isConnected} placeholder="100.00" />
                            <p className="text-xs text-zinc-500 mt-1">Base de capital para o cálculo de risco.</p>
                        </label>
                         <label className="flex flex-col gap-1">
                            <span>Risco por Trade (%)</span>
                            <input type="number" step="0.01" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:bg-zinc-700 disabled:cursor-not-allowed" value={cfg.risk_per_trade ? (cfg.risk_per_trade * 100).toFixed(2) : ''} onChange={e => handleCfgChange('risk_per_trade', parseFloat(e.target.value)/100)} disabled={!isConnected} placeholder="1.00" />
                             <p className="text-xs text-zinc-500 mt-1">Percentual do "Capital do Robô" a arriscar.</p>
                        </label>
                    </>
                ) : (
                    <div className="md:col-span-2">
                        <label className="flex flex-col gap-1">
                            <span>Risco % (do Saldo Total da Conta)</span>
                            <input type="number" step="0.01" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:bg-zinc-700 disabled:cursor-not-allowed" value={cfg.risk_per_trade ? (cfg.risk_per_trade * 100).toFixed(2) : ''} onChange={e => handleCfgChange('risk_per_trade', parseFloat(e.target.value)/100)} disabled={!isConnected || cfg.risk_mode === 'MINIMO'} placeholder="1.00" />
                        </label>
                    </div>
                )}
                
                <div className="md:col-span-2 pt-4 mt-2 border-t border-zinc-700 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <label className="flex flex-col gap-1"><span>Timeframe</span><input className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:bg-zinc-700 disabled:cursor-not-allowed" value={cfg.timeframe || ''} onChange={e => handleCfgChange('timeframe', e.target.value)} disabled={!isConnected} placeholder="1h" /></label>
                    <label className="flex flex-col gap-1">
                        <span>Alvo Fibonacci (Projeção)</span>
                        <input type="number" step="0.001" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:bg-zinc-700 disabled:cursor-not-allowed" value={cfg.fib_target || ''} onChange={e => handleCfgChange('fib_target', parseFloat(e.target.value))} disabled={!isConnected} placeholder="1.618" />
                    </label>
                    <label className="flex flex-col gap-1"><span>Kagi Mode</span><select className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:bg-zinc-700 disabled:cursor-not-allowed" value={cfg.kagi_mode || 'ATR'} onChange={e => handleCfgChange('kagi_mode', e.target.value)} disabled={!isConnected}><option>ATR</option><option>PCT</option></select></label>
                    <label className="flex flex-col gap-1"><span>Kagi ATR</span><input type="number" step="0.1" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:bg-zinc-700 disabled:cursor-not-allowed" value={cfg.kagi_rev_atr || ''} onChange={e => handleCfgChange('kagi_rev_atr', parseFloat(e.target.value))} disabled={!isConnected} placeholder="1.1" /></label>
                </div>

                <div className="md:col-span-2 pt-4 mt-2 border-t border-zinc-700">
                    <label className="flex flex-col gap-1">
                        <span className="font-semibold text-amber-300">Estratégia Operacional da IA</span>
                        <select className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:bg-zinc-700 disabled:cursor-not-allowed" value={cfg.ai_strategy || 'KAGI_REVERSAL'} onChange={e => handleCfgChange('ai_strategy', e.target.value as Config['ai_strategy'])} disabled={!isConnected}>
                            <option value="KAGI_REVERSAL">Reversão Kagi (Padrão)</option>
                            <option value="ELLIOTT_WAVE_3">Onda 3 de Elliott</option>
                            <option value="SMART_MONEY">Smart Money (Order Block + FVG)</option>
                        </select>
                        <p className="text-xs text-zinc-500 mt-1">Define qual modelo de análise o Robô IA utilizará para encontrar operações.</p>
                    </label>
                </div>
                
                <div className="md:col-span-2 pt-4 mt-2 border-t border-zinc-700">
                    <label className="flex flex-col gap-1">
                        <span>Validade do Setup (Kagi)</span>
                        <select className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:bg-zinc-700 disabled:cursor-not-allowed" value={cfg.validity_mode || 'FIXED'} onChange={e => handleCfgChange('validity_mode', e.target.value as Config['validity_mode'])} disabled={!isConnected}>
                            <option value="FIXED">Velas Fixas</option>
                            <option value="DYNAMIC_ATR">Dinâmico (ATR)</option>
                        </select>
                    </label>
                    {cfg.validity_mode === 'DYNAMIC_ATR' ? (
                        <div className="mt-2">
                            <label className="flex flex-col gap-1"><span>Velas Base (Dinâmico)</span><input type="number" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:bg-zinc-700 disabled:cursor-not-allowed" value={cfg.base_validity_candles || ''} onChange={e => handleCfgChange('base_validity_candles', parseInt(e.target.value))} disabled={!isConnected} placeholder="24" /></label>
                            <p className="text-xs text-zinc-500 mt-1">O robô ajustará a validade em torno deste valor base, usando a volatilidade (ATR) atual vs. histórica.</p>
                        </div>
                    ) : (
                        <div className="mt-2">
                            <label className="flex flex-col gap-1"><span>Velas de Validade (Fixo)</span><input type="number" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:bg-zinc-700 disabled:cursor-not-allowed" value={cfg.max_pending_candles || ''} onChange={e => handleCfgChange('max_pending_candles', parseInt(e.target.value))} disabled={!isConnected} placeholder="28" /></label>
                            <p className="text-xs text-zinc-500 mt-1">O setup será cancelado após este número fixo de velas se não for acionado.</p>
                        </div>
                    )}
                </div>
                 <div className="md:col-span-2 pt-4 mt-2 border-t border-zinc-700">
                    <label className="flex flex-col gap-1">
                        <span>Gerenciamento de Stop</span>
                        <select className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:bg-zinc-700 disabled:cursor-not-allowed" value={cfg.stop_management_mode || 'FIXED'} onChange={e => handleCfgChange('stop_management_mode', e.target.value as Config['stop_management_mode'])} disabled={!isConnected}>
                            <option value="FIXED">Fixo (Alvo/Stop Padrão)</option>
                            <option value="DYNAMIC_KAGI">Dinâmico (Sinal de Saída Kagi)</option>
                        </select>
                        <p className="text-xs text-zinc-500 mt-1">"Dinâmico" fecha a posição se o Kagi reverter contra o trade, protegendo lucros ou reduzindo perdas.</p>
                    </label>
                </div>
            </div>
             <div className="flex justify-end pt-4 mt-4 border-t border-zinc-700"><button onClick={save} className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded transition-colors disabled:opacity-50" disabled={!isConnected}>Salvar Parâmetros</button></div>
        </div>
      </Modal>
    </>
  );
}