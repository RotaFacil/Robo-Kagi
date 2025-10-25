
import React from 'react';
import type { RobotInstance, MasterApiState, SubscriptionStatus } from '../../App';
import { TrashIcon, EditIcon, KeyIcon } from '../icons/UIIcons';

interface RobotInstanceCardProps {
    instance: RobotInstance;
    onToggleStatus: (id: string) => void;
    onEdit: (instance: RobotInstance) => void;
    onDelete: (id: string) => void;
    masterApiState: MasterApiState;
    subscriptionStatus: SubscriptionStatus;
}

const ToggleSwitch = ({ isEnabled, onToggle, disabled, disabledTitle }: { isEnabled: boolean, onToggle: (enabled: boolean) => void, disabled?: boolean, disabledTitle?: string }) => {
    const toggleClass = isEnabled ? 'bg-green-500' : 'bg-zinc-600';
    const knobClass = isEnabled ? 'translate-x-5' : 'translate-x-0';
    return (
        <button type="button" className={`${toggleClass} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed`} role="switch" aria-checked={isEnabled} onClick={() => onToggle(!isEnabled)} disabled={disabled} title={disabled ? disabledTitle : (isEnabled ? "Parar robô" : "Iniciar robô")}>
            <span aria-hidden="true" className={`${knobClass} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
        </button>
    );
};

const PnlText = ({ value }: { value: number }) => {
    const color = value >= 0 ? 'text-green-400' : 'text-red-400';
    const sign = value >= 0 ? '+' : '';
    return <span className={`font-bold ${color}`}>{sign}{value.toFixed(2)}</span>;
};


const RobotInstanceCard: React.FC<RobotInstanceCardProps> = ({ instance, onToggleStatus, onEdit, onDelete, masterApiState, subscriptionStatus }) => {
    const { id, type, symbol, timeframe, maxCapital, isRunning, pnl, trades, winRate } = instance;

    const botTypeDisplay = type === 'kagi' ? { name: 'Kagi+Fibo', color: 'bg-purple-500/20 text-purple-400' } : { name: 'IA', color: 'bg-cyan-500/20 text-cyan-400' };
    
    const hasApiKeys = masterApiState.isValidated;
    const isDisabled = !hasApiKeys || subscriptionStatus !== 'active';

    let disabledTitle = '';
    if (!hasApiKeys) {
        disabledTitle = "Configure e valide as chaves de API para iniciar.";
    } else if (subscriptionStatus === 'grace_period') {
        disabledTitle = "Renove a assinatura para reativar os robôs.";
    } else if (subscriptionStatus === 'expired') {
        disabledTitle = "Assinatura expirada. Robôs desativados.";
    }


    return (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 flex flex-col gap-3 transform hover:scale-105 transition-transform duration-200">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2">
                         <span className={`px-2 py-0.5 rounded text-xs font-bold ${botTypeDisplay.color}`}>{botTypeDisplay.name}</span>
                         <span className="text-xs font-semibold bg-zinc-700 px-2 py-0.5 rounded">{timeframe}</span>
                         <KeyIcon className={`h-4 w-4 ${hasApiKeys ? 'text-green-400' : 'text-zinc-600'}`} title={hasApiKeys ? 'Chaves de API validadas' : 'Chaves de API não configuradas ou inválidas'} />
                    </div>
                    <h3 className="font-bold text-lg text-zinc-100 mt-1">{symbol}</h3>
                </div>
                <ToggleSwitch isEnabled={isRunning} onToggle={() => onToggleStatus(id)} disabled={isDisabled} disabledTitle={disabledTitle} />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                    <p className="text-zinc-400 text-xs">P/L (USD)</p>
                    <p><PnlText value={pnl} /></p>
                </div>
                 <div>
                    <p className="text-zinc-400 text-xs">Trades</p>
                    <p className="font-mono text-zinc-200">{trades}</p>
                </div>
                 <div>
                    <p className="text-zinc-400 text-xs">Acerto</p>
                    <p className="font-mono text-zinc-200">{winRate.toFixed(1)}%</p>
                </div>
            </div>
            
             <div className="border-t border-zinc-700/50 pt-2 flex justify-between items-center">
                <p className="text-xs text-zinc-500">Capital: <span className="font-mono text-zinc-400">${maxCapital}</span></p>
                <div className="flex items-center gap-1">
                     <button onClick={() => onEdit(instance)} className="p-2 rounded-full hover:bg-zinc-700 transition-colors text-zinc-400" title="Editar Robô">
                        <EditIcon className="h-4 w-4" />
                    </button>
                     <button onClick={() => onDelete(id)} className="p-2 rounded-full hover:bg-zinc-700 transition-colors text-red-500/70 hover:text-red-500" title="Excluir Robô">
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RobotInstanceCard;
