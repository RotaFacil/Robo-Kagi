import React from 'react';
import Modal from '../Modal';
import AssetList from '../AssetList';
import type { Alert, MarketType } from '../../App'; // Removed ChartState as it's not used directly here

interface AssetListModalProps {
    isOpen: boolean;
    onClose: () => void;
    allSymbols: string[];
    alerts: Alert[];
    focusSymbol: string;
    setFocusSymbol: (symbol: string) => void;
    wsStatus: 'connecting' | 'connected' | 'disconnected';
    market: MarketType;
    setMarket: (market: MarketType) => void;
    aiMonitoredSymbols: string[];
    setAiMonitoredSymbols: (symbols: string[]) => void;
}

const AssetListModal: React.FC<AssetListModalProps> = (props) => {
    return (
        <Modal isOpen={props.isOpen} onClose={props.onClose} title="Lista de Ativos">
            <div className="h-[70vh]"> {/* Give it a fixed height for scrolling within modal */}
                <AssetList
                    symbols={props.allSymbols}
                    alerts={props.alerts}
                    focusSymbol={props.focusSymbol}
                    setFocusSymbol={props.setFocusSymbol}
                    wsStatus={props.wsStatus}
                    market={props.market}
                    setMarket={props.setMarket}
                    monitoredSymbols={props.aiMonitoredSymbols}
                    setMonitoredSymbols={props.setAiMonitoredSymbols}
                />
            </div>
        </Modal>
    );
};

export default AssetListModal;