import React, { useState } from 'react';
import ControlPanel from './ControlPanel';
import SettingsPanel from './SettingsPanel';
import { ChevronUpIcon, ChevronDownIcon } from './icons/UIIcons';
import type { View, VisibleComponents, User, Notification, MasterApiState, SubscriptionStatus } from '../App';
import VerticalSidebar from './VerticalSidebar';

interface LayoutProps {
    children: React.ReactNode;
    user: User | null;
    profilePhoto: string | null;
    wsStatus: 'connecting' | 'connected' | 'disconnected';
    isAiPanelVisible: boolean;
    setAiPanelVisible: (visible: boolean) => void;
    activeView: View;
    setActiveView: (view: View) => void;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
    visibleComponents: VisibleComponents;
    setVisibleComponents: React.Dispatch<React.SetStateAction<VisibleComponents>>;
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    handleLogout: () => void;
    masterApiState: MasterApiState;
    setMasterApiState: (newState: MasterApiState) => Promise<void>; // Updated to reflect it's now a Promise
    subscriptionStatus: SubscriptionStatus;
}

const Layout: React.FC<LayoutProps> = (props) => {
    const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
    const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    
    return (
        <div className="flex h-screen overflow-hidden">
            <VerticalSidebar
                user={props.user}
                notifications={props.notifications}
                setNotifications={props.setNotifications}
                onOpenConfigModal={() => setIsConfigModalOpen(true)}
                onOpenLayoutSettings={() => setIsSettingsPanelOpen(true)}
                setActiveView={props.setActiveView}
                handleLogout={props.handleLogout}
            />
            <div className="flex flex-col flex-grow min-w-0">
                <header className={`bg-zinc-900 border-b border-zinc-800 shadow-md z-20 transition-all duration-300 relative ${isHeaderCollapsed ? 'py-0 h-8' : 'h-auto lg:h-24 py-2 lg:py-0'}`}>
                    <div className={`transition-opacity duration-300 h-full ${isHeaderCollapsed ? 'opacity-0 h-0 invisible' : 'opacity-100'}`}>
                        <ControlPanel 
                            {...props} 
                            isConfigModalOpen={isConfigModalOpen}
                            setIsConfigModalOpen={setIsConfigModalOpen}
                        />
                    </div>
                    <div 
                        onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-12 h-4 bg-zinc-800 hover:bg-amber-500 rounded-b-md cursor-pointer flex justify-center items-center"
                        title={isHeaderCollapsed ? "Expandir Header" : "Minimizar Header"}
                    >
                        {isHeaderCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
                    </div>
                </header>
                
                <main className="flex-grow overflow-auto min-h-0 bg-zinc-950">
                    {props.children}
                </main>
            </div>
            
            <SettingsPanel 
                isOpen={isSettingsPanelOpen} 
                onClose={() => setIsSettingsPanelOpen(false)}
                visibleComponents={props.visibleComponents}
                setVisibleComponents={props.setVisibleComponents}
            />
        </div>
    );
};

export default Layout;