
import React, { useState } from 'react';
import type { RobotInstance, MasterApiState, SubscriptionStatus } from '../../App';
import RobotInstanceCard from './RobotInstanceCard';
import AddEditRobotModal from './AddEditRobotModal';

interface RobotsViewProps {
    robotInstances: RobotInstance[];
    allSymbols: string[];
    onSave: (robot: RobotInstance) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (id: string) => void;
    masterApiState: MasterApiState;
    subscriptionStatus: SubscriptionStatus;
}

const RobotsView: React.FC<RobotsViewProps> = ({ robotInstances, allSymbols, onSave, onDelete, onToggleStatus, masterApiState, subscriptionStatus }) => {
    const [isAddEditModalOpen, setAddEditModalOpen] = useState(false);
    const [instanceToEdit, setInstanceToEdit] = useState<RobotInstance | null>(null);

    const handleAddClick = () => {
        setInstanceToEdit(null);
        setAddEditModalOpen(true);
    };

    const handleEditClick = (instance: RobotInstance) => {
        setInstanceToEdit(instance);
        setAddEditModalOpen(true);
    };

    return (
        <>
            <div className="p-4 animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-zinc-100">Gerenciador de Robôs</h1>
                    <button onClick={handleAddClick} className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded transition-colors">
                        + Adicionar Robô
                    </button>
                </div>

                {robotInstances.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {robotInstances.map(instance => (
                            <RobotInstanceCard
                                key={instance.id}
                                instance={instance}
                                onToggleStatus={onToggleStatus}
                                onEdit={handleEditClick}
                                onDelete={onDelete}
                                masterApiState={masterApiState}
                                subscriptionStatus={subscriptionStatus}
                            />
                        ))}
                    </div>
                ) : (
                     <div className="text-center text-zinc-500 py-24 border-2 border-dashed border-zinc-800 rounded-lg">
                        <p className="text-lg">Nenhum robô configurado.</p>
                        <p className="mt-2">Clique em "Adicionar Robô" para criar sua primeira instância.</p>
                    </div>
                )}
            </div>
            
            <AddEditRobotModal
                isOpen={isAddEditModalOpen}
                onClose={() => setAddEditModalOpen(false)}
                onSave={onSave}
                instanceToEdit={instanceToEdit}
                allSymbols={allSymbols}
            />
        </>
    );
};

export default RobotsView;
