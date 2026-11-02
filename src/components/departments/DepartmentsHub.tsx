import React, { useState } from 'react';
import { 
  DepartmentId, 
  DepartmentInfo, 
  AutonomousAgent, 
  Mission, 
  Lead, 
  ProductItem, 
  FinancialRecord, 
  KnowledgeDoc,
  User 
} from '../../types/index.ts';
import { 
  Radar, 
  Compass, 
  Cpu, 
  Sparkles, 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  Database, 
  Play, 
  Power, 
  Plus, 
  ShieldAlert, 
  CheckCircle,
  FileText
} from 'lucide-react';
import { api } from '../../services/api.ts';

interface DepartmentsHubProps {
  departments: DepartmentInfo[];
  agents: AutonomousAgent[];
  missions: Mission[];
  leads: Lead[];
  products: ProductItem[];
  finances: FinancialRecord[];
  knowledge: KnowledgeDoc[];
  currentUser: User | null;
  selectedDepartmentId: DepartmentId;
  onSelectDepartment: (id: DepartmentId) => void;
  onRefreshData: () => void;
}

export const DepartmentsHub: React.FC<DepartmentsHubProps> = ({
  departments,
  agents,
  missions,
  leads,
  products,
  finances,
  knowledge,
  currentUser,
  selectedDepartmentId,
  onSelectDepartment,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'data'>('overview');
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadValue, setNewLeadValue] = useState('');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentDept = departments.find(d => d.id === selectedDepartmentId) || departments[0];
  const deptAgents = agents.filter(a => a.departmentId === selectedDepartmentId);
  const deptMissions = missions.filter(m => m.departmentsInvolved.includes(selectedDepartmentId));

  const handleToggleAgent = async (agentId: string) => {
    try {
      await api.toggleAgent24h(agentId);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar modo do agente.');
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim()) return;
    setIsSubmitting(true);
    try {
      await api.createLead({
        name: newLeadName,
        value: Number(newLeadValue) || 0,
        stage: 'Qualificado',
        notes: 'Lead registrado diretamente via terminal do AYIN Sales.'
      });
      setNewLeadName('');
      setNewLeadValue('');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar lead.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !newDocContent.trim()) return;
    setIsSubmitting(true);
    try {
      await api.createKnowledge({
        title: newDocTitle,
        content: newDocContent,
        category: 'guide'
      });
      setNewDocTitle('');
      setNewDocContent('');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar conhecimento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDeptIcon = (id: DepartmentId) => {
    switch (id) {
      case 'AYIN_RADAR': return <Radar className="w-4 h-4" />;
      case 'AYIN_STRATEGY': return <Compass className="w-4 h-4" />;
      case 'AYIN_AGENTS': return <Cpu className="w-4 h-4" />;
      case 'AYIN_CREATIVE': return <Sparkles className="w-4 h-4" />;
      case 'AYIN_SALES': return <TrendingUp className="w-4 h-4" />;
      case 'AYIN_MARKET': return <ShoppingBag className="w-4 h-4" />;
      case 'AYIN_FINANCE': return <DollarSign className="w-4 h-4" />;
      case 'AYIN_INTELLIGENCE': return <Database className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* 8 Department Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {departments.map((dept) => {
          const isSelected = dept.id === selectedDepartmentId;
          return (
            <button
              key={dept.id}
              onClick={() => onSelectDepartment(dept.id)}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-purple-900/60 border border-purple-400/50 text-white shadow-lg shadow-purple-950/50'
                  : 'glass-obsidian border border-purple-900/20 text-slate-400 hover:text-slate-200 hover:border-purple-800/40'
              }`}
            >
              <span className={isSelected ? 'text-amber-400' : 'text-slate-400'}>
                {getDeptIcon(dept.id)}
              </span>
              <span>{dept.name}</span>
              <span className="font-cinzel text-[10px] text-amber-300/70 hidden sm:inline">
                {dept.hebrewName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Department Command Deck */}
      <div className="p-6 glass-obsidian rounded-2xl border border-purple-900/30 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-purple-900/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl glass-obsidian-gold border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-lg">
              {getDeptIcon(currentDept.id)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-cinzel font-bold text-white tracking-wide">
                  {currentDept.name}
                </h2>
                <span className="text-xs font-cinzel text-amber-300">
                  {currentDept.hebrewName}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {currentDept.roleDescription}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
            <span className="font-mono-numbers">{deptAgents.length} Agentes Alocados</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-numbers">{deptMissions.length} Missões Vinculadas</span>
          </div>
        </div>

        {/* Specialized Department Content Renderers */}
        {selectedDepartmentId === 'AYIN_RADAR' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 glass-obsidian rounded-xl border border-purple-900/30 space-y-2">
                <span className="text-xs uppercase tracking-wider text-slate-400">Varredura de Sinais</span>
                <h4 className="text-sm font-semibold text-white">14 Concorrentes Rastreados</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-light">
                  Sinais detectados: Adoção de modelos proprietários e demanda por soberania de dados.
                </p>
              </div>

              <div className="p-4 glass-obsidian rounded-xl border border-purple-900/30 space-y-2">
                <span className="text-xs uppercase tracking-wider text-slate-400">Janela de Oportunidade</span>
                <h4 className="text-sm font-semibold text-emerald-400">Observatórios 24/7 Autônomos</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-light">
                  Nenhum concorrente direto oferece orquestração contínua em background sem manter o navegador aberto.
                </p>
              </div>

              <div className="p-4 glass-obsidian rounded-xl border border-purple-900/30 space-y-2">
                <span className="text-xs uppercase tracking-wider text-slate-400">Índice de Confiança</span>
                <h4 className="text-sm font-semibold text-amber-400 font-mono-numbers">98.4% Precisão Analítica</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-light">
                  Auditado pelo Ayin Radar Sentinel em tempo de execução.
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedDepartmentId === 'AYIN_STRATEGY' && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Roadmap de Engenharia Tática
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 glass-obsidian rounded-xl border border-purple-900/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">Matriz de Expansão B2B Enterprise</span>
                  <span className="text-emerald-400 font-mono-numbers">Fase 1 Concluída</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-light">
                  Foco na blindagem multitenant e isolamento de bases de conhecimento individuais por empresa.
                </p>
              </div>

              <div className="p-4 glass-obsidian rounded-xl border border-purple-900/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">Governança do Master Owner</span>
                  <span className="text-amber-400 font-mono-numbers">Ativa</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-light">
                  Ações sensíveis com impactos financeiros acima de R$ 1.000 ou alterações contratuais retidas formalmente.
                </p>
              </div>
            </div>
          </div>
        )}

        {selectedDepartmentId === 'AYIN_AGENTS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Matriz de Agentes Autônomos (Operação 24/7)
              </h3>
              <span className="text-xs text-slate-500">
                A execução independe do navegador estar aberto
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="p-4 glass-obsidian rounded-xl border border-purple-900/30 space-y-3 hover:border-purple-600/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white">{agent.name}</span>
                        <span className="text-xs font-cinzel text-amber-300/80">{agent.hebrewCodename}</span>
                      </div>
                      <span className="text-[11px] text-purple-300">{agent.role}</span>
                    </div>

                    <button
                      onClick={() => handleToggleAgent(agent.id)}
                      title={agent.is24hEnabled ? 'Desativar operação 24h' : 'Ativar operação contínua 24h'}
                      className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        agent.is24hEnabled 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-light">
                    {agent.specialty}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-purple-900/20 font-mono-numbers">
                    <span>{agent.totalMissionsCompleted} missões</span>
                    <span className="text-amber-400">{agent.accuracyScore}% acurácia</span>
                    <span className={agent.is24hEnabled ? 'text-emerald-400' : 'text-slate-500'}>
                      {agent.is24hEnabled ? '24h Ativo' : 'Manual'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedDepartmentId === 'AYIN_CREATIVE' && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Estúdio de Campanhas & Copywriting de Alta Conversão
            </h3>
            <div className="p-4 glass-obsidian rounded-xl border border-purple-900/30 space-y-3">
              <span className="text-xs font-semibold text-white block">
                Exemplar Ativo: Ativação B2B de Automação Contínua
              </span>
              <div className="p-3 bg-[#050508]/80 rounded-lg text-xs text-slate-300 leading-relaxed font-light border border-purple-900/20">
                "Prezado [Nome], enquanto a maioria das plataformas de IA opera como meros chatbots passivos, a SHEFA AYIN desenvolve uma inteligência central e agentes que executam missões estratégicas continuamente, 24 horas por dia, com isolamento absoluto dos seus dados corporativos."
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>Roteiro validado pelo Ayin Creative Scribe</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-400">95% Taxa de Engajamento Projetada</span>
              </div>
            </div>
          </div>
        )}

        {selectedDepartmentId === 'AYIN_SALES' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Funil Comercial de Oportunidades & Leads
              </h3>
            </div>

            {/* Quick Lead Creator */}
            <form onSubmit={handleCreateLead} className="p-4 glass-obsidian-gold rounded-xl border border-amber-500/20 flex flex-wrap gap-3 items-center">
              <input
                type="text"
                placeholder="Nome da oportunidade ou cliente..."
                value={newLeadName}
                onChange={(e) => setNewLeadName(e.target.value)}
                className="bg-[#050508] border border-purple-900/40 text-xs px-3 py-2 rounded-lg text-slate-200 placeholder-slate-500 flex-1 min-w-[200px]"
              />
              <input
                type="number"
                placeholder="Valor estimado (R$)..."
                value={newLeadValue}
                onChange={(e) => setNewLeadValue(e.target.value)}
                className="bg-[#050508] border border-purple-900/40 text-xs px-3 py-2 rounded-lg text-slate-200 placeholder-slate-500 w-36"
              />
              <button
                type="submit"
                disabled={isSubmitting || !newLeadName.trim()}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Lead</span>
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-purple-900/30">
                  <tr>
                    <th className="py-2.5 px-3">Cliente / Contato</th>
                    <th className="py-2.5 px-3">Origem</th>
                    <th className="py-2.5 px-3">Estágio</th>
                    <th className="py-2.5 px-3">Agente Responsável</th>
                    <th className="py-2.5 px-3 text-right">Valor Projetado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/20">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-purple-950/20 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-semibold text-white block">{lead.name}</span>
                        <span className="text-[11px] text-slate-400">{lead.email}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{lead.source}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono-numbers text-amber-300 bg-amber-950/40 border border-amber-500/20">
                          {lead.stage}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{lead.assignedAgent}</td>
                      <td className="py-3 px-3 text-right font-mono-numbers text-white font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedDepartmentId === 'AYIN_MARKET' && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Catálogo de Produtos, Infoprodutos e Comissões
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map((prod) => (
                <div key={prod.id} className="p-4 glass-obsidian rounded-xl border border-purple-900/30 space-y-2">
                  <span className="text-[11px] text-amber-400 uppercase tracking-wider">{prod.category}</span>
                  <h4 className="text-sm font-semibold text-white">{prod.title}</h4>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-purple-900/20 font-mono-numbers">
                    <span className="text-slate-300">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prod.price)}
                    </span>
                    <span className="text-purple-300">{prod.commissionRate}% Comiss.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedDepartmentId === 'AYIN_FINANCE' && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Demonstrativo Financeiro & Trava Orçamentária
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 glass-obsidian rounded-xl border border-emerald-500/20 space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-slate-400">Receitas Liquidadas</span>
                <div className="text-xl font-bold font-mono-numbers text-emerald-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    finances.filter(f => f.type === 'assinatura' || f.type === 'receita').reduce((acc, c) => acc + c.amount, 0)
                  )}
                </div>
              </div>

              <div className="p-4 glass-obsidian rounded-xl border border-rose-500/20 space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-slate-400">Custos Operacionais</span>
                <div className="text-xl font-bold font-mono-numbers text-rose-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    finances.filter(f => f.type === 'custo').reduce((acc, c) => acc + c.amount, 0)
                  )}
                </div>
              </div>

              <div className="p-4 glass-obsidian-gold rounded-xl border border-amber-500/30 space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-amber-300">Trava de Aprovação</span>
                <div className="text-xs text-amber-200 leading-relaxed font-light">
                  Gastos acima de R$ 1.000 exigem chancela manual do Master Owner (Alifermadeiro@hotmail.com).
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-purple-900/30">
                  <tr>
                    <th className="py-2.5 px-3">Lançamento</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/20">
                  {finances.map((fin) => (
                    <tr key={fin.id} className="hover:bg-purple-950/20 transition-colors">
                      <td className="py-3 px-3 font-medium text-white">{fin.title}</td>
                      <td className="py-3 px-3 text-slate-300 uppercase text-[10px]">{fin.type}</td>
                      <td className="py-3 px-3 text-slate-400 font-mono-numbers">{fin.date}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono-numbers ${
                          fin.status === 'liquidado' ? 'text-emerald-300 bg-emerald-950/40' : 'text-amber-300 bg-amber-950/40'
                        }`}>
                          {fin.status}
                        </span>
                      </td>
                      <td className={`py-3 px-3 text-right font-mono-numbers font-medium ${
                        fin.type === 'custo' ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fin.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedDepartmentId === 'AYIN_INTELLIGENCE' && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Base de Conhecimento Vetorial & Memória Operacional
            </h3>

            {/* Knowledge Add Form */}
            <form onSubmit={handleCreateKnowledge} className="p-4 glass-obsidian rounded-xl border border-purple-900/30 space-y-3">
              <input
                type="text"
                placeholder="Título do documento ou diretriz..."
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                className="w-full bg-[#050508] border border-purple-900/40 text-xs px-3 py-2 rounded-lg text-slate-200 placeholder-slate-500"
              />
              <textarea
                placeholder="Conteúdo informativo ou regra de negócios autorizada..."
                value={newDocContent}
                onChange={(e) => setNewDocContent(e.target.value)}
                rows={2}
                className="w-full bg-[#050508] border border-purple-900/40 text-xs p-3 rounded-lg text-slate-200 placeholder-slate-500 resize-none"
              />
              <button
                type="submit"
                disabled={isSubmitting || !newDocTitle.trim() || !newDocContent.trim()}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Indexar na Memória</span>
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {knowledge.map((doc) => (
                <div key={doc.id} className="p-4 glass-obsidian rounded-xl border border-purple-900/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{doc.title}</span>
                    <span className="text-[10px] uppercase text-purple-400 font-mono-numbers">{doc.category}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-light">{doc.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
