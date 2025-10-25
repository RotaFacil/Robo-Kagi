import React, { useEffect, useState, useCallback } from 'react';
import { connectWS } from './lib/ws';
import { fetchAccountInfo, fetchSymbols, fetchConfig, fetchAIMonitorList } from './lib/api';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AuthView from './components/auth/AuthView';
import Profile from './components/auth/Profile';
import Admin from './components/auth/Admin';
import AnalysisView from './components/AnalysisView';
import { Toast, type ToastMessage } from './components/Toast';
import RobotsView from './components/robots/RobotsView';
import { AIStrategy } from './lib/aiStrategies';
import SubscriptionExpiredView from './components/auth/SubscriptionExpiredView';
import CheckoutView from './components/checkout/CheckoutView';
import Modal from './components/Modal';
import { 
  supabaseSignUp, 
  supabaseGetUserByEmail, 
  supabaseSaveMasterApiState, 
  supabaseGetMasterApiState, 
  supabaseSaveRobotInstance, 
  supabaseGetRobotInstances,
  supabaseDeleteRobotInstance,
  supabaseUpdateUser,
  supabaseSignIn,
  SupabaseUser // Import SupabaseUser for type consistency
} from './lib/supabase';


// Interfaces

// Extracted from the old global Config
export interface TradingParameters {
  risk_mode: 'PERCENTUAL' | 'MINIMO' | 'FIXED_CAPITAL';
  risk_per_trade: number;
  risk_fixed_capital_base: number;
  timeframe: string;
  kagi_mode: 'ATR' | 'PCT';
  kagi_rev_atr: number;
  kagi_rev_pct: number;
  max_pending_candles: number;
  mode: 'MANUAL' | 'AUTO';
  live: boolean;
  validity_mode: 'FIXED' | 'DYNAMIC_ATR';
  base_validity_candles: number;
  fib_target: number;
  stop_management_mode: 'FIXED' | 'DYNAMIC_KAGI';
  ai_strategy: AIStrategy;
  ai_mode: 'MANUAL' | 'AUTO';
  ai_news_filter?: boolean;
  break_even_active?: boolean;
  break_even_mode?: 'TARGET_PCT' | 'RR';
  break_even_trigger_pct?: number;
  break_even_trigger_rr?: number;
  trailing_stop_active?: boolean;
  trailing_stop_mode?: 'PERCENTAGE' | 'ATR';
  trailing_stop_distance_pct?: number;
  trailing_stop_distance_atr?: number;
}


export interface Alert {
  symbol: string;
  signal: 'buy' | 'sell';
  entry: number;
  stop: number;
  tp: number;
}

export interface Order {
  symbol: string;
  side: 'buy' | 'sell';
  entry: number;
  stop: number;
  tp: number;
  status?: 'OPEN' | 'TP' | 'SL';
  pnl?: number;
  origin?: 'kagi' | 'ai' | 'manual';
  timestamp?: number;
}

export interface Position {
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  margin: number;
}

export interface AccountState {
  totalBalance: number;
  availableBalance: number;
  totalUnrealizedPnl: number;
  marginUsed: number;
  positions: Position[];
}

export interface Drawing {
    type: 'RECTANGLE_ZONE' | 'TREND_LINE' | 'PIVOT_MARKER' | 'HORIZONTAL_LINE';
    startPrice?: number;
    endPrice?: number;
    price?: number;
    label?: string;
    color?: string; // e.g., '#RRGGBB'
    points?: { time: number; price: number }[];
    time?: number;
    position?: 'aboveBar' | 'belowBar' | 'inBar';
}


export interface AIAnalysis {
    symbol: string;
    entry: number;
    reason: string;
    time: number; // timestamp for unique key
    drawings?: Drawing[];
}

export interface ChartState {
    symbol: string;
    timeframe: string;
}

export interface VisibleComponents {
    // Analysis
    assetList: boolean;
    tradePanel: boolean;
    positionsPanel: boolean;
    charts: boolean;
    // Dashboard
    accountHealth: boolean;
    marketHeatmap: boolean;
    realizedPnl: boolean;
    winRate: boolean;
    totalTrades: boolean;
    avgPnl: boolean;
    capitalCurve: boolean;
    notesPanel: boolean;
    performanceByAsset: boolean;
    performanceByStrategy: boolean;
    backtestPanel: boolean;
}

