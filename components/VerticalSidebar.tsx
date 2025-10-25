import React from 'react';
import type { View, User, Notification } from '../../App';
import { SettingsIcon, UserIcon, AdminIcon, ConfigIcon, BotIcon, LogoutIcon } from './icons/UIIcons';
import NotificationCenter from './header/NotificationCenter';

interface VerticalSidebarProps {
    user: User | null;
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    onOpenConfigModal: () => void;
    onOpenLayoutSettings: () => void;
    setActiveView: (view: View) => void; 
    handleLogout: () => void;
}

interface SidebarButtonProps {
    onClick: () => void;
    title: string;
    children: React.ReactNode;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({ onClick, title, children }) => (
    <button 
        onClick={onClick} 
        className="p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-amber-300" 
        title={title}
    >
        {children}
    </button>
);

const VerticalSidebar: React.FC<VerticalSidebarProps> = ({
    user,
    notifications,
    setNotifications,
    onOpenConfigModal,
    onOpenLayoutSettings,
    setActiveView,
    handleLogout,
}) => {
    return (
        <aside className="w-20 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center justify-between py-4 gap-4 shrink-0">
            <div className="flex flex-col items-center gap-4">
                <div className="text-amber-400" title="Robô Kagi + Fibo">
                    <BotIcon className="h-8 w-8" />
                </div>
                
                <div className="flex flex-col gap-4 mt-8">
                    <NotificationCenter notifications={notifications} setNotifications={setNotifications} />
                    <SidebarButton onClick={onOpenConfigModal} title="Configurações Globais">
                        <ConfigIcon />
                    </SidebarButton>
                    <SidebarButton onClick={onOpenLayoutSettings} title="Configurações de Layout">
                        <SettingsIcon />
                    </SidebarButton>
                    <SidebarButton onClick={() => setActiveView('profile')} title="Perfil e Assinatura">
                        <UserIcon />
                    </SidebarButton>
                    {user?.isAdmin && (
                        <SidebarButton onClick={() => setActiveView('admin')} title="Painel Admin">
                            <AdminIcon />
                        </SidebarButton>
                    )}
                </div>
            </div>
            
            <div className="flex flex-col gap-4">
                <SidebarButton onClick={handleLogout} title="Sair (Logout)">
                    <LogoutIcon />
                </SidebarButton>
            </div>
        </aside>
    );
};

export default VerticalSidebar;