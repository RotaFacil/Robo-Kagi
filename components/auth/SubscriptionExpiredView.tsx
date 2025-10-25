
import React from 'react';

const SubscriptionExpiredView: React.FC = () => {
    // In a real app, this button would trigger a payment modal or redirect to a billing page.
    const handleRenew = () => {
        alert("Redirecionando para a página de renovação de assinatura...");
        // Example: window.location.href = '/billing';
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-200 p-4">
            <div className="w-full max-w-lg p-8 text-center bg-zinc-900 rounded-2xl shadow-2xl border border-red-700/50 animate-fade-in-up">
                <div className="text-5xl mb-4">🚫</div>
                <h1 className="text-3xl font-bold text-red-400">Acesso Bloqueado</h1>
                <p className="mt-4 text-zinc-400">
                    Sua assinatura expirou e o período de tolerância terminou. Para sua segurança, todos os robôs foram parados.
                </p>
                <p className="mt-2 text-zinc-400">
                    Para reativar seus robôs e continuar usando a plataforma, por favor, renove seu plano.
                </p>
                <div className="mt-8">
                    <button 
                        onClick={handleRenew}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-3 rounded-lg transition-colors text-lg shadow-md hover:shadow-lg"
                        aria-label="Renovar Assinatura"
                    >
                        Renovar Assinatura
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionExpiredView;
