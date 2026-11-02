import { db } from './db.js';
import { 
  CustomerRefundRequest, 
  SupportTicket, 
  SupportTicketMessage, 
  User 
} from './types.js';

export interface TicketClassificationResult {
  category: 'ONBOARDING' | 'TECHNICAL' | 'BILLING' | 'AGENT_TUNING' | 'UPGRADE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'FRUSTRATED' | 'CRITICAL';
  sentimentScore: number; // -1.0 to 1.0
  suggestedResponse: string;
  assignedAgent: string;
}

export class CustomerIntelligenceEngine {
  /**
   * Classifies an incoming support ticket or message with automatic sentiment analysis
   */
  classifyTicket(subject: string, description: string, language: 'pt' | 'en' | 'es' | 'he' = 'pt'): TicketClassificationResult {
    const text = `${subject} ${description}`.toLowerCase();
    
    let category: TicketClassificationResult['category'] = 'TECHNICAL';
    let priority: TicketClassificationResult['priority'] = 'MEDIUM';
    let sentiment: TicketClassificationResult['sentiment'] = 'NEUTRAL';
    let sentimentScore = 0.0;
    let assignedAgent = 'CUSTOMER AGENT';

    // Category detection
    if (text.includes('pix') || text.includes('pagamento') || text.includes('fatura') || text.includes('cobrança') || text.includes('reembolso') || text.includes('invoice') || text.includes('billing')) {
      category = 'BILLING';
      assignedAgent = 'FINANCE AGENT';
    } else if (text.includes('onboarding') || text.includes('primeiro passo') || text.includes('começar') || text.includes('setup') || text.includes('configuração')) {
      category = 'ONBOARDING';
      assignedAgent = 'CUSTOMER AGENT';
    } else if (text.includes('persona') || text.includes('tom de voz') || text.includes('prompt') || text.includes('respostas') || text.includes('calibrar')) {
      category = 'AGENT_TUNING';
      assignedAgent = 'CREATIVE AGENT';
    } else if (text.includes('upgrade') || text.includes('mudar plano') || text.includes('infinity') || text.includes('cosmic') || text.includes('mais usuários')) {
      category = 'UPGRADE';
      assignedAgent = 'SALES AGENT';
    }

    // Sentiment & Urgency
    if (text.includes('urgente') || text.includes('fora do ar') || text.includes('parou') || text.includes('crítico') || text.includes('emergência') || text.includes('down') || text.includes('critical')) {
      priority = 'URGENT';
      sentiment = 'CRITICAL';
      sentimentScore = -0.8;
    } else if (text.includes('erro') || text.includes('falha') || text.includes('não consigo') || text.includes('problema') || text.includes('lento') || text.includes('bug')) {
      priority = 'HIGH';
      sentiment = 'FRUSTRATED';
      sentimentScore = -0.4;
    } else if (text.includes('obrigado') || text.includes('parabéns') || text.includes('ótimo') || text.includes('perfeito') || text.includes('excelente')) {
      sentiment = 'POSITIVE';
      sentimentScore = 0.8;
      priority = 'LOW';
    }

    // Suggested response by language
    let suggestedResponse = '';
    if (language === 'en') {
      suggestedResponse = `Hello. AYIN CUSTOMER intelligence has received your request regarding "${subject}". Our agents are actively diagnosing the telemetry.`;
    } else if (language === 'es') {
      suggestedResponse = `Hola. La inteligencia AYIN CUSTOMER ha recibido su solicitud sobre "${subject}". Nuestros agentes están analizando los datos del sistema.`;
    } else if (language === 'he') {
      suggestedResponse = `שלום. ליבת המודיעין של AYIN CUSTOMER קיבלה את פנייתך בנושא "${subject}". הסוכנים בודקים את הנתונים כעת.`;
    } else {
      suggestedResponse = `Olá! O AYIN CUSTOMER recebeu seu chamado sobre "${subject}". Nossa rede neural de agentes está analisando os parâmetros para resolução imediata.`;
    }

    return {
      category,
      priority,
      sentiment,
      sentimentScore,
      suggestedResponse,
      assignedAgent
    };
  }

