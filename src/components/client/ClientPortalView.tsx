import React, { useState, useEffect } from 'react';
import { Company, User, Lead, KnowledgeDoc, AutonomousAgent, Subscription, DevProject, SupportTicket } from '../../types/index.ts';
import { 
  Bot, 
  Send, 
  ShieldCheck, 
  Building2, 
  BookOpen, 
  Users, 
  Sliders, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  Cpu, 
  Sparkles,
  ArrowRight,
  Briefcase,
  AlertCircle,
  FileText,
  DollarSign,
  Layers,
  MessageSquare,
  Check,
  AlertTriangle,
  RotateCcw,
  CheckCircle
} from 'lucide-react';
import { api } from '../../services/api.ts';

interface ClientPortalViewProps {
  companies: Company[];
  currentUser: User | null;
  currentCompany: Company | null;
  onSelectCompany: (company: Company) => void;
  leads: Lead[];
  knowledge: KnowledgeDoc[];
  agents?: AutonomousAgent[];
  subscriptions?: Subscription[];
  onRefreshData: () => void;
  onNavigateToServices?: () => void;
  onNavigateToPlans?: () => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  companies,
  currentUser,
  currentCompany,
  onSelectCompany,
  leads,
  knowledge,
  agents = [],
  subscriptions = [],
  onRefreshData,
  onNavigateToServices,
  onNavigateToPlans
}) => {
  const activeCompany = currentCompany || companies[0];
  const isMaster = currentUser?.role === 'MASTER_OWNER';

  const [activeTab, setActiveTab] = useState<'overview' | 'onboarding' | 'projects' | 'support' | 'assistant' | 'agents' | 'settings'>('overview');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([
    {
      role: 'model',
      text: activeCompany?.aiPersona.welcomeMessage || 'Olá! Sou a inteligência corporativa dedicada da sua empresa no Observatório SHEFA AYIN.'
    }
  ]);
  const [isSending, setIsSending] = useState(false);

  // Development & Projects state
  const [projects, setProjects] = useState<DevProject[]>([]);
  const [feedbackInput, setFeedbackInput] = useState<{ [projectId: string]: string }>({});
  const [isApprovingProject, setIsApprovingProject] = useState<{ [projectId: string]: boolean }>({});

  // Customer Success & Support state
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [newTicketCategory, setNewTicketCategory] = useState<'ONBOARDING' | 'TECHNICAL' | 'BILLING' | 'AGENT_TUNING' | 'UPGRADE'>('TECHNICAL');
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  // Customer Intelligence & Multilingual (Version 3.0)
  const [supportLanguage, setSupportLanguage] = useState<'pt' | 'en' | 'es' | 'he'>('pt');
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(497);
  const [refundReason, setRefundReason] = useState('');
  const [refundOrderOrSub, setRefundOrderOrSub] = useState('');
  const [refundsList, setRefundsList] = useState<any[]>([]);
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [refundFeedback, setRefundFeedback] = useState<string | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationResult, setClassificationResult] = useState<any | null>(null);

  // Persona edit states
  const [assistantName, setAssistantName] = useState(activeCompany?.aiPersona.assistantName || '');
  const [assistantTone, setAssistantTone] = useState(activeCompany?.aiPersona.tone || '');
  const [assistantInstructions, setAssistantInstructions] = useState(activeCompany?.aiPersona.instructions || '');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const loadProjectsAndTickets = async () => {
    try {
      const [projRes, tickRes, refRes] = await Promise.all([
        api.getProjects().catch(() => []),
        api.getSupportTickets().catch(() => []),
        api.getRefundRequests().catch(() => [])
      ]);
      setProjects(projRes);
      setSupportTickets(tickRes);
      setRefundsList(refRes);
      if (tickRes.length > 0 && !selectedTicketId) {
        setSelectedTicketId(tickRes[0].id);
      }
    } catch (err) {
      console.warn('Erro ao carregar projetos, chamados e estornos:', err);
    }
  };

  useEffect(() => {
    loadProjectsAndTickets();
  }, [activeCompany]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isSending || !activeCompany) return;

    const userMsg = chatMessage.trim();
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsSending(true);

    try {
      const res = await api.askAssistant(userMsg);
      setChatHistory(prev => [...prev, { role: 'model', text: res.response }]);
    } catch (err: any) {
      setChatHistory(prev => [
        ...prev, 
        { role: 'model', text: 'Desculpe, ocorreu uma instabilidade momentânea na resposta do assistente.' }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany) return;
    setIsSavingSettings(true);
    setSettingsSaved(false);

    try {
      await api.updateCompany(activeCompany.id, {
        aiPersona: {
          assistantName,
          tone: assistantTone,
          welcomeMessage: activeCompany.aiPersona.welcomeMessage,
          instructions: assistantInstructions
        }
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configurações.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleApproveProject = async (projectId: string) => {
    setIsApprovingProject(prev => ({ ...prev, [projectId]: true }));
    try {
      const fb = feedbackInput[projectId] || 'Entrega validada com sucesso.';
      await api.approveProject(projectId, fb);
      await loadProjectsAndTickets();
      onRefreshData();
      alert('Projeto aprovado com sucesso! Status atualizado para ENTREGUE.');
    } catch (err: any) {
      alert(err.message || 'Erro ao aprovar projeto.');
    } finally {
      setIsApprovingProject(prev => ({ ...prev, [projectId]: false }));
    }
  };

  const handleRequestChanges = async (projectId: string) => {
    const fb = feedbackInput[projectId];
    if (!fb || !fb.trim()) {
      alert('Por favor descreva os ajustes necessários antes de solicitar revisão.');
      return;
    }
    setIsApprovingProject(prev => ({ ...prev, [projectId]: true }));
    try {
      await api.requestProjectChanges(projectId, fb);
      await loadProjectsAndTickets();
      onRefreshData();
      alert('Solicitação de ajustes encaminhada à equipe de desenvolvimento e aos agentes responsáveis.');
    } catch (err: any) {
      alert(err.message || 'Erro ao solicitar ajustes.');
    } finally {
      setIsApprovingProject(prev => ({ ...prev, [projectId]: false }));
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketDesc.trim()) return;
    setIsCreatingTicket(true);
    try {
      const created = await api.createSupportTicket({
        subject: newTicketSubject.trim(),
        description: newTicketDesc.trim(),
        priority: newTicketPriority,
        category: newTicketCategory
      });
      setNewTicketSubject('');
      setNewTicketDesc('');
      setIsNewTicketOpen(false);
      await loadProjectsAndTickets();
      setSelectedTicketId(created.id);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao abrir chamado.');
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const handleSendTicketMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !ticketReply.trim() || isReplying) return;
    setIsReplying(true);
    try {
      await api.addTicketMessage(selectedTicketId, ticketReply.trim());
      setTicketReply('');
      await loadProjectsAndTickets();
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar mensagem.');
    } finally {
      setIsReplying(false);
    }
  };

  const handleAutoClassify = async () => {
    if (!newTicketSubject.trim()) return;
    setIsClassifying(true);
    try {
      const res = await api.classifyTicket(newTicketSubject, newTicketDesc, supportLanguage);
      setClassificationResult(res);
      if (res.category) setNewTicketCategory(res.category);
      if (res.priority) setNewTicketPriority(res.priority);
    } catch (err) {
      console.warn('Erro na autoclassificação:', err);
    } finally {
      setIsClassifying(false);
    }
  };

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundAmount || !refundReason.trim()) return;
    setIsSubmittingRefund(true);
    setRefundFeedback(null);
    try {
      await api.createRefundRequest({
        ticketId: selectedTicketId || undefined,
        orderOrSubscriptionId: refundOrderOrSub || activeCompany?.subscriptionId || 'sub_general',
        amount: Number(refundAmount),
        reason: refundReason.trim()
      });
      setRefundFeedback('Solicitação registrada com sucesso. Protocolo em apreciação pelo Master Owner para reversão bancária via Pix.');
      setRefundReason('');
      await loadProjectsAndTickets();
    } catch (err: any) {
      setRefundFeedback(`Falha ao registrar: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const handleRateTicket = async (ticketId: string, rating: number) => {
    try {
      const ticket = supportTickets.find(t => t.id === ticketId);
      await api.updateTicketStatus(ticketId, ticket?.status || 'RESOLVED', rating);
      await loadProjectsAndTickets();
    } catch (err) {
      console.error('Failed to rate ticket:', err);
    }
  };

  if (!activeCompany) {
    return (
      <div className="p-12 text-center text-slate-400">
        Nenhuma empresa vinculada ao usuário.
      </div>
    );
  }

  const companyLeads = leads.filter(l => l.companyId === activeCompany.id);
  const companyKnowledge = knowledge.filter(k => k.companyId === activeCompany.id);
  const companySub = subscriptions.find(s => s.companyId === activeCompany.id) || null;
  const companyProjects = projects.filter(p => isMaster || p.companyId === activeCompany.id);
  const companyTickets = supportTickets.filter(t => isMaster || t.companyId === activeCompany.id);
  const selectedTicket = companyTickets.find(t => t.id === selectedTicketId) || companyTickets[0];

  // Real business metrics
  const totalLeadsValue = companyLeads.reduce((acc, l) => acc + (l.value || 0), 0);
  const closedLeads = companyLeads.filter(l => l.stage === 'Fechado');
  const closedValue = closedLeads.reduce((acc, l) => acc + (l.value || 0), 0);
  const missionsUsed = activeCompany.quotas.usedMissions || 0;
  const missionsLimit = activeCompany.quotas.monthlyMissions || 150;
  const missionsPercent = Math.min(100, Math.round((missionsUsed / missionsLimit) * 100));
  const hoursSaved = Math.round(missionsUsed * 2.4);

  // Onboarding steps
  const onboardingSteps = [
    {
      id: 'step_1',
      title: 'Diagnóstico & Mapeamento Inicial',
      desc: 'Levantamento de processos corporativos, regras de negócio e objetivos táticos.',
      status: 'completed',
      date: 'Concluído na contratação'
    },
    {
      id: 'step_2',
      title: 'Parametrização dos Agentes & Persona',
      desc: 'Configuração do tom de voz executivo, instruções restritas e alinhamento de funil.',
      status: 'completed',
      date: 'Parametrizado'
    },
    {
      id: 'step_3',
      title: 'Base de Conhecimento Privativa',
      desc: `${companyKnowledge.length} documentos indexados com busca semântica hermética.`,
      status: companyKnowledge.length > 0 ? 'completed' : 'in_progress',
      date: companyKnowledge.length > 0 ? `${companyKnowledge.length} manuais ativos` : 'Em alimentação'
    },
    {
      id: 'step_4',
      title: 'Operação Contínua 24/7 Ativa',
      desc: 'Disparo autônomo dos agentes em background com conciliação Pix automatizada.',
      status: activeCompany.status === 'active' ? 'completed' : 'pending',
      date: activeCompany.status === 'active' ? 'Operando 24/7' : 'Aguardando liberação'
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header & Tenant Switcher */}
      <div className="p-6 glass-obsidian-gold rounded-2xl border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-cinzel">
            <Building2 className="w-4 h-4" />
            <span>PORTAL CORPORATIVO DO CLIENTE</span>
            <span aria-hidden="true">·</span>
            <span>ISOLAMENTO HERMÉTICO LGPD</span>
          </div>
          <h2 className="text-xl font-cinzel font-bold text-white tracking-wide">
            {activeCompany.name}
          </h2>
          <span className="text-xs text-slate-300 font-light block">
            CNPJ: {activeCompany.cnpjOrTaxId} · Plano Atual: <strong className="text-amber-300">{activeCompany.plan}</strong>
          </span>
        </div>

        {/* Multi-tenant selector (if Master Owner) */}
        {isMaster && companies.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Alternar Tenant:</span>
            <select
              value={activeCompany.id}
              onChange={(e) => {
                const found = companies.find(c => c.id === e.target.value);
                if (found) onSelectCompany(found);
              }}
              className="p-2 bg-[#05050a] border border-amber-500/40 rounded-lg text-white text-xs focus:outline-none"
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.plan})</option>
              ))}
            </select>
          </div>
        )}

        {/* Tab Controls */}
        <div className="p-1 glass-obsidian rounded-xl border border-purple-900/40 flex flex-wrap items-center gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'overview' ? 'bg-amber-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Visão Geral & Cotas
          </button>
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'onboarding' ? 'bg-amber-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Implantação
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'projects' ? 'bg-amber-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Projetos & Entregas</span>
            <span className="px-1.5 py-0.2 bg-black/40 rounded text-[10px] font-mono-numbers">
              {companyProjects.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'support' ? 'bg-amber-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Suporte & CS</span>
            <span className="px-1.5 py-0.2 bg-black/40 rounded text-[10px] font-mono-numbers">
              {companyTickets.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('assistant')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'assistant' ? 'bg-amber-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Assistente Dedicado
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'agents' ? 'bg-amber-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Agentes ({activeCompany.quotas.maxAgents})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'settings' ? 'bg-amber-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Persona & Regras
          </button>
        </div>
      </div>

      {/* TAB 1: VISÃO GERAL & CONSUMO DE COTAS & RESULTADOS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Real Results Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 glass-obsidian rounded-xl border border-purple-900/30">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Leads no Funil</span>
              <span className="text-xl font-bold font-mono-numbers text-white">{companyLeads.length} Oportunidades</span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono-numbers">
                Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalLeadsValue)}
              </span>
            </div>

            <div className="p-4 glass-obsidian rounded-xl border border-purple-900/30">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Receita Gerada</span>
              <span className="text-xl font-bold font-mono-numbers text-emerald-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(closedValue)}
              </span>
              <span className="text-[10px] text-emerald-300 block mt-0.5">{closedLeads.length} negócios fechados</span>
            </div>

            <div className="p-4 glass-obsidian rounded-xl border border-purple-900/30">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Tempo Economizado</span>
              <span className="text-xl font-bold font-mono-numbers text-amber-300">
                ~{hoursSaved} Horas
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Em tarefas e follow-ups</span>
            </div>

            <div className="p-4 glass-obsidian rounded-xl border border-purple-900/30">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Status da Assinatura</span>
              <span className="text-xl font-bold font-mono-numbers text-emerald-400">
                {activeCompany.status === 'active' ? 'ATIVA (24/7)' : 'PENDENTE'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Plano {activeCompany.plan}
              </span>
            </div>
          </div>

          {/* Quotas Consumption Card */}
          <div className="p-6 glass-obsidian rounded-2xl border border-purple-900/30 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/20">
              <div>
                <h3 className="text-base font-cinzel font-bold text-white">
                  Consumo de Cotas & Capacidade Computacional
                </h3>
                <span className="text-xs text-slate-400 font-light">
                  Acompanhamento transparente das franquias do plano corporativo
                </span>
              </div>
              {onNavigateToPlans && (
                <button
                  onClick={onNavigateToPlans}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow"
                >
                  Fazer Upgrade de Plano
                </button>
              )}
            </div>

            {/* Quota Bars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-[#07070f] rounded-xl border border-purple-900/20 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Missões Mensais:</span>
                  <span className="font-bold text-white font-mono-numbers">{missionsUsed} / {missionsLimit}</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{ width: `${missionsPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 block font-mono-numbers">{missionsPercent}% consumido no ciclo</span>
              </div>

              <div className="p-4 bg-[#07070f] rounded-xl border border-purple-900/20 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Agentes Disponíveis:</span>
                  <span className="font-bold text-amber-300 font-mono-numbers">
                    {Math.min(activeCompany.quotas.maxAgents, 11)} / {activeCompany.quotas.maxAgents}
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full w-full" />
                </div>
                <span className="text-[10px] text-slate-500 block font-mono-numbers">Totalmente alocados</span>
              </div>

              <div className="p-4 bg-[#07070f] rounded-xl border border-purple-900/20 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Base de Conhecimento:</span>
                  <span className="font-bold text-white font-mono-numbers">
                    {companyKnowledge.length} / {activeCompany.quotas.maxKnowledgeDocs} docs
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (companyKnowledge.length / activeCompany.quotas.maxKnowledgeDocs) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 block font-mono-numbers">
                  {Math.round((companyKnowledge.length / activeCompany.quotas.maxKnowledgeDocs) * 100)}% ocupado
                </span>
              </div>
            </div>

            {/* Quick Actions Strip */}
            <div className="pt-4 border-t border-purple-900/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-400 font-light">
                Precisa de implantação assistida ou automações de API para conectar seus sistemas?
              </span>
              {onNavigateToServices && (
                <button
                  onClick={onNavigateToServices}
                  className="px-4 py-2 glass-obsidian text-amber-300 hover:text-white border border-amber-500/30 rounded-lg font-medium cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <span>Contratar Serviços Empresariais</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACOMPANHAMENTO DA IMPLANTAÇÃO (ONBOARDING TRACKER) */}
      {activeTab === 'onboarding' && (
        <div className="p-6 glass-obsidian rounded-2xl border border-purple-900/30 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-purple-900/20">
            <div>
              <h3 className="text-base font-cinzel font-bold text-white">
                Rastreador de Implantação Corporativa & Onboarding
              </h3>
              <p className="text-xs text-slate-400 font-light mt-0.5">
                Passo a passo transparente da ativação da inteligência artificial na sua empresa.
              </p>
            </div>
            <span className="text-xs font-mono-numbers text-emerald-400 glass-obsidian px-3 py-1.5 rounded-lg border border-emerald-500/30">
              Status: 100% Homologado
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {onboardingSteps.map((step, idx) => (
              <div 
                key={step.id} 
                className="p-5 bg-[#07070f] rounded-xl border border-purple-900/30 space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-xs font-mono-numbers">
                    {idx + 1}
                  </span>
                  <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {step.date}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white">{step.title}</h4>
                  <p className="text-xs text-slate-400 font-light mt-1 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-purple-950/30 border border-purple-900/40 rounded-xl text-xs text-slate-300 flex items-center justify-between gap-4 font-light">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                Sua empresa possui isolamento hermético multitenant. Nenhuma outra empresa ou agente externo tem acesso aos seus leads ou base de conhecimento.
              </span>
            </div>
            {onNavigateToServices && (
              <button
                onClick={onNavigateToServices}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium shrink-0 cursor-pointer"
              >
                Solicitar Consultoria Adicional
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB: PROJETOS DE DESENVOLVIMENTO & ENTREGAS (Phase 01) */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-purple-900/20">
            <div>
              <h3 className="text-base font-cinzel font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-400" />
                <span>Projetos Corporativos & Acompanhamento de Entregas</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Acompanhe o cronograma, prazos de entrega, tarefas dos agentes e valide o aceite final de cada entrega.
              </p>
            </div>
            <span className="text-xs font-mono-numbers px-3 py-1 glass-obsidian border border-purple-900/30 rounded-lg text-amber-300">
              {companyProjects.length} Projetos Vinculados
            </span>
          </div>

          {companyProjects.length === 0 ? (
            <div className="p-12 text-center glass-obsidian rounded-2xl border border-purple-900/20 space-y-3">
              <Layers className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="text-sm font-semibold text-white">Nenhum projeto em desenvolvimento</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Sua empresa ainda não possui projetos customizados em andamento. Contrate diagnósticos ou automações sob medida na aba de Serviços.
              </p>
              {onNavigateToServices && (
                <button
                  onClick={onNavigateToServices}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Ver Serviços Empresariais
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {companyProjects.map((project) => {
                const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
                const totalTasks = project.tasks.length || 1;
                const progressPercent = Math.round((completedTasks / totalTasks) * 100);
                const isApproved = project.clientApprovalStatus === 'APPROVED' || project.status === 'DELIVERED';

                return (
                  <div
                    key={project.id}
                    className="p-6 glass-obsidian rounded-2xl border border-purple-900/30 space-y-5 hover:border-purple-600/40 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            project.status === 'DELIVERED'
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                              : project.status === 'CLIENT_APPROVAL'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                              : 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                          }`}>
                            {project.status === 'DELIVERED' ? 'ENTREGUE' :
                             project.status === 'CLIENT_APPROVAL' ? 'AGUARDANDO APROVAÇÃO' :
                             project.status === 'IN_DEVELOPMENT' ? 'EM DESENVOLVIMENTO' :
                             project.status === 'REVIEW' ? 'REVISÃO TÉCNICA' : 'PLANEJAMENTO'}
                          </span>
                          <span className="text-xs text-slate-400 font-mono-numbers">
                            Prazo: {project.deadline}
                          </span>
                        </div>
                        <h4 className="text-base font-cinzel font-bold text-white">{project.title}</h4>
                        <p className="text-xs text-slate-300 mt-1 font-light leading-relaxed">{project.description}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block mb-1">Progresso Geral</span>
                        <div className="text-lg font-bold font-mono-numbers text-amber-400">{progressPercent}%</div>
                        <span className="text-[10px] text-slate-500 font-mono-numbers">
                          {completedTasks} de {totalTasks} etapas
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isApproved ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-purple-600'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {/* Tasks Checklist */}
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                        Cronograma de Tarefas & Alocação de Agentes
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {project.tasks.map((task) => (
                          <div
                            key={task.id}
                            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                              task.status === 'completed'
                                ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-200'
                                : task.status === 'in_progress'
                                ? 'bg-amber-950/20 border-amber-900/30 text-amber-200'
                                : 'bg-[#07070f] border-purple-900/20 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {task.status === 'completed' ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : task.status === 'in_progress' ? (
                                <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                              )}
                              <div>
                                <span className="font-medium text-white block">{task.title}</span>
                                <span className="text-[10px] text-slate-400 block">
                                  Agente: {task.assignedAgent} · Limite: {task.deadline}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] uppercase font-mono-numbers font-semibold">
                              {task.status === 'completed' ? 'Concluído' :
                               task.status === 'in_progress' ? 'Executando' : 'Pendente'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Client Approval / Feedback Action Strip */}
                    <div className="pt-4 border-t border-purple-900/20">
                      {isApproved ? (
                        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            <span>
                              <strong>Entrega Homologada e Aprovada pelo Cliente.</strong>{' '}
                              {project.clientFeedback && `Comentário: "${project.clientFeedback}"`}
                            </span>
                          </div>
                          {project.deliveredAt && (
                            <span className="text-[11px] font-mono-numbers text-emerald-400 shrink-0">
                              Aceite em {new Date(project.deliveredAt).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 bg-[#07070f] p-4 rounded-xl border border-purple-900/30">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-amber-300">Aceite Formal do Cliente</span>
                            <span className="text-slate-400">Status atual: {project.clientApprovalStatus}</span>
                          </div>
                          <textarea
                            rows={2}
                            value={feedbackInput[project.id] || ''}
                            onChange={(e) => setFeedbackInput(prev => ({ ...prev, [project.id]: e.target.value }))}
                            placeholder="Insira parecer ou solicitação de ajustes para a equipe e agentes..."
                            className="w-full p-2.5 bg-black/60 border border-purple-900/30 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                          />
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => handleRequestChanges(project.id)}
                              disabled={isApprovingProject[project.id]}
                              className="px-4 py-2 border border-amber-600/50 text-amber-300 hover:text-white hover:bg-amber-950/40 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Solicitar Ajustes
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveProject(project.id)}
                              disabled={isApprovingProject[project.id]}
                              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow disabled:opacity-50 flex items-center gap-1.5"
                            >
                              <Check className="w-4 h-4" />
                              <span>{isApprovingProject[project.id] ? 'Aprovando...' : 'Aprovar Entrega Formal'}</span>
                            </button>
                          </div>
                        </div>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-purple-900/20 gap-4">
            <div>
              <h3 className="text-base font-cinzel font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <span>Central de Suporte & Customer Success 24/7 (Inspirado em Klarna & Ryanair)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Atendimento consultivo, resolução de chamados técnicos, fluxo de estorno e inteligência multilíngue.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Language Selector */}
              <div className="flex items-center gap-1 bg-[#080910] border border-purple-900/40 rounded-lg p-1 text-xs">
                {(['pt', 'en', 'es', 'he'] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setSupportLanguage(lang)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                      supportLanguage === lang ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsRefundModalOpen(true)}
                className="px-3.5 py-2 bg-purple-950/80 hover:bg-purple-900 text-amber-300 border border-purple-700/50 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Solicitar Estorno Pix</span>
              </button>

              <button
                onClick={() => setIsNewTicketOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow flex items-center gap-1.5"
              >
                <span>Abrir Novo Chamado</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tickets Sidebar */}
            <div className="lg:col-span-1 space-y-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Seus Chamados ({companyTickets.length})
              </span>
              {companyTickets.length === 0 ? (
                <div className="p-6 text-center glass-obsidian rounded-xl border border-purple-900/20 text-slate-500 text-xs">
                  Nenhum chamado aberto.
                </div>
              ) : (
                <div className="space-y-2">
                  {companyTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        selectedTicket?.id === t.id
                          ? 'bg-amber-950/30 border-amber-500/50 shadow-md'
                          : 'glass-obsidian border-purple-900/20 hover:border-purple-600/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          t.status === 'RESOLVED' || t.status === 'CLOSED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                            : 'bg-purple-950 text-purple-300 border border-purple-500/30'
                        }`}>
                          {t.status === 'RESOLVED' ? 'RESOLVIDO' : t.status === 'IN_PROGRESS' ? 'EM ATENDIMENTO' : 'ABERTO'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono-numbers">
                          {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <h5 className="font-semibold text-white truncate">{t.subject}</h5>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-light">{t.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ticket Thread Detail */}
            <div className="lg:col-span-2">
              {selectedTicket ? (
                <div className="p-6 glass-obsidian rounded-2xl border border-purple-900/30 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-purple-900/20 gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-950/80 text-purple-300 border border-purple-500/30 rounded uppercase font-mono-numbers">
                          {selectedTicket.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono-numbers">
                          Prioridade: {selectedTicket.priority} · Agente: {selectedTicket.assignedAgent}
                        </span>
                      </div>
                      <h4 className="text-base font-cinzel font-bold text-white">{selectedTicket.subject}</h4>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* CSAT Star Rating */}
                      <div className="flex items-center gap-1 bg-[#080910] border border-purple-900/40 rounded-lg px-2.5 py-1">
                        <span className="text-[10px] text-slate-400 mr-1">CSAT:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleRateTicket(selectedTicket.id, star)}
                            className={`text-xs cursor-pointer transition-transform hover:scale-125 ${
                              (selectedTicket.satisfactionRating || 5) >= star ? 'text-amber-400' : 'text-slate-600'
                            }`}
                            title={`Avaliar com ${star} estrela(s)`}
                          >
                            ★
                          </button>
                        ))}
                      </div>

                      <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                        selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                      }`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                  </div>

                  {/* Messages History */}
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {selectedTicket.communicationHistory.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3.5 rounded-xl text-xs space-y-1 ${
                          msg.senderRole === 'AGENT'
                            ? 'bg-purple-950/30 border border-purple-900/30 text-purple-200'
                            : msg.senderRole === 'MASTER_OWNER'
                            ? 'bg-amber-950/30 border border-amber-500/30 text-amber-100'
                            : 'bg-[#07070f] border border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-semibold text-white">
                            {msg.senderName} ({msg.senderRole})
                          </span>
                          <span className="font-mono-numbers">
                            {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="leading-relaxed font-light">{msg.message}</p>
                      </div>
                    ))}
                  </div>

                  {/* Reply Input */}
                  <form onSubmit={handleSendTicketMessage} className="pt-3 border-t border-purple-900/20 space-y-2">
                    <textarea
                      rows={2}
                      value={ticketReply}
                      onChange={(e) => setTicketReply(e.target.value)}
                      placeholder="Escreva sua resposta para o Customer Agent ou Master Owner..."
                      className="w-full p-2.5 bg-[#07070f] border border-purple-900/30 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isReplying || !ticketReply.trim()}
                        className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow disabled:opacity-50"
                      >
                        {isReplying ? 'Enviando...' : 'Enviar Resposta'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-12 text-center glass-obsidian rounded-2xl border border-purple-900/20 text-slate-400 text-xs">
                  Selecione um chamado ao lado para ver o histórico de conversas.
                </div>
              )}
            </div>
          </div>

          {/* New Ticket Modal */}
          {isNewTicketOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="w-full max-w-lg glass-obsidian p-6 rounded-2xl border border-amber-500/40 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-purple-900/30">
                  <h4 className="text-base font-cinzel font-bold text-white">Abrir Chamado de Suporte</h4>
                  <button onClick={() => setIsNewTicketOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Assunto do Chamado:</label>
                    <input
                      type="text"
                      required
                      value={newTicketSubject}
                      onChange={(e) => setNewTicketSubject(e.target.value)}
                      placeholder="Ex: Dúvida na integração com CRM ou ajuste de agente"
                      className="w-full p-2.5 bg-[#07070f] border border-purple-900/30 rounded-xl text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">Categoria:</label>
                      <select
                        value={newTicketCategory}
                        onChange={(e: any) => setNewTicketCategory(e.target.value)}
                        className="w-full p-2.5 bg-[#07070f] border border-purple-900/30 rounded-xl text-white"
                      >
                        <option value="TECHNICAL">Técnico / Integração</option>
                        <option value="AGENT_TUNING">Calibração de Agente</option>
                        <option value="ONBOARDING">Implantação & Onboarding</option>
                        <option value="BILLING">Faturamento / Pix</option>
                        <option value="UPGRADE">Upgrade de Recursos</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">Prioridade:</label>
                      <select
                        value={newTicketPriority}
                        onChange={(e: any) => setNewTicketPriority(e.target.value)}
                        className="w-full p-2.5 bg-[#07070f] border border-purple-900/30 rounded-xl text-white"
                      >
                        <option value="LOW">Baixa</option>
                        <option value="MEDIUM">Média</option>
                        <option value="HIGH">Alta</option>
                        <option value="URGENT">Urgente</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Descrição Detalhada:</label>
                    <textarea
                      required
                      rows={4}
                      value={newTicketDesc}
                      onChange={(e) => setNewTicketDesc(e.target.value)}
                      placeholder="Descreva detalhadamente sua necessidade ou problema enfrentado..."
                      className="w-full p-2.5 bg-[#07070f] border border-purple-900/30 rounded-xl text-white"
                    />
                  {classificationResult && (
                    <div className="p-3 bg-purple-950/40 border border-purple-700/40 rounded-xl space-y-1 text-slate-300">
                      <div className="flex items-center justify-between text-amber-300 font-semibold">
                        <span>Classificação Sugerida por IA</span>
                        <span className="text-[10px] font-mono uppercase text-emerald-400">Score: {classificationResult.sentimentScore}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-light">{classificationResult.suggestedResponse}</p>
                    </div>
                  )}

                  <div className="pt-3 border-t border-purple-900/20 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleAutoClassify}
                      disabled={isClassifying || !newTicketSubject.trim()}
                      className="px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900 text-amber-300 border border-purple-600/40 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isClassifying ? 'Classificando...' : 'Diagnosticar com IA'}</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewTicketOpen(false);
                          setClassificationResult(null);
                        }}
                        className="px-4 py-2 text-slate-400 hover:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isCreatingTicket}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white rounded-lg font-bold shadow"
                      >
                        {isCreatingTicket ? 'Abrindo...' : 'Protocolar Chamado'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Refund Request Modal (Klarna & Ryanair Inspired) */}
          {isRefundModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="w-full max-w-lg glass-obsidian p-6 rounded-2xl border border-amber-500/40 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-purple-900/30">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-400" />
                    <h4 className="text-base font-cinzel font-bold text-white">Solicitar Estorno / Reembolso Pix</h4>
                  </div>
                  <button onClick={() => { setIsRefundModalOpen(false); setRefundFeedback(null); }} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <div className="p-3 bg-amber-950/30 border border-amber-600/30 rounded-xl text-xs text-amber-200">
                  <strong>Aviso de Governança:</strong> Todo estorno financeiro exige autorização soberana do Master Owner (Alifer Madeiro) antes da emissão da chave de reversão bancária no SPI/BACEN.
                </div>

                {refundFeedback ? (
                  <div className="p-4 bg-emerald-950/40 border border-emerald-600/40 rounded-xl space-y-3 text-xs text-emerald-200">
                    <p>{refundFeedback}</p>
                    <button
                      onClick={() => { setIsRefundModalOpen(false); setRefundFeedback(null); }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold"
                    >
                      Entendido
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitRefund} className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">Valor do Estorno Solicitado (R$):</label>
                      <input
                        type="number"
                        required
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(Number(e.target.value))}
                        className="w-full p-2.5 bg-[#07070f] border border-purple-900/30 rounded-xl text-white"
                        min={10}
                        step={10}
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">Referência do Pedido / Assinatura:</label>
                      <input
                        type="text"
                        value={refundOrderOrSub}
                        onChange={(e) => setRefundOrderOrSub(e.target.value)}
                        placeholder={activeCompany?.subscriptionId || 'Ex: sub_vertice_001 ou ctr_001'}
                        className="w-full p-2.5 bg-[#07070f] border border-purple-900/30 rounded-xl text-white"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">Justificativa e Motivo do Estorno:</label>
                      <textarea
                        required
                        rows={3}
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        placeholder="Descreva o motivo detalhado para análise da diretoria e do Master Owner..."
                        className="w-full p-2.5 bg-[#07070f] border border-purple-900/30 rounded-xl text-white"
                      />
                    </div>

                    <div className="pt-3 border-t border-purple-900/20 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsRefundModalOpen(false)}
                        className="px-4 py-2 text-slate-400 hover:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingRefund}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white rounded-lg font-bold shadow"
                      >
                        {isSubmittingRefund ? 'Enviando...' : 'Protocolar Pedido de Estorno'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ASSISTENTE EXECUTIVO DEDICADO */}
      {activeTab === 'assistant' && (
        <div className="p-6 glass-obsidian rounded-2xl border border-purple-900/30 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-purple-900/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-cinzel font-bold text-white">
                  {activeCompany.aiPersona.assistantName}
                </h3>
                <span className="text-xs text-slate-400 font-light">
                  Tom: {activeCompany.aiPersona.tone} · Base Privativa: {companyKnowledge.length} manuais
                </span>
              </div>
            </div>
          </div>

          {/* Chat Window */}
          <div className="h-80 overflow-y-auto space-y-3 p-4 bg-[#05050a] rounded-xl border border-purple-900/30 text-xs">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-xl leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-amber-600 text-white rounded-br-none shadow'
                      : 'bg-[#12121e] text-slate-200 border border-purple-900/40 rounded-bl-none font-light'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="p-3 bg-[#12121e] text-amber-300 border border-purple-900/40 rounded-xl rounded-bl-none text-xs flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>{activeCompany.aiPersona.assistantName} consultando base corporativa...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder={`Pergunte sobre produtos, dados ou procedimentos da ${activeCompany.name}...`}
              className="flex-1 p-3 bg-[#07070f] border border-purple-900/30 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={isSending || !chatMessage.trim()}
              className="px-5 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: AGENTES LIBERADOS CONFORME O PLANO */}
      {activeTab === 'agents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 glass-obsidian rounded-xl border border-purple-900/20 text-xs text-slate-400">
            <span>Agentes autônomos dedicados à operação corporativa da {activeCompany.name}</span>
            <span className="font-mono-numbers">Cota do Plano: {activeCompany.quotas.maxAgents} Agentes</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agents.slice(0, activeCompany.quotas.maxAgents).map((agent) => (
              <div
                key={agent.id}
                className="p-5 glass-obsidian rounded-2xl border border-purple-900/30 hover:border-amber-400/30 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-cinzel text-amber-400 block">
                      {agent.hebrewCodename}
                    </span>
                    <h4 className="text-base font-cinzel font-bold text-white">
                      {agent.name}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono-numbers">
                      {agent.agentRoleType}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    agent.status === 'running' 
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' 
                      : agent.status === 'analyzing'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {agent.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-light leading-relaxed">
                  {agent.specialty}
                </p>

                <div className="pt-3 border-t border-purple-900/20 flex items-center justify-between text-[11px] text-slate-500 font-mono-numbers">
                  <span>Média de Precisão: {agent.accuracyScore}%</span>
                  <span>{agent.totalMissionsCompleted} missões</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PERSONA & CONFIGURAÇÃO */}
      {activeTab === 'settings' && (
        <div className="p-6 glass-obsidian rounded-2xl border border-purple-900/30 space-y-6">
          <div className="pb-3 border-b border-purple-900/20">
            <h3 className="text-base font-cinzel font-bold text-white">
              Calibração da Persona & Instruções Executivas
            </h3>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              Defina o tom de voz, regras comerciais e limites de atuação do assistente e dos agentes da sua empresa.
            </p>
          </div>

          {settingsSaved && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Diretrizes e persona da empresa salvas com sucesso no núcleo neural!</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Nome do Assistente:</label>
              <input
                type="text"
                value={assistantName}
                onChange={(e) => setAssistantName(e.target.value)}
                className="w-full p-2.5 bg-[#07070f] border border-purple-900/30 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Tom de Voz da Empresa:</label>
              <input
                type="text"
                value={assistantTone}
                onChange={(e) => setAssistantTone(e.target.value)}
                placeholder="Ex: Consultivo, rigoroso, focado em ROI e agilidade comercial"
                className="w-full p-2.5 bg-[#07070f] border border-purple-900/30 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Instruções Estratégicas Restritas:</label>
              <textarea
                value={assistantInstructions}
                onChange={(e) => setAssistantInstructions(e.target.value)}
                rows={4}
                placeholder="Diretrizes inegociáveis para respostas a clientes, margens de desconto permitidas, canais de escalonamento..."
                className="w-full p-2.5 bg-[#07070f] border border-purple-900/30 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="pt-3 border-t border-purple-900/20 flex justify-end">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow disabled:opacity-50"
              >
                {isSavingSettings ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
