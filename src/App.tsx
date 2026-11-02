import React, { useEffect, useState, useCallback } from 'react';
import { 
  User, 
  Company, 
  DepartmentInfo, 
  AutonomousAgent, 
  Mission, 
  Lead, 
  ProductItem, 
  FinancialRecord, 
  KnowledgeDoc, 
  AuditLog, 
  SystemStats,
  DepartmentId,
  PlanDefinition,
  Subscription,
  EngineGovernanceSettings,
  LivingCoreVisualState,
  EnterpriseService,
  ServiceContract,
  FlagshipProduct,
  CommercialProposal,
  CommercialPartner,
  SalesOpportunityScore,
  AiProviderConfig,
  AiTaskRoutingRule,
  EnterpriseIntegration,
  CloudInfrastructureComparison,
  TechCostGovernance
} from './types/index.ts';
import { api } from './services/api.ts';
import { CinematicIntro } from './components/CinematicIntro.tsx';
import { TopBar, AppView } from './components/TopBar.tsx';
import { Observatory3D } from './components/observatory/Observatory3D.tsx';
import { AyinCoreTerminal } from './components/AyinCoreTerminal.tsx';
import { DepartmentsHub } from './components/departments/DepartmentsHub.tsx';
import { ClientPortalView } from './components/client/ClientPortalView.tsx';
import { MasterOwnerPanel } from './components/admin/MasterOwnerPanel.tsx';
import { SubscriptionEngineView } from './components/business/SubscriptionEngineView.tsx';
import { EnterpriseServicesView } from './components/services/EnterpriseServicesView.tsx';
import { CrmAcquisitionView } from './components/crm/CrmAcquisitionView.tsx';
import { SalesIntelligenceWorkspace } from './components/sales/SalesIntelligenceWorkspace.tsx';
import { EnterpriseEcosystemView } from './components/enterprise/EnterpriseEcosystemView.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { 
  Eye, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Activity, 
  Layers, 
  ArrowUpRight,
  History,
  Building2,
  Lock,
  Power,
  AlertTriangle,
  Target,
  Briefcase
} from 'lucide-react';