export interface Notification {
  id: number;
  message: string;
  type: 'order' | 'veto' | 'info';
  timestamp: number;
  isRead: boolean;
  symbol?: string;
}

export interface RobotInstance {
  id: string;
  type: 'kagi' | 'ai';
  symbol: string;
  timeframe: string;
  maxCapital: number;
  isRunning: boolean;
  pnl: number;
  trades: number;
  winRate: number;
  params: TradingParameters; // Each robot now has its own full set of parameters
}


type WsStatus = 'connecting' | 'connected' | 'disconnected';
export type MarketType = 'futures' | 'spot';
export type View = 'analysis' | 'dashboard' | 'profile' | 'admin' | 'robots' | 'checkout';
export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean; // Corresponds to is_admin in Supabase
  plan: 'Starter' | 'Pro' | 'Expert' | 'Trader' | 'Enterprise' | 'Teste Grátis';
  subscriptionEndDate: string; // ISO string e.g., "2024-12-31T23:59:59Z", corresponds to subscription_end_date
  doc: string; // CPF/CNPJ
}
export type SubscriptionStatus = 'active' | 'grace_period' | 'expired';
export type MasterApiState = { apiKey: string, apiSecret: string, isValidated: boolean };
type RegistrationData = { name: string, email: string, doc: string, apiKey: string, apiSecret: string, plan: User['plan'], password?: string };

// Default parameters for new robots or as a fallback
const defaultTradingParameters: TradingParameters = {
    risk_mode: 'FIXED_CAPITAL',
    risk_per_trade: 0.01, // 1%
    risk_fixed_capital_base: 500,
    timeframe: '1h',
    kagi_mode: 'ATR',
    kagi_rev_atr: 1.1,
    kagi_rev_pct: 0,
    max_pending_candles: 28,
    mode: 'AUTO',
    live: false,
    validity_mode: 'FIXED',
    base_validity_candles: 24,
    fib_target: 1.618,
    stop_management_mode: 'FIXED',
    ai_strategy: 'AI_AUTO_SELECT',
    ai_mode: 'AUTO',
    ai_news_filter: true,
    break_even_active: true,
    break_even_mode: 'TARGET_PCT',
    break_even_trigger_pct: 50,
    trailing_stop_active: false,
};


const initialVisibleComponents: VisibleComponents = {
    assetList: true, tradePanel: true, positionsPanel: true, charts: true,
    accountHealth: true, marketHeatmap: true, realizedPnl: true, winRate: true,
    totalTrades: true, avgPnl: true, capitalCurve: true, notesPanel: true,
    performanceByAsset: true, performanceByStrategy: true, backtestPanel: true,
};

// Removed initial robot instances, as they will be fetched from Supabase
const getInitialRobotInstances = (): RobotInstance[] => [];


const loadVisibleComponents = (): VisibleComponents => {
    try {
        const stored = localStorage.getItem('visibleComponents');
        if (stored) {
            const parsed = JSON.parse(stored);
            return { ...initialVisibleComponents, ...parsed };
        }
    } catch (e) {
        console.error("Failed to load visible components from localStorage", e);
    }
    return initialVisibleComponents;
};


