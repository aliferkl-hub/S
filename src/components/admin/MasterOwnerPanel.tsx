import React, { useState, useEffect } from 'react';
import { 
  Mission, 
  Company, 
  AuditLog, 
  User, 
  AutonomousAgent, 
  EngineGovernanceSettings, 
  SystemStats,
  PlanDefinition,
  EnterpriseService,
  ServiceContract,
  CommercialProposal,
  CommercialPartner,
  Subscription,
  PixCharge,
  DevProject,
  SupportTicket,
  AgentInteraction
} from '../../types/index.ts';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Key, 
  Plus, 
  Lock, 
  History, 
  Building2, 
  Power, 
  DollarSign, 
  QrCode, 
  Cpu, 
  Pause, 
  Play, 
  RefreshCw, 
  Zap,
  TrendingUp,
  Receipt,
  Layers,
  FileText,
  Briefcase,
  Users,
  Target,
  Percent,
  Check,
  MessageSquare,
  Network
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { livingAudio } from '../../services/livingAudio.ts';

interface MasterOwnerPanelProps {
  currentUser: User | null;
  missions: Mission[];
  companies: Company[];
  auditLogs: AuditLog[];
  agents?: AutonomousAgent[];
  stats?: SystemStats | null;
  onRefreshData: () => void;
  onClose: () => void;
}

