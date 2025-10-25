import React, { useState } from 'react';
import type { User, View } from '../../App';
import Modal from '../Modal';
import SubscriptionTiers from './SubscriptionTiers';
import { ArrowLeftIcon } from '../icons/UIIcons';

interface ProfileProps {
    user: User;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
    profilePhoto: string | null;
    setProfilePhoto: (photo: string | null) => void;
    setActiveView: (view: View) => void;
    navigateToCheckout: (plan: User['plan']) => void;
}


const Profile: React.FC<ProfileProps> = ({ user, addToast, profilePhoto, setProfilePhoto, setActiveView, navigateToCheckout }) => {
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isManagingPayment, setIsManagingPayment] = useState(false);
    
    const [profileData, setProfileData] = useState({
        name: user.name,
        docType: 'CNPJ' as 'CPF' | 'CNPJ',
        docNumber: '12.345.678/0001-90',
        dob: '1990-01-15',
        razaoSocial: 'Empresa Exemplo LTDA',
        telefone: '(11) 98765-4321',
        address: 'Rua das Flores, Apto 45 - São Paulo, SP',
        number: '123',
        cep: '01234-567'
    });


    if (!user) return null;

    const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    setProfilePhoto(e.target.result as string);
                    addToast('Foto do perfil atualizada!', 'success');
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSaveProfile = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setProfileData({
            name: formData.get('name') as string,
            dob: formData.get('dob') as string,
            razaoSocial: formData.get('razaoSocial') as string,
            telefone: formData.get('telefone') as string,
            cep: formData.get('cep') as string,
            address: formData.get('address') as string,
            number: formData.get('number') as string,
            docType: formData.get('docType') as 'CPF' | 'CNPJ',
            docNumber: formData.get('docNumber') as string,
        });
        addToast('Dados cadastrais salvos com sucesso!', 'success');
        setIsEditingProfile(false);
    };

    return (
        <div className="p-4 space-y-8 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-zinc-100">Perfil e Assinatura</h1>
                <button 
                    onClick={() => setActiveView('analysis')} 
                    className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                    <ArrowLeftIcon />
                    Voltar para Análise
                </button>
            </div>

            {/* User Details */}
            <div className="bg-zinc-900 rounded-lg p-6">
                <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-zinc-700 border-2 border-zinc-600 flex items-center justify-center overflow-hidden">
                            {profilePhoto ? (
                                <img src={profilePhoto} alt="Foto do Perfil" className="w-full h-full object-cover" />
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            )}
                        </div>
                        <label htmlFor="photo-upload" className="absolute -bottom-1 -right-1 bg-amber-500 hover:bg-amber-600 p-2 rounded-full cursor-pointer transition-transform hover:scale-110" title="Trocar foto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                        </label>
                    </div>
                     <div>
                        <h2 className="text-lg font-semibold text-amber-300">Dados Cadastrais</h2>
                        <p className="text-sm text-zinc-400">Gerencie suas informações pessoais e de assinatura.</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <div><strong className="text-zinc-400 block">ID do Usuário:</strong> {user.id}</div>
                    <div><strong className="text-zinc-400 block">Razão Social:</strong> {profileData.razaoSocial}</div>
                    <div><strong className="text-zinc-400 block">Nome Completo:</strong> {profileData.name}</div>
                    <div><strong className="text-zinc-400 block">{profileData.docType}:</strong> {profileData.docNumber}</div>
                    <div><strong className="text-zinc-400 block">Data de Nascimento:</strong> {new Date(profileData.dob + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                    <div><strong className="text-zinc-400 block">Telefone:</strong> {profileData.telefone}</div>
                    <div><strong className="text-zinc-400 block">Email:</strong> {user.email}</div>
                    <div><strong className="text-zinc-400 block">Endereço:</strong> {`${profileData.address}, ${profileData.number}`}</div>
                    <div><strong className="text-zinc-400 block">CEP:</strong> {profileData.cep}</div>
                </div>
                 <div className="flex justify-end mt-6">
                    <button onClick={() => setIsEditingProfile(true)} className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-4 rounded">Editar Dados</button>
                </div>
            </div>

            <SubscriptionTiers 
                currentPlan={user.plan}
                onUpgradeClick={navigateToCheckout}
            />

            {/* Payment Details */}
            <div className="bg-zinc-900 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-amber-300 mb-4">Dados de Pagamento</h2>
                <div className="flex items-center gap-4">
                    <img src="https://img.icons8.com/color/48/000000/mastercard-logo.png" alt="Mastercard" className="bg-white p-1 rounded"/>
                    <div>
                        <p className="font-semibold">Mastercard terminando em 1234</p>
                        <p className="text-zinc-400 text-sm">Expira em 12/2026</p>
                    </div>
                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={() => addToast('Funcionalidade em desenvolvimento.', 'info')} className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-4 rounded">Gerenciar Pagamento</button>
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={isEditingProfile} onClose={() => setIsEditingProfile(false)} title="Editar Dados Cadastrais">
                <form onSubmit={handleSaveProfile} className="space-y-4 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex flex-col gap-1"><span>Nome Completo</span><input name="name" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" defaultValue={profileData.name} /></label>
                        <label className="flex flex-col gap-1"><span>Data de Nascimento</span><input name="dob" type="date" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" defaultValue={profileData.dob} /></label>
                        <label className="flex flex-col gap-1"><span>Razão Social</span><input name="razaoSocial" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" defaultValue={profileData.razaoSocial} /></label>
                        
                        <div className="grid grid-cols-3 gap-2">
                            <label className="flex flex-col gap-1 col-span-1"><span>Tipo Doc.</span>
                                <select name="docType" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" defaultValue={profileData.docType}>
                                    <option>CPF</option>
                                    <option>CNPJ</option>
                                </select>
                            </label>
                            <label className="flex flex-col gap-1 col-span-2"><span>CPF/CNPJ</span><input name="docNumber" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" defaultValue={profileData.docNumber} /></label>
                        </div>
                        
                        <label className="flex flex-col gap-1"><span>Telefone</span><input name="telefone" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" defaultValue={profileData.telefone} /></label>
                        <label className="flex flex-col gap-1"><span>CEP</span><input name="cep" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" defaultValue={profileData.cep} /></label>
                    </div>
                     <div className="grid grid-cols-3 gap-2">
                        <label className="flex flex-col gap-1 col-span-2"><span>Endereço</span><input name="address" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" defaultValue={profileData.address} /></label>
                        <label className="flex flex-col gap-1"><span>Número</span><input name="number" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" defaultValue={profileData.number} /></label>
                    </div>
                     <div className="flex justify-end pt-2"><button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded transition-colors">Salvar Alterações</button></div>
                </form>
            </Modal>
        </div>
    );
};

export default Profile;