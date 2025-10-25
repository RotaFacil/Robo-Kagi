import React from 'react';
import type { AccountState } from '../../App';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const PnlText = ({ value }: { value: number }) => {
    const color = value >= 0 ? 'text-green-400' : 'text-red-400';
    const sign = value >= 0 ? '+' : '';
    return <span className={`font-bold ${color}`}>{sign}{formatCurrency(value)}</span>;
};


const AccountHealth: React.FC<{ accountState: AccountState | null }> = ({ accountState }) => {
    if (!accountState) return (
        <div className="bg-zinc-900 rounded-lg p-4 text-center text-zinc-500 h-full flex items-center justify-center">
            Carregando dados da conta...
        </div>
    );

    const { totalBalance, availableBalance, totalUnrealizedPnl, marginUsed } = accountState;
    const marginPercentage = totalBalance > 0 ? (marginUsed / totalBalance) * 100 : 0;

    return (
        <div className="bg-zinc-900 rounded-lg p-4 h-full flex flex-col justify-between">
            <h2 className="text-lg font-semibold text-amber-300 mb-3">Saúde da Conta</h2>
            <div className="space-y-3 text-sm">
                <div className="flex justify-between items-baseline">
                    <span className="text-zinc-400">Patrimônio Total</span>
                    <span className="text-2xl font-bold text-zinc-100">{formatCurrency(totalBalance)}</span>
                </div>
                 <div className="flex justify-between items-baseline">
                    <span className="text-zinc-400">P/L Aberto</span>
                    <div className="text-lg"><PnlText value={totalUnrealizedPnl} /></div>
                </div>
                 <div className="flex justify-between items-baseline">
                    <span className="text-zinc-400">Saldo Disponível</span>
                    <span className="font-mono text-zinc-200">{formatCurrency(availableBalance)}</span>
                </div>
                 <div className="flex justify-between items-baseline">
                    <span className="text-zinc-400">Margem Utilizada</span>
                    <span className="font-mono text-zinc-200">{formatCurrency(marginUsed)}</span>
                </div>
            </div>
            <div className="mt-4">
                <span className="text-xs text-zinc-500">Uso da Margem ({marginPercentage.toFixed(1)}%)</span>
                <div className="w-full bg-zinc-700 rounded-full h-2.5 mt-1">
                    <div 
                        className="bg-amber-500 h-2.5 rounded-full" 
                        style={{ width: `${Math.min(marginPercentage, 100)}%` }}
                    ></div>
                </div>
            </div>
        </div>
    )
}

export default React.memo(AccountHealth);