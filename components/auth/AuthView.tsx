import React, { useState } from 'react';
import Modal from '../Modal';
import type { User } from '../../App';
import { verifyBinanceAccount } from '../../lib/api';

type RegistrationData = { name: string, email: string, doc: string, apiKey: string, apiSecret: string, plan: User['plan'], password?: string };

interface AuthViewProps {
  onLogin: (credentials: { email: string; password?: string }) => void;
  onRegister: (data: RegistrationData) => Promise<{ success: boolean; message?: string }>;
  onProceedToPayment: (data: RegistrationData) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const Spinner = () => (
    <div className="flex items-center justify-center gap-2">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
        <span>Processando...</span>
    </div>
);


const AuthView: React.FC<AuthViewProps> = ({ onLogin, onRegister, onProceedToPayment, addToast }) => {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    
    // Login State
    const [loginEmail, setLoginEmail] = useState('rsprolipsioficial@gmail.com');
    const [loginPassword, setLoginPassword] = useState('admin123');
    
    // Register State
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regDoc, setRegDoc] = useState('');
    const [regReferrer, setRegReferrer] = useState('');
    const [regApiKey, setRegApiKey] = useState('');
    const [regApiSecret, setRegApiSecret] = useState('');
    const [regPlan, setRegPlan] = useState<User['plan']>('Pro');
    const [hasBinanceAccount, setHasBinanceAccount] = useState<'yes' | 'no' | null>(null);


    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Forgot Password State
    const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

