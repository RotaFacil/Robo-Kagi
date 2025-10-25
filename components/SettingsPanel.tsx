import React from 'react';
import Modal from './Modal';
import type { VisibleComponents } from '../App';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    visibleComponents: VisibleComponents;
    setVisibleComponents: React.Dispatch<React.SetStateAction<VisibleComponents>>;
}

const componentConfig = {
  analysis: [
    { id: 'assetList', label: 'Lista de Ativos (Pesquisa)' },
    { id: 'charts', label: 'Gráficos' },
    { id: 'tradePanel', label: 'Painel de Compra e Venda' },
    { id: 'positionsPanel', label: 'Painel de Posições/Histórico' },
  ],
  dashboard: [
    { id: 'accountHealth', label: 'Saúde da Conta' },
    { id: 'marketHeatmap', label: 'Heatmap do Mercado (24h)' },
    { id: 'realizedPnl', label: 'Card: P/L Realizado' },
    { id: 'winRate', label: 'Card: Taxa de Acerto' },
    { id: 'totalTrades', label: 'Card: Total de Trades' },
    { id: 'avgPnl', label: 'Card: P/L Médio' },
    { id: 'capitalCurve', label: 'Gráfico: Curva de Capital' },
    { id: 'notesPanel', label: 'Painel de Anotações' },
    { id: 'performanceByAsset', label: 'Tabela: Desempenho por Ativo' },
    { id: 'performanceByStrategy', label: 'Tabela: Desempenho por Estratégia' },
    { id: 'backtestPanel', label: 'Ferramenta de Backtesting' },
  ]
};

// FIX: Refactored ToggleSwitch props into an interface and used React.FC to correctly handle React-specific props like `key`.
interface ToggleSwitchProps {
    id: keyof VisibleComponents;
    label: string;
    isChecked: boolean;
    onToggle: (id: keyof VisibleComponents) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, label, isChecked, onToggle }) => {
    return (
        <div className="flex items-center justify-between bg-zinc-800/50 p-3 rounded-lg">
            <label htmlFor={id} className="text-sm text-zinc-300">{label}</label>
            <button
                type="button"
                id={id}
                className={`${isChecked ? 'bg-amber-500' : 'bg-zinc-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-900`}
                role="switch"
                aria-checked={isChecked}
                onClick={() => onToggle(id)}
            >
                <span
                    aria-hidden="true"
                    className={`${isChecked ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
            </button>
        </div>
    );
};


const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, visibleComponents, setVisibleComponents }) => {
    const handleToggle = (id: keyof VisibleComponents) => {
        setVisibleComponents(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Configurações de Layout">
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-amber-300 mb-3 border-b border-zinc-700 pb-2">Componentes da Tela de Análise</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {componentConfig.analysis.map(item => (
                            <ToggleSwitch 
                                key={item.id}
                                id={item.id as keyof VisibleComponents}
                                label={item.label}
                                isChecked={visibleComponents[item.id as keyof VisibleComponents]}
                                onToggle={handleToggle}
                            />
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-amber-300 mb-3 border-b border-zinc-700 pb-2">Componentes do Dashboard</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {componentConfig.dashboard.map(item => (
                             <ToggleSwitch 
                                key={item.id}
                                id={item.id as keyof VisibleComponents}
                                label={item.label}
                                isChecked={visibleComponents[item.id as keyof VisibleComponents]}
                                onToggle={handleToggle}
                            />
                        ))}
                    </div>
                </div>
            </div>
             <div className="flex justify-end pt-6 mt-6 border-t border-zinc-700">
                <button onClick={onClose} className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded transition-colors">Fechar</button>
            </div>
        </Modal>
    );
};

export default SettingsPanel;