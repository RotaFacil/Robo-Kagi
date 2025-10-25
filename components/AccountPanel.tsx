import React from 'react';
import type { AccountState, Position } from '../App';

interface AccountPanelProps {
    accountState: AccountState | null;
    isLoading: boolean;
    error: string | null;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const PnlText = ({ value }: { value: number }) => {
    const color = value >= 0 ? 'text-green-400' : 'text-red-400';
    const sign = value >= 0 ? '+' : '';
    return <span className={`font-bold ${color}`}>{sign}{formatCurrency(value)}</span>;
};

interface PositionCardProps {
    position: Position;
}

const PositionCard: React.FC<PositionCardProps> = ({ position }) => (
    <div className="bg-zinc-800 rounded p-2 text-xs">
        <div className="flex justify-between font-bold">
            <span>{position.symbol}</span>
            <span className={position.side === 'LONG' ? 'text-green-400' : 'text-red-400'}>{position.side}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-zinc-400">
            <span>Tamanho:</span><span className="text-right text-zinc-200">{position.size}</span>
            <span>Entrada:</span><span className="text-right text-zinc-200">{position.entryPrice.toPrecision(4)}</span>
            <span>Marcação:</span><span className="text-right text-zinc-200">{position.markPrice.toPrecision(4)}</span>
            <span>Margem:</span><span className="text-right text-zinc-200">{formatCurrency(position.margin)}</span>
            <span>P/L:</span><div className="text-right"><PnlText value={position.pnl} /></div>
        </div>
    </div>
);

const SkeletonLoader = () => (
    <div className="p-2 animate-pulse">
        <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex flex-col gap-1">
                <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
                <div className="h-7 bg-zinc-800 rounded w-1/2"></div>
            </div>
            <div className="flex flex-col gap-1">
                 <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
                <div className="h-7 bg-zinc-800 rounded w-1/2"></div>
            </div>
        </div>
        <div className="mt-4 space-y-2">
            <div className="h-16 bg-zinc-800 rounded"></div>
            <div className="h-16 bg-zinc-800 rounded"></div>
        </div>
    </div>
);


export function AccountContent({ accountState, isLoading, error }: AccountPanelProps) {
    if (isLoading) {
        return <SkeletonLoader />;
    }

    if (error) {
        return (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-3 py-2 rounded-lg text-sm m-2">
                <p className="font-bold">Erro ao Carregar Conta</p>
                <p>{error}</p>
            </div>
        );
    }

    if (accountState) {
        return (
            <>
                <div className="grid grid-cols-2 gap-2 text-sm p-2">
                    <div className="flex flex-col">
                        <span className="text-zinc-400">Saldo Total</span>
                        <span className="text-lg font-bold">{formatCurrency(accountState.totalBalance)}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-zinc-400">P/L Aberto</span>
                        <div className="text-lg"><PnlText value={accountState.totalUnrealizedPnl} /></div>
                    </div>
                </div>
                <div className="p-2">
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {accountState.positions.length > 0 ? (
                            accountState.positions.map(p => <PositionCard key={p.symbol} position={p} />)
                        ) : (
                            <div className="text-center text-zinc-500 py-8 text-sm flex flex-col items-center gap-2">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                Nenhuma posição aberta.
                            </div>
                        )}
                    </div>
                </div>
            </>
        );
    }
    
    return null;
}
