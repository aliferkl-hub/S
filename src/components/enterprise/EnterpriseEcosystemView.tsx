import React, { useState } from 'react';
import { 
  AiProviderConfig, 
  AiTaskRoutingRule, 
  EnterpriseIntegration, 
  CloudInfrastructureComparison, 
  TechCostGovernance, 
  User 
} from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { 
  Cpu, 
  Layers, 
  ShieldCheck, 
  DollarSign, 
  Activity, 
  RefreshCw, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Server, 
  Database, 
  Sparkles, 
  Network, 
  Power, 
  Radio, 
  HardDrive, 
  Zap, 
  ExternalLink,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface EnterpriseEcosystemViewProps {
  currentUser: User | null;
  aiProviders: AiProviderConfig[];
  routingRules: AiTaskRoutingRule[];
  integrations: EnterpriseIntegration[];
  cloudDossier: CloudInfrastructureComparison | null;
  techGovernance: TechCostGovernance | null;
  onRefreshAll: () => Promise<void>;
}

export const EnterpriseEcosystemView: React.FC<EnterpriseEcosystemViewProps> = ({
  currentUser,
  aiProviders,
  routingRules,
  integrations,
  cloudDossier,
  techGovernance,
  onRefreshAll
}) => {
  const isMaster = currentUser?.role === 'MASTER_OWNER';
  const [activeTab, setActiveTab] = useState<'ai_gateway' | 'marketplace' | 'budget' | 'cloud_graph'>('ai_gateway');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testFeedback, setTestFeedback] = useState<{ [key: string]: { success: boolean; message: string; latency?: number } }>({});
  const [newBudgetCap, setNewBudgetCap] = useState<number>(techGovernance?.monthlyBudgetCapBrl || 2500);
  const [isUpdatingBudget, setIsUpdatingBudget] = useState(false);
  const [isUpdatingMigration, setIsUpdatingMigration] = useState(false);

  // Test an AI provider
  const handleTestProvider = async (providerId: string) => {
    setTestingId(providerId);
    try {
      const res = await api.testAiProvider(providerId);
      setTestFeedback(prev => ({
        ...prev,
        [providerId]: { success: res.success, message: res.message, latency: res.latencyMs }
      }));
      await onRefreshAll();
    } catch (err: any) {
      setTestFeedback(prev => ({
        ...prev,
        [providerId]: { success: false, message: err.message || 'Falha no teste.' }
      }));
    } finally {
      setTestingId(null);
    }
  };

  // Test an enterprise integration
  const handleTestIntegration = async (integrationId: string) => {
    setTestingId(integrationId);
    try {
      const res = await api.testMarketplaceIntegration(integrationId);
      setTestFeedback(prev => ({
        ...prev,
        [integrationId]: { success: res.success, message: res.message, latency: res.latencyMs }
      }));
      await onRefreshAll();
    } catch (err: any) {
      setTestFeedback(prev => ({
        ...prev,
        [integrationId]: { success: false, message: err.message || 'Falha no teste.' }
      }));
    } finally {
      setTestingId(null);
    }
  };

  // Toggle master authorization for AI Provider
  const handleToggleProviderApproval = async (provider: AiProviderConfig) => {
    if (!isMaster) return;
    try {
      await api.updateAiProvider(provider.providerId, {
        isMasterApproved: !provider.isMasterApproved,
        isActive: !provider.isMasterApproved
      });
      await onRefreshAll();
    } catch (err) {
      console.error('Failed to toggle provider:', err);
    }
  };

  // Toggle master authorization for Integration
  const handleToggleIntegrationApproval = async (integration: EnterpriseIntegration) => {
    if (!isMaster) return;
    try {
      await api.updateMarketplaceIntegration(integration.id, {
        isMasterApproved: !integration.isMasterApproved
      });
      await onRefreshAll();
    } catch (err) {
      console.error('Failed to toggle integration:', err);
    }
  };

  // Update Tech Budget Cap
  const handleSaveBudgetCap = async () => {
    if (!isMaster) return;
    setIsUpdatingBudget(true);
    try {
      await api.updateTechBudgetCap(newBudgetCap);
      await onRefreshAll();
    } catch (err) {
      console.error('Failed updating budget cap:', err);
    } finally {
      setIsUpdatingBudget(false);
    }
  };

  // Approve or revoke cloud migration
  const handleToggleMigration = async (currentStatus: boolean) => {
    if (!isMaster) return;
    setIsUpdatingMigration(true);
    try {
      await api.approveCloudMigration(!currentStatus);
      await onRefreshAll();
    } catch (err) {
      console.error('Failed toggling migration:', err);
    } finally {
      setIsUpdatingMigration(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 rounded flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> ATIVO</span>;
      case 'CONNECTED':
        return <span className="px-2.5 py-1 text-[11px] font-bold bg-sky-950/80 text-sky-300 border border-sky-600/40 rounded flex items-center gap-1"><Radio className="w-3 h-3" /> CONECTADO</span>;
      case 'AVAILABLE':
        return <span className="px-2.5 py-1 text-[11px] font-bold bg-purple-950/80 text-purple-300 border border-purple-600/40 rounded flex items-center gap-1">DISPONÍVEL</span>;
      case 'PENDING_APPROVAL':
        return <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-600/40 rounded flex items-center gap-1"><AlertCircle className="w-3 h-3" /> PENDENTE APROVAÇÃO</span>;
      case 'DISABLED':
        return <span className="px-2.5 py-1 text-[11px] font-bold bg-slate-900 text-slate-400 border border-slate-700 rounded flex items-center gap-1"><Lock className="w-3 h-3" /> DESATIVADO</span>;
      default:
        return <span className="px-2.5 py-1 text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-600/40 rounded flex items-center gap-1">ERRO</span>;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 glass-obsidian rounded-2xl border border-purple-900/30">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-amber-400 uppercase mb-1">
            <Cpu className="w-4 h-4" />
            <span>Versão 3.0 — Ecossistema Tecnológico Global & Inteligência Corporativa</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-cinzel font-bold text-white tracking-wide">
            ENTERPRISE TECHNOLOGY ECOSYSTEM
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl mt-1">
            Gateway unificado de provedores de IA (Gemini, OpenAI, Bedrock, Nova), registro interno de integrações corporativas, governança orçamentária e comparativo de infraestrutura em nuvem.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onRefreshAll()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-950/60 hover:bg-purple-900 text-amber-200 border border-purple-600/40 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar Telemetria</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-purple-900/30 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ai_gateway')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ai_gateway'
              ? 'bg-gradient-to-r from-purple-900/80 to-purple-800/80 text-amber-300 border border-amber-500/40 shadow'
              : 'text-slate-400 hover:text-white hover:bg-purple-950/30'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>AI Provider Gateway ({aiProviders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('marketplace')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'marketplace'
              ? 'bg-gradient-to-r from-purple-900/80 to-purple-800/80 text-amber-300 border border-amber-500/40 shadow'
              : 'text-slate-400 hover:text-white hover:bg-purple-950/30'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Marketplace de Integrações ({integrations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('budget')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'budget'
              ? 'bg-gradient-to-r from-purple-900/80 to-purple-800/80 text-amber-300 border border-amber-500/40 shadow'
              : 'text-slate-400 hover:text-white hover:bg-purple-950/30'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Governança & Teto de Custos</span>
        </button>

        <button
          onClick={() => setActiveTab('cloud_graph')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'cloud_graph'
              ? 'bg-gradient-to-r from-purple-900/80 to-purple-800/80 text-amber-300 border border-amber-500/40 shadow'
              : 'text-slate-400 hover:text-white hover:bg-purple-950/30'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Nuvem GCP vs AWS & Grafo Neo4j</span>
        </button>
      </div>

      {/* TAB 1: AI PROVIDER GATEWAY */}
      {activeTab === 'ai_gateway' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {aiProviders.map(provider => {
              const feedback = testFeedback[provider.providerId];
              const isTesting = testingId === provider.providerId;

              return (
                <div 
                  key={provider.providerId}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    provider.isActive 
                      ? 'bg-[#0a0a14] border-purple-800/50 shadow-lg shadow-purple-950/30' 
                      : 'glass-obsidian border-purple-950/30 opacity-80'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                          {provider.providerId === 'gemini' ? 'Provedor Nativo Primário' : 'Provedor Compatível'}
                        </span>
                        <h3 className="font-bold text-white text-base font-cinzel">{provider.providerName}</h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">Modelo: {provider.modelId}</p>
                      </div>
                      <div>{getStatusBadge(provider.status)}</div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {provider.notes}
                    </p>

                    {/* Telemetry Numbers */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-purple-950/20 border border-purple-900/30 rounded-xl text-center">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Latência</div>
                        <div className="text-xs font-bold text-emerald-400">{provider.latencyMs}ms</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Chamadas</div>
                        <div className="text-xs font-bold text-white">{provider.callsCount}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Gasto Mês</div>
                        <div className="text-xs font-bold text-amber-400">R$ {provider.currentMonthSpentBrl.toFixed(2)}</div>
                      </div>
                    </div>

                    {feedback && (
                      <div className={`p-2.5 rounded-lg text-[11px] border ${
                        feedback.success ? 'bg-emerald-950/50 border-emerald-600/40 text-emerald-300' : 'bg-rose-950/50 border-rose-600/40 text-rose-300'
                      }`}>
                        {feedback.message}
                      </div>
                    )}
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-purple-900/30 text-xs">
                    <button
                      onClick={() => handleTestProvider(provider.providerId)}
                      disabled={isTesting}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900 text-slate-200 rounded border border-purple-700/30 cursor-pointer disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isTesting ? 'Testando...' : 'Testar Ping'}</span>
                    </button>

                    {isMaster && provider.providerId !== 'gemini' && provider.providerId !== 'mock_sandbox' && (
                      <button
                        onClick={() => handleToggleProviderApproval(provider)}
                        className={`px-3 py-1.5 rounded font-semibold transition-colors cursor-pointer ${
                          provider.isMasterApproved
                            ? 'bg-rose-900/40 hover:bg-rose-800/60 text-rose-200 border border-rose-600/40'
                            : 'bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-200 border border-emerald-600/40'
                        }`}
                      >
                        {provider.isMasterApproved ? 'Suspender Provedor' : 'Autorizar Master'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Task Routing Rules Matrix */}
          <div className="p-6 glass-obsidian rounded-2xl border border-purple-900/30 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white font-cinzel">Matriz de Roteamento Neural por Tarefa</h2>
                <p className="text-xs text-slate-400">Distribuição automatizada de cargas de trabalho entre os provedores de acordo com latência e ROI.</p>
              </div>
              <span className="text-[11px] text-amber-400 font-mono">Centralized Model Orchestration</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-purple-900/40 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Categoria da Tarefa</th>
                    <th className="py-3 px-4">Provedor Primário</th>
                    <th className="py-3 px-4">Provedor Fallback (Contingência)</th>
                    <th className="py-3 px-4">Max Tokens</th>
                    <th className="py-3 px-4">Temperatura</th>
                    <th className="py-3 px-4">Status de Soberania</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/20 text-slate-200 font-sans">
                  {routingRules.map(rule => (
                    <tr key={rule.taskCategory} className="hover:bg-purple-950/20">
                      <td className="py-3 px-4 font-semibold text-white font-mono">{rule.taskCategory}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[11px]">
                          {rule.preferredProvider.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono text-[11px]">
                          {rule.fallbackProvider.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">{rule.maxTokens}</td>
                      <td className="py-3 px-4 font-mono">{rule.temperature}</td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aprovado Master
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MARKETPLACE DE INTEGRAÇÕES */}
      {activeTab === 'marketplace' && (
        <div className="space-y-6">
          <div className="p-4 bg-purple-950/20 border border-purple-900/30 rounded-xl text-xs text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Conexão validada sob demanda. Integrações só aparecem conectadas após aprovação e teste real com latência comprovada.</span>
            </div>
            <span className="text-amber-400 font-mono">{integrations.filter(i => i.status === 'ACTIVE' || i.status === 'CONNECTED').length} Ativas / {integrations.length} Totais</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {integrations.map(item => {
              const feedback = testFeedback[item.id];
              const isTesting = testingId === item.id;

              return (
                <div 
                  key={item.id}
                  className="p-5 glass-obsidian rounded-2xl border border-purple-900/30 flex flex-col justify-between hover:border-purple-700/40 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono text-amber-400 uppercase">{item.provider}</span>
                        <h3 className="font-bold text-white text-sm mt-0.5">{item.productName}</h3>
                        <span className="text-[11px] text-slate-400 font-mono">{item.departmentId}</span>
                      </div>
                      <div>{getStatusBadge(item.status)}</div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.purpose}
                    </p>

                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-black/40 rounded-xl text-[11px] text-slate-400">
                      <div>
                        <span>Latência: </span>
                        <strong className="text-emerald-400">{item.latencyMs > 0 ? `${item.latencyMs}ms` : 'Standby'}</strong>
                      </div>
                      <div>
                        <span>Chamadas: </span>
                        <strong className="text-white">{item.usageVolumeCalls}</strong>
                      </div>
                      <div>
                        <span>Custo Estimado: </span>
                        <strong className="text-amber-400">R$ {item.estimatedMonthlyCostBrl.toFixed(2)}/mês</strong>
                      </div>
                      <div>
                        <span>Autenticação: </span>
                        <strong className={item.authStatus === 'VERIFIED' ? 'text-emerald-400' : 'text-amber-400'}>{item.authStatus}</strong>
                      </div>
                    </div>

                    {feedback && (
                      <div className={`p-2 rounded text-[11px] border ${
                        feedback.success ? 'bg-emerald-950/60 border-emerald-600/40 text-emerald-300' : 'bg-rose-950/60 border-rose-600/40 text-rose-300'
                      }`}>
                        {feedback.message}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-purple-900/30 text-xs">
                    <button
                      onClick={() => handleTestIntegration(item.id)}
                      disabled={isTesting}
                      className="px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900 text-slate-200 rounded border border-purple-700/30 cursor-pointer disabled:opacity-50"
                    >
                      {isTesting ? 'Verificando...' : 'Testar Conexão'}
                    </button>

                    {isMaster && (
                      <button
                        onClick={() => handleToggleIntegrationApproval(item)}
                        className={`px-3 py-1.5 rounded font-semibold transition-colors cursor-pointer ${
                          item.isMasterApproved
                            ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-600/40'
                            : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/40'
                        }`}
                      >
                        {item.isMasterApproved ? 'Revogar Master' : 'Aprovar Master'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: GOVERNANÇA & TETO DE CUSTOS */}
      {activeTab === 'budget' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 glass-obsidian rounded-2xl border border-purple-900/30">
              <span className="text-xs text-slate-400 uppercase font-semibold">Teto Orçamentário Mensal</span>
              <div className="text-2xl font-bold text-white mt-1">
                R$ {(techGovernance?.monthlyBudgetCapBrl || 2500).toFixed(2)}
              </div>
              <p className="text-xs text-slate-400 mt-2">Limite máximo estipulado pelo Master Owner para consumo de APIs.</p>
            </div>

            <div className="p-6 glass-obsidian rounded-2xl border border-purple-900/30">
              <span className="text-xs text-slate-400 uppercase font-semibold">Consumo Efetivo no Mês</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                R$ {(techGovernance?.totalSpentThisMonthBrl || 218.40).toFixed(2)}
              </div>
              <p className="text-xs text-slate-400 mt-2">Equivalente a {techGovernance?.spentPercent || 8.74}% do teto aprovado.</p>
            </div>

            <div className="p-6 glass-obsidian rounded-2xl border border-purple-900/30">
              <span className="text-xs text-slate-400 uppercase font-semibold">Kill-Switch de Gastos</span>
              <div className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
                {techGovernance?.isAutoPaused ? (
                  <span className="text-rose-400 flex items-center gap-1.5"><ShieldAlert className="w-5 h-5" /> AUTO-PAUSADO</span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1.5"><CheckCircle2 className="w-5 h-5" /> LIBERADO</span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">Pausa automática ativada caso o consumo alcance 100% do teto.</p>
            </div>
          </div>

          {/* Budget Setting Form for Master Owner */}
          {isMaster && (
            <div className="p-6 glass-obsidian rounded-2xl border border-amber-500/30 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Configuração Soberana do Teto de Gastos de Tecnologia</span>
              </div>
              <p className="text-xs text-slate-300">
                Nenhum provedor de tecnologia pago pode exceder o valor definido sem intervenção manual do Master Owner:
              </p>

              <div className="flex items-center gap-4 max-w-md">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400">R$</span>
                  <input
                    type="number"
                    value={newBudgetCap}
                    onChange={e => setNewBudgetCap(Number(e.target.value))}
                    className="w-full bg-[#080910] border border-purple-900/40 rounded-xl pl-8 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    min={100}
                    step={100}
                  />
                </div>
                <button
                  onClick={handleSaveBudgetCap}
                  disabled={isUpdatingBudget}
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingBudget ? 'Atualizando...' : 'Atualizar Teto'}
                </button>
              </div>
            </div>
          )}

          {/* Provider Breakdown Table */}
          <div className="p-6 glass-obsidian rounded-2xl border border-purple-900/30 space-y-4">
            <h3 className="text-sm font-bold text-white font-cinzel">Detalhamento de Custos por Provedor</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-purple-900/40 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-4">Provedor</th>
                    <th className="py-2.5 px-4">Chamadas</th>
                    <th className="py-2.5 px-4">Tokens Consumidos</th>
                    <th className="py-2.5 px-4">Gasto Efetivo</th>
                    <th className="py-2.5 px-4">% do Orçamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/20 text-slate-200">
                  {(techGovernance?.providerBreakdown || []).map(item => (
                    <tr key={item.providerId} className="hover:bg-purple-950/20">
                      <td className="py-3 px-4 font-semibold text-white">{item.providerName}</td>
                      <td className="py-3 px-4 font-mono">{item.calls}</td>
                      <td className="py-3 px-4 font-mono">{item.tokens.toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono text-emerald-400 font-bold">R$ {item.spentBrl.toFixed(2)}</td>
                      <td className="py-3 px-4 font-mono">
                        {techGovernance?.totalSpentThisMonthBrl 
                          ? ((item.spentBrl / techGovernance.totalSpentThisMonthBrl) * 100).toFixed(1) + '%'
                          : '0.0%'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NUVEM & GRAFO NEO4J */}
      {activeTab === 'cloud_graph' && cloudDossier && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current GCP Hosting */}
            <div className="p-6 glass-obsidian rounded-2xl border border-emerald-900/40 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Infraestrutura Atual em Produção</span>
                  <h3 className="text-lg font-bold text-white font-cinzel">{cloudDossier.currentHosting.provider}</h3>
                  <p className="text-xs text-slate-400">Região: {cloudDossier.currentHosting.region}</p>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/40 rounded">
                  ATIVO
                </span>
              </div>

              <div className="p-3 bg-black/40 rounded-xl space-y-1.5 text-xs">
                <div className="text-slate-300">Especificações: <strong>{cloudDossier.currentHosting.containerSpecs}</strong></div>
                <div className="text-slate-300">Custo Mensal Estimado: <strong className="text-emerald-400">R$ {cloudDossier.currentHosting.monthlyCostBrl.toFixed(2)}</strong></div>
                <div className="text-slate-300">RTO: <strong>{cloudDossier.currentHosting.rtoMinutes} min</strong> · RPO: <strong>{cloudDossier.currentHosting.rpoMinutes} min</strong></div>
              </div>

              <div>
                <strong className="text-xs text-white block mb-2">Vantagens Operacionais:</strong>
                <ul className="text-xs text-slate-300 space-y-1 pl-4 list-disc">
                  {cloudDossier.currentHosting.benefits.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Evaluated AWS Alternative */}
            <div className="p-6 glass-obsidian rounded-2xl border border-purple-900/40 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">Alternativa Avaliada (Dossier Técnico)</span>
                  <h3 className="text-lg font-bold text-white font-cinzel">{cloudDossier.awsAlternative.provider}</h3>
                  <p className="text-xs text-slate-400">Região: {cloudDossier.awsAlternative.region}</p>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-bold bg-purple-950 text-purple-300 border border-purple-600/40 rounded">
                  HOMOLOGADO
                </span>
              </div>

              <div className="p-3 bg-black/40 rounded-xl space-y-1.5 text-xs">
                <div className="text-slate-300">Especificações: <strong>{cloudDossier.awsAlternative.containerSpecs}</strong></div>
                <div className="text-slate-300">Custo Mensal Estimado: <strong className="text-amber-400">R$ {cloudDossier.awsAlternative.monthlyCostBrl.toFixed(2)}</strong></div>
                <div className="text-slate-300">RTO: <strong>{cloudDossier.awsAlternative.rtoMinutes} min</strong> · RPO: <strong>{cloudDossier.awsAlternative.rpoMinutes} min</strong></div>
              </div>

              <div>
                <strong className="text-xs text-white block mb-2">Vantagens Operacionais:</strong>
                <ul className="text-xs text-slate-300 space-y-1 pl-4 list-disc">
                  {cloudDossier.awsAlternative.benefits.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>

              {isMaster && (
                <div className="pt-2 border-t border-purple-900/30 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Aprovação Master de Migração:</span>
                  <button
                    onClick={() => handleToggleMigration(cloudDossier.isMigrationApprovedByMaster)}
                    disabled={isUpdatingMigration}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                      cloudDossier.isMigrationApprovedByMaster
                        ? 'bg-rose-950 text-rose-300 border border-rose-600/40'
                        : 'bg-amber-600 hover:bg-amber-500 text-white'
                    }`}
                  >
                    {cloudDossier.isMigrationApprovedByMaster ? 'Revogar Aprovação de Migração' : 'Aprovar Migração p/ AWS'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Neo4j Graph DB Evaluation */}
          <div className="p-6 glass-obsidian rounded-2xl border border-purple-900/30 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">Camada de Inteligência de Dados & Grafos</span>
                <h3 className="text-lg font-bold text-white font-cinzel">{cloudDossier.neo4jEvaluation.product}</h3>
              </div>
              <span className="px-3 py-1 rounded bg-amber-950 text-amber-300 text-xs font-bold border border-amber-600/40">
                PARECER TÉCNICO: MANTER JSON UNIFICADO
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed bg-black/40 p-4 rounded-xl border border-purple-900/30">
              {cloudDossier.neo4jEvaluation.justification}
            </p>

            <div className="space-y-2">
              <strong className="text-xs text-white block">Preview do Grafo Relacional SHEFA AYIN (Cypher Ready):</strong>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono bg-purple-950/20 p-4 rounded-xl border border-purple-900/30">
                <div>
                  <span className="text-amber-400 block mb-1">Nós Definidos:</span>
                  <ul className="text-slate-300 space-y-1">
                    {cloudDossier.neo4jEvaluation.graphSchemaPreview.nodes.map((node, i) => (
                      <li key={i}>{node}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-amber-400 block mb-1">Relações Mapeadas:</span>
                  <ul className="text-slate-300 space-y-1">
                    {cloudDossier.neo4jEvaluation.graphSchemaPreview.relationships.map((rel, i) => (
                      <li key={i}>{rel}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Disaster Recovery & Backup Integrity */}
          <div className="p-6 glass-obsidian rounded-2xl border border-purple-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
                <HardDrive className="w-4 h-4" />
                <span>Protocolo de Recuperação de Desastres & Backup Automático</span>
              </div>
              <p className="text-xs text-slate-300">
                Último snapshot: <strong className="text-white">{new Date(cloudDossier.disasterRecovery.lastBackupTimestamp).toLocaleString('pt-BR')}</strong> · Destino: <code className="text-amber-400">{cloudDossier.disasterRecovery.backupLocation}</code>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-600/40 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                INTEGRIDADE: {cloudDossier.disasterRecovery.backupIntegrityCheck}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
