

import React, { useState, useEffect } from 'react';
import type { RobotInstance, TradingParameters } from '../../App';
import Modal from '../Modal';
import { aiStrategyOptions, aiStrategyDescriptions, AIStrategy } from '../../lib/aiStrategies';

interface AddEditRobotModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (robot: RobotInstance) => void;
    instanceToEdit?: RobotInstance | null;
    allSymbols: string[];
}

const TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1D'];

// Default parameters for a brand new robot
const defaultNewRobotParams: TradingParameters = {
    risk_mode: 'FIXED_CAPITAL',
    risk_per_trade: 0.01, // 1%
    risk_fixed_capital_base: 500,
    timeframe: '1h',
    kagi_mode: 'ATR',
    kagi_rev_atr: 1.1,
    kagi_rev_pct: 0.5,
    max_pending_candles: 28,
    mode: 'AUTO',
    live: true,
    validity_mode: 'FIXED',
    base_validity_candles: 24,
    fib_target: 1.618,
    stop_management_mode: 'FIXED',
    ai_strategy: 'AI_AUTO_SELECT',
    ai_mode: 'AUTO',
    ai_news_filter: true,
    break_even_active: true,
    break_even_mode: 'TARGET_PCT',
    break_even_trigger_pct: 50,
    break_even_trigger_rr: 1.0,
    trailing_stop_active: false,
    trailing_stop_mode: 'PERCENTAGE',
    trailing_stop_distance_pct: 1.5,
    trailing_stop_distance_atr: 2.0,
};