export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // States moved from original App
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wsStatus, setWsStatus] = useState<WsStatus>('connecting');
  const [accountState, setAccountState] = useState<AccountState | null>(null);
  const [isAccountLoading, setIsAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [allSymbols, setAllSymbols] = useState<string[]>([]);
  const [market, setMarket] = useState<MarketType>('futures');
  // Global config for simulation/live mode is removed. App is now always live.
  const [isAiPanelVisible, setAiPanelVisible] = useState(false);
  const [aiMonitoredSymbols, setAiMonitoredSymbols] = useState<string[]>([]);
  const [aiAnalyses, setAiAnalyses] = useState<AIAnalysis[]>([]);
  const [activeView, setActiveView] = useState<View>('analysis');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chartStates, setChartStates] = useState<ChartState[]>([
    { symbol: 'BTC/USDT', timeframe: '1h' },
  ]);
  const [activeChartIndex, setActiveChartIndex] = useState<number>(0);
  const [visibleComponents, setVisibleComponents] = useState<VisibleComponents>(loadVisibleComponents());
  const [latestPrices, setLatestPrices] = useState<Record<string, { price: number; time: number }>>({});

  // State for Robot Manager
  const [robotInstances, setRobotInstances] = useState<RobotInstance[]>(getInitialRobotInstances());
  const [masterApiState, setMasterApiState] = useState<MasterApiState>({ apiKey: '', apiSecret: '', isValidated: false });
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('active');
  const [planToCheckout, setPlanToCheckout] = useState<User['plan'] | null>(null);
  const [pendingRegistration, setPendingRegistration] = useState<RegistrationData | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);


  const activeSymbol = chartStates[activeChartIndex]?.symbol || 'BTC/USDT';

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  };
  
  const handleUpdateChartState = (index: number, newState: Partial<ChartState>) => {
    setChartStates(prev => {
        const newChartStates = [...prev];
        newChartStates[index] = { ...newChartStates[index], ...newState };
        return newChartStates;
    });
  };

    useEffect(() => {
        try {
            localStorage.setItem('visibleComponents', JSON.stringify(visibleComponents));
        } catch (e) {
            console.error("Failed to save visible components to localStorage", e);
        }
    }, [visibleComponents]);

    // Subscription Status Management
    useEffect(() => {
        if (!user?.subscriptionEndDate) return;

        const checkSubscription = () => {
            const endDate = new Date(user.subscriptionEndDate);
            const now = new Date();
            const gracePeriodEnd = new Date(endDate);
            gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 2);

            let newStatus: SubscriptionStatus;

            if (now > gracePeriodEnd) {
                newStatus = 'expired';
            } else if (now > endDate) {
                newStatus = 'grace_period';
            } else {
                newStatus = 'active';
            }
            
            if (newStatus !== subscriptionStatus) {
                setSubscriptionStatus(newStatus);
                if (newStatus === 'grace_period') {
                    addToast('Sua assinatura venceu. Período de tolerância de 2 dias iniciado.', 'info');
                } else if (newStatus === 'expired') {
                    setRobotInstances(prev => prev.map(r => ({ ...r, isRunning: false })));
                    addToast('Assinatura expirada. Todos os robôs foram parados.', 'error');
                }
            }
        };

        checkSubscription();
        const interval = setInterval(checkSubscription, 60 * 1000); // Check every minute
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, subscriptionStatus]); // addToast and setRobotInstances can cause re-renders if not stable


  useEffect(() => {
    if (!user || subscriptionStatus === 'expired' || activeView === 'checkout') return; // Don't connect if not logged in, expired, or checking out

    const ws = connectWS((msg: any) => {
      // NOTE: The single-bot state messages are now obsolete with the multi-robot manager.
      // In a real implementation, a new 'robot_instances_update' message would be used.
      if (msg.type === 'ai_monitor_list') setAiMonitoredSymbols(msg.data.symbols);
      if (msg.type === 'tick') setAlerts(msg.data.alerts);
      
      if (msg.type === 'order') {
        const orderData = { ...msg.data, status: msg.data.status || 'OPEN', timestamp: Date.now() };
        setOrders((o) => [orderData, ...o]);
        const orderMessage = `Ordem ${orderData.side} em ${orderData.symbol} executada.`;
        addToast(orderMessage, 'success');
        setNotifications(prev => [{ id: Date.now(), message: orderMessage, type: 'order', timestamp: Date.now(), isRead: false, symbol: orderData.symbol }, ...prev]);
      }
      
      if (msg.type === 'ai_news_veto') {
        const vetoData = msg.data;
        const message = `Trade em ${vetoData.symbol} vetado: ${vetoData.reason}`;
        addToast(message, 'info');
        setNotifications(prev => [{ id: Date.now(), message, type: 'veto', timestamp: Date.now(), isRead: false, symbol: vetoData.symbol }, ...prev]);
      }
      
      if (msg.type === 'ai_analysis') setAiAnalyses(prev => [{ ...msg.data, time: Date.now(), drawings: msg.data.drawings || [] }, ...prev].slice(0, 10));
      
      if (msg.type === 'account') {
        setAccountState(msg.data);
        if (isAccountLoading) setIsAccountLoading(false);
        if (accountError) setAccountError(null);
      }
      
      if (msg.type === 'price_update') {
          setLatestPrices(prev => ({
              ...prev,
              [msg.data.symbol]: { price: msg.data.price, time: msg.data.time / 1000 }
          }));
      }
    }, setWsStatus);
    return () => ws.close();
  }, [user, isAccountLoading, accountError, subscriptionStatus, activeView]);


  // Supabase: Initial data load effect
  useEffect(() => {
    if (!user) {
        setRobotInstances([]);
        setMasterApiState({ apiKey: '', apiSecret: '', isValidated: false });
        return;
    }

    const loadUserData = async () => {
        try {
            const apiState = await supabaseGetMasterApiState(user.id);
            setMasterApiState(apiState);

            const robots = await supabaseGetRobotInstances(user.id);
            setRobotInstances(robots);

            // Fetch app config (live mode) and AI monitor list only once per user session if needed
            const [configData, monitorListData] = await Promise.all([
                fetchConfig(), fetchAIMonitorList()
            ]);
            // setAppConfig is removed as sim/live mode is gone
            setAiMonitoredSymbols(monitorListData.symbols);

            addToast('Dados do usuário e robôs carregados.', 'success');
        } catch (e) {
            console.error('Failed to load user data from Supabase:', e);
            addToast('Erro ao carregar dados do usuário.', 'error');
            // If API keys fail to load, ensure isAccountLoading is handled
            setAccountError(e instanceof Error ? e.message : "Ocorreu um erro desconhecido.");
        }
    };

    loadUserData();
  }, [user]); // Re-run when user changes (login/logout)


  useEffect(() => {
    if (wsStatus !== 'connected' || activeView === 'checkout') {
        setIsAccountLoading(true);
        setAccountState(null);
        setAccountError(null);
        setAllSymbols([]);
        // setAiMonitoredSymbols([]); // Removed, handled by initial data load
        return;
    }

    const fetchInitialData = async () => {
        setIsAccountLoading(true);
        try {
            // Account info is fetched on initial data load (after Supabase user load), not per websocket connect
            // This condition prevents re-fetching if accountState is already present from Supabase
            if (!accountState) {
                const accountData = await fetchAccountInfo();
                setAccountState(accountData);
            }
            const symbolsData = await fetchSymbols(market);
            setAllSymbols(symbolsData.symbols);
            setAccountError(null);
        } catch (e) {
            setAccountError(e instanceof Error ? e.message : "Ocorreu um erro desconhecido.");
            setAccountState(null);
        } finally {
            setIsAccountLoading(false);
        }
    };
    
    fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsStatus, market, activeView]);

  // Supabase: Save API state whenever masterApiState changes (e.g., from ControlPanel)
  const setMasterApiStateAndPersist = useCallback(async (newState: MasterApiState) => {
    setMasterApiState(newState);
    if (user) {
        try {
            await supabaseSaveMasterApiState(user.id, newState);
            addToast('Chaves API atualizadas no banco de dados.', 'info');
        } catch (e) {
            console.error('Failed to save API state to Supabase:', e);
            addToast('Erro ao salvar chaves API no banco de dados.', 'error');
        }
    }
  }, [user]);


  const handleLogin = async (credentials: {email: string, password?: string}) => {
    if (!credentials.password) {
        addToast('A senha é obrigatória.', 'error');
        return;
    }
    try {
        const loggedInUser = await supabaseSignIn(credentials.email, credentials.password);
        if (!loggedInUser) {
            addToast('Credenciais inválidas.', 'error');
            return;
        }
        
        setUser(loggedInUser);
        addToast('Login realizado com sucesso!', 'success');

    } catch (e) {
        addToast(e instanceof Error ? e.message : 'Erro durante o login.', 'error');
    }
  };
  
    // This handler now only manages FREE TRIAL registrations
    const handleRegister = async (data: RegistrationData): Promise<{ success: boolean; message?: string }> => {
        try {
            // Check if user already exists
            const existingUser = await supabaseGetUserByEmail(data.email);
            if (existingUser) {
                addToast('Este email já está registrado. Faça login ou use outro email.', 'error');
                return { success: false, message: 'Email já registrado.' };
            }
            if (!data.password) {
                return { success: false, message: 'Senha é obrigatória para o registro.' };
            }

            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 7); // Free trial gets 7 days

            const newUser = {
                name: data.name,
                email: data.email,
                password: data.password,
                isAdmin: false,
                plan: data.plan,
                subscriptionEndDate: endDate.toISOString(),
                doc: data.doc,
            };
            const initialApiState: MasterApiState = {
                apiKey: data.apiKey,
                apiSecret: data.apiSecret,
                isValidated: true, // Assuming validation passed at AuthView level
            };

            const createdUser = await supabaseSignUp(newUser, initialApiState);
            if (createdUser) {
                const loggedInUser = await supabaseSignIn(data.email, data.password);
                if (loggedInUser) {
                    setUser(loggedInUser);
                    setMasterApiState(initialApiState);
                    addToast('Registro bem-sucedido! Bem-vindo ao Teste Grátis!', 'success');
                    return { success: true };
                } else {
                    return { success: false, message: 'Falha ao fazer login após registro.' };
                }
            } else {
                return { success: false, message: 'Falha ao criar usuário no Supabase.' };
            }

        } catch (e) {
            const message = e instanceof Error ? e.message : "Ocorreu um erro desconhecido.";
            addToast(message, 'error');
            return { success: false, message };
        }
    };
    
    const handleProceedToCheckout = (data: RegistrationData) => {
        setPendingRegistration(data);
        setPlanToCheckout(data.plan);
        setIsCheckoutModalOpen(true);
    };

    const handleRegistrationSuccess = async () => {
        if (!pendingRegistration) return;

        const data = pendingRegistration;
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // New paid user gets 30 days

        try {
            // Check if user already exists (should have been checked in AuthView before proceeding to checkout)
            let existingUser = await supabaseGetUserByEmail(data.email);
            if (existingUser) {
                 addToast('Este email já está registrado. Faça login ou use outro email.', 'error');
                 return;
            }
            if (!data.password) {
                addToast('Senha não encontrada para registro.', 'error');
                return;
            }

            const newUser = {
                name: data.name,
                email: data.email,
                password: data.password,
                isAdmin: false, 
                plan: data.plan,
                subscriptionEndDate: endDate.toISOString(),
                doc: data.doc,
            };
            const initialApiState: MasterApiState = {
                apiKey: data.apiKey,
                apiSecret: data.apiSecret,
                isValidated: true,
            };

            const createdUser = await supabaseSignUp(newUser, initialApiState);
            if (createdUser) {
                const loggedInUser = await supabaseSignIn(data.email, data.password);
                if (loggedInUser) {
                    setUser(loggedInUser);
                    setMasterApiState(initialApiState);
                    setIsCheckoutModalOpen(false);
                    setPendingRegistration(null);
                    setPlanToCheckout(null);
                    setActiveView('dashboard'); // Start on dashboard after paying
                    addToast('Pagamento bem-sucedido! Sua conta foi criada.', 'success');
                } else {
                    addToast('Falha ao fazer login após registro.', 'error');
                }
            } else {
                 addToast('Falha ao criar usuário no Supabase após o pagamento.', 'error');
            }
        } catch (e) {
             addToast(e instanceof Error ? e.message : 'Erro ao processar registro pago.', 'error');
        }
    };
  
    const handleSaveRobot = async (robot: RobotInstance) => {
        if (!user) {
            addToast('Você precisa estar logado para salvar robôs.', 'error');
            return;
        }

        const robotWithUserId = { ...robot, user_id: user.id }; // Attach user_id for Supabase
        
        try {
            const savedRobot = await supabaseSaveRobotInstance(robotWithUserId);
            if (savedRobot) {
                setRobotInstances(prev => {
                    const index = prev.findIndex(r => r.id === robot.id);
                    if (index > -1) {
                        // Update
                        const newInstances = [...prev];
                        newInstances[index] = robot;
                        return newInstances;
                    } else {
                        // Add new
                        return [...prev, robot];
                    }
                });
                addToast(`Robô ${robot.symbol} salvo com sucesso!`, 'success');
            }
        } catch (e) {
            addToast(e instanceof Error ? e.message : "Ocorreu um erro ao salvar o robô.", 'error');
        }
    };

    const handleDeleteRobot = async (robotId: string) => {
        if (!user) {
            addToast('Você precisa estar logado para deletar robôs.', 'error');
            return;
        }
        try {
            await supabaseDeleteRobotInstance(robotId);
            setRobotInstances(prev => prev.filter(r => r.id !== robotId));
            addToast(`Robô ${robotId} removido.`, 'info');
        } catch (e) {
            addToast(e instanceof Error ? e.message : "Ocorreu um erro ao deletar o robô.", 'error');
        }
    };

    const handleToggleRobotStatus = (robotId: string) => {
        setRobotInstances(prev => prev.map(r => 
            r.id === robotId ? { ...r, isRunning: !r.isRunning } : r
        ));
        // NOTE: isRunning status is currently client-side. To persist it,
        // you would need to call supabaseSaveRobotInstance with the updated robot.
        // For this task, we're not persisting `isRunning` to DB as it often reflects
        // a real-time server-side state.
    };
    
    const handleLogout = () => {
        setUser(null);
        setMasterApiState({ apiKey: '', apiSecret: '', isValidated: false });
        setRobotInstances([]); // Clear robots on logout since they are tied to the user
        addToast('Logout realizado com sucesso.', 'info');
    };

    const navigateToCheckout = (plan: User['plan']) => {
      setPlanToCheckout(plan);
      setActiveView('checkout');
    };

    const handlePurchaseSuccess = async (newPlan: User['plan']) => {
        if (!user) return;

        const newEndDate = new Date();
        newEndDate.setDate(newEndDate.getDate() + 30);

        try {
            const updatedUser = await supabaseUpdateUser(user.id, {
                plan: newPlan,
                subscription_end_date: newEndDate.toISOString(),
            });

            if (updatedUser) {
                setUser(prevUser => prevUser ? {
                    ...prevUser,
                    plan: updatedUser.plan,
                    subscriptionEndDate: updatedUser.subscription_end_date
                } : null);

                addToast(`Upgrade para o plano ${newPlan} realizado com sucesso!`, 'success');
                setActiveView('profile');
                setPlanToCheckout(null);
            }
        } catch (e) {
            addToast(e instanceof Error ? e.message : 'Erro ao atualizar plano no banco de dados.', 'error');
        }
    };


  if (!user) {
    const handleModalClose = () => {
        setIsCheckoutModalOpen(false);
        setPendingRegistration(null);
        setPlanToCheckout(null);
    };
    return (
        <>
            <div className="fixed top-4 right-4 z-[100] space-y-2">
                {toasts.map(toast => (
                  <Toast key={toast.id} {...toast} onDismiss={() => setToasts(t => t.filter(item => item.id !== toast.id))} />
                ))}
            </div>
            <AuthView onLogin={handleLogin} onRegister={handleRegister} onProceedToPayment={handleProceedToCheckout} addToast={addToast} />
            <Modal isOpen={isCheckoutModalOpen} onClose={handleModalClose} title="Finalizar Pagamento">
                <CheckoutView
                    user={null}
                    planToCheckout={planToCheckout}
                    onPurchaseSuccess={() => {}} // Not used in registration flow
                    onRegistrationSuccess={handleRegistrationSuccess}
                    initialData={pendingRegistration}
                    onBack={handleModalClose}
                    isModal={true}
                />
            </Modal>
        </>
    );
  }
  
  if (subscriptionStatus === 'expired') {
    return <SubscriptionExpiredView />;
  }


  const renderView = () => {
    switch(activeView) {
        case 'analysis':
            return <AnalysisView 
                        allSymbols={allSymbols}
                        alerts={alerts}
                        activeSymbol={activeSymbol}
                        handleUpdateChartState={handleUpdateChartState}
                        wsStatus={wsStatus}
                        market={market}
                        setMarket={setMarket}
                        aiMonitoredSymbols={aiMonitoredSymbols}
                        setAiMonitoredSymbols={setAiMonitoredSymbols}
                        chartStates={chartStates}
                        activeChartIndex={activeChartIndex}
                        setActiveChartIndex={setActiveChartIndex}
                        robotInstances={robotInstances}
                        aiAnalyses={aiAnalyses}
                        isAiPanelVisible={isAiPanelVisible}
                        accountState={accountState}
                        addToast={addToast}
                        orders={orders}
                        isAccountLoading={isAccountLoading}
                        accountError={accountError}
                        setOrders={setOrders}
                        visibleComponents={visibleComponents}
                        latestPrices={latestPrices}
                    />;
        case 'dashboard':
            return <Dashboard orders={orders} accountState={accountState} visibleComponents={visibleComponents} />;
        case 'robots':
            return <RobotsView 
                        robotInstances={robotInstances}
                        allSymbols={allSymbols}
                        onSave={handleSaveRobot}
                        onDelete={handleDeleteRobot}
                        onToggleStatus={handleToggleRobotStatus}
                        masterApiState={masterApiState}
                        subscriptionStatus={subscriptionStatus}
                    />;
        case 'profile':
            return <Profile user={user!} addToast={addToast} profilePhoto={profilePhoto} setProfilePhoto={setProfilePhoto} setActiveView={setActiveView} navigateToCheckout={navigateToCheckout} />;
        case 'admin':
            return <Admin addToast={addToast} setActiveView={setActiveView} />;
        case 'checkout':
            // This case is now only for logged-in users upgrading their plan
            return (
                <div className="min-h-screen bg-zinc-950 text-zinc-200 p-4 sm:p-6 lg:p-8 font-sans">
                     <CheckoutView
                        user={user}
                        planToCheckout={planToCheckout}
                        onPurchaseSuccess={handlePurchaseSuccess}
                        onRegistrationSuccess={() => {}} // Not used here
                        initialData={null}
                        onBack={() => {
                            setActiveView('profile');
                            setPlanToCheckout(null);
                        }}
                    />
                </div>
            )
        default:
            return <AnalysisView 
                        allSymbols={allSymbols}
                        alerts={alerts}
                        activeSymbol={activeSymbol}
                        handleUpdateChartState={handleUpdateChartState}
                        wsStatus={wsStatus}
                        market={market}
                        setMarket={setMarket}
                        aiMonitoredSymbols={aiMonitoredSymbols}
                        setAiMonitoredSymbols={setAiMonitoredSymbols}
                        chartStates={chartStates}
                        activeChartIndex={activeChartIndex}
                        setActiveChartIndex={setActiveChartIndex}
                        robotInstances={robotInstances}
                        aiAnalyses={aiAnalyses}
                        isAiPanelVisible={isAiPanelVisible}
                        accountState={accountState}
                        addToast={addToast}
                        orders={orders}
                        isAccountLoading={isAccountLoading}
                        accountError={accountError}
                        setOrders={setOrders}
                        visibleComponents={visibleComponents}
                        latestPrices={latestPrices}
                    />;
    }
  }


  return (
    <div className="min-h-screen font-sans text-xs flex flex-col bg-zinc-950 text-zinc-200">
       <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onDismiss={() => setToasts(t => t.filter(item => item.id !== toast.id))} />
        ))}
      </div>

       {activeView !== 'checkout' && user ? (
        <Layout
            user={user}
            profilePhoto={profilePhoto}
            wsStatus={wsStatus}
            isAiPanelVisible={isAiPanelVisible}
            setAiPanelVisible={setAiPanelVisible}
            activeView={activeView}
            setActiveView={setActiveView}
            addToast={addToast}
            visibleComponents={visibleComponents}
            setVisibleComponents={setVisibleComponents}
            notifications={notifications}
            setNotifications={setNotifications}
            handleLogout={handleLogout}
            masterApiState={masterApiState}
            setMasterApiState={setMasterApiStateAndPersist} // Use the persisting setter
            subscriptionStatus={subscriptionStatus}
          >
            {wsStatus === 'disconnected' ? (
                <div className="h-full flex items-center justify-center m-2 text-zinc-400">
                    <div className="text-center bg-zinc-900 p-8 rounded-lg border border-zinc-800 max-w-md w-full shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                        </svg>
                        <p className="font-bold text-lg text-red-500 mt-4">Conexão Perdida</p>
                        <p className="text-sm text-zinc-500 mt-2">Não foi possível conectar ao servidor backend.</p>
                        <p className="text-xs text-zinc-600 mt-1">Tentando reconectar automaticamente...</p>
                        <div className="mt-6">
                            <button 
                                onClick={() => window.location.reload()}
                                className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded transition-colors"
                                aria-label="Recarregar a página"
                            >
                                Recarregar Página
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                renderView()
            )}
          </Layout>
        ) : (
            renderView() // Render CheckoutView (full page) for logged-in users
        )}
    </div>
  );
}