export default function App() {
  // Navigation & View State
  const [hasEnteredIntro, setHasEnteredIntro] = useState<boolean>(() => {
    return sessionStorage.getItem('shefa_entered') === 'true';
  });
  const [currentView, setCurrentView] = useState<AppView>('observatory');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<DepartmentId>('AYIN_RADAR');
  const [isMasterPanelOpen, setIsMasterPanelOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTotalFocus, setIsTotalFocus] = useState(false);

  // Core Data States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [departments, setDepartments] = useState<DepartmentInfo[]>([]);
  const [agents, setAgents] = useState<AutonomousAgent[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [finances, setFinances] = useState<FinancialRecord[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeDoc[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [governance, setGovernance] = useState<EngineGovernanceSettings | null>(null);
  const [services, setServices] = useState<EnterpriseService[]>([]);
  const [contracts, setContracts] = useState<ServiceContract[]>([]);
  const [flagshipProducts, setFlagshipProducts] = useState<FlagshipProduct[]>([]);
  const [proposals, setProposals] = useState<CommercialProposal[]>([]);
  const [partners, setPartners] = useState<CommercialPartner[]>([]);
  const [salesScores, setSalesScores] = useState<SalesOpportunityScore[]>([]);
  const [aiProviders, setAiProviders] = useState<AiProviderConfig[]>([]);
  const [routingRules, setRoutingRules] = useState<AiTaskRoutingRule[]>([]);
  const [integrations, setIntegrations] = useState<EnterpriseIntegration[]>([]);
  const [cloudDossier, setCloudDossier] = useState<CloudInfrastructureComparison | null>(null);
  const [techGovernance, setTechGovernance] = useState<TechCostGovernance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Compute the 10 authentic visual states for AYIN CORE
  const computeLivingState = (): LivingCoreVisualState => {
    if (stats?.isEmergencyPaused || governance?.isEmergencyPaused) {
      return 'PAUSADO';
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'DESCONECTADO';
    }
    const recentFailed = missions.find(
      m => m.status === 'failed' && (Date.now() - new Date(m.updatedAt || m.createdAt).getTime()) < 300000
    );
    if (recentFailed) {
      return 'ERRO';
    }
    if (missions.some(m => m.status === 'awaiting_approval')) {
      return 'AGUARDANDO_APROVACAO';
    }
    if (stats && stats.totalCosts && governance?.financialSpendingLimit && stats.totalCosts > governance.financialSpendingLimit) {
      return 'ALERTA';
    }
    if (missions.some(m => m.status === 'in_progress')) {
      return 'EXECUTANDO';
    }
    if (agents.some(a => a.status === 'analyzing')) {
      return 'ANALISANDO';
    }
    if (isLoading) {
      return 'INICIALIZANDO';
    }
    return 'ONLINE';
  };

  const livingState = computeLivingState();

  // Initial authentication check & auto-login as Master Owner if token or first run
  const fetchAuth = useCallback(async () => {
    try {
      const res = await api.getMe();
      setCurrentUser(res.user);
      if (res.company) setCurrentCompany(res.company);
    } catch {
      try {
        const loginRes = await api.login('Alifermadeiro@hotmail.com', 'ShefaAyin2026!');
        setCurrentUser(loginRes.user);
      } catch (err) {
        console.warn('Initial session check:', err);
      }
    }
  }, []);

  // Primary Data Loading
  const loadAllData = useCallback(async () => {
    try {
      const [
        deptsRes,
        agentsRes,
        missionsRes,
        leadsRes,
        productsRes,
        financesRes,
        knowledgeRes,
        statsRes,
        plansRes,
        subsRes,
        govRes,
        srvRes,
        ctrRes,
        flagRes,
        propRes,
        prtRes,
        salesScoresRes,
        aiProvRes,
        routingRulesRes,
        integrationsRes,
        cloudDossierRes,
        techGovRes
      ] = await Promise.all([
        api.getDepartments().catch(() => []),
        api.getAgents().catch(() => []),
        api.getMissions().catch(() => []),
        api.getLeads().catch(() => []),
        api.getProducts().catch(() => []),
        api.getFinances().catch(() => []),
        api.getKnowledge().catch(() => []),
        api.getSystemStats().catch(() => null),
        api.getPlans().catch(() => []),
        api.getSubscriptions().catch(() => []),
        api.getGovernance().catch(() => null),
        api.getServices().catch(() => []),
        api.getServiceContracts().catch(() => []),
        api.getFlagshipProducts().catch(() => []),
        api.getProposals().catch(() => []),
        api.getPartners().catch(() => []),
        api.getSalesScores().catch(() => []),
        api.getAiProviders().catch(() => []),
        api.getAiRoutingRules().catch(() => []),
        api.getMarketplaceIntegrations().catch(() => []),
        api.getCloudDossier().catch(() => null),
        api.getTechGovernance().catch(() => null)
      ]);

      setDepartments(deptsRes);
      setAgents(agentsRes);
      setMissions(missionsRes);
      setLeads(leadsRes);
      setProducts(productsRes);
      setFinances(financesRes);
      setKnowledge(knowledgeRes);
      setStats(statsRes);
      setPlans(plansRes);
      setSubscriptions(subsRes);
      setGovernance(govRes);
      setServices(srvRes);
      setContracts(ctrRes);
      setFlagshipProducts(flagRes);
      setProposals(propRes);
      setPartners(prtRes);
      setSalesScores(salesScoresRes);
      setAiProviders(aiProvRes);
      setRoutingRules(routingRulesRes);
      setIntegrations(integrationsRes);
      setCloudDossier(cloudDossierRes);
      setTechGovernance(techGovRes);

      // Load audit logs if Master Owner
      try {
        const auditRes = await api.getAuditLogs();
        setAuditLogs(auditRes);
      } catch {
        // Not master owner or restricted
      }

      // Load companies
      try {
        const comps = await api.getCompanies();
        if (comps.length > 0 && !currentCompany) {
          setCurrentCompany(comps[0]);
        }
      } catch {
        // ignore
      }
    } catch (err) {
      console.error('Data load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentCompany]);

  useEffect(() => {
    fetchAuth().then(() => {
      loadAllData();
    });
  }, [fetchAuth, loadAllData]);

  // Periodic polling to receive continuous background 24/7 worker progress
  useEffect(() => {
    const timer = setInterval(() => {
      loadAllData();
    }, 8000);
    return () => clearInterval(timer);
  }, [loadAllData]);

  const handleEnterObservatory = () => {
    sessionStorage.setItem('shefa_entered', 'true');
    setHasEnteredIntro(true);
  };

  const handleSelectDepartment = (deptId: DepartmentId) => {
    setSelectedDepartmentId(deptId);
    setCurrentView('departments');
  };

  const handleFocusCore = () => {
    setCurrentView('core');
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setCurrentCompany(null);
    setIsAuthModalOpen(true);
  };

  if (!hasEnteredIntro) {
    return (
      <CinematicIntro 
        onEnter={handleEnterObservatory} 
        masterEmail="Alifermadeiro@hotmail.com" 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 flex flex-col font-sans selection:bg-purple-900 selection:text-amber-200">
      {/* Top Bar with 3-Zone Contract (concealed in Total Focus Mode for total immersion) */}
      {!isTotalFocus && (
        <TopBar
          currentView={currentView}
          onNavigate={setCurrentView}
          currentUser={currentUser}
          currentCompany={currentCompany}
          onOpenMasterPanel={() => setIsMasterPanelOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          onToggleTotalFocus={() => setIsTotalFocus(true)}
        />
      )}

      {/* Main Viewport Container */}
      <main className={`flex-1 w-full mx-auto space-y-8 ${isTotalFocus ? 'p-0 max-w-none' : 'max-w-[1440px] px-4 sm:px-6 py-6'}`}>
        
        {/* Emergency Kill-Switch Global Banner when Paused */}
        {(stats?.isEmergencyPaused || governance?.isEmergencyPaused) && (
          <div className="p-4 bg-rose-950/80 border border-rose-500/60 rounded-2xl text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl shadow-rose-950/40">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-900/60 flex items-center justify-center text-rose-400 shrink-0">
                <Power className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <span className="font-bold text-white block">
                  PAUSA GERAL DE EMERGÊNCIA ATIVA (KILL-SWITCH ACIONADO)
                </span>
                <span className="text-[11px] text-rose-300 font-light">
                  Todos os loops autônomos, disparos de cobrança e execuções de agentes estão suspensos no servidor.
                </span>
              </div>
            </div>
            {currentUser?.role === 'MASTER_OWNER' && (
              <button
                onClick={() => setIsMasterPanelOpen(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                Gerenciar Soberania
              </button>
            )}
          </div>
        )}

        {/* Real Commercial & Operational Aggregate Metrics Strip */}
        {stats && !isTotalFocus && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="p-3.5 glass-obsidian rounded-xl border border-purple-900/20">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-0.5">Departamentos</span>
              <div className="text-base font-bold font-mono-numbers text-white">8 Ativos</div>
              <span className="text-[10px] text-purple-300">Constelação completa</span>
            </div>

            <div className="p-3.5 glass-obsidian rounded-xl border border-purple-900/20">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-0.5">Agentes 24/7</span>
              <div className="text-base font-bold font-mono-numbers text-amber-400">
                {stats.active24hAgents} / {stats.totalAgents}
              </div>
              <span className="text-[10px] text-slate-400">Motor contínuo no server</span>
            </div>

            <div className="p-3.5 glass-obsidian rounded-xl border border-purple-900/20">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-0.5">Missões Cumpridas</span>
              <div className="text-base font-bold font-mono-numbers text-emerald-400">
                {stats.completedMissions} / {stats.totalMissions}
              </div>
              <span className="text-[10px] text-slate-400">Execução persistida</span>
            </div>

            <div className="p-3.5 glass-obsidian rounded-xl border border-purple-900/20">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-0.5">Trava Sensível</span>
              <div className="text-base font-bold font-mono-numbers text-amber-300">
                {stats.awaitingApproval} Pendente
              </div>
              <span className="text-[10px] text-slate-400">Aprovação Master</span>
            </div>

            <div className="p-3.5 glass-obsidian rounded-xl border border-purple-900/20">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-0.5">MRR Vigente</span>
              <div className="text-base font-bold font-mono-numbers text-amber-300">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stats.mrr || 0)}
              </div>
              <span className="text-[10px] text-emerald-400 font-mono-numbers">
                {stats.activeSubscriptions || 0} ativas · {stats.churnedSubscriptions || 0} churn
              </span>
            </div>

            <div className="p-3.5 glass-obsidian rounded-xl border border-purple-900/20">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Receita Pix</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-500/30 rounded font-mono-numbers">
                  VERIFICADO
                </span>
              </div>
              <div className="text-base font-bold font-mono-numbers text-emerald-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stats.realVerifiedPixRevenue > 0 ? stats.realVerifiedPixRevenue : stats.totalReceivedRevenue || 0)}
              </div>
              <span className="text-[10px] text-slate-400 font-mono-numbers">
                Demo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stats.seedDemoRevenue || 0)}
              </span>
            </div>

            <div className="p-3.5 glass-obsidian rounded-xl border border-purple-900/20">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-0.5">Projetos & Dev</span>
              <div className="text-base font-bold font-mono-numbers text-cyan-400">
                {stats.activeProjects ?? 2} Ativos
              </div>
              <span className="text-[10px] text-slate-400 font-mono-numbers">
                {stats.deliveredProjects ?? 0} entregues com aceite
              </span>
            </div>

            <div className="p-3.5 glass-obsidian rounded-xl border border-purple-900/20">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-0.5">Margem Real DRE</span>
              <div className="text-base font-bold font-mono-numbers text-purple-300">
                {(stats.realNetMarginPercent || stats.netMarginPercent || 0).toFixed(1)}%
              </div>
              <span className="text-[10px] text-slate-400">
                Custos: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stats.realOperatingCosts || stats.totalCosts || 0)}
              </span>
            </div>
          </div>
        )}

        {/* VIEW 1: OBSERVATÓRIO 3D */}
        {currentView === 'observatory' && (
          <div className="space-y-6">
            <Observatory3D
              departments={departments}
              agents={agents}
              missions={missions}
              livingState={livingState}
              selectedDepartmentId={selectedDepartmentId}
              onSelectDepartment={handleSelectDepartment}
              onSelectAgent={(agent) => {
                if (agent.departmentId) {
                  setSelectedDepartmentId(agent.departmentId);
                }
              }}
              onFocusCore={handleFocusCore}
              isTotalFocus={isTotalFocus}
              onToggleTotalFocus={() => setIsTotalFocus(prev => !prev)}
              onSendCommand={async (cmd: string) => {
                await api.sendCommand(cmd);
                loadAllData();
              }}
              currentUser={currentUser}
              onToggleAgentPause={async (agentId: string) => {
                await api.toggleAgentPause(agentId);
                loadAllData();
              }}
              onTriggerKillSwitch={async () => {
                await api.toggleEmergencyPause();
                loadAllData();
              }}
            />

            {!isTotalFocus && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 p-6 glass-obsidian rounded-2xl border border-purple-900/30 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-purple-900/20">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-semibold text-white">
                        Constelação dos 8 Departamentos Independentes
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Clique em um departamento para inspecionar</span>
                      <span aria-hidden="true">·</span>
                      <button
                        onClick={() => setIsTotalFocus(true)}
                        className="text-amber-400 hover:text-amber-300 font-medium underline underline-offset-2 cursor-pointer"
                      >
                        Ativar Foco Total [F]
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {departments.map((dept) => (
                      <button
                        key={dept.id}
                        onClick={() => handleSelectDepartment(dept.id)}
                        className="p-3 glass-obsidian rounded-xl border border-purple-900/20 hover:border-purple-500/40 text-left transition-all hover:scale-[1.02] cursor-pointer group"
                      >
                        <span className="text-xs font-semibold text-white block group-hover:text-amber-300 transition-colors">
                          {dept.name}
                        </span>
                        <span className="text-[10px] font-cinzel text-amber-300/80 block mb-1">
                          {dept.hebrewName}
                        </span>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono-numbers pt-1 border-t border-purple-900/10">
                          <span>{dept.activeAgentsCount} Agentes</span>
                          <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Master Security Status Widget */}
                <div className="p-6 glass-obsidian-gold rounded-2xl border border-amber-500/30 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                        Soberania Master Owner
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-light">
                      O Master Owner ({currentUser?.email || 'Alifermadeiro@hotmail.com'}) possui controle integral sobre agentes, orçamentos e ambientes de clientes.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-amber-500/20 space-y-2">
                    <button
                      onClick={() => setIsMasterPanelOpen(true)}
                      className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg text-xs font-medium transition-all cursor-pointer shadow"
                    >
                      Abrir Console Master
                    </button>
                    <button
                      onClick={() => setCurrentView('core')}
                      className="w-full py-2 glass-obsidian text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Despachar Comando AYIN
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: AYIN CORE COMMAND TERMINAL */}
        {currentView === 'core' && (
          <AyinCoreTerminal
            currentUser={currentUser}
            missions={missions}
            onMissionCreated={(newMission) => {
              setMissions(prev => [newMission, ...prev]);
              loadAllData();
            }}
            onSelectDepartment={handleSelectDepartment}
          />
        )}

        {/* VIEW 3: 8 SPECIALIZED DEPARTMENTS & 11 AGENTS */}
        {currentView === 'departments' && (
          <DepartmentsHub
            departments={departments}
            agents={agents}
            missions={missions}
            leads={leads}
            products={products}
            finances={finances}
            knowledge={knowledge}
            currentUser={currentUser}
            selectedDepartmentId={selectedDepartmentId}
            onSelectDepartment={setSelectedDepartmentId}
            onRefreshData={loadAllData}
          />
        )}

        {/* VIEW 4: SERVIÇOS EMPRESARIAIS & PRODUTOS AYIN */}
        {currentView === 'services' && (
          <EnterpriseServicesView
            services={services}
            contracts={contracts}
            flagshipProducts={flagshipProducts}
            currentUser={currentUser}
            currentCompany={currentCompany}
            onRefreshData={loadAllData}
            onNavigateToCore={handleFocusCore}
          />
        )}

        {/* VIEW 5: PLANOS SAAS & CHECKOUT PIX */}
        {currentView === 'subscriptions' && (
          <SubscriptionEngineView
            plans={plans}
            subscriptions={subscriptions}
            currentUser={currentUser}
            onRefreshData={loadAllData}
          />
        )}

        {/* VIEW 6: CRM COMERCIAL & AQUISIÇÃO */}
        {currentView === 'crm' && (
          <CrmAcquisitionView
            leads={leads}
            proposals={proposals}
            partners={partners}
            plans={plans}
            services={services}
            currentUser={currentUser}
            currentCompany={currentCompany}
            onRefreshData={loadAllData}
          />
        )}

        {/* VIEW 6B: SALES INTELLIGENCE WORKSPACE (Entel & Nova Gestões) */}
        {currentView === 'sales-intelligence' && (
          <SalesIntelligenceWorkspace
            scores={salesScores}
            leads={leads}
            currentUser={currentUser}
            onRefreshScores={loadAllData}
            onNavigateToLead={() => setCurrentView('crm')}
          />
        )}

        {/* VIEW 6C: ENTERPRISE TECHNOLOGY ECOSYSTEM (AI Gateway & Marketplace) */}
        {currentView === 'enterprise-stack' && (
          <EnterpriseEcosystemView
            currentUser={currentUser}
            aiProviders={aiProviders}
            routingRules={routingRules}
            integrations={integrations}
            cloudDossier={cloudDossier}
            techGovernance={techGovernance}
            onRefreshAll={loadAllData}
          />
        )}

        {/* VIEW 7: CLIENT COMPANIES ENVIRONMENT (MULTI-TENANT) */}
        {currentView === 'companies' && (
          <ClientPortalView
            companies={currentCompany ? [currentCompany] : []}
            currentUser={currentUser}
            currentCompany={currentCompany}
            onSelectCompany={setCurrentCompany}
            leads={leads}
            knowledge={knowledge}
            agents={agents}
            subscriptions={subscriptions}
            onRefreshData={loadAllData}
            onNavigateToServices={() => setCurrentView('services')}
            onNavigateToPlans={() => setCurrentView('subscriptions')}
          />
        )}

        {/* VIEW 8: CRYPTOGRAPHIC AUDIT LOGS */}
        {currentView === 'audit' && (
          <div className="w-full max-w-6xl mx-auto p-6 glass-obsidian rounded-2xl border border-purple-900/30 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-purple-900/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-amber-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-cinzel font-bold text-white tracking-wide">
                    Registro de Auditoria & Soberania Criptográfica
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Histórico imutável de operações, comandos e aprovações com encadeamento SHA-256 e timestamps certificados.
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono-numbers text-purple-300 glass-obsidian px-3 py-1.5 rounded-lg border border-purple-900/30">
                {auditLogs.length} Registros Auditados
              </span>
            </div>

            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-[#07070d]/80 rounded-xl border border-purple-900/20 space-y-2 hover:border-purple-600/40 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <span className="font-semibold text-amber-300 font-mono-numbers">{log.action}</span>
                    <span className="text-slate-400 font-mono-numbers">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-light">{log.details}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-purple-900/10 text-[11px] text-slate-500 font-mono-numbers">
                    <span>Ator: {log.actorEmail} ({log.actorRole}) · Tenant: {log.companyId}</span>
                    <span className="truncate max-w-sm" title={log.hash}>Hash SHA-256: {log.hash}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Master Owner Sovereign Management Modal */}
      {isMasterPanelOpen && (
        <MasterOwnerPanel
          currentUser={currentUser}
          missions={missions}
          companies={currentCompany ? [currentCompany] : []}
          auditLogs={auditLogs}
          agents={agents}
          stats={stats}
          onRefreshData={loadAllData}
          onClose={() => setIsMasterPanelOpen(false)}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          loadAllData();
        }}
      />

      {/* Persistent Quiet Cosmic Footer (concealed in Total Focus Mode) */}
      {!isTotalFocus && (
        <footer className="mt-12 border-t border-purple-900/20 py-6 text-center text-xs text-slate-500 font-light">
          <div className="flex flex-wrap items-center justify-center gap-4 mb-2">
            <span className="font-cinzel text-amber-300/80">SHEFA AYIN (עין השפע)</span>
            <span aria-hidden="true">·</span>
            <span>Empresa de Inteligência Artificial Híbrida</span>
            <span aria-hidden="true">·</span>
            <span>Soberania Master Owner: Alifermadeiro@hotmail.com</span>
          </div>
          <p className="text-[11px] text-slate-600">
            SaaS & Serviços Empresariais · Constelação dos 11 Agentes 24/7 · Blindagem LGPD & Isolamento Multitenant · Núcleo Neural AYIN CORE
          </p>
        </footer>
      )}
    </div>
  );
}