const AddEditRobotModal: React.FC<AddEditRobotModalProps> = ({ isOpen, onClose, onSave, instanceToEdit, allSymbols }) => {
    const [robot, setRobot] = useState<Partial<RobotInstance>>({});

    useEffect(() => {
        if (isOpen) {
            if (instanceToEdit) {
                setRobot({ ...instanceToEdit });
            } else {
                setRobot({
                    type: 'kagi',
                    symbol: 'BTC/USDT',
                    timeframe: '1h',
                    maxCapital: 500,
                    isRunning: false,
                    params: { ...defaultNewRobotParams }
                });
            }
        }
    }, [instanceToEdit, isOpen]);

    const handleParamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        let parsedValue: any = value;
        if (type === 'number') {
            parsedValue = parseFloat(value);
        }
        if (name === 'risk_per_trade') {
            parsedValue = parseFloat(value) / 100; // Convert percentage from input
        }

        setRobot(prev => ({
            ...prev,
            params: { ...prev.params, [name]: parsedValue } as TradingParameters
        }));
    };
    
     const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setRobot(prev => ({
            ...prev,
            params: { ...prev.params, [name]: checked } as TradingParameters
        }));
    };

    const handleBaseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setRobot(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const robotData = { ...robot };

        const finalRobot: RobotInstance = {
            id: robotData.id || `${robotData.type}-${robotData.symbol?.replace('/', '')}-${robotData.timeframe}-${Date.now()}`,
            pnl: instanceToEdit?.pnl || 0,
            trades: instanceToEdit?.trades || 0,
            winRate: instanceToEdit?.winRate || 0,
            ...(robotData as Omit<RobotInstance, 'id'|'pnl'|'trades'|'winRate'>),
            params: { ...robotData.params, timeframe: robotData.timeframe } as TradingParameters // ensure timeframe is synced
        };
        onSave(finalRobot);
        onClose();
    };

    if (!robot.params) return null; // Don't render if state is not ready

    const cfg = robot.params; // Alias for easier access

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={instanceToEdit ? `Configurar Robô: ${instanceToEdit.symbol}` : 'Adicionar Novo Robô'}>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-zinc-700">
                    <label className="flex flex-col gap-1">
                        <span className="text-zinc-400">Tipo de Robô</span>
                        <select name="type" value={robot.type} onChange={handleBaseChange} className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full">
                            <option value="kagi">Robô Kagi+Fibo</option>
                            <option value="ai">Robô IA</option>
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-zinc-400">Ativo (Símbolo)</span>
                        <input name="symbol" list="symbols-datalist-robot" value={robot.symbol} onChange={handleBaseChange} className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" />
                        <datalist id="symbols-datalist-robot">
                            {allSymbols.map(s => <option key={s} value={s} />)}
                        </datalist>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-zinc-400">Timeframe</span>
                        <select name="timeframe" value={robot.timeframe} onChange={handleBaseChange} className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full">
                            {TIMEFRAMES.map(tf => <option key={tf} value={tf}>{tf}</option>)}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-zinc-400">Capital Máximo (USD)</span>
                        <input name="maxCapital" type="number" value={robot.maxCapital} onChange={handleBaseChange} className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" placeholder="500" />
                    </label>
                </div>
                
                <h3 className="text-base font-semibold text-amber-300 pt-2">Parâmetros de Operação</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                    <div className="md:col-span-2 lg:col-span-4"><label className="flex flex-col gap-1"><span>Modo de Risco</span><select className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" name="risk_mode" value={cfg.risk_mode || 'PERCENTUAL'} onChange={handleParamChange}><option value="PERCENTUAL">Percentual (Saldo Total)</option><option value="FIXED_CAPITAL">Capital Fixo (USD)</option><option value="MINIMO">Mínimo da Exchange</option></select></label></div>
                    {cfg.risk_mode === 'FIXED_CAPITAL' ? (
                        <><label className="flex flex-col gap-1"><span>Capital do Robô (USD)</span><input type="number" step="0.01" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" name="risk_fixed_capital_base" value={cfg.risk_fixed_capital_base || ''} onChange={handleParamChange} placeholder="100.00" /><p className="text-xs text-zinc-500 mt-1">Base de capital para o cálculo de risco.</p></label><label className="flex flex-col gap-1"><span>Risco por Trade (%)</span><input type="number" step="0.01" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" name="risk_per_trade" value={cfg.risk_per_trade ? (cfg.risk_per_trade * 100).toFixed(2) : ''} onChange={handleParamChange} placeholder="1.00" /><p className="text-xs text-zinc-500 mt-1">Percentual do "Capital do Robô" a arriscar.</p></label></>
                    ) : (
                        <div className="md:col-span-2 lg:col-span-4"><label className="flex flex-col gap-1"><span>Risco % (do Saldo Total da Conta)</span><input type="number" step="0.01" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" name="risk_per_trade" value={cfg.risk_per_trade ? (cfg.risk_per_trade * 100).toFixed(2) : ''} onChange={handleParamChange} disabled={cfg.risk_mode === 'MINIMO'} placeholder="1.00" /></label></div>
                    )}
                    <div className="md:col-span-2 lg:col-span-4 pt-4 mt-2 border-t border-zinc-700 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <label className="flex flex-col gap-1"><span>Alvo Fibonacci (Projeção)</span><input type="number" step="0.001" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" name="fib_target" value={cfg.fib_target || ''} onChange={handleParamChange} placeholder="1.618" /></label>
                        <label className="flex flex-col gap-1"><span>Kagi Mode</span><select className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" name="kagi_mode" value={cfg.kagi_mode || 'ATR'} onChange={handleParamChange}><option>ATR</option><option>PCT</option></select></label>
                        <label className="flex flex-col gap-1"><span>Kagi ATR</span><input type="number" step="0.1" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" name="kagi_rev_atr" value={cfg.kagi_rev_atr || ''} onChange={handleParamChange} placeholder="1.1" /></label>
                    </div>
                    <div className="md:col-span-2 lg:col-span-4 pt-4 mt-2 border-t border-zinc-700"><label className="flex flex-col gap-1"><span className="font-semibold text-amber-300">Estratégia Operacional da IA</span><select className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" name="ai_strategy" value={cfg.ai_strategy || 'AI_AUTO_SELECT'} onChange={handleParamChange}>{aiStrategyOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</select></label>{cfg.ai_strategy && aiStrategyDescriptions[cfg.ai_strategy] && (<div className="mt-3 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700 text-xs animate-fade-in-up"><p className="text-zinc-400 mb-2">{aiStrategyDescriptions[cfg.ai_strategy].title}</p><ul className="list-disc list-inside space-y-1 text-zinc-500 pl-2">{aiStrategyDescriptions[cfg.ai_strategy].framework.map((point, index) => (<li key={index}>{point}</li>))}</ul></div>)}</div>
                    <div className="md:col-span-2 lg:col-span-4 pt-4 mt-2 border-t border-zinc-700"><span className="font-semibold text-amber-300">Filtros Adicionais da IA</span><div className="mt-2 flex items-center gap-3 bg-zinc-800/50 p-3 rounded-lg"><input type="checkbox" id="ai-news-filter" name="ai_news_filter" checked={!!cfg.ai_news_filter} onChange={handleCheckboxChange} className="h-4 w-4 text-amber-500 bg-zinc-800 border-zinc-700 rounded focus:ring-amber-500" /><label htmlFor="ai-news-filter" className="text-zinc-300">Filtro de Notícias IA</label></div>{cfg.ai_news_filter && (<div className="mt-2 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700 text-xs animate-fade-in-up"><p className="text-zinc-400">Quando ativado, antes de executar uma ordem, a IA verificará notícias e o sentimento geral do mercado para o ativo. Trades podem ser vetados se for detectado um sentimento extremamente negativo.</p></div>)}</div>
                    <div className="md:col-span-2 lg:col-span-4 pt-4 mt-2 border-t border-zinc-700"><span className="font-semibold text-amber-300">Gerenciamento de Posição</span><div className="mt-2 flex items-center gap-3 bg-zinc-800/50 p-3 rounded-lg"><input type="checkbox" id="break-even-active" name="break_even_active" checked={!!cfg.break_even_active} onChange={handleCheckboxChange} className="h-4 w-4 text-amber-500 bg-zinc-800 border-zinc-700 rounded focus:ring-amber-500" /><label htmlFor="break-even-active" className="text-zinc-300">Mover Stop para o Break-Even</label></div>{cfg.break_even_active && (<div className="mt-2 ml-4 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700 text-xs animate-fade-in-up space-y-3"><label className="flex flex-col gap-1"><span>Modo de Gatilho</span><select className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" name="break_even_mode" value={cfg.break_even_mode || 'TARGET_PCT'} onChange={handleParamChange}><option value="TARGET_PCT">Percentual do Alvo</option><option value="RR">Risco/Retorno</option></select></label>{(!cfg.break_even_mode || cfg.break_even_mode === 'TARGET_PCT') && (<div><label className="flex flex-col gap-1"><span>Gatilho (% do Alvo)</span><input type="number" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" name="break_even_trigger_pct" value={cfg.break_even_trigger_pct || ''} onChange={handleParamChange} placeholder="50" /></label><p className="text-xs text-zinc-500 mt-1">O Stop será movido para a entrada quando o trade atingir esta porcentagem do alvo (TP).</p></div>)}{cfg.break_even_mode === 'RR' && (<div><label className="flex flex-col gap-1"><span>Gatilho (Relação Risco/Retorno)</span><input type="number" step="0.1" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" name="break_even_trigger_rr" value={cfg.break_even_trigger_rr || ''} onChange={handleParamChange} placeholder="1.0" /></label><p className="text-xs text-zinc-500 mt-1">O Stop será movido para a entrada quando o trade atingir a relação R/R (ex: 1.0 para 1:1).</p></div>)}</div>)}<div className="mt-3 flex items-center gap-3 bg-zinc-800/50 p-3 rounded-lg"><input type="checkbox" id="trailing-stop-active" name="trailing_stop_active" checked={!!cfg.trailing_stop_active} onChange={handleCheckboxChange} className="h-4 w-4 text-amber-500 bg-zinc-800 border-zinc-700 rounded focus:ring-amber-500" /><label htmlFor="trailing-stop-active" className="text-zinc-300">Ativar Trailing Stop</label></div>{cfg.trailing_stop_active && (<div className="mt-2 ml-4 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700 text-xs animate-fade-in-up space-y-3"><label className="flex flex-col gap-1"><span>Tipo de Trailing</span><select className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" name="trailing_stop_mode" value={cfg.trailing_stop_mode || 'PERCENTAGE'} onChange={handleParamChange}><option value="PERCENTAGE">Percentual Fixo</option><option value="ATR">Múltiplo do ATR</option></select></label>{(!cfg.trailing_stop_mode || cfg.trailing_stop_mode === 'PERCENTAGE') && (<div><label className="flex flex-col gap-1"><span>Distância (%)</span><input type="number" step="0.1" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" name="trailing_stop_distance_pct" value={cfg.trailing_stop_distance_pct || ''} onChange={handleParamChange} placeholder="1.5" /></label><p className="text-xs text-zinc-500 mt-1">O Stop seguirá o preço a esta distância percentual fixa.</p></div>)}{cfg.trailing_stop_mode === 'ATR' && (<div><label className="flex flex-col gap-1"><span>Distância (Múltiplo do ATR)</span><input type="number" step="0.1" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" name="trailing_stop_distance_atr" value={cfg.trailing_stop_distance_atr || ''} onChange={handleParamChange} placeholder="2.0" /></label><p className="text-xs text-zinc-500 mt-1">O Stop seguirá o preço a uma distância baseada no ATR (ex: 2.0 = 2x o valor do ATR).</p></div>)}</div>)}</div>
                </div>

                <div className="flex justify-end pt-4 mt-4 border-t border-zinc-700 gap-2">
                    <button type="button" onClick={onClose} className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold px-4 py-2 rounded transition-colors">Cancelar</button>
                    <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded transition-colors">Salvar Robô</button>
                </div>
            </form>
        </Modal>
    );
};

export default AddEditRobotModal;
