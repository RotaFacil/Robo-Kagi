import React from 'react';

const InfoIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-500 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const Tooltip: React.FC<{ text: string, children: React.ReactNode }> = ({ text, children }) => (
    <div className="relative flex items-center group">
        {children}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-700 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {text}
        </div>
    </div>
);

const SubscriptionCard: React.FC<{ title: string; price: string; features: { text: string; tooltip?: string }[]; isCurrent?: boolean; isPopular?: boolean; onUpgrade: () => void; }> = ({ title, price, features, isCurrent, isPopular, onUpgrade }) => {
    const cardClasses = `flex flex-col bg-zinc-800/50 p-6 rounded-lg border-2 h-full ${isCurrent ? 'border-amber-500' : 'border-zinc-700'} ${isPopular ? 'relative' : ''}`;
    const buttonClasses = `w-full mt-auto py-2 px-4 rounded-md font-semibold transition-colors ${isCurrent ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed' : 'bg-amber-500 text-black hover:bg-amber-600'}`;

    return (
        <div className={cardClasses}>
            {isPopular && <div className="absolute top-0 right-4 -translate-y-1/2 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">MAIS POPULAR</div>}
            <div>
                <h3 className="text-xl font-bold text-amber-300">{title}</h3>
                <p className="mt-2 text-3xl font-bold">{price}<span className="text-base font-normal text-zinc-400">{!price.includes('Grátis') && '/mês'}</span></p>
            </div>
            <ul className="my-6 space-y-3 text-zinc-300 flex-grow">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <svg className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {feature.tooltip ? (
                            <Tooltip text={feature.tooltip}>
                                <div className="flex items-center cursor-help">
                                    <span>{feature.text}</span>
                                    <InfoIcon />
                                </div>
                            </Tooltip>
                        ) : (
                            <span>{feature.text}</span>
                        )}
                    </li>
                ))}
            </ul>
            <button className={buttonClasses} disabled={isCurrent} onClick={onUpgrade}>
                {isCurrent ? 'Plano Atual' : title.includes('Grátis') ? 'Iniciar Teste' : 'Fazer Upgrade'}
            </button>
        </div>
    );
};

interface SubscriptionTiersProps {
    currentPlan: string;
    onUpgradeClick: (planTitle: string) => void;
}

const SubscriptionTiers: React.FC<SubscriptionTiersProps> = ({ currentPlan, onUpgradeClick }) => {
    const subscriptionPlans = [
        {
            title: "Teste Grátis",
            price: "7 Dias Grátis",
            features: [
                { text: "Acesso a todas as funcionalidades do plano Pro por 7 dias." },
                { text: "Suporte via Email" },
                { text: "Sem compromisso, cancele quando quiser" }
            ],
            isCurrent: currentPlan === 'Teste Grátis',
        },
        {
            title: "Starter",
            price: "R$99",
            features: [
                { text: "2 Robôs Operacionais" },
                { text: "Análise IA Limitada" },
                { text: "Backtesting Básico" },
                { text: "Suporte via Email" }
            ],
            isCurrent: currentPlan === 'Starter',
        },
        {
            title: "Pro",
            price: "R$299",
            features: [
                { text: "5 Robôs Operacionais" },
                { text: "Análise IA Completa" },
                { text: "Backtesting Avançado" },
                { text: "Gerenciamento de Posição" },
                { text: "Suporte Prioritário" }
            ],
            isPopular: true,
            isCurrent: currentPlan === 'Pro',
        },
        {
            title: "Expert",
            price: "R$599",
            features: [
                { text: "10 Robôs Operacionais" },
                { text: "Todos os recursos do plano Pro" },
                { text: "API para Automações", tooltip: "Acesse nossa API para criar suas próprias automações, integrar com outras ferramentas e otimizar suas estratégias de forma programática." },
            ],
            isCurrent: currentPlan === 'Expert',
        },
        {
            title: "Trader",
            price: "R$1.100",
            features: [
                { text: "50 Robôs Operacionais" },
                { text: "Todos os recursos do plano Expert" },
                { text: "Otimizador de Estratégia", tooltip: "Ferramenta avançada que testa milhares de combinações de parâmetros para encontrar a configuração mais lucrativa para sua estratégia." },
            ],
            isCurrent: currentPlan === 'Trader',
        },
        {
            title: "Enterprise",
            price: "R$2.999",
            features: [
                { text: "Robôs Ilimitados" },
                { text: "Todos os recursos do plano Trader" },
                { text: "Sessão com Especialista", tooltip: "Uma sessão individual de 1 hora com um de nossos especialistas para tirar dúvidas, otimizar seu uso do robô e discutir estratégias de mercado." },
                { text: "Suporte Dedicado 24/7" }
            ],
            isCurrent: currentPlan === 'Enterprise',
        }
    ];

    return (
        <div>
             <h2 className="text-lg font-semibold text-amber-300 mb-4">Planos de Assinatura</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                 {subscriptionPlans.map(plan => (
                     <SubscriptionCard 
                        key={plan.title}
                        title={plan.title}
                        price={plan.price}
                        features={plan.features}
                        isCurrent={plan.isCurrent}
                        isPopular={plan.isPopular}
                        onUpgrade={() => onUpgradeClick(plan.title)}
                    />
                 ))}
             </div>
        </div>
    );
};

export default SubscriptionTiers;