import React, { useEffect, useState, useCallback } from 'react';
import { verifyBinanceAccount } from '../lib/api';
import Modal from './Modal';
import type { View, User, MasterApiState } from '../App';
import UserProfileCard from './header/UserProfileCard';
import HeaderNavAndStatus from './header/HeaderNavAndStatus';

interface ControlPanelProps { 
    user: User | null;
    profilePhoto: string | null;
    wsStatus: 'connecting' | 'connected' | 'disconnected';
    activeView: View;
    setActiveView: (view: View) => void;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
    isConfigModalOpen: boolean;
    setIsConfigModalOpen: (isOpen: boolean) => void;
    masterApiState: MasterApiState;
    setMasterApiState: (newState: MasterApiState) => Promise<void>; // Now takes a full MasterApiState and is a Promise
    subscriptionStatus: 'active' | 'grace_period' | 'expired';
}

export default function ControlPanel({ 
    user,
    profilePhoto,
    wsStatus, 
    activeView,
    setActiveView,
    addToast,          
    isConfigModalOpen,
    setIsConfigModalOpen,
    masterApiState,
    setMasterApiState, // This is now the persisting setter
    subscriptionStatus,
}: ControlPanelProps) {
  const [localApiState, setLocalApiState] = useState(masterApiState);
  const [isVerifying, setIsVerifying] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const isConnected = wsStatus === 'connected';

  useEffect(() => {
    if (isConfigModalOpen) {
        setLocalApiState(masterApiState);
        setValidationError(null);
    }
  }, [masterApiState, isConfigModalOpen]);

  const handleSaveAndValidate = useCallback(async () => {
    if (!user) {
        addToast('Você precisa estar logado para salvar as chaves API.', 'error');
        return;
    }
    setIsVerifying(true);
    setValidationError(null);
    try {
        const result = await verifyBinanceAccount(localApiState.apiKey, user.doc);
        if (result.isValid) {
            // Use the prop setter, which now also persists to Supabase
            await setMasterApiState({ ...localApiState, isValidated: true });
            addToast("Chaves de API salvas e validadas com sucesso!", 'success');
            setIsConfigModalOpen(false);
        } else {
            // Use the prop setter, which now also persists to Supabase
            await setMasterApiState({ ...localApiState, isValidated: false });
            setValidationError(result.reason || 'Falha na validação.');
        }
    } catch (e) {
        // Ensure state is updated even on API error by explicitly calling setMasterApiState
        await setMasterApiState({ ...localApiState, isValidated: false }); 
        if (e instanceof Error) setValidationError(e.message);
        else setValidationError("Ocorreu um erro desconhecido.");
    } finally {
        setIsVerifying(false);
    }
  }, [localApiState, setMasterApiState, addToast, setIsConfigModalOpen, user]);


  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-start w-full h-full gap-2 lg:gap-4 px-2 lg:px-4">
        {/* User Profile Card - Left Section */}
        <div className="flex-none">
          <UserProfileCard 
            user={user} 
            profilePhoto={profilePhoto} 
            setActiveView={setActiveView} 
          />
        </div>
        
        {/* App Status & Main Navigation - Right Section */}
        <div className="flex-grow w-full">
          <HeaderNavAndStatus
            wsStatus={wsStatus}
            activeView={activeView}
            setActiveView={setActiveView}
            isConnected={isConnected}
            subscriptionStatus={subscriptionStatus}
          />
        </div>
      </div>
      
      <Modal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} title="Configurações Globais">
          <div className="space-y-4 text-sm">
            <h3 className="text-base font-semibold">Atualizar Credenciais de API da Binance</h3>
             <p className="text-xs text-zinc-400 mt-2">
                As chaves de API são fornecidas durante o registro. Use esta seção para atualizá-las, se necessário. Para sua segurança, o sistema validará se o <strong className="text-amber-300">CPF/CNPJ</strong> associado à sua conta Binance é o mesmo do seu cadastro.
            </p>
            {masterApiState.isValidated && (
                <div className="bg-green-900/50 border border-green-700 text-green-300 px-3 py-2 rounded-lg text-xs">
                    Suas chaves de API estão validadas e ativas.
                </div>
            )}
             {validationError && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-3 py-2 rounded-lg text-xs">
                    <strong>Falha na Validação:</strong> {validationError}
                </div>
            )}
            {/* NOTE: Storing API keys in frontend state is insecure for production apps.
                This is for prototype demonstration purposes only. */}
            <label className="flex flex-col gap-1">
                <span className="text-zinc-400">API Key</span>
                <input 
                    type="text" 
                    value={localApiState.apiKey}
                    onChange={(e) => setLocalApiState(prev => ({...prev, apiKey: e.target.value}))}
                    placeholder="Sua chave de API da Binance"
                    className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full font-mono"
                />
            </label>
            <label className="flex flex-col gap-1">
                <span className="text-zinc-400">API Secret</span>
                <input 
                    type="password" 
                    value={localApiState.apiSecret}
                    onChange={(e) => setLocalApiState(prev => ({...prev, apiSecret: e.target.value}))}
                    placeholder="Seu segredo de API da Binance (permanecerá oculto)"
                    className="bg-zinc-800 border border-zinc-700 rounded p-2 w-full font-mono"
                />
            </label>
            <p className="text-xs text-zinc-400 mt-4 pt-4 border-t border-zinc-700">As configurações de estratégia (risco, Kagi, IA, etc.) são gerenciadas individualmente para cada robô no painel de <strong className="text-amber-300">Robôs</strong>.</p>
             <div className="flex justify-end pt-4 mt-4 border-t border-zinc-700">
                <button 
                  onClick={handleSaveAndValidate} 
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-wait w-48 h-10 flex items-center justify-center"
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                      Verificando...
                    </>
                  ) : "Salvar e Validar Chaves"}
                  </button>
             </div>
        </div>
      </Modal>
    </>
  );
}
