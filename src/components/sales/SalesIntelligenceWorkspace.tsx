import React, { useState } from 'react';
import { 
  SalesOpportunityScore, 
  Lead, 
  User 
} from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  PhoneCall, 
  Mail, 
  MessageSquare, 
  Calendar, 
  ChevronRight, 
  RefreshCw, 
  CheckCircle2, 
  ShieldAlert, 
  FileText,
  DollarSign
} from 'lucide-react';

interface SalesIntelligenceWorkspaceProps {
  scores: SalesOpportunityScore[];
  leads: Lead[];
  currentUser: User | null;
  onRefreshScores: () => Promise<void>;
  onNavigateToLead?: (leadId: string) => void;
}

export const SalesIntelligenceWorkspace: React.FC<SalesIntelligenceWorkspaceProps> = ({
  scores,
  leads,
  currentUser,
  onRefreshScores,
  onNavigateToLead
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(scores[0]?.leadId || leads[0]?.id || '');
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [isAnalyzingTranscript, setIsAnalyzingTranscript] = useState(false);
  const [transcriptResult, setTranscriptResult] = useState<any | null>(null);
  const [filterIntent, setFilterIntent] = useState<string>('ALL');

  const selectedScore = scores.find(s => s.leadId === selectedLeadId) || scores[0];
  const selectedLead = leads.find(l => l.id === selectedLeadId);

  // High-level pipeline metrics
  const totalPipelineValue = leads.reduce((acc, l) => acc + (l.value || 0), 0);
  const highFitCount = scores.filter(s => s.score >= 80).length;
  const staleDealsCount = scores.filter(s => s.isStaleRisk).length;
  const readyToBuyCount = scores.filter(s => s.intent === 'READY_TO_BUY').length;

  const filteredScores = scores.filter(s => {
    if (filterIntent === 'ALL') return true;
    return s.intent === filterIntent;
  });

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      await api.recalculateSalesScores();
      await onRefreshScores();
    } catch (err) {
      console.error('Failed to recalculate scores:', err);
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleAnalyzeTranscript = async () => {
    if (!transcriptText.trim()) return;
    setIsAnalyzingTranscript(true);
    try {
      const res = await api.analyzeTranscript(transcriptText, selectedScore?.companyName);
      setTranscriptResult(res);
    } catch (err) {
      console.error('Failed to analyze transcript:', err);
    } finally {
      setIsAnalyzingTranscript(false);
    }
  };

  const getIntentBadge = (intent: string) => {
    switch (intent) {
      case 'READY_TO_BUY':
        return <span className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 rounded">Pronto para Compra</span>;
      case 'TECHNICAL_VALIDATION':
        return <span className="px-2.5 py-1 text-[11px] font-semibold bg-sky-950/80 text-sky-300 border border-sky-600/40 rounded">Validação Técnica / LGPD</span>;
      case 'PRICE_SENSITIVE':
        return <span className="px-2.5 py-1 text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-600/40 rounded">Sensível a Preço</span>;
      case 'CHURN_RISK':
        return <span className="px-2.5 py-1 text-[11px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-600/40 rounded">Risco de Perda</span>;
      default:
        return <span className="px-2.5 py-1 text-[11px] font-semibold bg-purple-950/80 text-purple-300 border border-purple-600/40 rounded">Em Avaliação</span>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30';
    if (score >= 70) return 'text-amber-400 border-amber-500/40 bg-amber-950/30';
    return 'text-slate-400 border-slate-700 bg-slate-900/30';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header & Strategic Mission */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 glass-obsidian rounded-2xl border border-purple-900/30">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-amber-400 uppercase mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Motor de Inteligência Comercial — Inspirado em Entel Agent2Sales & Nova Gestões</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-cinzel font-bold text-white tracking-wide">
            SALES INTELLIGENCE WORKSPACE
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl mt-1">
            Detecção autônoma de intenção de compra, pontuação preditiva de oportunidades (0-100), coaching tático personalizado e identificação de negócios em risco.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
            <span>{isRecalculating ? 'Recalibrando Scores...' : 'Recalcular Oportunidades'}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 glass-obsidian rounded-xl border border-purple-900/20">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Pipeline Total Qualificado</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white">
            R$ {totalPipelineValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{leads.length} leads corporativos indexados</p>
        </div>

        <div className="p-4 glass-obsidian rounded-xl border border-purple-900/20">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Leads Prontos para Compra</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">{readyToBuyCount}</div>
          <p className="text-[11px] text-emerald-400/80 mt-1">Intenção imediata de fechamento</p>
        </div>

        <div className="p-4 glass-obsidian rounded-xl border border-purple-900/20">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Alta Probabilidade (Fit &gt; 80%)</span>
            <Target className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-sky-400">{highFitCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Candidatos a plano Infinity ou Cosmic</p>
        </div>

        <div className="p-4 glass-obsidian rounded-xl border border-purple-900/20">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Oportunidades em Risco (Stale)</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400">{staleDealsCount}</div>
          <p className="text-[11px] text-rose-400/80 mt-1">Sem contato ativo há mais de 4 dias</p>
        </div>
      </div>

      {/* Main Grid: Opportunity Radar & Coaching Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Lead Opportunity List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wider text-slate-200 uppercase flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              <span>Ranking de Oportunidades</span>
            </h2>

            {/* Filter pills */}
            <select
              value={filterIntent}
              onChange={e => setFilterIntent(e.target.value)}
              className="bg-[#0b0c14] border border-purple-900/40 text-xs text-slate-200 rounded px-2.5 py-1 focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">Todas as Intenções</option>
              <option value="READY_TO_BUY">Pronto para Compra</option>
              <option value="TECHNICAL_VALIDATION">Validação Técnica</option>
              <option value="PRICE_SENSITIVE">Sensível a Preço</option>
              <option value="EVALUATING">Em Avaliação</option>
            </select>
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredScores.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs glass-obsidian rounded-xl">
                Nenhuma oportunidade localizada com o filtro selecionado.
              </div>
            ) : (
              filteredScores.map(item => {
                const isSelected = item.leadId === selectedLeadId;
                return (
                  <div
                    key={item.leadId}
                    onClick={() => setSelectedLeadId(item.leadId)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-950/40 border-amber-500/60 shadow-lg shadow-amber-950/20'
                        : 'glass-obsidian border-purple-900/20 hover:border-purple-700/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white text-sm">{item.companyName}</h3>
                          {item.isStaleRisk && (
                            <span title="Negócio estagnado sem contato há mais de 4 dias">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse shrink-0" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Ticket Estimado: R$ {item.estimatedDealValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className={`px-2.5 py-1 rounded-lg border text-xs font-bold shrink-0 ${getScoreColor(item.score)}`}>
                        {item.score} / 100
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-purple-900/20 text-xs">
                      <div>{getIntentBadge(item.intent)}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Ação recomendada em 24h</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Coaching Card & Action Engine (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedScore ? (
            <div className="glass-obsidian rounded-2xl border border-purple-900/30 p-6 space-y-6">
              {/* Header of Selected Lead */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-purple-900/20">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-amber-400 font-mono uppercase tracking-wider">Dossiê de Vendas Inteligente</span>
                    {getIntentBadge(selectedScore.intent)}
                  </div>
                  <h3 className="text-xl font-bold text-white font-cinzel">{selectedScore.companyName}</h3>
                  <p className="text-xs text-slate-400">
                    Estágio CRM: <strong className="text-slate-200">{selectedLead?.stage || 'Em Negociação'}</strong> · Responsável: <strong className="text-slate-200">{selectedLead?.assignedAgent || 'SALES AGENT'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`px-4 py-2 rounded-xl border text-center ${getScoreColor(selectedScore.score)}`}>
                    <div className="text-2xl font-black">{selectedScore.score}</div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold">Fit de Conversão</div>
                  </div>
                </div>
              </div>

              {/* Stale Warning Alert if applicable */}
              {selectedScore.isStaleRisk && (
                <div className="p-3.5 bg-rose-950/40 border border-rose-600/40 rounded-xl flex items-start gap-3 text-xs text-rose-200">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-rose-100 block mb-0.5">Alerta de Negócio Estagnado (Missed Opportunity Risk)</strong>
                    Nenhuma interação registrada há mais de 4 dias. Recomendado reativar o prospect imediatamente para evitar evasão para concorrentes.
                  </div>
                </div>
              )}

              {/* Buying Signals & Pain Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-purple-950/20 border border-emerald-900/30 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Sinais de Compra Detectados</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 pl-1">
                    {selectedScore.buyingSignals.map((signal, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{signal}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-purple-950/20 border border-rose-900/30 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Dores & Objeções Mapeadas</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 pl-1">
                    {selectedScore.painPoints.map((pain, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{pain}</span>
                      </li>
                    ))}
                    {selectedScore.competitorMentions.length > 0 && (
                      <li className="flex items-start gap-2 text-amber-300 font-medium pt-1">
                        <span className="text-amber-400 font-bold">!</span>
                        <span>Concorrentes cotados: {selectedScore.competitorMentions.join(', ')}</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Personalized Sales Coaching */}
              <div className="p-4 bg-gradient-to-r from-purple-950/40 to-amber-950/30 border border-amber-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Orientação Tática do SALES AGENT (Coaching)</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {selectedScore.coachingNotes}
                </p>
              </div>

              {/* Next Action Box */}
              <div className="p-4 bg-[#080910] border border-purple-800/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
                    Próxima Ação Recomendada
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {selectedScore.recommendedNextAction}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                    <span className="flex items-center gap-1.5">
                      {selectedScore.recommendedChannel === 'WHATSAPP' && <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />}
                      {selectedScore.recommendedChannel === 'EMAIL' && <Mail className="w-3.5 h-3.5 text-amber-400" />}
                      {selectedScore.recommendedChannel === 'EXECUTIVE_MEETING' && <Calendar className="w-3.5 h-3.5 text-sky-400" />}
                      <span>Canal: <strong>{selectedScore.recommendedChannel}</strong></span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Data Limite: {new Date(selectedScore.recommendedDate).toLocaleDateString('pt-BR')}</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (onNavigateToLead && selectedScore.leadId) {
                      onNavigateToLead(selectedScore.leadId);
                    }
                  }}
                  className="px-4 py-2 bg-purple-900/60 hover:bg-purple-800 text-amber-200 border border-purple-600/40 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer shrink-0"
                >
                  Abrir no CRM &gt;
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 glass-obsidian rounded-2xl">
              Selecione uma oportunidade à esquerda para visualizar o dossiê preditivo.
            </div>
          )}

          {/* Real-Time Conversation Transcript Analyzer */}
          <div className="glass-obsidian rounded-2xl border border-purple-900/30 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Analisador Neural de Diálogos & Reuniões (Transcript Analyzer)</span>
              </div>
              <span className="text-[11px] text-amber-400/80 font-mono">Processamento Instantâneo</span>
            </div>
            <p className="text-xs text-slate-300">
              Cole abaixo a transcrição de uma reunião do Google Meet/Teams, troca de mensagens no WhatsApp ou anotações de call para extrair intenção, objeções e sugestão de fechamento:
            </p>

            <textarea
              value={transcriptText}
              onChange={e => setTranscriptText(e.target.value)}
              placeholder="Ex: 'Cliente: Estivemos analisando a proposta do plano Cosmic, porém nossa diretoria questionou se vocês possuem conformidade com a LGPD e se podemos parcelar em até 12 vezes via Pix. Nosso time de atendimento precisa de urgência para iniciar na próxima segunda...'"
              rows={4}
              className="w-full bg-[#080910] border border-purple-900/40 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
            />

            <div className="flex justify-end">
              <button
                onClick={handleAnalyzeTranscript}
                disabled={isAnalyzingTranscript || !transcriptText.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-800 to-amber-700 hover:from-purple-700 hover:to-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isAnalyzingTranscript ? 'Processando Diálogo...' : 'Analisar Diálogo com AYIN SALES'}</span>
              </button>
            </div>

            {/* Analysis Result Box */}
            {transcriptResult && (
              <div className="p-4 bg-purple-950/30 border border-amber-500/30 rounded-xl space-y-3 mt-4 text-xs animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Diagnóstico da Conversa Concluído
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[11px] font-bold">
                    Score Predito: {transcriptResult.opportunityScore}/100
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
                  <div>
                    <strong className="text-white block mb-1">Ângulo de Fechamento Recomendado:</strong>
                    <p className="text-slate-200 bg-black/40 p-2.5 rounded border border-purple-900/30">
                      {transcriptResult.recommendedClosingAngle}
                    </p>
                  </div>
                  <div>
                    <strong className="text-white block mb-1">Objeções Identificadas:</strong>
                    <ul className="list-disc pl-4 space-y-1 text-slate-300">
                      {transcriptResult.objectionAnalysis.map((obj: string, i: number) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
