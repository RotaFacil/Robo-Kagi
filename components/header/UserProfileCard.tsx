import React from 'react';
import type { User, View } from '../../App';
import { UserIcon } from '../icons/UIIcons';

interface UserProfileCardProps {
    user: User | null;
    profilePhoto: string | null;
    setActiveView: (view: View) => void;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ user, profilePhoto, setActiveView }) => {
    if (!user) return null;

    return (
        <button 
            onClick={() => setActiveView('profile')} 
            className="flex items-center gap-3 text-left p-2 rounded-lg hover:bg-zinc-800 transition-colors group"
            title="Ver Perfil e Assinatura"
        >
             <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 overflow-hidden border-2 border-zinc-600 group-hover:border-amber-500/50 transition-colors">
                {profilePhoto ? (
                    <img src={profilePhoto} alt="Foto do Perfil" className="w-full h-full object-cover" />
                ) : (
                    <UserIcon className="w-8 h-8 text-zinc-500" />
                )}
            </div>
            <div className="flex flex-col">
                <h1 className="font-bold text-md md:text-lg text-amber-300 leading-tight">Robô Kagi + Fibo</h1>
                <p className="text-sm text-zinc-400 leading-tight">{user.name}</p>
                <div className="mt-1 hidden sm:flex items-center gap-1.5 text-xs text-purple-400 group-hover:text-purple-300 font-semibold transition-colors">
                    <span>Plano: {user.plan} (Upgrade)</span>
                </div>
            </div>
        </button>
    );
};

export default UserProfileCard;