import React, { useState } from 'react';
import { 
  Lead, 
  LeadStage, 
  CommercialProposal, 
  CommercialPartner, 
  User, 
  Company, 
  PlanDefinition,
  EnterpriseService
} from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { 
  Target, 
  Users, 
  FileCheck, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  DollarSign, 
  Calendar, 
  Phone, 
  Mail, 
  Share2, 
  TrendingUp, 
  Briefcase,
  Layers,
  ChevronRight,
  Filter,
  Percent,
  Search,
  Building
} from 'lucide-react';

interface CrmAcquisitionViewProps {
  leads: Lead[];
  proposals: CommercialProposal[];
  partners: CommercialPartner[];
  plans: PlanDefinition[];
  services: EnterpriseService[];
  currentUser: User | null;
  currentCompany: Company | null;
  onRefreshData: () => void;
}

const STAGES: LeadStage[] = ['Novo', 'Qualificado', 'Proposta', 'Negociação', 'Fechado', 'Perdido'];

export const CrmAcquisitionView: React.FC<CrmAcquisitionViewProps> = ({
  leads,
  proposals,
  partners,
  plans,
  services,
  currentUser,
  currentCompany,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'proposals' | 'partners'>('pipeline');
  const [stageFilter, setStageFilter] = useState<LeadStage | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Lead Modal
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadSource, setLeadSource] = useState('Prospecção Ativa');
  const [leadValue, setLeadValue] = useState(4970);
  const [leadNotes, setLeadNotes] = useState('');
  const [leadPartnerCode, setLeadPartnerCode] = useState('');

  // New Proposal Modal
  const [isNewProposalOpen, setIsNewProposalOpen] = useState(false);
  const [selectedLeadForProp, setSelectedLeadForProp] = useState<Lead | null>(null);
  const [propCompanyName, setPropCompanyName] = useState('');
  const [propContactName, setPropContactName] = useState('');
  const [propContactEmail, setPropContactEmail] = useState('');
  const [propContactPhone, setPropContactPhone] = useState('');
  const [propPlanTier, setPropPlanTier] = useState<string>('Cosmic Growth');
  const [propServicesSelected, setPropServicesSelected] = useState<string[]>([]);
  const [propDiscount, setPropDiscount] = useState<number>(0);
  const [propNotes, setPropNotes] = useState('');

  // New Partner Modal
  const [isNewPartnerOpen, setIsNewPartnerOpen] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerCompany, setPartnerCompany] = useState('');
  const [partnerCode, setPartnerCode] = useState('');
  const [partnerRate, setPartnerRate] = useState(15);

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Filtered Leads
  const filteredLeads = leads.filter(l => {
    const matchesStage = stageFilter === 'ALL' || l.stage === stageFilter;
    const matchesSearch = !searchTerm.trim() || 
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.companyName && l.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStage && matchesSearch;
  });

  const totalPipelineValue = leads.reduce((acc, l) => l.stage !== 'Perdido' ? acc + (l.value || 0) : acc, 0);
  const closedDealsValue = leads.filter(l => l.stage === 'Fechado').reduce((acc, l) => acc + (l.value || 0), 0);
  const conversionRate = leads.length > 0 ? (leads.filter(l => l.stage === 'Fechado').length / leads.length) * 100 : 0;

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadEmail) return;

    try {
      await api.createLead({
        name: leadName,
        email: leadEmail,
        phone: leadPhone,
        companyName: leadCompany,
        source: leadSource,
        value: leadValue,
        notes: leadNotes,
        partnerReferralCode: leadPartnerCode || undefined
      });
      setIsNewLeadOpen(false);
      setLeadName('');
      setLeadEmail('');
      setLeadPhone('');
      setLeadCompany('');
      setLeadNotes('');
      setFeedbackMsg('Lead cadastrado no pipeline com sucesso!');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar lead.');
    }
  };

  const handleAdvanceStage = async (leadId: string, nextStage: LeadStage) => {
    try {
      await api.updateLeadStage(leadId, nextStage);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar estágio do lead.');
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propCompanyName || !propContactEmail || !propContactName) return;

    // Calculate sum of plan and services
    const plan = plans.find(p => p.tier === propPlanTier);
    const planCost = plan ? plan.annualPrice : 0;
    const servicesCost = propServicesSelected.reduce((acc, code) => {
      const srv = services.find(s => s.code === code);
      return acc + (srv ? srv.basePrice : 0);
    }, 0);
    const totalGross = planCost + servicesCost;

    try {
      await api.createProposal({
        leadId: selectedLeadForProp?.id,
        companyName: propCompanyName,
        contactName: propContactName,
        contactEmail: propContactEmail,
        contactPhone: propContactPhone,
        planTier: propPlanTier,
        servicesIncluded: [
          ...(plan ? [`Assinatura Anual ${plan.name} (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.annualPrice)})`] : []),
          ...propServicesSelected.map(code => {
            const s = services.find(x => x.code === code);
            return s ? `${s.name} (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.basePrice)})` : code;
          })
        ],
        totalValue: totalGross,
        discountPercent: propDiscount,
        validDays: 15,
        notes: propNotes
      });

      setIsNewProposalOpen(false);
      setPropCompanyName('');
      setPropContactName('');
      setPropContactEmail('');
      setPropContactPhone('');
      setPropServicesSelected([]);
      setPropDiscount(0);
      setFeedbackMsg('Proposta comercial emitida e anexada ao lead!');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao emitir proposta comercial.');
    }
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName || !partnerEmail || !partnerCode) return;

    try {
      await api.createPartner({
        name: partnerName,
        email: partnerEmail,
        companyName: partnerCompany,
        referralCode: partnerCode,
        commissionRate: partnerRate
      });
      setIsNewPartnerOpen(false);
      setPartnerName('');
      setPartnerEmail('');
      setPartnerCompany('');
      setPartnerCode('');
      setFeedbackMsg('Parceiro comercial registrado com sucesso!');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar parceiro.');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Top Banner & KPI Strip */}
      <div className="p-6 glass-obsidian-gold rounded-2xl border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-cinzel font-bold text-white tracking-wide">
              SHEFA AYIN · Motor de Aquisição & CRM Comercial
            </h2>
          </div>
          <p className="text-xs text-slate-300 font-light max-w-2xl">
            Prospecção contínua 24/7 com os agentes <strong>Radar Sentinel</strong>, <strong>Lead Organizer</strong> e <strong>Sales Negotiator</strong>. Pipeline de leads, propostas corporativas e gestão de parceiros.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="p-1 glass-obsidian rounded-xl border border-purple-900/40 flex items-center gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'pipeline' ? 'bg-amber-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Funil de Leads ({leads.length})
          </button>
          <button
            onClick={() => setActiveTab('proposals')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'proposals' ? 'bg-amber-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Propostas ({proposals.length})
          </button>
          <button
            onClick={() => setActiveTab('partners')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'partners' ? 'bg-amber-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Parceiros & Afiliados ({partners.length})
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 glass-obsidian rounded-xl border border-purple-900/30">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Pipeline Total</span>
          <span className="text-xl font-bold font-mono-numbers text-amber-400">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalPipelineValue)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{leads.filter(l => l.stage !== 'Perdido').length} oportunidades ativas</span>
        </div>

        <div className="p-4 glass-obsidian rounded-xl border border-purple-900/30">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Negócios Fechados</span>
          <span className="text-xl font-bold font-mono-numbers text-emerald-400">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(closedDealsValue)}
          </span>
          <span className="text-[10px] text-emerald-300 block mt-0.5">{leads.filter(l => l.stage === 'Fechado').length} conversões concluídas</span>
        </div>

        <div className="p-4 glass-obsidian rounded-xl border border-purple-900/30">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Taxa de Conversão</span>
          <span className="text-xl font-bold font-mono-numbers text-white">
            {conversionRate.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Média geral do funil</span>
        </div>

        <div className="p-4 glass-obsidian rounded-xl border border-purple-900/30">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Rede de Parceiros</span>
          <span className="text-xl font-bold font-mono-numbers text-purple-300">
            {partners.length} Ativos
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {partners.reduce((acc, p) => acc + p.totalReferredLeads, 0)} leads referenciados
          </span>
        </div>
      </div>

      {/* TAB 1: PIPELINE DE LEADS */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 glass-obsidian rounded-xl border border-purple-900/20">
            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <span className="text-slate-400 mr-2 text-[11px]">Estágio:</span>
              <button
                onClick={() => setStageFilter('ALL')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  stageFilter === 'ALL' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos ({leads.length})
              </button>
              {STAGES.map((stg) => (
                <button
                  key={stg}
                  onClick={() => setStageFilter(stg)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                    stageFilter === stg ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {stg} ({leads.filter(l => l.stage === stg).length})
                </button>
              ))}
            </div>

            {/* Actions: Search & Add Lead */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#050508] border border-purple-900/30 rounded-lg text-xs text-slate-300">
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar lead ou empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent focus:outline-none w-36 text-xs text-white"
                />
              </div>

              <button
                onClick={() => setIsNewLeadOpen(true)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Lead</span>
              </button>
            </div>
          </div>

          {/* Leads Table / Grid */}
          <div className="space-y-3">
            {filteredLeads.length === 0 ? (
              <div className="p-12 text-center glass-obsidian rounded-2xl border border-purple-900/20 text-xs text-slate-400">
                Nenhum lead encontrado com o filtro selecionado.
              </div>
            ) : (
              filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-4 glass-obsidian rounded-xl border border-purple-900/20 hover:border-amber-400/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-white text-sm">{lead.name}</span>
                      {lead.companyName && (
                        <>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="text-amber-200 font-medium">{lead.companyName}</span>
                        </>
                      )}
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        lead.stage === 'Fechado'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                          : lead.stage === 'Perdido'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                          : lead.stage === 'Proposta' || lead.stage === 'Negociação'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                          : 'bg-purple-950/80 text-purple-300 border border-purple-500/30'
                      }`}>
                        {lead.stage}
                      </span>
                      {lead.partnerReferralCode && (
                        <span className="px-1.5 py-0.5 bg-purple-900/40 text-purple-300 text-[10px] rounded font-mono-numbers">
                          Indicação: {lead.partnerReferralCode}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 font-light leading-relaxed">
                      {lead.notes || 'Sem anotações no momento.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-mono-numbers">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {lead.email}
                      </span>
                      {lead.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {lead.phone}
                        </span>
                      )}
                      <span>·</span>
                      <span>Agente: {lead.assignedAgent}</span>
                      <span>·</span>
                      <span>Origem: {lead.source}</span>
                    </div>
                  </div>

                  {/* Actions & Stage Advancement */}
                  <div className="flex items-center justify-between md:flex-col md:items-end gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-purple-900/20">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Valor Potencial</span>
                      <span className="text-base font-bold font-mono-numbers text-amber-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value || 0)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {lead.stage !== 'Fechado' && lead.stage !== 'Perdido' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedLeadForProp(lead);
                              setPropCompanyName(lead.companyName || lead.name);
                              setPropContactName(lead.name);
                              setPropContactEmail(lead.email);
                              setPropContactPhone(lead.phone || '');
                              setIsNewProposalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-amber-600/80 hover:bg-amber-500 text-white rounded text-xs font-medium transition-colors cursor-pointer"
                          >
                            Gerar Proposta
                          </button>

                          <button
                            onClick={() => {
                              const currentIndex = STAGES.indexOf(lead.stage);
                              if (currentIndex < STAGES.length - 2) {
                                handleAdvanceStage(lead.id, STAGES[currentIndex + 1]);
                              }
                            }}
                            className="px-2.5 py-1 bg-purple-900/60 hover:bg-purple-800 text-amber-200 border border-purple-700/40 rounded text-xs transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span>Avançar</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROPOSTAS COMERCIAIS */}
      {activeTab === 'proposals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 glass-obsidian rounded-xl border border-purple-900/20 text-xs text-slate-400">
            <span>Propostas comerciais formalizadas pelo AYIN SALES & SOFER</span>
            <button
              onClick={() => {
                setSelectedLeadForProp(null);
                setIsNewProposalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Proposta Comercial</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proposals.map((prop) => (
              <div
                key={prop.id}
                className="p-5 glass-obsidian rounded-2xl border border-purple-900/30 hover:border-amber-400/40 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono-numbers text-amber-400 uppercase tracking-widest block mb-0.5">
                        PROPOSTA #{prop.id.slice(-6)}
                      </span>
                      <h4 className="text-base font-cinzel font-bold text-white">
                        {prop.companyName}
                      </h4>
                      <span className="text-xs text-slate-400 font-light">
                        Contato: {prop.contactName} ({prop.contactEmail})
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      prop.status === 'ACCEPTED'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                        : prop.status === 'REJECTED'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                    }`}>
                      {prop.status === 'ACCEPTED' ? 'Aceita' : prop.status === 'REJECTED' ? 'Recusada' : 'Enviada'}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-purple-900/20 text-xs">
                    <span className="text-slate-400 block font-semibold">Itens e Serviços Inclusos:</span>
                    <ul className="space-y-1 text-slate-300 font-light text-[11px]">
                      {prop.servicesIncluded.map((s, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {prop.notes && (
                    <p className="text-xs text-slate-400 font-light italic bg-[#05050a] p-2.5 rounded-lg border border-purple-900/20">
                      "{prop.notes}"
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-purple-900/20 flex items-center justify-between text-xs">
                  <div>
                    {prop.discountPercent > 0 && (
                      <span className="text-[10px] text-slate-500 line-through block font-mono-numbers">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prop.totalValue)} (-{prop.discountPercent}%)
                      </span>
                    )}
                    <span className="text-lg font-bold font-mono-numbers text-amber-400">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prop.finalValue)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {prop.status !== 'ACCEPTED' && (
                      <button
                        onClick={async () => {
                          await api.updateProposal(prop.id, { status: 'ACCEPTED' });
                          onRefreshData();
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold cursor-pointer"
                      >
                        Marcar como Aceita
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: REDE DE PARCEIROS & AFILIADOS */}
      {activeTab === 'partners' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 glass-obsidian rounded-xl border border-purple-900/20 text-xs text-slate-400">
            <span>Programa Oficial de Parceiros Comerciais & Comissionamento</span>
            <button
              onClick={() => setIsNewPartnerOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Novo Parceiro</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="p-5 glass-obsidian rounded-2xl border border-purple-900/30 hover:border-amber-400/40 transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-cinzel font-bold text-white">
                      {partner.name}
                    </h4>
                    {partner.companyName && (
                      <span className="text-xs text-amber-300 font-medium block">
                        {partner.companyName}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 font-mono-numbers">
                      {partner.email}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Comissão Padrão</span>
                    <span className="text-base font-bold font-mono-numbers text-amber-400">
                      {partner.commissionRate}%
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#05050a] rounded-xl border border-purple-900/30 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Leads Indicados</span>
                    <span className="text-sm font-bold font-mono-numbers text-white">{partner.totalReferredLeads}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Fechados</span>
                    <span className="text-sm font-bold font-mono-numbers text-emerald-400">{partner.totalDealsClosed}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Comissão Gerada</span>
                    <span className="text-sm font-bold font-mono-numbers text-amber-400">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(partner.totalCommissionEarned)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-purple-900/20 font-mono-numbers">
                  <span>Código de Rastreio: <strong className="text-amber-300">{partner.referralCode}</strong></span>
                  <span className="text-emerald-400">Status: Ativo</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Novo Lead */}
      {isNewLeadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 glass-obsidian-gold rounded-2xl border border-amber-500/40 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <h3 className="text-base font-cinzel font-bold text-white">Cadastrar Novo Lead no CRM</h3>
              <button onClick={() => setIsNewLeadOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Nome do Contato:</label>
                <input
                  type="text"
                  required
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo Silveira"
                  className="w-full p-2.5 bg-[#07070f] border border-purple-900/30 rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Email:</label>
                  <input
                    type="email"
                    required
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="carlos@empresa.com.br"
                    className="w-full p-2.5 bg-[#07070f] border border-purple-900/30 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Telefone / WhatsApp:</label>
                  <input
                    type="text"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    placeholder="+55 (11) 99999-9999"
                    className="w-full p-2.5 bg-[#07070f] border border-purple-900/30 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Nome da Empresa:</label>
                  <input
                    type="text"
                    value={leadCompany}
                    onChange={(e) => setLeadCompany(e.target.value)}
                    placeholder="Silveira Transportes Ltda"
                    className="w-full p-2.5 bg-[#07070f] border border-purple-900/30 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Valor Estimado (R$):</label>
                  <input
                    type="number"
                    value={leadValue}
                    onChange={(e) => setLeadValue(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#07070f] border border-purple-900/30 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Origem:</label>
                  <select
                    value={leadSource}
                    onChange={(e) => setLeadSource(e.target.value)}
                    className="w-full p-2.5 bg-[#07070f] border border-purple-900/30 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Radar Sentinel">Radar Sentinel (Autônomo)</option>
                    <option value="Prospecção Ativa">Prospecção Ativa</option>
                    <option value="Inbound Site">Inbound Site</option>
                    <option value="Indicação Parceiro">Indicação de Parceiro</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Código do Parceiro (Opcional):</label>
                  <input
                    type="text"
                    value={leadPartnerCode}
                    onChange={(e) => setLeadPartnerCode(e.target.value.toUpperCase())}
                    placeholder="ALFA2026"
                    className="w-full p-2.5 bg-[#07070f] border border-purple-900/30 rounded-xl text-white focus:outline-none focus:border-amber-400 uppercase font-mono-numbers"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Anotações / Contexto:</label>
                <textarea
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  placeholder="Descreva as dores da empresa, interesse em planos ou serviços de implantação..."
                  rows={2}
                  className="w-full p-2.5 bg-[#07070f] border border-purple-900/30 rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 border-t border-amber-500/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewLeadOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow"
                >
                  Cadastrar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Nova Proposta Comercial */}
      {isNewProposalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl p-6 glass-obsidian-gold rounded-2xl border border-amber-500/40 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <h3 className="text-base font-cinzel font-bold text-white">Gerar Proposta Comercial Customizada</h3>
              <button onClick={() => setIsNewProposalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Empresa:</label>
                  <input
                    type="text"
                    required
                    value={propCompanyName}
                    onChange={(e) => setPropCompanyName(e.target.value)}
                    placeholder="Nome da empresa"
                    className="w-full p-2 bg-[#07070f] border border-purple-900/30 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Contato:</label>
                  <input
                    type="text"
                    required
                    value={propContactName}
                    onChange={(e) => setPropContactName(e.target.value)}
                    placeholder="Nome do decisor"
                    className="w-full p-2 bg-[#07070f] border border-purple-900/30 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Email:</label>
                  <input
                    type="email"
                    required
                    value={propContactEmail}
                    onChange={(e) => setPropContactEmail(e.target.value)}
                    placeholder="email@empresa.com"
                    className="w-full p-2 bg-[#07070f] border border-purple-900/30 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Telefone:</label>
                  <input
                    type="text"
                    value={propContactPhone}
                    onChange={(e) => setPropContactPhone(e.target.value)}
                    placeholder="+55 (11) 98765-4321"
                    className="w-full p-2 bg-[#07070f] border border-purple-900/30 rounded-xl text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Plano SaaS Anual Incluso:</label>
                <select
                  value={propPlanTier}
                  onChange={(e) => setPropPlanTier(e.target.value)}
                  className="w-full p-2 bg-[#07070f] border border-purple-900/30 rounded-xl text-white"
                >
                  <option value="Astral Starter">Astral Starter (R$ 1.970/ano)</option>
                  <option value="Cosmic Growth">Cosmic Growth (R$ 4.970/ano)</option>
                  <option value="Infinity Enterprise">Infinity Enterprise (R$ 14.970/ano)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Serviços Empresariais Adicionais:</label>
                <div className="grid grid-cols-2 gap-2">
                  {services.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 p-2 bg-[#050508] border border-purple-900/30 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={propServicesSelected.includes(s.code)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPropServicesSelected(prev => [...prev, s.code]);
                          } else {
                            setPropServicesSelected(prev => prev.filter(x => x !== s.code));
                          }
                        }}
                        className="rounded border-purple-700 text-amber-500"
                      />
                      <span className="text-[11px] text-slate-300 truncate">
                        {s.name} (+R$ {s.basePrice})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Desconto Negociado (%):</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={propDiscount}
                  onChange={(e) => setPropDiscount(Number(e.target.value))}
                  className="w-full p-2 bg-[#07070f] border border-purple-900/30 rounded-xl text-white font-mono-numbers"
                />
              </div>

              <div className="pt-3 border-t border-amber-500/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewProposalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow"
                >
                  Emitir Proposta Comercial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Novo Parceiro */}
      {isNewPartnerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 glass-obsidian-gold rounded-2xl border border-amber-500/40 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <h3 className="text-base font-cinzel font-bold text-white">Cadastrar Novo Parceiro / Afiliado</h3>
              <button onClick={() => setIsNewPartnerOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreatePartner} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Nome do Parceiro:</label>
                <input
                  type="text"
                  required
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="Nome do parceiro ou consultor"
                  className="w-full p-2.5 bg-[#07070f] border border-purple-900/30 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Email:</label>
                <input
                  type="email"
                  required
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder="parceiro@empresa.com"
                  className="w-full p-2.5 bg-[#07070f] border border-purple-900/30 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Código de Referência:</label>
                  <input
                    type="text"
                    required
                    value={partnerCode}
                    onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                    placeholder="EX: NEXUS2026"
                    className="w-full p-2.5 bg-[#07070f] border border-purple-900/30 rounded-xl text-white uppercase font-mono-numbers"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Taxa de Comissão (%):</label>
                  <input
                    type="number"
                    min="5"
                    max="35"
                    required
                    value={partnerRate}
                    onChange={(e) => setPartnerRate(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#07070f] border border-purple-900/30 rounded-xl text-white font-mono-numbers"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-amber-500/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewPartnerOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow"
                >
                  Salvar Parceiro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
