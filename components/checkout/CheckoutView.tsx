import React, { useState, useEffect } from 'react';
import type { User } from '../../App';
import { getPlanPrice, createCreditCardPayment, createPixPayment, createBoletoPayment } from '../../lib/asaas';
import { ArrowLeftIcon } from '../icons/UIIcons';
import { CardIcon, PixIcon, BoletoIcon, AsaasIcon } from '../icons/BrandIcons';

interface CheckoutViewProps {
    user: User | null; // Null for new registration, User object for upgrade
    planToCheckout: User['plan'] | null;
    onPurchaseSuccess: (newPlan: User['plan']) => void;
    onRegistrationSuccess: () => void;
    onBack: () => void;
    initialData?: { name: string, email: string, doc: string } | null;
    isModal?: boolean;
}

const Spinner = ({ color = 'black' }: { color?: 'black' | 'white' }) => (
    <div className="flex items-center justify-center gap-2">
        <div className={`animate-spin rounded-full h-5 w-5 border-b-2 border-${color}`}></div>
        <span>Processando...</span>
    </div>
);

const CheckoutView: React.FC<CheckoutViewProps> = ({ user, planToCheckout, onPurchaseSuccess, onRegistrationSuccess, onBack, initialData, isModal = false }) => {
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix' | 'boleto'>('card');
    const isNewRegistration = !user && !!initialData;
    
    const [formData, setFormData] = useState({
        name: initialData?.name || user?.name || '',
        email: initialData?.email || user?.email || '',
        doc: initialData?.doc || user?.doc || '',
        phone: '(11) 98765-4321', // Mock phone
    });

    const [cardData, setCardData] = useState({
        number: '',
        name: '',
        expiry: '',
        cvv: '',
    });
    
    const [isLoading, setIsLoading] = useState(false);
    const [paymentResult, setPaymentResult] = useState<{ type: 'pix' | 'boleto', data: any } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const planPrice = getPlanPrice(planToCheckout);
    const planName = planToCheckout || 'Nenhum plano selecionado';

    useEffect(() => {
        // If user navigates here without a plan, redirect back
        if (!planToCheckout && !isModal) { // Don't redirect if it's a modal that might be opening
            onBack();
        }
    }, [planToCheckout, onBack, isModal]);

    // FIX: Define the missing handleCardChange function.
    const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCardData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setPaymentResult(null);

        try {
            if (paymentMethod === 'card') {
                await createCreditCardPayment(cardData, formData, planName);
                if (isNewRegistration) {
                    onRegistrationSuccess();
                } else {
                    onPurchaseSuccess(planName as User['plan']);
                }
            } else if (paymentMethod === 'pix') {
                const result = await createPixPayment(formData, planName);
                setPaymentResult({ type: 'pix', data: result });
            } else if (paymentMethod === 'boleto') {
                const result = await createBoletoPayment(formData, planName);
                setPaymentResult({ type: 'boleto', data: result });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Add toast feedback here in a real app
    };

    const renderPaymentResult = () => {
        if (!paymentResult) return null;

        if (paymentResult.type === 'pix') {
            return (
                <div className="bg-zinc-800/50 p-6 rounded-lg border border-green-700 text-center animate-fade-in-up">
                    <h3 className="text-xl font-bold text-green-400">Pagamento PIX Gerado</h3>
                    <p className="text-zinc-400 mt-2">Escaneie o QR Code abaixo com seu aplicativo do banco.</p>
                    <div className="flex justify-center my-4">
                        <img src={`data:image/png;base64,${paymentResult.data.qrCode}`} alt="PIX QR Code" className="bg-white p-2 rounded-lg" />
                    </div>
                    <p className="text-zinc-400 mb-2 text-sm">Ou use o PIX Copia e Cola:</p>
                    <div className="relative bg-zinc-900 p-2 rounded-md">
                        <input
                            readOnly
                            value={paymentResult.data.payload}
                            className="bg-transparent text-xs text-zinc-400 w-full pr-10 font-mono"
                        />
                        <button onClick={() => copyToClipboard(paymentResult.data.payload)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-amber-300" title="Copiar">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </button>
                    </div>
                     <p className="text-xs text-zinc-500 mt-4">Após o pagamento, a ativação do plano é automática.</p>
                </div>
            );
        }

        if (paymentResult.type === 'boleto') {
            return (
                 <div className="bg-zinc-800/50 p-6 rounded-lg border border-green-700 text-center animate-fade-in-up">
                    <h3 className="text-xl font-bold text-green-400">Boleto Gerado com Sucesso!</h3>
                    <p className="text-zinc-400 mt-2 mb-6">Clique no botão abaixo para visualizar e imprimir seu boleto. O plano será ativado após a compensação.</p>
                    <a 
                        href={paymentResult.data.bankSlipUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-3 rounded-lg transition-colors text-lg"
                    >
                        Visualizar Boleto
                    </a>
                </div>
            );
        }
        return null;
    }

    const content = (
         <div className={isModal ? "flex flex-col gap-8" : "grid grid-cols-1 lg:grid-cols-3 gap-8"}>
            {/* Order Summary */}
            <div className={isModal ? "" : "lg:col-span-1"}>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6 sticky top-8">
                    <h2 className="text-xl font-semibold mb-4 border-b border-zinc-800 pb-3">Resumo do Pedido</h2>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-300">Plano: <strong className="text-amber-300">{planName}</strong></span>
                        <span className="font-semibold">R$ {planPrice.toFixed(2)}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                         <div className="flex gap-2 text-sm">
                            <input placeholder="Cupom de desconto" className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" />
                            <button className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold px-4 rounded transition-colors">Aplicar</button>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between items-center font-bold text-lg">
                        <span>Total:</span>
                        <span>R$ {planPrice.toFixed(2)}</span>
                    </div>
                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
                        Pagamentos processados por <AsaasIcon />
                    </div>
                </div>
            </div>
            {/* Main Content */}
            <div className={isModal ? "" : "lg:col-span-2 space-y-6"}>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
                    <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-center gap-3">
                        <span className="text-amber-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></span>
                        <h2 className="text-xl font-semibold">1. Seus Dados</h2>
                    </div>
                    <div className="p-4 sm:p-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className="flex flex-col gap-1 text-sm"><span>Nome completo *</span><input name="name" value={formData.name} readOnly className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full text-zinc-400 cursor-not-allowed" /></label>
                            <label className="flex flex-col gap-1 text-sm"><span>E-mail *</span><input name="email" type="email" value={formData.email} readOnly className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full text-zinc-400 cursor-not-allowed" /></label>
                            <label className="flex flex-col gap-1 text-sm"><span>CPF / CNPJ *</span><input name="doc" value={formData.doc} readOnly className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full text-zinc-400 cursor-not-allowed" /></label>
                            <label className="flex flex-col gap-1 text-sm"><span>Telefone / WhatsApp *</span><input name="phone" value={formData.phone} readOnly className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full text-zinc-400 cursor-not-allowed" /></label>
                        </div>
                    </div>
                </div>

                 <div className="bg-zinc-900 border border-zinc-800 rounded-xl">
                    <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-center gap-3">
                        <span className="text-amber-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg></span>
                        <h2 className="text-xl font-semibold">2. Pagamento</h2>
                    </div>
                    <div className="p-4 sm:p-6">
                        {paymentResult ? renderPaymentResult() : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="flex bg-zinc-800/50 p-1 rounded-lg">
                                    <button type="button" onClick={() => setPaymentMethod('card')} className={`flex-1 p-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 ${paymentMethod === 'card' ? 'bg-amber-500 text-black' : 'text-zinc-300 hover:bg-zinc-700'}`}><CardIcon /> Cartão</button>
                                    <button type="button" onClick={() => setPaymentMethod('pix')} className={`flex-1 p-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 ${paymentMethod === 'pix' ? 'bg-amber-500 text-black' : 'text-zinc-300 hover:bg-zinc-700'}`}><PixIcon /> Pix</button>
                                    <button type="button" onClick={() => setPaymentMethod('boleto')} className={`flex-1 p-2 rounded-md font-semibold transition-colors flex items-center justify-center gap-2 ${paymentMethod === 'boleto' ? 'bg-amber-500 text-black' : 'text-zinc-300 hover:bg-zinc-700'}`}><BoletoIcon /> Boleto</button>
                                </div>

                                {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-3 py-2 rounded-lg text-sm">{error}</div>}
                                
                                {paymentMethod === 'card' && (
                                    <div className="space-y-4 animate-fade-in-up text-sm">
                                        <label className="flex flex-col gap-1"><span>Número do Cartão</span><input name="number" value={cardData.number} onChange={handleCardChange} className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full font-mono" placeholder="0000 0000 0000 0000" /></label>
                                        <label className="flex flex-col gap-1"><span>Nome no Cartão</span><input name="name" value={cardData.name} onChange={handleCardChange} className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full" /></label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <label className="flex flex-col gap-1"><span>Validade (MM/AA)</span><input name="expiry" value={cardData.expiry} onChange={handleCardChange} className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full font-mono" placeholder="MM/AA" /></label>
                                            <label className="flex flex-col gap-1"><span>CVV</span><input name="cvv" value={cardData.cvv} onChange={handleCardChange} className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full font-mono" placeholder="123" /></label>
                                        </div>
                                    </div>
                                )}
                                <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold p-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait h-12 text-lg" disabled={isLoading}>
                                    {isLoading ? <Spinner /> : `Pagar R$ ${planPrice.toFixed(2)}`}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
    
    if (isModal) {
        return content;
    }
    
    return (
        <div className="max-w-6xl mx-auto">
            {!isModal && (
                <button onClick={onBack} className="flex items-center gap-2 text-amber-400 hover:text-amber-500 mb-6">
                    <ArrowLeftIcon />
                    Voltar
                </button>
            )}
            {content}
        </div>
    );
};

export default CheckoutView;