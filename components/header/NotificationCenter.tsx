import React, { useState, useEffect, useRef } from 'react';
import type { Notification } from '../../App';
import { BellIcon } from '../icons/UIIcons';

interface NotificationCenterProps {
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, setNotifications }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen) { // If opening, mark all as read
            setTimeout(() => {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            }, 1000); // Delay marking as read for a better UX
        }
    };

    const handleClearAll = () => {
        setNotifications([]);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const getTypeIcon = (type: Notification['type']) => {
        switch(type) {
            case 'order': return <span className="text-green-400">📈</span>;
            case 'veto': return <span className="text-yellow-400">⚠️</span>;
            default: return <span className="text-blue-400">ℹ️</span>;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={handleToggle} 
                className="p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-amber-300 relative" 
                title="Notificações"
            >
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                     <span className="absolute top-1 right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 ring-2 ring-zinc-900"></span>
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="absolute top-0 left-full ml-2 w-80 bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl z-50 animate-fade-in-up">
                    <div className="flex justify-between items-center p-3 border-b border-zinc-700">
                        <h4 className="font-semibold text-zinc-200">Notificações</h4>
                        {notifications.length > 0 && (
                             <button onClick={handleClearAll} className="text-xs text-zinc-400 hover:text-amber-300 hover:underline">Limpar Tudo</button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(n => (
                                <div key={n.id} className="p-3 border-b border-zinc-700/50 last:border-b-0 hover:bg-zinc-700/50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">{getTypeIcon(n.type)}</div>
                                        <div>
                                            <p className="text-sm text-zinc-200">{n.message}</p>
                                            <p className="text-xs text-zinc-500 mt-1">{new Date(n.timestamp).toLocaleString('pt-BR')}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-zinc-500 p-8">
                                <p>Nenhuma notificação nova.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
