import React from 'react';
import Modal from '../Modal';
import PositionsPanel from '../PositionsPanel';
import type { AccountState, Order, Alert } from '../../App';

interface PositionsPanelModalProps {
    isOpen: boolean;
    onClose: () => void;
    accountState: AccountState | null;
    orders: Order[];
    alerts: Alert[];
    isLoading: boolean;
    error: string | null;
    onClearOrders: () => void;
}

const PositionsPanelModal: React.FC<PositionsPanelModalProps> = (props) => {
    return (
        <Modal isOpen={props.isOpen} onClose={props.onClose} title="Minhas Posições e Ordens">
            <div className="h-[70vh]"> {/* Give it a fixed height for scrolling within modal */}
                <PositionsPanel
                    accountState={props.accountState}
                    orders={props.orders}
                    alerts={props.alerts}
                    isLoading={props.isLoading}
                    error={props.error}
                    onClearOrders={props.onClearOrders}
                />
            </div>
        </Modal>
    );
};

export default PositionsPanelModal;