import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { WhatsappIcon, PadlockOpenIcon, PadlockClosedIcon, ArrowLeftIcon, RefreshIcon } from '../icons/UIIcons';
import type { View } from '../../App';

type User = {
    id: number;
    name: string;
    email: string;
    plan: 'Básico' | 'Intermediário' | 'Top' | 'Teste';
    status: 'Ativo' | 'Inativo' | 'Pendente';
    joinDate: string;
    phone: string;
    paymentStatus: 'Pago' | 'Pendente' | 'Atrasado';
    razaoSocial: string;
    docType: 'CPF' | 'CNPJ';
    docNumber: string;
    address: string;
};

const mockUsers: User[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com', plan: 'Básico', status: 'Ativo', joinDate: '2023-10-26', phone: '5511987654321', paymentStatus: 'Pago', razaoSocial: 'Alice Web Services', docType: 'CNPJ', docNumber: '11.111.111/0001-11', address: 'Rua Exemplo, 123' },
    { id: 2, name: 'Bob', email: 'bob@example.com', plan: 'Intermediário', status: 'Ativo', joinDate: '2023-10-25', phone: '5521912345678', paymentStatus: 'Pago', razaoSocial: '', docType: 'CPF', docNumber: '222.222.222-22', address: 'Avenida Principal, 456' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', plan: 'Top', status: 'Inativo', joinDate: '2023-09-15', phone: '5531988887777', paymentStatus: 'Atrasado', razaoSocial: 'Charlie Investimentos', docType: 'CNPJ', docNumber: '33.333.333/0001-33', address: 'Praça Central, 789' },
    { id: 4, name: 'Diana', email: 'diana@example.com', plan: 'Intermediário', status: 'Pendente', joinDate: '2023-10-22', phone: '5541999998888', paymentStatus: 'Pendente', razaoSocial: 'Diana Imports', docType: 'CNPJ', docNumber: '44.444.444/0001-44', address: 'Alameda dos Anjos, 101' },
];

interface AdminProps {
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
    setActiveView: (view: View) => void;
}

const StatCard = ({ title, value }: { title: string, value: string | number }) => (
    <div className="bg-zinc-800/50 rounded-lg p-4">
        <h3 className="text-sm text-zinc-400 font-medium">{title}</h3>
        <p className="text-3xl font-bold mt-1 text-zinc-100">{value}</p>
    </div>
);

const PlanFeatureManager = () => {
    const [features, setFeatures] = useState({
        numRobos: { basico: 2, intermediario: 5, top: 'Ilimitado' },
        analiseIA: { basico: 'Limitada', intermediario: 'Completa', top: 'Completa' },
        backtesting: { basico: 'Básico', intermediario: 'Avançado', top: 'Avançado' },
        api: { basico: false, intermediario: false, top: true },
        otimizador: { basico: false, intermediario: false, top: true },
        especialista: { basico: false, intermediario: false, top: true },
    });

    const handleCheckboxChange = (feature: keyof typeof features, plan: 'basico' | 'intermediario' | 'top') => {
        // In a real app, this would be more complex
        if (typeof features[feature][plan] === 'boolean') {
             // @ts-ignore
            setFeatures(prev => ({...prev, [feature]: {...prev[feature], [plan]: !prev[feature][plan]}}))
        }
    }
    
    return (
        <div className="bg-zinc-900 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-amber-300 mb-4">Gerenciamento de Planos e Features</h2>
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-800 text-sm">
                    <thead className="bg-zinc-800/50">
                        <tr>
                            <th className="p-3 text-left font-medium text-zinc-400">Feature</th>
                            <th className="p-3 text-center font-medium text-zinc-400">Básico</th>
                            <th className="p-3 text-center font-medium text-zinc-400">Intermediário</th>
                            <th className="p-3 text-center font-medium text-zinc-400">Top</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {Object.entries(features).map(([key, value]) => (
                             <tr key={key} className="hover:bg-zinc-800 transition-colors">
                                <td className="p-3 font-semibold capitalize">{key.replace('num', 'Nº ')}</td>
                                {Object.entries(value).map(([plan, setting]) => (
                                    <td key={plan} className="p-3 text-center">
                                        {typeof setting === 'boolean' ? (
                                            <input type="checkbox" checked={setting} onChange={() => handleCheckboxChange(key as keyof typeof features, plan as any)} className="h-5 w-5 text-amber-500 bg-zinc-800 border-zinc-700 rounded focus:ring-amber-500" />
                                        ) : (
                                            <input type="text" defaultValue={setting} className="bg-zinc-700 border border-zinc-600 rounded p-1 w-24 text-center" />
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
             <div className="flex justify-end mt-4">
                 <button className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-4 rounded transition-colors">Salvar Alterações dos Planos</button>
            </div>
        </div>
    )
}

const Admin: React.FC<AdminProps> = ({ addToast, setActiveView }) => {
    const [users, setUsers] = useState<User[]>(mockUsers);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [editableUser, setEditableUser] = useState<User | null>(null);
    const [isUserFormLocked, setIsUserFormLocked] = useState(true);

    const handleStatusChange = (userId: number) => {
        setUsers(users.map(u => {
            if (u.id === userId) {
                const statuses: User['status'][] = ['Ativo', 'Inativo', 'Pendente'];
                const currentIndex = statuses.indexOf(u.status);
                const nextIndex = (currentIndex + 1) % statuses.length;
                return { ...u, status: statuses[nextIndex] };
            }
            return u;
        }));
        addToast('Status do usuário alterado.', 'info');
    };

    const handleOpenUserDetails = (user: User) => {
        setSelectedUser(user);
        setEditableUser({ ...user });
        setIsUserFormLocked(true);
    };

    const handleSaveUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editableUser) return;
        setUsers(users.map(u => u.id === editableUser.id ? editableUser : u));
        addToast(`Dados de ${editableUser.name} salvos com sucesso!`, 'success');
        setSelectedUser(null);
        setEditableUser(null);
    };
    
    const handleResetPassword = () => {
        if (!editableUser) return;
        const isConfirmed = window.confirm(
            `Tem certeza que deseja resetar a senha de ${editableUser.name}? A nova senha padrão será "RS123".`
        );
        if (isConfirmed) {
            // In a real app, this would make an API call to the backend.
            // Here we just simulate the success feedback.
            addToast(
                `Senha de ${editableUser.name} resetada para "RS123". Lembre-se de comunicar o usuário.`,
                'success'
            );
        }
    };

    const getStatusBadge = (status: User['status']) => {
        switch(status) {
            case 'Ativo': return 'bg-green-500/20 text-green-400';
            case 'Inativo': return 'bg-red-500/20 text-red-400';
            case 'Pendente': return 'bg-yellow-500/20 text-yellow-400';
        }
    };
    
    return (
        <div className="p-4 space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-zinc-100">Painel Administrativo</h1>
                <button 
                    onClick={() => setActiveView('analysis')} 
                    className="flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                    <ArrowLeftIcon />
                    Voltar para Análise
                </button>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total de Usuários" value={users.length} />
                <StatCard title="Usuários Ativos" value={users.filter(u => u.status === 'Ativo').length} />
                <StatCard title="Receita Mensal (MRR)" value="R$ 796" />
                <StatCard title="Novos Usuários (Mês)" value="3" />
            </div>

            <div className="bg-zinc-900 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-amber-300 mb-4">Configurações de Checkout</h2>
                <div className="grid grid-cols-1 gap-4 items-end">
                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-zinc-300">Chave API do Mercado Pago</span>
                         <input 
                            type="text"
                            readOnly
                            value="******************** (Configurada no Backend)"
                            className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full text-zinc-500 font-mono cursor-not-allowed"
                        />
                         <p className="text-xs text-zinc-500 mt-1">
                            A chave API do Mercado Pago é uma credencial sensível e deve ser configurada exclusivamente nas variáveis de ambiente do servidor backend por segurança.
                        </p>
                    </label>
                </div>
            </div>
            
            <PlanFeatureManager />

            <div className="bg-zinc-900 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-amber-300 mb-4">Gerenciamento de Usuários</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-800 text-sm">
                        <thead className="bg-zinc-800/50">
                            <tr>
                                <th className="p-3 text-left font-medium text-zinc-400">Nome</th>
                                <th className="p-3 text-left font-medium text-zinc-400">Email</th>
                                <th className="p-3 text-left font-medium text-zinc-400">Plano</th>
                                <th className="p-3 text-left font-medium text-zinc-400">Status</th>
                                <th className="p-3 text-left font-medium text-zinc-400">Data de Cadastro</th>
                                <th className="p-3 text-left font-medium text-zinc-400">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-zinc-800 transition-colors">
                                    <td className="p-3">{user.name}</td>
                                    <td className="p-3">{user.email}</td>
                                    <td className="p-3">{user.plan}</td>
                                    <td className="p-3">
                                        <button onClick={() => handleStatusChange(user.id)} className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(user.status)} transition-transform hover:scale-105`} title="Clique para alterar">
                                            {user.status}
                                        </button>
                                    </td>
                                    <td className="p-3">{user.joinDate}</td>
                                    <td className="p-3 flex items-center gap-4">
                                        <button onClick={() => handleOpenUserDetails(user)} className="text-amber-400 hover:text-amber-500 hover:underline">Detalhes</button>
                                        <a href={`https://wa.me/${user.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-500" title="Contatar no WhatsApp">
                                            <WhatsappIcon />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Modal isOpen={!!selectedUser && !!editableUser} onClose={() => setSelectedUser(null)} title={`Detalhes de ${selectedUser?.name}`}>
                {editableUser && (
                    <form onSubmit={handleSaveUser}>
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-700">
                            <h4 className="font-semibold text-zinc-300">Dados do Usuário</h4>
                            <button type="button" onClick={() => setIsUserFormLocked(!isUserFormLocked)} className="p-2 rounded-full hover:bg-zinc-700 transition-colors text-zinc-400" title={isUserFormLocked ? 'Destravar para editar' : 'Travar edição'}>
                                {isUserFormLocked ? <PadlockClosedIcon /> : <PadlockOpenIcon />}
                            </button>
                        </div>

                        <div className="space-y-4 text-sm max-h-[50vh] overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="flex flex-col gap-1"><span>Nome</span><input name="name" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:opacity-50" value={editableUser.name} onChange={e => setEditableUser({...editableUser, name: e.target.value})} disabled={isUserFormLocked} /></label>
                                <label className="flex flex-col gap-1"><span>Email</span><input name="email" type="email" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:opacity-50" value={editableUser.email} onChange={e => setEditableUser({...editableUser, email: e.target.value})} disabled={isUserFormLocked} /></label>
                                <label className="flex flex-col gap-1"><span>Telefone</span><input name="phone" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:opacity-50" value={editableUser.phone} onChange={e => setEditableUser({...editableUser, phone: e.target.value})} disabled={isUserFormLocked} /></label>
                                <label className="flex flex-col gap-1"><span>Plano</span>
                                    <select name="plan" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:opacity-50" value={editableUser.plan} onChange={e => setEditableUser({...editableUser, plan: e.target.value as User['plan']})} disabled={isUserFormLocked}>
                                        <option>Básico</option><option>Intermediário</option><option>Top</option><option>Teste</option>
                                    </select>
                                </label>
                                <label className="flex flex-col gap-1"><span>Razão Social</span><input name="razaoSocial" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:opacity-50" value={editableUser.razaoSocial} onChange={e => setEditableUser({...editableUser, razaoSocial: e.target.value})} disabled={isUserFormLocked} /></label>
                                <div className="grid grid-cols-3 gap-2">
                                     <label className="flex flex-col gap-1 col-span-1"><span>Tipo Doc.</span>
                                        <select name="docType" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:opacity-50" value={editableUser.docType} onChange={e => setEditableUser({...editableUser, docType: e.target.value as User['docType']})} disabled={isUserFormLocked}>
                                            <option>CPF</option><option>CNPJ</option>
                                        </select>
                                    </label>
                                    <label className="flex flex-col gap-1 col-span-2"><span>{editableUser.docType}</span><input name="docNumber" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:opacity-50" value={editableUser.docNumber} onChange={e => setEditableUser({...editableUser, docNumber: e.target.value})} disabled={isUserFormLocked} /></label>
                                </div>
                                <label className="md:col-span-2 flex flex-col gap-1"><span>Endereço</span><input name="address" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:opacity-50" value={editableUser.address} onChange={e => setEditableUser({...editableUser, address: e.target.value})} disabled={isUserFormLocked} /></label>
                            </div>
                            <div className="pt-4 mt-4 border-t border-zinc-700">
                                <h4 className="font-semibold text-zinc-300 mb-2">Status Financeiro e da Conta</h4>
                                <div className="grid grid-cols-2 gap-4">
                                     <label className="flex flex-col gap-1"><span>Status da Conta</span>
                                        <select name="status" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:opacity-50" value={editableUser.status} onChange={e => setEditableUser({...editableUser, status: e.target.value as User['status']})} disabled={isUserFormLocked}>
                                            <option>Ativo</option><option>Inativo</option><option>Pendente</option>
                                        </select>
                                    </label>
                                     <label className="flex flex-col gap-1"><span>Status do Pagamento</span>
                                        <select name="paymentStatus" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full disabled:opacity-50" value={editableUser.paymentStatus} onChange={e => setEditableUser({...editableUser, paymentStatus: e.target.value as User['paymentStatus']})} disabled={isUserFormLocked}>
                                            <option>Pago</option><option>Pendente</option><option>Atrasado</option>
                                        </select>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-4 mt-4 border-t border-zinc-700 gap-3">
                            <div>
                                <button
                                    type="button"
                                    onClick={handleResetPassword}
                                    disabled={isUserFormLocked}
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RefreshIcon className="h-4 w-4" />
                                    Resetar Senha
                                </button>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setSelectedUser(null)} className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-4 rounded transition-colors">Cancelar</button>
                                <button type="submit" disabled={isUserFormLocked} className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Salvar Alterações</button>
                            </div>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default Admin;