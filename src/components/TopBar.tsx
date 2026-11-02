import React from 'react';
import { User, Company } from '../types/index.ts';
import { Maximize2, Shield, LogOut, UserCheck } from 'lucide-react';

export type AppView = 
  | 'observatory' 
  | 'core' 
  | 'departments' 
  | 'services' 
  | 'subscriptions' 
  | 'crm' 
  | 'sales-intelligence'
  | 'enterprise-stack'
  | 'companies' 
  | 'audit';

interface TopBarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  currentUser: User | null;
  currentCompany: Company | null;
  onOpenMasterPanel: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onToggleTotalFocus?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  currentCompany,
  onOpenMasterPanel,
  onOpenAuthModal,
  onLogout,
  onToggleTotalFocus
}) => {
  const isMaster = currentUser?.role === 'MASTER_OWNER';

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-6 px-6 py-3.5 bg-[#050508]/90 backdrop-blur-md border-b border-purple-900/20">
      {/* Zone 1: Single text element wordmark */}
      <div 
        onClick={() => onNavigate('observatory')} 
        className="text-base font-cinzel font-bold text-white tracking-widest whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2"
      >
        <span>SHEFA AYIN</span>
        <span className="text-amber-400/80 text-xs font-normal">עין השפע</span>
      </div>

      {/* Zone 2: Concise single-line text navigation links */}
      <nav className="hidden xl:flex items-center gap-5 text-xs font-medium text-slate-300 overflow-x-auto">
        <button
          onClick={() => onNavigate('observatory')}
          className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentView === 'observatory' ? 'text-amber-400 underline underline-offset-4' : ''
          }`}
        >
          Observatório 3D
        </button>

        <button
          onClick={() => onNavigate('core')}
          className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentView === 'core' ? 'text-amber-400 underline underline-offset-4' : ''
          }`}
        >
          AYIN Core
        </button>

        <button
          onClick={() => onNavigate('departments')}
          className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentView === 'departments' ? 'text-amber-400 underline underline-offset-4' : ''
          }`}
        >
          Departamentos
        </button>

        <button
          onClick={() => onNavigate('services')}
          className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentView === 'services' ? 'text-amber-400 underline underline-offset-4' : ''
          }`}
        >
          Serviços & Produtos
        </button>

        <button
          onClick={() => onNavigate('subscriptions')}
          className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentView === 'subscriptions' ? 'text-amber-400 underline underline-offset-4' : ''
          }`}
        >
          Planos SaaS
        </button>

        <button
          onClick={() => onNavigate('crm')}
          className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentView === 'crm' ? 'text-amber-400 underline underline-offset-4' : ''
          }`}
        >
          CRM
        </button>

        <button
          onClick={() => onNavigate('sales-intelligence')}
          className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentView === 'sales-intelligence' ? 'text-amber-400 underline underline-offset-4 font-bold' : ''
          }`}
        >
          Sales Intel
        </button>

        <button
          onClick={() => onNavigate('enterprise-stack')}
          className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentView === 'enterprise-stack' ? 'text-amber-400 underline underline-offset-4 font-bold' : ''
          }`}
        >
          Ecossistema V3
        </button>

        <button
          onClick={() => onNavigate('companies')}
          className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentView === 'companies' ? 'text-amber-400 underline underline-offset-4' : ''
          }`}
        >
          Portal Cliente
        </button>

        <button
          onClick={() => onNavigate('audit')}
          className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentView === 'audit' ? 'text-amber-400 underline underline-offset-4' : ''
          }`}
        >
          Auditoria
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-2.5 shrink-0">
        {onToggleTotalFocus && (
          <button
            onClick={onToggleTotalFocus}
            title="Entrar no Modo de Foco Total (F)"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-purple-200 glass-obsidian hover:text-amber-300 hover:border-amber-400/40 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Foco</span>
          </button>
        )}

        {currentUser ? (
          <div className="flex items-center gap-2">
            {isMaster ? (
              <button
                onClick={onOpenMasterPanel}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer whitespace-nowrap shrink-0"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Console Master</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('subscriptions')}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-700 hover:to-purple-800 text-amber-200 border border-purple-600/40 rounded-lg text-xs font-semibold transition-all shadow cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Meu Plano</span>
              </button>
            )}

            <button
              onClick={onLogout}
              title="Encerrar Sessão"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/40 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Acessar Conta
          </button>
        )}
      </div>
    </header>
  );
};