export const MasterOwnerPanel: React.FC<MasterOwnerPanelProps> = ({
  currentUser,
  missions,
  companies,
  auditLogs,
  agents = [],
  stats,
  onRefreshData,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<
    'sovereignty' | 'companies' | 'plans' | 'services' | 'subscriptions' | 'finance' | 'crm' | 'projects' | 'support' | 'agent_network' | 'approvals' | 'audit' | 'security'
  >('sovereignty');
  
  // Governance & Emergency Engine State
  const [governance, setGovernance] = useState<EngineGovernanceSettings | null>(null);
  const [spendingLimitInput, setSpendingLimitInput] = useState<string>('1000');
  const [isTogglingEmergency, setIsTogglingEmergency] = useState(false);
  const [isSavingLimit, setIsSavingLimit] = useState(false);
  const [governanceFeedback, setGovernanceFeedback] = useState<string | null>(null);

  // Dynamic Data States
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [services, setServices] = useState<EnterpriseService[]>([]);
  const [contracts, setContracts] = useState<ServiceContract[]>([]);
  const [proposals, setProposals] = useState<CommercialProposal[]>([]);
  const [partners, setPartners] = useState<CommercialPartner[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [projects, setProjects] = useState<DevProject[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [agentInteractions, setAgentInteractions] = useState<AgentInteraction[]>([]);
  const [isRunningAgentCycle, setIsRunningAgentCycle] = useState(false);
  const [agentCycleSummary, setAgentCycleSummary] = useState<string | null>(null);
  const [refundRequests, setRefundRequests] = useState<any[]>([]);

  // Editing state for plans
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editMonthlyPrice, setEditMonthlyPrice] = useState<number>(0);
  const [editAnnualPrice, setEditAnnualPrice] = useState<number>(0);

  // Editing state for services
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServicePrice, setEditServicePrice] = useState<number>(0);
  const [editServiceDays, setEditServiceDays] = useState<number>(0);

  // New Company form
  const [companyName, setCompanyName] = useState('');
  const [companyCnpj, setCompanyCnpj] = useState('');
  const [companyPlan, setCompanyPlan] = useState<'Astral Starter' | 'Cosmic Growth' | 'Infinity Enterprise'>('Cosmic Growth');
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);

  // Security Credentials Update form
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [securityStatus, setSecurityStatus] = useState<string | null>(null);

  const pendingApprovals = missions.filter(m => m.status === 'awaiting_approval');

  // Load secondary collections
  const loadMasterData = async () => {
    try {
      const [govRes, plansRes, srvRes, ctrRes, propRes, prtRes, subRes, projRes, tickRes, intRes, refRes] = await Promise.all([
        api.getGovernance().catch(() => null),
        api.getPlans().catch(() => []),
        api.getServices().catch(() => []),
        api.getServiceContracts().catch(() => []),
        api.getProposals().catch(() => []),
        api.getPartners().catch(() => []),
        api.getSubscriptions().catch(() => []),
        api.getProjects().catch(() => []),
        api.getSupportTickets().catch(() => []),
        api.getAgentInteractions().catch(() => []),
        api.getRefundRequests().catch(() => [])
      ]);

      if (govRes) {
        setGovernance(govRes);
        setSpendingLimitInput((govRes.financialSpendingLimit ?? 1000).toString());
      }
      setPlans(plansRes);
      setServices(srvRes);
      setContracts(ctrRes);
      setProposals(propRes);
      setPartners(prtRes);
      setSubscriptions(subRes);
      setProjects(projRes);
      setSupportTickets(tickRes);
      setAgentInteractions(intRes);
      setRefundRequests(refRes);
    } catch (err) {
      console.error('Error loading Master Owner data:', err);
    }
  };

  const handleReviewRefund = async (refundId: string, approved: boolean) => {
    try {
      await api.reviewRefundRequest(refundId, approved);
      const updatedRefunds = await api.getRefundRequests();
      setRefundRequests(updatedRefunds);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao processar estorno.');
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  const handleToggleEmergencyPause = async () => {
    setIsTogglingEmergency(true);
    setGovernanceFeedback(null);
    try {
      const res = await api.toggleEmergencyPause();
      setGovernance(prev => prev ? { ...prev, isEmergencyPaused: res.isEmergencyPaused } : null);
      setGovernanceFeedback(res.message);
      if (res.isEmergencyPaused) {
        livingAudio.playTone('emergency');
        livingAudio.speak('Atenção. Trava de emergência geral acionada pelo Master Owner. Operações suspensas no servidor.');
      } else {
        livingAudio.playTone('complete');
        livingAudio.speak('Motor autônomo restabelecido com sucesso pelo Master Owner.');
      }
      onRefreshData();
    } catch (err: any) {
      setGovernanceFeedback(err.message || 'Falha ao acionar trava de emergência.');
      livingAudio.playTone('alert');
    } finally {
      setIsTogglingEmergency(false);
    }
  };

  const handleUpdateSpendingLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(spendingLimitInput);
    if (isNaN(limit) || limit < 0) {
      setGovernanceFeedback('Por favor insira um valor válido de limite em reais.');
      return;
    }
    setIsSavingLimit(true);
    try {
      await api.updateSpendingLimit(limit);
      setGovernance(prev => prev ? { ...prev, financialSpendingLimit: limit } : null);
      setGovernanceFeedback(`Limite autorizado atualizado para R$ ${limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`);
      onRefreshData();
    } catch (err: any) {
      setGovernanceFeedback(err.message || 'Falha ao atualizar limite.');
    } finally {
      setIsSavingLimit(false);
    }
  };

  const handleSavePlanPrice = async (planId: string) => {
    try {
      await api.updatePlan(planId, {
        monthlyPrice: editMonthlyPrice,
        annualPrice: editAnnualPrice
      });
      setEditingPlanId(null);
      loadMasterData();
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar plano.');
    }
  };

  const handleSaveServicePrice = async (serviceId: string) => {
    try {
      await api.updateService(serviceId, {
        basePrice: editServicePrice,
        deliveryTimelineDays: editServiceDays
      });
      setEditingServiceId(null);
      loadMasterData();
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar serviço.');
    }
  };

  const handleSuspendSubscription = async (id: string) => {
    try {
      await api.suspendSubscription(id);
      loadMasterData();
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao suspender assinatura.');
    }
  };

  const handleReactivateSubscription = async (id: string) => {
    try {
      await api.reactivateSubscription(id);
      loadMasterData();
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao reativar assinatura.');
    }
  };

  const handleCancelSubscription = async (id: string) => {
    if (!confirm('Deseja realmente cancelar esta assinatura?')) return;
    try {
      await api.cancelSubscription(id);
      loadMasterData();
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao cancelar assinatura.');
    }
  };

  const handleToggleAgent = async (agentId: string) => {
    try {
      await api.toggleAgentPause(agentId);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar estado do agente.');
    }
  };

  const handleApprove = async (missionId: string) => {
    try {
      await api.approveMission(missionId);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao aprovar missão.');
    }
  };

  const handleReject = async (missionId: string) => {
    const reason = prompt('Informe a justificativa do bloqueio da ação:');
    if (!reason) return;
    try {
      await api.rejectMission(missionId, reason);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao rejeitar missão.');
    }
  };

  const handleRunAgentCycle = async () => {
    setIsRunningAgentCycle(true);
    setAgentCycleSummary(null);
    try {
      const res = await api.runInterAgentCycle();
      setAgentCycleSummary(res.summary);
      livingAudio.speak('Ciclo de colaboração multiagente executado com 11 trocas táticas entre departamentos.');
      loadMasterData();
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao rodar ciclo dos 11 agentes.');
    } finally {
      setIsRunningAgentCycle(false);
    }
  };

  const handleApproveInteraction = async (interactionId: string) => {
    try {
      await api.approveAgentInteraction(interactionId);
      loadMasterData();
      onRefreshData();
      alert('Ação inter-agente autorizada pelo Master Owner.');
    } catch (err: any) {
      alert(err.message || 'Erro ao aprovar interação.');
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !companyCnpj.trim()) return;
    setIsCreatingCompany(true);

    try {
      await api.createCompany({
        name: companyName,
        cnpjOrTaxId: companyCnpj,
        plan: companyPlan
      });
      setCompanyName('');
      setCompanyCnpj('');
      onRefreshData();
      loadMasterData();
      alert('Nova empresa cliente provisionada com sucesso!');
    } catch (err: any) {
      alert(err.message || 'Erro ao criar empresa.');
    } finally {
      setIsCreatingCompany(false);
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setSecurityStatus('A confirmação da nova senha não confere.');
      return;
    }
    if (newPass.length < 8) {
      setSecurityStatus('A nova senha deve ter ao menos 8 caracteres.');
      return;
    }

    try {
      await api.setupMaster(currPass, newPass);
      setSecurityStatus('Credenciais do Master Owner atualizadas com hash scrypt no servidor!');
      setCurrPass('');
      setNewPass('');
      setConfirmPass('');
      onRefreshData();
    } catch (err: any) {
      setSecurityStatus(err.message || 'Erro ao atualizar credenciais.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-6xl bg-[#07070d] border border-amber-500/40 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Bar */}
        <div className="p-5 bg-gradient-to-r from-purple-950/80 via-[#0d0d18] to-purple-950/80 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-cinzel font-bold text-white tracking-wide">
                  Console Soberano Master Owner
                </h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono-numbers uppercase">
                  Root Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 font-light mt-0.5">
                Alifermadeiro@hotmail.com · Chave Pix: 11973479473 · Gestão de Negócios e Governança 24/7
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs (Single line, scrollable if narrow) */}
        <div className="flex items-center gap-1 px-4 py-2 bg-[#050508] border-b border-purple-900/30 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('sovereignty')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'sovereignty' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Soberania & Métricas
          </button>
          <button
            onClick={() => setActiveTab('companies')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'companies' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Clientes & Empresas ({companies.length})
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'plans' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Planos SaaS & Preços
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'services' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Serviços & Contratos ({contracts.length})
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'subscriptions' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Assinaturas Pix ({subscriptions.length})
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'finance' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Financeiro & Margem
          </button>
          <button
            onClick={() => setActiveTab('crm')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'crm' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            CRM & Parceiros
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'projects' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Projetos Dev ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'support' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Suporte & CS ({supportTickets.length})
          </button>
          <button
            onClick={() => setActiveTab('agent_network')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'agent_network' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Rede 11 Agentes</span>
            <span className="px-1.5 py-0.2 bg-purple-950 text-purple-300 border border-purple-500/40 rounded text-[9px] font-mono-numbers">
              {agentInteractions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'approvals' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Aprovações AYIN</span>
            {pendingApprovals.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
                {pendingApprovals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'audit' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Auditoria SHA-256
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'security' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Segurança
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200">
          
          {/* TAB 1: SOBERANIA & MÉTRICAS REAIS */}
          {activeTab === 'sovereignty' && (
            <div className="space-y-6">
              {/* Emergency Kill-Switch Box */}
              <div className="p-5 bg-gradient-to-r from-[#140812] via-[#0d0714] to-[#140812] border border-rose-500/40 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Power className={`w-4 h-4 ${governance?.isEmergencyPaused ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`} />
                      <h3 className="text-sm font-cinzel font-bold text-white">
                        Kill-Switch de Emergência Master Owner
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 font-light leading-relaxed">
                      Interrupção global imediata de todos os agentes, missões, despachos e cobranças no servidor.
                    </p>
                  </div>

                  <button
                    disabled={isTogglingEmergency}
                    onClick={handleToggleEmergencyPause}
                    className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow flex items-center gap-2 shrink-0 ${
                      governance?.isEmergencyPaused
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    <span>{governance?.isEmergencyPaused ? 'REATIVAR SISTEMA' : 'ACIONAR PAUSA GERAL'}</span>
                  </button>
                </div>

                {governanceFeedback && (
                  <div className="p-3 bg-black/40 rounded-lg text-xs font-mono-numbers text-amber-300 border border-amber-500/20">
                    {governanceFeedback}
                  </div>
                )}
              </div>

              {/* Real Financial & Operational Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-[#0a0a14] rounded-xl border border-purple-900/30">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">MRR Vigente</span>
                  <span className="text-2xl font-bold font-mono-numbers text-amber-300">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.mrr || 0)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {stats?.activeSubscriptions || 0} assinaturas ativas
                  </span>
                </div>

                <div className="p-4 bg-[#0a0a14] rounded-xl border border-purple-900/30">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Receita Liquidada Pix</span>
                  <span className="text-2xl font-bold font-mono-numbers text-emerald-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.totalReceivedRevenue || stats?.grossRevenue || 0)}
                  </span>
                  <span className="text-[10px] text-emerald-300 block mt-1">
                    Em conta oficial via chave celular
                  </span>
                </div>

                <div className="p-4 bg-[#0a0a14] rounded-xl border border-purple-900/30">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Inadimplência Real</span>
                  <span className={`text-2xl font-bold font-mono-numbers ${(stats?.defaultRate || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {(stats?.defaultRate || 0).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1 font-mono-numbers">
                    Atraso: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.defaultAmount || 0)}
                  </span>
                </div>

                <div className="p-4 bg-[#0a0a14] rounded-xl border border-purple-900/30">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Margem Líquida</span>
                  <span className="text-2xl font-bold font-mono-numbers text-purple-300">
                    {(stats?.netMarginPercent || 0).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1 font-mono-numbers">
                    Líquido: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.netResult || 0)}
                  </span>
                </div>
              </div>

              {/* Spending Limit Form */}
              <div className="p-5 bg-[#0a0a14] rounded-xl border border-purple-900/30 space-y-3">
                <h3 className="text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider">
                  Trava Automática de Gastos & Aprovação
                </h3>
                <p className="text-xs text-slate-400 font-light">
                  Ações que envolvam gastos acima deste patamar serão retidas automaticamente e enviadas para a fila de aprovação do Master Owner.
                </p>

                <form onSubmit={handleUpdateSpendingLimit} className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono-numbers">R$</span>
                    <input
                      type="number"
                      value={spendingLimitInput}
                      onChange={(e) => setSpendingLimitInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#05050a] border border-purple-900/40 rounded-lg text-xs text-white font-mono-numbers focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingLimit}
                    className="px-4 py-2 bg-purple-900/80 hover:bg-purple-800 text-amber-200 border border-purple-700/50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {isSavingLimit ? 'Salvando...' : 'Atualizar Limite'}
                  </button>
                </form>
              </div>

              {/* 11 Agents Status Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-cinzel font-bold text-white uppercase tracking-wider">
                  Controle Individual da Constelação dos 11 Agentes
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-purple-900/30 text-slate-400">
                        <th className="py-2.5 px-3 font-semibold">Agente</th>
                        <th className="py-2.5 px-3 font-semibold">Papel Comercial</th>
                        <th className="py-2.5 px-3 font-semibold">Status 24h</th>
                        <th className="py-2.5 px-3 font-semibold">Precisão</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-900/20 font-light text-slate-300">
                      {agents.map((ag) => (
                        <tr key={ag.id} className="hover:bg-purple-950/20">
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-white block">{ag.name}</span>
                            <span className="text-[10px] text-amber-300 font-cinzel">{ag.hebrewCodename}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">{ag.role}</td>
                          <td className="py-2.5 px-3 font-mono-numbers">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              ag.isManuallyPaused ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'
                            }`}>
                              {ag.isManuallyPaused ? 'PAUSADO' : 'ATIVO 24/7'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono-numbers text-amber-300">{ag.accuracyScore}%</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleToggleAgent(ag.id)}
                              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                                ag.isManuallyPaused
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  : 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/40'
                              }`}
                            >
                              {ag.isManuallyPaused ? 'Reativar' : 'Pausar'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLIENTES & EMPRESAS */}
          {activeTab === 'companies' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-purple-900/20">
                <h3 className="text-sm font-cinzel font-bold text-white">
                  Empresas Clientes & Tenants Herméticos
                </h3>
                <span className="text-xs font-mono-numbers text-slate-400">
                  {companies.length} Empresas Registradas
                </span>
              </div>

              {/* Companies List */}
              <div className="space-y-3">
                {companies.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-4 bg-[#0a0a14] rounded-xl border border-purple-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{comp.name}</span>
                        <span className="text-xs text-amber-300 font-mono-numbers px-2 py-0.5 bg-amber-950/40 rounded border border-amber-500/30">
                          {comp.plan}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-light block">
                        CNPJ: {comp.cnpjOrTaxId} · Criada em: {new Date(comp.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono-numbers pt-1">
                        <span>Missões: {comp.quotas.usedMissions} / {comp.quotas.monthlyMissions}</span>
                        <span>·</span>
                        <span>Agentes: {comp.quotas.maxAgents}</span>
                        <span>·</span>
                        <span>Docs: {comp.quotas.maxKnowledgeDocs}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-400 font-semibold px-2 py-1 bg-emerald-950/40 rounded">
                        {comp.status === 'active' ? 'Ativa' : 'Suspensa'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Company Form */}
              <form onSubmit={handleCreateCompany} className="p-5 bg-[#050508] border border-purple-900/30 rounded-xl space-y-3 text-xs">
                <h4 className="font-bold text-white text-sm">Provisionar Novo Tenant Corporativo</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Razão Social:</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ex: Alfa Logística S.A."
                      className="w-full p-2 bg-[#0a0a14] border border-purple-900/40 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">CNPJ:</label>
                    <input
                      type="text"
                      required
                      value={companyCnpj}
                      onChange={(e) => setCompanyCnpj(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-full p-2 bg-[#0a0a14] border border-purple-900/40 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Plano Inicial:</label>
                    <select
                      value={companyPlan}
                      onChange={(e) => setCompanyPlan(e.target.value as any)}
                      className="w-full p-2 bg-[#0a0a14] border border-purple-900/40 rounded-lg text-white"
                    >
                      <option value="Astral Starter">Astral Starter (R$ 197)</option>
                      <option value="Cosmic Growth">Cosmic Growth (R$ 497)</option>
                      <option value="Infinity Enterprise">Infinity Enterprise (R$ 1.497)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isCreatingCompany}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold transition-colors cursor-pointer"
                  >
                    {isCreatingCompany ? 'Criando...' : 'Provisionar Empresa'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: PLANOS SAAS & PREÇOS (Configuráveis pelo Master Owner) */}
          {activeTab === 'plans' && (
            <div className="space-y-6">
              <div className="pb-3 border-b border-purple-900/20">
                <h3 className="text-sm font-cinzel font-bold text-white">
                  Precificação & Cotas dos Planos Oficiais (SaaS)
                </h3>
                <p className="text-xs text-slate-400 font-light mt-0.5">
                  Edite os valores mensais e anuais praticados na plataforma. As alterações impactam novos checkouts e renovações.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((p) => {
                  const isEditing = editingPlanId === p.id;
                  return (
                    <div
                      key={p.id}
                      className="p-5 bg-[#0a0a14] rounded-xl border border-purple-900/30 space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono-numbers text-amber-400 uppercase tracking-widest block">
                          {p.tier}
                        </span>
                        <h4 className="text-base font-cinzel font-bold text-white">{p.name}</h4>
                        <p className="text-xs text-slate-400 font-light">{p.targetAudience}</p>

                        {!isEditing ? (
                          <div className="p-3 bg-[#050508] rounded-lg border border-purple-900/20 font-mono-numbers space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Mensal:</span>
                              <span className="font-bold text-amber-300">R$ {p.monthlyPrice}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Anual:</span>
                              <span className="font-bold text-white">R$ {p.annualPrice}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 p-3 bg-[#050508] rounded-lg border border-purple-900/20 text-xs font-mono-numbers">
                            <div>
                              <label className="text-slate-400 block mb-0.5">Mensal (R$):</label>
                              <input
                                type="number"
                                value={editMonthlyPrice}
                                onChange={(e) => setEditMonthlyPrice(Number(e.target.value))}
                                className="w-full p-1.5 bg-[#0a0a14] border border-amber-500/40 rounded text-white"
                              />
                            </div>
                            <div>
                              <label className="text-slate-400 block mb-0.5">Anual (R$):</label>
                              <input
                                type="number"
                                value={editAnnualPrice}
                                onChange={(e) => setEditAnnualPrice(Number(e.target.value))}
                                className="w-full p-1.5 bg-[#0a0a14] border border-amber-500/40 rounded text-white"
                              />
                            </div>
                          </div>
                        )}

                        <div className="text-[11px] text-slate-400 font-mono-numbers space-y-1 pt-1">
                          <div>Usuários: {p.limits.maxUsers}</div>
                          <div>Agentes: {p.limits.maxAgents}</div>
                          <div>Missões: {p.limits.monthlyMissions}/mês</div>
                          <div>Docs: {p.limits.maxKnowledgeDocs}</div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-purple-900/20">
                        {!isEditing ? (
                          <button
                            onClick={() => {
                              setEditingPlanId(p.id);
                              setEditMonthlyPrice(p.monthlyPrice);
                              setEditAnnualPrice(p.annualPrice);
                            }}
                            className="w-full py-2 bg-purple-900/50 hover:bg-purple-800 text-amber-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Editar Valores
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingPlanId(null)}
                              className="w-1/2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleSavePlanPrice(p.id)}
                              className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Salvar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: SERVIÇOS EMPRESARIAIS & CONTRATOS */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              <div className="pb-3 border-b border-purple-900/20">
                <h3 className="text-sm font-cinzel font-bold text-white">
                  Gestão dos 4 Serviços Empresariais (Valores Configuráveis)
                </h3>
                <p className="text-xs text-slate-400 font-light mt-0.5">
                  Configure os honorários base para Diagnóstico, Implantação, Automações e Consultoria.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((srv) => {
                  const isEditing = editingServiceId === srv.id;
                  return (
                    <div
                      key={srv.id}
                      className="p-5 bg-[#0a0a14] rounded-xl border border-purple-900/30 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-mono-numbers text-amber-400 uppercase tracking-widest block">
                              {srv.code}
                            </span>
                            <h4 className="text-base font-cinzel font-bold text-white">{srv.name}</h4>
                          </div>

                          {!isEditing ? (
                            <span className="text-lg font-bold font-mono-numbers text-amber-300">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(srv.basePrice)}
                            </span>
                          ) : (
                            <div className="text-right">
                              <label className="text-[10px] text-slate-400 block">Novo Preço (R$):</label>
                              <input
                                type="number"
                                value={editServicePrice}
                                onChange={(e) => setEditServicePrice(Number(e.target.value))}
                                className="w-28 p-1 bg-[#050508] border border-amber-500/40 rounded text-xs text-white font-mono-numbers"
                              />
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 font-light">{srv.description}</p>
                        <span className="text-[11px] text-slate-400 font-mono-numbers block">
                          Prazo estimado: {!isEditing ? `${srv.deliveryTimelineDays} dias` : (
                            <input
                              type="number"
                              value={editServiceDays}
                              onChange={(e) => setEditServiceDays(Number(e.target.value))}
                              className="w-16 p-0.5 bg-[#050508] border border-purple-700 rounded text-xs text-white"
                            />
                          )}
                        </span>
                      </div>

                      <div className="pt-3 border-t border-purple-900/20">
                        {!isEditing ? (
                          <button
                            onClick={() => {
                              setEditingServiceId(srv.id);
                              setEditServicePrice(srv.basePrice);
                              setEditServiceDays(srv.deliveryTimelineDays);
                            }}
                            className="px-3 py-1.5 bg-purple-900/50 hover:bg-purple-800 text-amber-200 rounded text-xs font-semibold cursor-pointer"
                          >
                            Alterar Valor Base
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingServiceId(null)}
                              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleSaveServicePrice(srv.id)}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold cursor-pointer"
                            >
                              Salvar Novo Preço
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Active Contracts Table */}
              <div className="space-y-3 pt-4 border-t border-purple-900/30">
                <h4 className="text-xs font-cinzel font-bold text-white uppercase tracking-wider">
                  Contratos de Serviços Vigentes
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-purple-900/30 text-slate-400">
                        <th className="py-2 px-3 font-semibold">Empresa</th>
                        <th className="py-2 px-3 font-semibold">Serviço</th>
                        <th className="py-2 px-3 font-semibold">Valor</th>
                        <th className="py-2 px-3 font-semibold">Status</th>
                        <th className="py-2 px-3 font-semibold text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-900/20 text-slate-300 font-light font-mono-numbers">
                      {contracts.map((ctr) => (
                        <tr key={ctr.id} className="hover:bg-purple-950/20">
                          <td className="py-2.5 px-3 font-sans font-medium text-white">{ctr.companyName}</td>
                          <td className="py-2.5 px-3 text-slate-400 font-sans">{ctr.serviceName}</td>
                          <td className="py-2.5 px-3 font-bold text-amber-300">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ctr.price)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              ctr.status === 'DELIVERED' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                            }`}>
                              {ctr.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {ctr.status !== 'DELIVERED' && (
                              <button
                                onClick={async () => {
                                  const nextStatus = ctr.status === 'PROPOSAL' ? 'APPROVED' : ctr.status === 'APPROVED' ? 'IN_PROGRESS' : 'DELIVERED';
                                  await api.updateServiceContractStatus(ctr.id, nextStatus);
                                  loadMasterData();
                                  onRefreshData();
                                }}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-semibold cursor-pointer"
                              >
                                Avançar Status
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ASSINATURAS & LIQUIDAÇÃO PIX */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-purple-900/20">
                <h3 className="text-sm font-cinzel font-bold text-white">
                  Controle de Assinaturas & Validação de Pagamentos Pix
                </h3>
                <span className="text-xs font-mono-numbers text-slate-400">
                  {subscriptions.length} Assinaturas Totais
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-purple-900/30 text-slate-400">
                      <th className="py-2.5 px-3 font-semibold">Empresa / Cliente</th>
                      <th className="py-2.5 px-3 font-semibold">Plano</th>
                      <th className="py-2.5 px-3 font-semibold">Ciclo</th>
                      <th className="py-2.5 px-3 font-semibold">Valor</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                      <th className="py-2.5 px-3 font-semibold">Validade</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Ações Master</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-900/20 text-slate-300 font-light font-mono-numbers">
                    {subscriptions.map((s) => (
                      <tr key={s.id} className="hover:bg-purple-950/20">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-white block font-sans">{s.companyName}</span>
                          <span className="text-[10px] text-slate-400">{s.customerEmail}</span>
                        </td>
                        <td className="py-2.5 px-3 font-sans text-amber-300 font-medium">{s.planTier}</td>
                        <td className="py-2.5 px-3 uppercase text-[11px]">{s.billingCycle}</td>
                        <td className="py-2.5 px-3 font-bold text-white">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.price)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            s.status === 'ACTIVE' 
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' 
                              : s.status === 'PENDING_PAYMENT'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {new Date(s.expiresAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 font-sans">
                            {s.status === 'ACTIVE' && (
                              <>
                                <button
                                  onClick={() => handleSuspendSubscription(s.id)}
                                  className="px-2 py-1 bg-amber-950/80 hover:bg-amber-800 text-amber-200 border border-amber-600/40 rounded text-[10px] font-semibold cursor-pointer"
                                  title="Bloquear por inadimplência"
                                >
                                  Bloquear
                                </button>
                                <button
                                  onClick={() => handleCancelSubscription(s.id)}
                                  className="px-2 py-1 bg-rose-950/80 hover:bg-rose-800 text-rose-200 border border-rose-600/40 rounded text-[10px] font-semibold cursor-pointer"
                                  title="Cancelar assinatura"
                                >
                                  Cancelar
                                </button>
                              </>
                            )}
                            {s.status === 'SUSPENDED' && (
                              <button
                                onClick={() => handleReactivateSubscription(s.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Reativar
                              </button>
                            )}
                            {s.status === 'PENDING_PAYMENT' && s.pixChargeId && (
                              <button
                                onClick={async () => {
                                  await api.simulatePixWebhook(s.pixChargeId!);
                                  loadMasterData();
                                  onRefreshData();
                                }}
                                className="px-2 py-1 bg-purple-900 hover:bg-purple-800 text-amber-300 border border-purple-600/40 rounded text-[10px] font-semibold cursor-pointer"
                              >
                                Homologar Pix
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: FINANCEIRO & MARGEM & COMISSÕES */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div className="pb-3 border-b border-purple-900/20">
                <h3 className="text-sm font-cinzel font-bold text-white">
                  Demonstração de Resultado & Comissionamento
                </h3>
                <p className="text-xs text-slate-400 font-light mt-0.5">
                  Receita real confirmada, custos operacionais auditados e comissões para parceiros.
                </p>
              </div>

              {/* Live Pix vs Seed Demo Revenue Separation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#070b14] rounded-xl border border-emerald-500/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Receita Pix Validada em Produção (Live):</span>
                    <span className="text-[10px] uppercase font-mono-numbers text-emerald-400 font-bold px-1.5 py-0.5 bg-emerald-950/60 rounded">
                      Autenticado BACEN
                    </span>
                  </div>
                  <span className="text-2xl font-bold font-mono-numbers text-emerald-400 block">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.realVerifiedPixRevenue || 0)}
                  </span>
                  <span className="text-[11px] text-slate-400 font-light block">
                    Transações com payload EMV gerado dinamicamente e conciliação bancária confirmada.
                  </span>
                </div>

                <div className="p-4 bg-[#0a0a14] rounded-xl border border-purple-900/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Receitas de Demonstração (Seed/Testes):</span>
                    <span className="text-[10px] uppercase font-mono-numbers text-amber-400 font-bold px-1.5 py-0.5 bg-amber-950/60 rounded">
                      Seed Template
                    </span>
                  </div>
                  <span className="text-2xl font-bold font-mono-numbers text-slate-300 block">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.seedDemoRevenue || 0)}
                  </span>
                  <span className="text-[11px] text-slate-500 font-light block">
                    Contratos modelo do repositório inicial para simulação de telas e vitrines.
                  </span>
                </div>
              </div>

              {/* DRE Operacional Real Auditado */}
              <div className="p-5 bg-[#07070f] rounded-xl border border-purple-900/40 space-y-4">
                <div className="flex items-center justify-between border-b border-purple-900/20 pb-2">
                  <h4 className="text-xs font-cinzel font-bold text-white uppercase tracking-wider">
                    DRE Operacional Real Auditado (Sem Estimativas Falsas)
                  </h4>
                  <span className="text-xs font-mono-numbers text-amber-300 font-bold">
                    Margem Líquida Real: {stats?.realNetMarginPercent || 0}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-numbers">
                  <div className="p-2.5 bg-[#050508] rounded-lg border border-purple-900/20">
                    <span className="text-slate-400 block text-[10px]">Faturamento Bruto:</span>
                    <span className="font-bold text-emerald-400">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.grossRevenue || 0)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#050508] rounded-lg border border-rose-900/20">
                    <span className="text-slate-400 block text-[10px]">(-) Impostos (8.5% Simples):</span>
                    <span className="font-bold text-rose-400">
                      - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.estimatedTaxes || 0)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#050508] rounded-lg border border-rose-900/20">
                    <span className="text-slate-400 block text-[10px]">(-) Inferência & Tokens IA:</span>
                    <span className="font-bold text-rose-400">
                      - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.estimatedAiTokenCost || 0)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#050508] rounded-lg border border-rose-900/20">
                    <span className="text-slate-400 block text-[10px]">(-) Servidores & Cloud:</span>
                    <span className="font-bold text-rose-400">
                      - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.infrastructureCost || 0)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#050508] rounded-lg border border-rose-900/20">
                    <span className="text-slate-400 block text-[10px]">(-) Taxas Pix BACEN:</span>
                    <span className="font-bold text-rose-400">
                      - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.gatewayFees || 0)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#050508] rounded-lg border border-rose-900/20">
                    <span className="text-slate-400 block text-[10px]">(-) Comissões Parceiros:</span>
                    <span className="font-bold text-rose-400">
                      - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.partnerCommissionsCost || 0)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#050508] rounded-lg border border-amber-900/30 col-span-2">
                    <span className="text-slate-400 block text-[10px]">(=) Resultado Líquido Real Auditado:</span>
                    <span className="font-bold text-amber-300 text-sm">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.realNetOperatingResult || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Partners Commissions Table */}
              <div className="space-y-3 pt-3">
                <h4 className="text-xs font-cinzel font-bold text-white uppercase tracking-wider">
                  Comissões de Parceiros & Afiliados
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-purple-900/30 text-slate-400">
                        <th className="py-2 px-3 font-semibold">Parceiro</th>
                        <th className="py-2 px-3 font-semibold">Código</th>
                        <th className="py-2 px-3 font-semibold">Taxa</th>
                        <th className="py-2 px-3 font-semibold">Leads</th>
                        <th className="py-2 px-3 font-semibold">Fechados</th>
                        <th className="py-2 px-3 font-semibold">Gerado</th>
                        <th className="py-2 px-3 font-semibold">Liquidado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-900/20 text-slate-300 font-light font-mono-numbers">
                      {partners.map((prt) => (
                        <tr key={prt.id} className="hover:bg-purple-950/20">
                          <td className="py-2.5 px-3 font-sans font-medium text-white">{prt.name}</td>
                          <td className="py-2.5 px-3 text-amber-300">{prt.referralCode}</td>
                          <td className="py-2.5 px-3">{prt.commissionRate}%</td>
                          <td className="py-2.5 px-3">{prt.totalReferredLeads}</td>
                          <td className="py-2.5 px-3 text-emerald-400 font-bold">{prt.totalDealsClosed}</td>
                          <td className="py-2.5 px-3 font-bold text-amber-400">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prt.totalCommissionEarned)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prt.totalCommissionPaid)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: CRM & PROPOSTAS COMERCIAIS */}
          {activeTab === 'crm' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-purple-900/20">
                <h3 className="text-sm font-cinzel font-bold text-white">
                  Propostas Comerciais do Observatório
                </h3>
                <span className="text-xs font-mono-numbers text-slate-400">
                  {proposals.length} Propostas Emitidas
                </span>
              </div>

              <div className="space-y-3">
                {proposals.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-4 bg-[#0a0a14] rounded-xl border border-purple-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{prop.companyName}</span>
                        <span className="text-xs text-slate-400 font-light font-mono-numbers">
                          ({prop.contactName} · {prop.contactEmail})
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-light">
                        {prop.servicesIncluded.join(' + ')}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono-numbers block">
                        Validade: {new Date(prop.validUntil).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-bold font-mono-numbers text-amber-300 block">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prop.finalValue)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        prop.status === 'ACCEPTED' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                      }`}>
                        {prop.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: APROVAÇÕES AYIN CORE */}
          {activeTab === 'approvals' && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-purple-900/20">
                <h3 className="text-sm font-cinzel font-bold text-white">
                  Fila de Aprovação Soberana AYIN CORE
                </h3>
                <p className="text-xs text-slate-400 font-light mt-0.5">
                  Operações que excederam o limite financeiro ou alteram diretrizes sensíveis requerem chancela expressa do Master Owner.
                </p>
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-[#0a0a14] rounded-xl border border-purple-900/30">
                  <CheckCircle className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
                  Nenhuma missão ou operação pendente de autorização no momento.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map((m) => (
                    <div
                      key={m.id}
                      className="p-5 bg-[#0a0a14] rounded-xl border border-amber-500/40 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            <h4 className="text-sm font-semibold text-white">{m.title}</h4>
                          </div>
                          <p className="text-xs text-slate-300 font-light mt-1">{m.objective}</p>
                          <span className="text-xs text-rose-300 font-medium mt-1 block">
                            Motivo da Retenção: {m.sensitiveReason || 'Impacto financeiro ou de segurança detectado'}
                          </span>
                        </div>

                        <span className="text-[10px] font-mono-numbers px-2 py-0.5 bg-amber-950 text-amber-300 rounded border border-amber-500/30">
                          Prioridade: {m.priority.toUpperCase()}
                        </span>
                      </div>

                      <div className="pt-3 border-t border-purple-900/20 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleReject(m.id)}
                          className="px-4 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/40 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Rejeitar Missão
                        </button>
                        <button
                          onClick={() => handleApprove(m.id)}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer shadow"
                        >
                          Autorizar & Executar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 9: AUDITORIA SHA-256 */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-purple-900/20 text-xs text-slate-400">
                <span>Registros imutáveis com encadeamento criptográfico SHA-256</span>
                <span className="font-mono-numbers">{auditLogs.length} Entradas Auditadas</span>
              </div>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-[#05050a] rounded-lg border border-purple-900/20 space-y-1 font-mono-numbers text-xs"
                  >
                    <div className="flex justify-between text-slate-400">
                      <span className="text-amber-300 font-semibold">{log.action}</span>
                      <span>{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="text-slate-200 font-sans text-xs">{log.details}</p>
                    <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                      <span>Ator: {log.actorEmail}</span>
                      <span className="truncate max-w-sm" title={log.hash}>Hash: {log.hash}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: PROJETOS DE DESENVOLVIMENTO CORPORATIVO (Phase 01) */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-purple-900/20">
                <div>
                  <h3 className="text-sm font-cinzel font-bold text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-amber-400" />
                    <span>Gestão Central de Projetos de Desenvolvimento & Entregas</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-light mt-0.5">
                    Controle de implantações, tarefas por agentes, prazos de entrega e homologação formal de clientes.
                  </p>
                </div>
                <span className="text-xs font-mono-numbers px-3 py-1 glass-obsidian border border-purple-900/30 rounded text-amber-300">
                  {projects.length} Projetos Totais
                </span>
              </div>

              {projects.length === 0 ? (
                <div className="p-12 text-center glass-obsidian rounded-xl border border-purple-900/20 text-slate-400 text-xs">
                  Nenhum projeto registrado no sistema.
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map((proj) => {
                    const doneCount = proj.tasks.filter(t => t.status === 'completed').length;
                    const totalCount = proj.tasks.length || 1;
                    const pct = Math.round((doneCount / totalCount) * 100);

                    return (
                      <div
                        key={proj.id}
                        className="p-5 bg-[#05050a] rounded-xl border border-purple-900/30 space-y-4 hover:border-purple-600/40 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30 uppercase font-mono-numbers">
                                {proj.companyName}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                proj.status === 'DELIVERED'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                  : proj.status === 'CLIENT_APPROVAL'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                  : 'bg-purple-950 text-purple-300 border border-purple-500/40'
                              }`}>
                                {proj.status}
                              </span>
                              <span className="text-xs text-slate-400 font-mono-numbers">
                                Limite: {proj.deadline}
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold text-white">{proj.title}</h4>
                            <p className="text-xs text-slate-300 font-light mt-0.5">{proj.description}</p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold font-mono-numbers text-amber-400">{pct}% Concluído</span>
                            <span className="text-[10px] text-slate-500 block font-mono-numbers">
                              {doneCount}/{totalCount} tarefas
                            </span>
                          </div>
                        </div>

                        {/* Task List */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-purple-900/20">
                          {proj.tasks.map((task) => (
                            <div
                              key={task.id}
                              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                                task.status === 'completed'
                                  ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-200'
                                  : task.status === 'in_progress'
                                  ? 'bg-amber-950/20 border-amber-900/30 text-amber-200'
                                  : 'bg-[#07070f] border-purple-900/20 text-slate-400'
                              }`}
                            >
                              <div>
                                <span className="font-medium text-white block">{task.title}</span>
                                <span className="text-[10px] text-slate-400">
                                  {task.assignedAgent} · {task.deadline}
                                </span>
                              </div>
                              <span className="text-[9px] uppercase font-mono-numbers font-bold">
                                {task.status}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-purple-900/10">
                          <span>
                            Aceite do Cliente: <strong className="text-amber-300">{proj.clientApprovalStatus}</strong>
                            {proj.clientFeedback && ` · "${proj.clientFeedback}"`}
                          </span>
                          {proj.deliveredAt && (
                            <span className="text-emerald-400 font-mono-numbers text-[11px]">
                              Entregue em {new Date(proj.deliveredAt).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: SUPORTE & CUSTOMER SUCCESS (Phase 01) */}
          {activeTab === 'support' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-purple-900/20">
                <div>
                  <h3 className="text-sm font-cinzel font-bold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <span>Central Soberana de Suporte & Customer Success</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-light mt-0.5">
                    Monitoramento de chamados corporativos, históricos de mensagens e resolução de demandas de clientes.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono-numbers">
                  <span className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-500/30 rounded">
                    {supportTickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length} Abertos
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500/30 rounded">
                    {supportTickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length} Resolvidos
                  </span>
                </div>
              </div>

              {supportTickets.length === 0 ? (
                <div className="p-12 text-center glass-obsidian rounded-xl border border-purple-900/20 text-slate-400 text-xs">
                  Nenhum chamado de suporte registrado.
                </div>
              ) : (
                <div className="space-y-4">
                  {supportTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-5 bg-[#05050a] rounded-xl border border-purple-900/30 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30 font-mono-numbers uppercase">
                              {ticket.companyName}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30 uppercase">
                              {ticket.category}
                            </span>
                            <span className="text-xs text-slate-400 font-mono-numbers">
                              Prioridade: {ticket.priority} · {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-white">{ticket.subject}</h4>
                          <p className="text-xs text-slate-300 font-light mt-0.5">{ticket.description}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-bold px-3 py-1 rounded uppercase ${
                            ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          }`}>
                            {ticket.status}
                          </span>
                          {ticket.status !== 'RESOLVED' && (
                            <button
                              onClick={async () => {
                                await api.updateTicketStatus(ticket.id, 'RESOLVED');
                                loadMasterData();
                                onRefreshData();
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold cursor-pointer transition-colors"
                            >
                              Resolver
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Messages Thread preview */}
                      <div className="space-y-2 pt-2 border-t border-purple-900/20 max-h-48 overflow-y-auto pr-1">
                        {ticket.communicationHistory.map((m) => (
                          <div
                            key={m.id}
                            className={`p-2.5 rounded-lg text-xs space-y-0.5 ${
                              m.senderRole === 'CLIENT'
                                ? 'bg-black/60 border border-slate-800 text-slate-300'
                                : 'bg-purple-950/40 border border-purple-900/30 text-purple-200'
                            }`}
                          >
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span className="font-semibold text-white">{m.senderName} ({m.senderRole})</span>
                              <span>{new Date(m.timestamp).toLocaleTimeString('pt-BR')}</span>
                            </div>
                            <p className="font-light">{m.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: REDE INTER-AGENTES 11 & COLABORAÇÃO (Phase 01) */}
          {activeTab === 'agent_network' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-purple-900/20 gap-3">
                <div>
                  <h3 className="text-sm font-cinzel font-bold text-white flex items-center gap-2">
                    <Network className="w-4 h-4 text-amber-400" />
                    <span>Constelação dos 11 Agentes Autônomos & Barramento Inter-Agentes</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-light mt-0.5">
                    Fluxo contínuo de tarefas estruturadas: RADAR → LEAD → SALES → FINANCE → SUBSCRIPTION → CUSTOMER → MARKETING → CREATIVE → MARKET → ANALYTICS → REPORT.
                  </p>
                </div>

                <button
                  onClick={handleRunAgentCycle}
                  disabled={isRunningAgentCycle}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-600 via-amber-700 to-purple-800 hover:from-amber-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-amber-900/30 flex items-center gap-2 disabled:opacity-50 shrink-0"
                >
                  <Zap className={`w-4 h-4 ${isRunningAgentCycle ? 'animate-spin' : ''}`} />
                  <span>{isRunningAgentCycle ? 'Processando Ciclo...' : 'Disparar Rodada dos 11 Agentes'}</span>
                </button>
              </div>

              {agentCycleSummary && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{agentCycleSummary}</span>
                </div>
              )}

              {/* 11 Agents Status Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { name: 'RADAR AGENT', role: 'Varredura & Oportunidades', color: 'text-amber-400' },
                  { name: 'LEAD AGENT', role: 'Qualificação & BANT', color: 'text-emerald-400' },
                  { name: 'SALES AGENT', role: 'Propostas & Negociação', color: 'text-purple-400' },
                  { name: 'FINANCE AGENT', role: 'Cobrança Pix & DRE', color: 'text-amber-300' },
                  { name: 'SUBSCRIPTION AGENT', role: 'Auditoria de Planos & Cotas', color: 'text-blue-400' },
                  { name: 'CUSTOMER AGENT', role: 'Onboarding & CS 24/7', color: 'text-emerald-300' },
                  { name: 'MARKETING AGENT', role: 'Campanhas & Pautas', color: 'text-rose-400' },
                  { name: 'CREATIVE AGENT', role: 'Copies & Visual Obsidian', color: 'text-purple-300' },
                  { name: 'MARKET AGENT', role: 'Benchmarking Concorrentes', color: 'text-cyan-400' },
                  { name: 'ANALYTICS AGENT', role: 'Métricas Reais & Margens', color: 'text-amber-400' },
                  { name: 'REPORT AGENT', role: 'Dossiê Executivo Master', color: 'text-white' }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 glass-obsidian rounded-xl border border-purple-900/30 text-xs space-y-1">
                    <span className={`font-bold block ${item.color}`}>{item.name}</span>
                    <span className="text-[10px] text-slate-400 block line-clamp-1">{item.role}</span>
                    <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono-numbers pt-1 border-t border-purple-900/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Operacional 24/7</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Inter-Agent Collaboration Bus Logs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider">
                    Log Estruturado de Handoffs & Mensageria Inter-Agentes
                  </span>
                  <span className="text-slate-500 font-mono-numbers">{agentInteractions.length} Registros</span>
                </div>

                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {agentInteractions.slice().reverse().map((int) => (
                    <div
                      key={int.id}
                      className="p-4 bg-[#05050a] rounded-xl border border-purple-900/30 space-y-2 hover:border-purple-600/40 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 font-mono-numbers">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400 font-bold">{int.fromAgent}</span>
                          <span className="text-slate-500">→</span>
                          <span className="text-purple-300 font-bold">{int.toAgent}</span>
                          <span className="text-[10px] px-2 py-0.2 bg-purple-950 border border-purple-900 rounded text-slate-300">
                            {int.actionType}
                          </span>
                        </div>
                        <span className="text-slate-500 text-[11px]">
                          {new Date(int.timestamp).toLocaleTimeString('pt-BR')}
                        </span>
                      </div>

                      <h5 className="text-xs font-semibold text-white">{int.subject}</h5>
                      <p className="text-xs text-slate-300 font-light leading-relaxed bg-black/40 p-2.5 rounded-lg border border-purple-900/20">
                        {int.verifiableOutput}
                      </p>

                      <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 font-mono-numbers">
                        <span>Status: <strong className={int.status === 'PROCESSED' ? 'text-emerald-400' : 'text-amber-400'}>{int.status}</strong></span>
                        {int.isSensitive && int.status === 'AWAITING_MASTER_APPROVAL' && (
                          <button
                            onClick={() => handleApproveInteraction(int.id)}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold cursor-pointer"
                          >
                            Autorizar Ação Master
                          </button>
                        )}
                        {int.masterApprovedBy && (
                          <span className="text-amber-300">Autorizado por: {int.masterApprovedBy}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: SEGURANÇA */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="pb-3 border-b border-purple-900/20">
                <h3 className="text-sm font-cinzel font-bold text-white">
                  Credenciais Soberanas do Master Owner
                </h3>
                <p className="text-xs text-slate-400 font-light mt-0.5">
                  Atualize sua senha mestra. Utiliza derivação criptográfica scrypt com salt de 64 bytes.
                </p>
              </div>

              {securityStatus && (
                <div className="p-3 bg-purple-950/60 border border-purple-500/40 rounded-xl text-xs text-amber-200">
                  {securityStatus}
                </div>
              )}

              <form onSubmit={handleUpdateCredentials} className="max-w-md space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1">Senha Atual:</label>
                  <input
                    type="password"
                    required
                    value={currPass}
                    onChange={(e) => setCurrPass(e.target.value)}
                    className="w-full p-2.5 bg-[#05050a] border border-purple-900/40 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Nova Senha Mestra:</label>
                  <input
                    type="password"
                    required
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full p-2.5 bg-[#05050a] border border-purple-900/40 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Confirmar Nova Senha:</label>
                  <input
                    type="password"
                    required
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="w-full p-2.5 bg-[#05050a] border border-purple-900/40 rounded-lg text-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white rounded-lg font-bold transition-all cursor-pointer shadow"
                  >
                    Salvar Novas Credenciais
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
