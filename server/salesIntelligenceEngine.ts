import { db } from './db.js';
import { SalesOpportunityScore, CustomerIntentType, Lead } from './types.js';

export interface ConversationAnalysisResult {
  sentiment: 'VERY_POSITIVE' | 'POSITIVE' | 'NEUTRAL' | 'SKEPTICAL' | 'NEGATIVE';
  sentimentScore: number; // -1.0 to 1.0
  detectedIntent: CustomerIntentType;
  buyingSignals: string[];
  painPoints: string[];
  competitorMentions: string[];
  objectionAnalysis: string[];
  recommendedClosingAngle: string;
  recommendedFollowUpDate: string;
  recommendedChannel: 'WHATSAPP' | 'EMAIL' | 'EXECUTIVE_MEETING' | 'FORMAL_PROPOSAL';
  opportunityScore: number; // 0-100
}

export class SalesIntelligenceEngine {
  /**
   * Evaluates all leads in CRM and updates opportunity scores and missed deal warnings
   */
  evaluateAllLeads(): SalesOpportunityScore[] {
    const data = db.getData();
    const leads = data.leads || [];
    const proposals = data.proposals || [];
    const scores: SalesOpportunityScore[] = [];

    for (const lead of leads) {
      const score = this.calculateLeadScore(lead, proposals);
      scores.push(score);
    }

    data.salesOpportunityScores = scores;
    db.commit();
    return scores;
  }

