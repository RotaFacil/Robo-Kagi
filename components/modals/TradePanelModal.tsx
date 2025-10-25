import React from 'react';
import Modal from '../Modal';
import TradePanel from '../TradePanel';
import type { AccountState } from '../../App';

interface TradePanelModalProps {
    isOpen: boolean;
    onClose: () => void;
    focusSymbol: string;
    wsStatus: 'connecting' | 'connected' | 'disconnected';
    accountState: AccountState | null;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const TradePanelModal: React.FC<TradePanelModalProps> = (props) => {
    return (
        <Modal isOpen={props.isOpen} onClose={props.onClose} title={`Negociar ${props.focusSymbol}`}>
            <div className="h-[70vh]"> {/* Give it a fixed height for scrolling within modal */}
                <TradePanel
                    focusSymbol={props.focusSymbol}
                    wsStatus={props.wsStatus}
                    accountState={props.accountState}
                    addToast={props.addToast}
                />
            </div>
        </Modal>
    );
};

export default TradePanelModal;