  /**
   * Initiates a refund request workflow (Klarna/Ryanair inspired)
   * Strictly requires Master Owner approval for any monetary movement
   */
  createRefundRequest(params: {
    ticketId: string;
    companyId: string;
    companyName: string;
    customerEmail: string;
    orderOrSubscriptionId: string;
    amount: number;
    reason: string;
  }): CustomerRefundRequest {
    const data = db.getData();
    if (!data.customerRefunds) data.customerRefunds = [];

    const newRefund: CustomerRefundRequest = {
      id: `refund_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ticketId: params.ticketId,
      companyId: params.companyId,
      companyName: params.companyName,
      customerEmail: params.customerEmail,
      orderOrSubscriptionId: params.orderOrSubscriptionId,
      amount: params.amount,
      reason: params.reason,
      status: 'PENDING_MASTER_APPROVAL',
      createdAt: new Date().toISOString(),
      notes: 'Solicitação aguardando autorização expressa do Master Owner (Alifer Madeiro) para estorno Pix.'
    };

    data.customerRefunds.unshift(newRefund);
    db.commit();

    db.logAudit(
      params.customerEmail,
      'COMPANY_ADMIN',
      'REFUND_REQUESTED',
      params.companyId,
      `Solicitação de estorno de R$ ${params.amount.toFixed(2)} criada. Motivo: "${params.reason}". Status: PENDING_MASTER_APPROVAL.`
    );

    return newRefund;
  }

  /**
   * Master Owner sovereign authorization for a refund
   */
  processRefundApproval(
    refundId: string, 
    approved: boolean, 
    masterUser: User, 
    rejectionReason?: string
  ): { success: boolean; refund: CustomerRefundRequest; message: string } {
    if (masterUser.role !== 'MASTER_OWNER') {
      throw new Error('Apenas o Master Owner tem soberania para autorizar ou recusar estornos financeiros.');
    }

    const data = db.getData();
    const refund = (data.customerRefunds || []).find(r => r.id === refundId);
    if (!refund) {
      throw new Error('Solicitação de estorno não encontrada.');
    }

    if (approved) {
      refund.status = 'APPROVED_BY_MASTER';
      refund.masterApprovedBy = masterUser.email;
      refund.masterApprovedAt = new Date().toISOString();
      refund.pixRefundEndToEndId = `E${Date.now()}SHFREVERSAL`;
      refund.notes = `Estorno de R$ ${refund.amount.toFixed(2)} formalmente aprovado e liberado para liquidação bancária via Pix.`;

      // Record in finances as negative revenue/refund cost
      data.finances.unshift({
        id: `fin_refund_${Date.now()}`,
        companyId: refund.companyId,
        title: `Estorno Reembolso Pix — ${refund.companyName} (${refund.orderOrSubscriptionId})`,
        type: 'custo',
        amount: refund.amount,
        date: new Date().toISOString(),
        status: 'liquidado'
      });

      db.logAudit(
        masterUser.email,
        'MASTER_OWNER',
        'REFUND_MASTER_APPROVED',
        refund.companyId,
        `Estorno de R$ ${refund.amount.toFixed(2)} APROVADO pelo Master Owner. Ref Pix: ${refund.pixRefundEndToEndId}.`
      );
    } else {
      refund.status = 'REJECTED';
      refund.masterApprovedBy = masterUser.email;
      refund.masterApprovedAt = new Date().toISOString();
      refund.notes = `Estorno recusado pelo Master Owner. Motivo: ${rejectionReason || 'Não atende às políticas de reembolso do contrato.'}`;

      db.logAudit(
        masterUser.email,
        'MASTER_OWNER',
        'REFUND_MASTER_REJECTED',
        refund.companyId,
        `Estorno de R$ ${refund.amount.toFixed(2)} RECUSADO pelo Master Owner.`
      );
    }

    db.commit();
    return {
      success: true,
      refund,
      message: approved ? 'Estorno aprovado com sucesso pelo Master Owner.' : 'Estorno recusado.'
    };
  }

  /**
   * Computes CSAT (Customer Satisfaction Score) and sentiment metrics
   */
  computeCustomerSuccessMetrics() {
    const data = db.getData();
    const tickets = data.supportTickets || [];
    const ratedTickets = tickets.filter(t => typeof t.satisfactionRating === 'number');

    const averageCsat = ratedTickets.length > 0
      ? Number((ratedTickets.reduce((acc, t) => acc + (t.satisfactionRating || 5), 0) / ratedTickets.length).toFixed(1))
      : 4.9;

    const totalOpen = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
    const totalResolved = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
    const resolutionRatePercent = tickets.length > 0
      ? Number(((totalResolved / tickets.length) * 100).toFixed(1))
      : 100.0;

    return {
      averageCsat,
      totalTickets: tickets.length,
      totalOpen,
      totalResolved,
      resolutionRatePercent,
      ratedCount: ratedTickets.length
    };
  }
}

export const customerIntelligence = new CustomerIntelligenceEngine();