  /**
   * Calculates opportunity score for a single lead based on real parameters
   */
  calculateLeadScore(lead: Lead, allProposals = db.getData().proposals || []): SalesOpportunityScore {
    let score = 50; // Base score
    const buyingSignals: string[] = [];
    const painPoints: string[] = [];
    const competitorMentions: string[] = [];

    // Stage fit
    if (lead.stage === 'Fechado') {
      score = 100;
      buyingSignals.push('Contrato fechado e ativado no ecossistema SHEFA.');
    } else if (lead.stage === 'Negociação') {
      score += 25;
      buyingSignals.push('Em fase de alinhamento de termos comerciais e SLAs.');
    } else if (lead.stage === 'Proposta') {
      score += 15;
      buyingSignals.push('Proposta comercial emitida e em apreciação pela diretoria.');
    } else if (lead.stage === 'Qualificado') {
      score += 8;
      buyingSignals.push('Requisitos corporativos e volume de atendimento validados.');
    } else if (lead.stage === 'Perdido') {
      score = 10;
    }

    // Deal value boost
    if (lead.value >= 10000) {
      score += 12;
      buyingSignals.push('Ticket corporativo alto (Tier Enterprise).');
    } else if (lead.value >= 4000) {
      score += 6;
    }

    // Related proposal check
    const relatedProposal = allProposals.find(p => p.leadId === lead.id || p.contactEmail === lead.email);
    if (relatedProposal) {
      if (relatedProposal.status === 'ACCEPTED') {
        score = 98;
      } else if (relatedProposal.status === 'SENT') {
        buyingSignals.push(`Proposta formal enviada no valor de R$ ${relatedProposal.finalValue.toFixed(2)}.`);
      }
    }

    // Intent detection based on notes and signals
    const notesLower = (lead.notes || '').toLowerCase();
    let intent: CustomerIntentType = 'EVALUATING';

    if (notesLower.includes('preço') || notesLower.includes('desconto') || notesLower.includes('caro') || notesLower.includes('orçamento apertado')) {
      intent = 'PRICE_SENSITIVE';
      painPoints.push('Sensibilidade a fluxo de caixa imediato; busca parcelamento ou desconto.');
    } else if (notesLower.includes('lgpd') || notesLower.includes('segurança') || notesLower.includes('técnico') || notesLower.includes('api') || notesLower.includes('integração')) {
      intent = 'TECHNICAL_VALIDATION';
      painPoints.push('Necessita de garantia de isolamento criptográfico e SLA técnico estrito.');
    } else if (notesLower.includes('urgente') || notesLower.includes('fechar') || notesLower.includes('imediato') || notesLower.includes('contratar')) {
      intent = 'READY_TO_BUY';
      buyingSignals.push('Manifestou intenção explícita de contratação imediata.');
      score += 10;
    } else if (lead.stage === 'Perdido' || notesLower.includes('cancelar') || notesLower.includes('desistiu')) {
      intent = 'CHURN_RISK';
      painPoints.push('Lead com alto risco de perda ou desinteresse temporário.');
    }

    // Competitor mentions detection
    if (notesLower.includes('zendesk') || notesLower.includes('salesforce') || notesLower.includes('blip') || notesLower.includes('rd station')) {
      if (notesLower.includes('zendesk')) competitorMentions.push('Zendesk');
      if (notesLower.includes('salesforce')) competitorMentions.push('Salesforce');
      if (notesLower.includes('blip')) competitorMentions.push('Blip');
      if (notesLower.includes('rd station')) competitorMentions.push('RD Station');
    }

    // Stale deal risk detection (no contact in > 4 days)
    const lastContactTime = lead.lastContact ? new Date(lead.lastContact).getTime() : new Date(lead.createdAt).getTime();
    const daysSinceContact = (Date.now() - lastContactTime) / (1000 * 60 * 60 * 24);
    const isStaleRisk = daysSinceContact >= 4 && lead.stage !== 'Fechado' && lead.stage !== 'Perdido';

    // Channel and next action recommendation
    let recommendedChannel: 'WHATSAPP' | 'EMAIL' | 'EXECUTIVE_MEETING' | 'FORMAL_PROPOSAL' = 'WHATSAPP';
    let recommendedNextAction = '';
    let coachingNotes = '';

    if (intent === 'READY_TO_BUY') {
      recommendedChannel = 'WHATSAPP';
      recommendedNextAction = 'Enviar link de liquidação instantânea via Pix com ativação imediata dos 11 agentes.';
      coachingNotes = 'Fechar agora. Evite apresentações longas; apresente o QR Code Pix e garanta onboarding em menos de 24h.';
    } else if (intent === 'TECHNICAL_VALIDATION') {
      recommendedChannel = 'EXECUTIVE_MEETING';
      recommendedNextAction = 'Convidar para sessão técnica exclusiva de validação com o Master Owner (Alifer Madeiro).';
      coachingNotes = 'Evidenciar arquitetura com isolamento multitenant, auditoria SHA-256 e sem retenção indevida de dados.';
    } else if (intent === 'PRICE_SENSITIVE') {
      recommendedChannel = 'EMAIL';
      recommendedNextAction = 'Apresentar plano anual com economia de 2 meses grátis e pagamento facilitado via Pix.';
      coachingNotes = 'Demonstre o ROI: a economia gerada em horas de SAC paga o investimento em menos de 45 dias.';
    } else {
      recommendedChannel = 'EMAIL';
      recommendedNextAction = 'Disparar estudo de caso comprovado de automação de 11 agentes no mesmo segmento.';
      coachingNotes = 'Manter cadência constante com dados práticos de aumento de conversão comercial.';
    }

    // Cap score at 100
    const finalScore = Math.min(100, Math.max(5, score));

    const followUpDate = new Date(Date.now() + (isStaleRisk ? 2 : 24) * 60 * 60 * 1000).toISOString();

    return {
      leadId: lead.id,
      companyName: lead.companyName || lead.name,
      score: finalScore,
      intent,
      buyingSignals: buyingSignals.length ? buyingSignals : ['Interesse inicial registrado pelo Radar Sentinel.'],
      painPoints: painPoints.length ? painPoints : ['Necessidade de automação e ganho de escala comercial.'],
      competitorMentions,
      recommendedNextAction,
      recommendedChannel,
      recommendedDate: followUpDate,
      coachingNotes,
      isStaleRisk,
      estimatedDealValue: lead.value || 1970,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Analyzes a sales conversation / call transcript and extracts deep buying signals and objection handling
   */
  analyzeTranscript(transcript: string, companyName?: string): ConversationAnalysisResult {
    const textLower = transcript.toLowerCase();

    // Sentiment heuristic
    let sentimentScore = 0.4;
    let sentiment: ConversationAnalysisResult['sentiment'] = 'POSITIVE';
    if (textLower.includes('não') && textLower.includes('caro') && textLower.includes('difícil')) {
      sentimentScore = -0.3;
      sentiment = 'SKEPTICAL';
    } else if (textLower.includes('excelente') || textLower.includes('perfeito') || textLower.includes('adorei') || textLower.includes('fechado')) {
      sentimentScore = 0.85;
      sentiment = 'VERY_POSITIVE';
    }

    const buyingSignals: string[] = [];
    const painPoints: string[] = [];
    const competitorMentions: string[] = [];
    const objectionAnalysis: string[] = [];

    if (textLower.includes('quando') || textLower.includes('prazo')) {
      buyingSignals.push('Investigando cronograma de implantação prática.');
    }
    if (textLower.includes('contrato') || textLower.includes('proposta')) {
      buyingSignals.push('Solicitou formalização jurídica ou proposta comercial.');
    }
    if (textLower.includes('equipe') || textLower.includes('treinamento')) {
      buyingSignals.push('Planejando capacitação interna de operadores.');
    }

    if (textLower.includes('lento') || textLower.includes('atraso') || textLower.includes('manual')) {
      painPoints.push('Processos manuais sobrecarregando os times operacionais.');
    }
    if (textLower.includes('perda') || textLower.includes('vendas perdidas')) {
      painPoints.push('Gargalos no atendimento resultando em perda de faturamento.');
    }

    if (textLower.includes('zendesk')) competitorMentions.push('Zendesk');
    if (textLower.includes('salesforce')) competitorMentions.push('Salesforce');
    if (textLower.includes('blip')) competitorMentions.push('Blip');

    if (textLower.includes('preço') || textLower.includes('valor')) {
      objectionAnalysis.push('Objeção orçamentária: contrapor com cálculo de custo por lead qualificado.');
    }
    if (textLower.includes('segurança') || textLower.includes('lgpd')) {
      objectionAnalysis.push('Objeção de conformidade: apresentar protocolo de blindagem e hash SHA-256 do AYIN CORE.');
    }

    let detectedIntent: CustomerIntentType = 'EVALUATING';
    if (sentimentScore > 0.6 && buyingSignals.length >= 2) detectedIntent = 'READY_TO_BUY';
    else if (objectionAnalysis.some(o => o.includes('orçamentária'))) detectedIntent = 'PRICE_SENSITIVE';
    else if (objectionAnalysis.some(o => o.includes('conformidade'))) detectedIntent = 'TECHNICAL_VALIDATION';

    return {
      sentiment,
      sentimentScore,
      detectedIntent,
      buyingSignals: buyingSignals.length ? buyingSignals : ['Engajamento dialógico ativo com a equipe de vendas.'],
      painPoints: painPoints.length ? painPoints : ['Busca de modernização de processos comerciais.'],
      competitorMentions,
      objectionAnalysis: objectionAnalysis.length ? objectionAnalysis : ['Nenhuma objeção impeditiva identificada na conversa.'],
      recommendedClosingAngle: detectedIntent === 'READY_TO_BUY' 
        ? 'Apresentar fechamento com bônus de implantação prioritária.' 
        : 'Enviar demonstrativo de ROI e agendar demonstração guiada do Observatório.',
      recommendedFollowUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      recommendedChannel: detectedIntent === 'READY_TO_BUY' ? 'WHATSAPP' : 'EMAIL',
      opportunityScore: Math.round(50 + sentimentScore * 30 + buyingSignals.length * 8)
    };
  }
}

export const salesIntelligence = new SalesIntelligenceEngine();