    const planOptions: User['plan'][] = ['Teste Grátis', 'Starter', 'Pro', 'Expert', 'Trader', 'Enterprise'];


    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!loginEmail || !loginPassword) {
            setError("Por favor, preencha o email e a senha.");
            return;
        }
        onLogin({ email: loginEmail, password: loginPassword });
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (hasBinanceAccount !== 'yes') {
             setError("Por favor, confirme que você possui uma conta Binance para continuar.");
             return;
        }
        if (!regName || !regEmail || !regPassword || !regDoc || !regApiKey || !regApiSecret) {
            setError("Todos os campos, exceto indicação, são obrigatórios.");
            return;
        }
        setIsLoading(true);
        setError(null);
        
        try {
            // Step 1: Validate Binance account for ALL registrations
            const validation = await verifyBinanceAccount(regApiKey, regDoc);
            if (!validation.isValid) {
                const reason = validation.reason || 'Falha na validação da conta Binance.';
                addToast(reason, 'error');
                setError(reason);
                setIsLoading(false);
                return;
            }

            const registrationData = {
                name: regName,
                email: regEmail,
                password: regPassword,
                doc: regDoc,
                apiKey: regApiKey,
                apiSecret: regApiSecret,
                plan: regPlan,
            };

            // Step 2: Decide flow based on plan
            if (regPlan === 'Teste Grátis') {
                const result = await onRegister(registrationData);
                if (!result.success) {
                    setError(result.message || 'Falha no registro.');
                }
            } else {
                onProceedToPayment(registrationData);
                // The view will change, no need to stop loading spinner here.
                return; // Exit to avoid setting loading to false
            }
        
        } catch (e) {
            const message = e instanceof Error ? e.message : "Ocorreu um erro desconhecido.";
            addToast(message, 'error');
            setError(message);
        }

        setIsLoading(false);
    };

    const handleForgotPasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!forgotPasswordEmail) return;
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            addToast(`Instruções de recuperação foram enviadas para ${forgotPasswordEmail}.`, 'success');
            setIsForgotPasswordModalOpen(false);
            setForgotPasswordEmail('');
            setIsLoading(false);
        }, 1500);
    };

    const isPaidPlan = regPlan !== 'Teste Grátis';
    const submitButtonText = isPaidPlan ? 'Ir para Pagamento' : 'Criar Conta e Validar';

    return (
        <>
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-200 p-4">
                <div className="w-full max-w-md p-6 sm:p-8 bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 animate-fade-in-up">
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold text-amber-300">Robô Kagi + Fibo</h1>
                        <p className="mt-2 text-zinc-400">Acesse sua conta ou registre-se para começar.</p>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex bg-zinc-800/50 p-1 rounded-lg mb-6">
                        <button onClick={() => { setActiveTab('login'); setError(null); }} className={`flex-1 p-2 rounded-md font-semibold transition-colors ${activeTab === 'login' ? 'bg-amber-500 text-black' : 'text-zinc-300 hover:bg-zinc-700'}`}>Login</button>
                        <button onClick={() => { setActiveTab('register'); setError(null); }} className={`flex-1 p-2 rounded-md font-semibold transition-colors ${activeTab === 'register' ? 'bg-amber-500 text-black' : 'text-zinc-300 hover:bg-zinc-700'}`}>Registrar-se</button>
                    </div>

                    {error && (
                        <div className="bg-red-900/50 border border-red-700 text-red-200 px-3 py-2 rounded-lg text-sm mb-4 text-center">
                            {error}
                        </div>
                    )}
                    
                    {activeTab === 'login' ? (
                        <form onSubmit={handleLoginSubmit} className="space-y-6">
                            <label className="flex flex-col gap-1">
                                <span className="text-zinc-400">Email</span>
                                <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="seuemail@exemplo.com" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" />
                            </label>
                            <label className="flex flex-col gap-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-400">Senha</span>
                                     <button 
                                        type="button" 
                                        onClick={() => setIsForgotPasswordModalOpen(true)}
                                        className="text-xs text-amber-400 hover:text-amber-500 hover:underline"
                                    >
                                        Esqueci minha senha
                                    </button>
                                </div>
                                <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="********" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" />
                            </label>
                            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold p-3 rounded transition-colors">Entrar</button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegisterSubmit} className="space-y-4 text-sm">
                            <label className="flex flex-col gap-1"><span>Nome Completo</span><input value={regName} onChange={e => setRegName(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" /></label>
                            <label className="flex flex-col gap-1"><span>Email</span><input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" /></label>
                            <label className="flex flex-col gap-1"><span>Senha</span><input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" /></label>
                            <label className="flex flex-col gap-1">
                                <span>Plano de Assinatura</span>
                                <select 
                                    value={regPlan} 
                                    onChange={e => setRegPlan(e.target.value as User['plan'])} 
                                    className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full"
                                >
                                    {planOptions.map(plan => (
                                        <option key={plan} value={plan}>{plan}{plan === 'Pro' ? ' (Mais Popular)' : ''}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col gap-1"><span>CPF / CNPJ (deve ser o mesmo da conta Binance)</span><input value={regDoc} onChange={e => setRegDoc(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" placeholder="12.345.678/0001-90" /></label>
                            <label className="flex flex-col gap-1"><span>Nome de usuário de quem indicou (Opcional)</span><input value={regReferrer} onChange={e => setRegReferrer(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" /></label>
                            
                            <div className="pt-4 mt-2 border-t border-zinc-700 space-y-3">
                                <span className="text-zinc-300 font-semibold">Você já tem uma conta na Binance? *</span>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="hasBinanceAccount" value="yes" checked={hasBinanceAccount === 'yes'} onChange={() => setHasBinanceAccount('yes')} className="h-4 w-4 text-amber-500 bg-zinc-800 border-zinc-600 focus:ring-amber-500 focus:ring-offset-zinc-900" />
                                        <span>Sim, já tenho</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="hasBinanceAccount" value="no" checked={hasBinanceAccount === 'no'} onChange={() => setHasBinanceAccount('no')} className="h-4 w-4 text-amber-500 bg-zinc-800 border-zinc-600 focus:ring-amber-500 focus:ring-offset-zinc-900" />
                                        <span>Não, preciso criar</span>
                                    </label>
                                </div>
                            </div>

                            {hasBinanceAccount === 'no' && (
                                <div className="bg-blue-900/30 border border-blue-700 text-blue-200 p-4 rounded-lg text-sm text-center animate-fade-in-up">
                                    <p className="font-semibold">Crie sua conta na Binance primeiro.</p>
                                    <p className="mt-2 text-xs">É necessário ter uma conta para usar a plataforma. Use o link abaixo para se cadastrar.</p>
                                    <a href="https://www.binance.com/referral/earn-together/refer2earn-usdc/claim?hl=pt&ref=GRO_28502_H6DL9&utm_source=default&utm_medium=web_share_copy" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-4 rounded transition-colors">
                                        Criar Conta na Binance
                                    </a>
                                    <p className="mt-3 text-xs text-zinc-400">Após criar sua conta, volte aqui, selecione "Sim" e continue o cadastro.</p>
                                </div>
                            )}

                            {hasBinanceAccount === 'yes' && (
                                <div className="pt-2 space-y-4 animate-fade-in-up">
                                    <p className="text-xs text-zinc-400">
                                        Ótimo! Agora, forneça sua chave de API da Binance para validação. O sistema irá verificar se o CPF/CNPJ da conta corresponde ao seu cadastro.
                                    </p>
                                    <label className="flex flex-col gap-1">
                                        <span className="text-zinc-400">Binance API Key</span>
                                        <input value={regApiKey} onChange={e => setRegApiKey(e.target.value)} placeholder="Sua chave de API da Binance" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full font-mono"/>
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="text-zinc-400">Binance API Secret</span>
                                        <input type="password" value={regApiSecret} onChange={e => setRegApiSecret(e.target.value)} placeholder="Seu segredo de API (permanecerá oculto)" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full font-mono"/>
                                    </label>
                                </div>
                            )}

                            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold p-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-12 flex items-center justify-center" disabled={isLoading || hasBinanceAccount !== 'yes'}>
                                {isLoading ? <Spinner /> : submitButtonText}
                            </button>
                        </form>
                    )}
                </div>
            </div>
            
            <Modal isOpen={isForgotPasswordModalOpen} onClose={() => setIsForgotPasswordModalOpen(false)} title="Recuperação de Senha">
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                    <p className="text-sm text-zinc-400">
                        Digite seu email de cadastro. Enviaremos um link para você resetar sua senha. Se preferir, contate o administrador para resetar sua senha para o padrão "RS123".
                    </p>
                    <label className="flex flex-col gap-1">
                        <span className="text-zinc-400">Email</span>
                        <input 
                            type="email" 
                            value={forgotPasswordEmail} 
                            onChange={e => setForgotPasswordEmail(e.target.value)} 
                            placeholder="seuemail@exemplo.com" 
                            className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" 
                            required 
                        />
                    </label>
                    <div className="flex justify-end pt-4 mt-4 border-t border-zinc-700">
                        <button 
                            type="submit" 
                            className="w-48 h-10 bg-amber-500 hover:bg-amber-600 text-black font-bold p-2 rounded transition-colors disabled:opacity-50 disabled:cursor-wait"
                            disabled={isLoading}
                        >
                             {isLoading ? <Spinner /> : 'Enviar Link'}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default AuthView;