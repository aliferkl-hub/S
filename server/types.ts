export type UserRole = 'MASTER_OWNER' | 'COMPANY_ADMIN' | 'OPERATOR';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string; // null for MASTER_OWNER
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLogin?: string;
}

export type PlanTier = 'Astral Starter' | 'Cosmic Growth' | 'Infinity Enterprise';

export type SubscriptionStatus = 
  | 'PENDING_PAYMENT' 
  | 'ACTIVE' 
  | 'TRIAL' 
  | 'EXPIRED' 
  | 'CANCELED' 
  | 'SUSPENDED' 
  | 'REFUNDED';

export interface PlanLimits {
  maxUsers: number;
  monthlyMissions: number;
  maxAgents: number;
  maxKnowledgeDocs: number;
  customAIPersona: boolean;
  prioritySupport: boolean;
  dedicatedAccountManager?: boolean;
}

export interface PlanDefinition {
  id: string;
  tier: PlanTier;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  targetAudience: string;
  features: string[];
  trialDays: number;
  limits: PlanLimits;
}

export interface Subscription {
  id: string;
  companyId: string;
  companyName: string;
  customerEmail: string;
  planTier: PlanTier;
  billingCycle: 'monthly' | 'annual';
  status: SubscriptionStatus;
  price: number;
  startDate: string;
  expiresAt: string;
  trialEndsAt?: string;
  pixChargeId?: string;
  autoRenew: boolean;
  featuresUnlocked: string[];
  lastPaymentConfirmedAt?: string;
  canceledAt?: string;
}

export type PixChargeStatus = 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED';

export interface PixCharge {
  id: string;
  orderId: string;
  companyId: string;
  customerName: string;
  customerEmail: string;
  customerCpfOrCnpj: string;
  planTier?: PlanTier;
  serviceId?: string;
  amount: number;
  pixKey: string; // '11973479473'
  pixKeyType: string;
  recipientName: string; // 'Alifer Madeiro'
  copyPasteCode: string;
  qrCodeSvg?: string;
  status: PixChargeStatus;
  createdAt: string;
  expiresAt: string;
  confirmedAt?: string;
  txId: string;
  endToEndId?: string;
  failureReason?: string;
}

export type ServiceCode = 'DIAGNOSTIC' | 'DEPLOYMENT' | 'CUSTOM_AUTOMATION' | 'CONSULTING';

export interface EnterpriseService {
  id: string;
  code: ServiceCode;
  name: string;
  tagline: string;
  description: string;
  basePrice: number; // Configurable by Master Owner (in BRL)
  deliveryTimelineDays: number;
  deliverables: string[];
  recommendedFor: string;
  isActive: boolean;
}

export type ServiceContractStatus = 'PROPOSAL' | 'APPROVED' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED';

export interface ServiceContract {
  id: string;
  companyId: string;
  companyName: string;
  customerEmail: string;
  serviceId: string;
  serviceCode: ServiceCode;
  serviceName: string;
  status: ServiceContractStatus;
  price: number;
  scopeNotes?: string;
  timelineDays: number;
  assignedAgentCodename?: string;
  pixChargeId?: string;
  startDate?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type FlagshipProductCode = 'AYIN_SALES' | 'AYIN_CUSTOMER' | 'AYIN_FINANCE' | 'AYIN_CORE';

export interface FlagshipProduct {
  id: string;
  code: FlagshipProductCode;
  name: string;
  hebrewName: string;
  tagline: string;
  description: string;
  capabilities: string[];
  associatedAgents: string[];
  departmentId: DepartmentId;
  includedInPlans: PlanTier[];
  standalonePriceMonthly: number;
}

export type ProposalStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface CommercialProposal {
  id: string;
  leadId?: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  planTier?: PlanTier;
  servicesIncluded: string[];
  totalValue: number;
  discountPercent: number;
  finalValue: number;
  status: ProposalStatus;
  validUntil: string;
  notes?: string;
  createdAt: string;
  acceptedAt?: string;
}

export interface CommercialPartner {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  referralCode: string;
  commissionRate: number; // Percentage, e.g. 15%
  totalReferredLeads: number;
  totalDealsClosed: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  tradeName: string;
  cnpjOrTaxId: string;
  plan: PlanTier;
  status: 'active' | 'suspended';
  createdAt: string;
  subscriptionId?: string;
  onboardingStep?: 'DIAGNOSTIC' | 'AGENT_SETUP' | 'KNOWLEDGE_BASE' | 'LIVE_247';
  aiPersona: {
    assistantName: string;
    tone: string;
    welcomeMessage: string;
    instructions: string;
  };
  quotas: {
    maxUsers: number;
    monthlyMissions: number;
    usedMissions: number;
    maxAgents: number;
    maxKnowledgeDocs: number;
  };
}

export type DepartmentId = 
  | 'AYIN_RADAR'
  | 'AYIN_STRATEGY'
  | 'AYIN_AGENTS'
  | 'AYIN_CREATIVE'
  | 'AYIN_SALES'
  | 'AYIN_MARKET'
  | 'AYIN_FINANCE'
  | 'AYIN_INTELLIGENCE';

export interface DepartmentInfo {
  id: DepartmentId;
  name: string;
  hebrewName: string;
  roleDescription: string;
  icon: string;
  color: string;
  activeAgentsCount: number;
  pendingTasks: number;
}

export type AgentRoleType =
  | 'RADAR AGENT'
  | 'LEAD AGENT'
  | 'SALES AGENT'
  | 'CUSTOMER AGENT'
  | 'MARKETING AGENT'
  | 'CREATIVE AGENT'
  | 'MARKET AGENT'
  | 'FINANCE AGENT'
  | 'SUBSCRIPTION AGENT'
  | 'ANALYTICS AGENT'
  | 'REPORT AGENT';

export type AgentStatus = 'idle' | 'running' | 'analyzing' | 'paused' | 'error';

export interface AutonomousAgent {
  id: string;
  companyId: string; // 'global' for Master Owner agents, or specific companyId
  name: string;
  hebrewCodename: string;
  departmentId: DepartmentId;
  agentRoleType: AgentRoleType;
  role: string;
  specialty: string;
  autonomyLevel: 'supervised' | 'autonomous_safe' | 'full_autonomous';
  status: AgentStatus;
  is24hEnabled: boolean;
  isManuallyPaused: boolean;
  totalMissionsCompleted: number;
  accuracyScore: number; // 0-100
  lastActive: string;
}

export type MissionPriority = 'low' | 'medium' | 'high' | 'critical';
export type MissionStatus = 'queued' | 'in_progress' | 'awaiting_approval' | 'completed' | 'failed' | 'rejected';

export interface MissionStep {
  id: string;
  title: string;
  departmentId: DepartmentId;
  assignedAgentId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
}

export interface Mission {
  id: string;
  companyId: string;
  creatorEmail: string;
  title: string;
  objective: string;
  priority: MissionPriority;
  status: MissionStatus;
  departmentsInvolved: DepartmentId[];
  steps: MissionStep[];
  isSensitive: boolean; // Requires Master Owner approval if true
  sensitiveReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  executionLogs: {
    timestamp: string;
    agentName: string;
    message: string;
    type: 'info' | 'action' | 'warning' | 'success';
  }[];
  finalReport?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDoc {
  id: string;
  companyId: string;
  title: string;
  category: 'policy' | 'product' | 'faq' | 'market_report' | 'guide';
  content: string;
  updatedAt: string;
}

export type LeadStage = 'Novo' | 'Qualificado' | 'Proposta' | 'Negociação' | 'Fechado' | 'Perdido';

export interface Lead {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  source: string;
  stage: LeadStage;
  value: number;
  notes: string;
  assignedAgent: string;
  partnerReferralCode?: string;
  createdAt: string;
  lastContact: string;
}

export interface ProductItem {
  id: string;
  companyId: string;
  title: string;
  category: string;
  price: number;
  commissionRate: number;
  type: 'proprio' | 'parceiro' | 'infoproduto';
  status: 'active' | 'draft';
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  companyId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED';
  paymentMethod: 'PIX';
  pixChargeId?: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface CommissionRecord {
  id: string;
  orderId?: string;
  subscriptionId?: string;
  partnerName: string;
  partnerEmail: string;
  rate: number;
  amount: number;
  status: 'pendente' | 'liquidado';
  date: string;
}

export interface FinancialRecord {
  id: string;
  companyId: string;
  title: string;
  type: 'receita' | 'custo' | 'comissao' | 'assinatura';
  amount: number;
  date: string;
  status: 'liquidado' | 'pendente' | 'aprovacao_necessaria';
}

export interface EngineGovernanceSettings {
  isEmergencyPaused: boolean; // Master Owner Kill-Switch
  financialSpendingLimit: number; // Limit above which Master Owner approval is required (R$ 1000 default)
  maxConcurrentTasks: number;
  autoRetryCount: number;
  pixKey: string;
  pixKeyType: string;
  masterRecipient: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  companyId: string;
  details: string;
  hash: string;
}

export interface DevProjectTask {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assignedAgent: string;
  deadline: string;
  completedAt?: string;
}

export interface DevProject {
  id: string;
  companyId: string;
  companyName: string;
  serviceContractId?: string;
  title: string;
  description: string;
  assignedAgentCodename: string;
  status: 'PLANNING' | 'IN_DEVELOPMENT' | 'REVIEW' | 'CLIENT_APPROVAL' | 'DELIVERED';
  tasks: DevProjectTask[];
  deadline: string;
  clientApprovalStatus: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';
  clientFeedback?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketMessage {
  id: string;
  senderEmail: string;
  senderName: string;
  senderRole: 'CLIENT' | 'AGENT' | 'MASTER_OWNER';
  message: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  companyId: string;
  companyName: string;
  customerEmail: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  category: 'ONBOARDING' | 'TECHNICAL' | 'BILLING' | 'AGENT_TUNING' | 'UPGRADE';
  assignedAgent: string;
  communicationHistory: SupportTicketMessage[];
  satisfactionRating?: number; // 1-5
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export type InterAgentActionType =
  | 'MARKET_RADAR_OPPORTUNITY'
  | 'LEAD_QUALIFICATION_HANDOFF'
  | 'SALES_PROPOSAL_DISPATCH'
  | 'FINANCE_PIX_RECONCILIATION'
  | 'SUBSCRIPTION_QUOTA_ADJUSTMENT'
  | 'CUSTOMER_ONBOARDING_ALERT'
  | 'MARKETING_CAMPAIGN_PITCH'
  | 'CREATIVE_ASSET_DELIVERY'
  | 'COMPETITOR_BENCHMARK_SYNC'
  | 'ANALYTICS_METRICS_AUDIT'
  | 'MASTER_REPORT_COMPILATION';

export interface AgentInteraction {
  id: string;
  timestamp: string;
  fromAgent: AgentRoleType;
  toAgent: AgentRoleType;
  actionType: InterAgentActionType;
  subject: string;
  payload: Record<string, any>;
  verifiableOutput: string;
  status: 'DISPATCHED' | 'PROCESSED' | 'AWAITING_MASTER_APPROVAL';
  isSensitive: boolean;
  masterApprovedAt?: string;
  masterApprovedBy?: string;
}

// -------------------------------------------------------------
// ENTERPRISE TECHNOLOGY INTEGRATION STACK (VERSION 3.0)
// -------------------------------------------------------------

export type AiProviderId = 'gemini' | 'openai' | 'bedrock' | 'nova' | 'mock_sandbox';

export type AiTaskCategory = 
  | 'CORE_STRATEGY' 
  | 'SALES_INTELLIGENCE' 
  | 'CUSTOMER_SUPPORT' 
  | 'CODE_DEVELOPMENT' 
  | 'CREATIVE_CAMPAIGNS' 
  | 'EXECUTIVE_BRIEFING';

export interface AiProviderConfig {
  providerId: AiProviderId;
  providerName: string;
  isActive: boolean;
  isMasterApproved: boolean;
  modelId: string;
  status: 'ACTIVE' | 'CONNECTED' | 'AVAILABLE' | 'PENDING_APPROVAL' | 'DISABLED' | 'ERROR';
  latencyMs: number;
  costPer1kInputTokensUsd: number;
  costPer1kOutputTokensUsd: number;
  monthlyBudgetCpmBrl: number;
  currentMonthSpentBrl: number;
  callsCount: number;
  tokensConsumed: number;
  fallbackProviderId?: AiProviderId;
  isFallbackAuthorized: boolean;
  maskedApiKey?: string;
  notes: string;
}

export interface AiTaskRoutingRule {
  taskCategory: AiTaskCategory;
  preferredProvider: AiProviderId;
  fallbackProvider: AiProviderId;
  maxTokens: number;
  temperature: number;
  authorizedByMaster: boolean;
}

export type IntegrationCategory = 
  | 'AI_GATEWAY' 
  | 'PRODUCTIVITY' 
  | 'CREATIVE' 
  | 'ERP_FINANCE' 
  | 'COMMUNICATION' 
  | 'INFRASTRUCTURE' 
  | 'DATA_GRAPH';

export type IntegrationStatus = 
  | 'ACTIVE' 
  | 'CONNECTED' 
  | 'AVAILABLE' 
  | 'PENDING_APPROVAL' 
  | 'DISABLED' 
  | 'ERROR';

export interface EnterpriseIntegration {
  id: string;
  provider: string;
  productName: string;
  departmentId: DepartmentId;
  category: IntegrationCategory;
  purpose: string;
  status: IntegrationStatus;
  apiAvailability: 'ONLINE' | 'STANDBY' | 'DEGRADED' | 'OFFLINE';
  authStatus: 'VERIFIED' | 'PENDING_KEYS' | 'REJECTED';
  estimatedMonthlyCostBrl: number;
  actualBilledCostBrl: number;
  usageVolumeCalls: number;
  lastSuccessfulTest: string;
  permissionsRequired: string[];
  isMasterApproved: boolean;
  monthlyBudgetCpmBrl: number;
  dailyLimitCalls: number;
  latencyMs: number;
  maskedApiKey?: string;
}

export interface CustomerRefundRequest {
  id: string;
  ticketId: string;
  companyId: string;
  companyName: string;
  customerEmail: string;
  orderOrSubscriptionId: string;
  amount: number;
  reason: string;
  status: 'PENDING_MASTER_APPROVAL' | 'APPROVED_BY_MASTER' | 'REJECTED' | 'PROCESSED_PIX_REVERSAL';
  pixRefundEndToEndId?: string;
  masterApprovedBy?: string;
  masterApprovedAt?: string;
  createdAt: string;
  notes?: string;
}

export type CustomerIntentType = 
  | 'READY_TO_BUY' 
  | 'EVALUATING' 
  | 'PRICE_SENSITIVE' 
  | 'TECHNICAL_VALIDATION' 
  | 'CHURN_RISK';

export interface SalesOpportunityScore {
  leadId: string;
  companyName: string;
  score: number; // 0-100
  intent: CustomerIntentType;
  buyingSignals: string[];
  painPoints: string[];
  competitorMentions: string[];
  recommendedNextAction: string;
  recommendedChannel: 'WHATSAPP' | 'EMAIL' | 'EXECUTIVE_MEETING' | 'FORMAL_PROPOSAL';
  recommendedDate: string;
  coachingNotes: string;
  isStaleRisk: boolean;
  estimatedDealValue: number;
  calculatedAt: string;
}

export interface CloudInfrastructureComparison {
  currentHosting: {
    provider: 'GOOGLE_CLOUD_RUN';
    region: 'us-east1';
    status: 'ACTIVE_HEALTHY';
    monthlyCostBrl: number;
    containerSpecs: string;
    rtoMinutes: number;
    rpoMinutes: number;
    benefits: string[];
  };
  awsAlternative: {
    provider: 'AWS_ECS_FARGATE_BEDROCK';
    region: 'sa-east-1 (São Paulo)';
    status: 'EVALUATED_READY_TO_PROVISION';
    monthlyCostBrl: number;
    containerSpecs: string;
    rtoMinutes: number;
    rpoMinutes: number;
    benefits: string[];
  };
  neo4jEvaluation: {
    product: 'Neo4j Aura Enterprise Graph DB';
    status: 'EVALUATION_DOCUMENTED';
    monthlyCostBrl: number;
    recommendation: 'MANTER_JSON_UNIFICADO_ATE_100K_NODES';
    justification: string;
    graphSchemaPreview: {
      nodes: string[];
      relationships: string[];
    };
  };
  disasterRecovery: {
    lastBackupTimestamp: string;
    backupLocation: string;
    backupIntegrityCheck: 'PASSED';
    automatedSnapshotIntervalHours: number;
  };
  isMigrationApprovedByMaster: boolean;
}

export interface TechCostGovernance {
  monthlyBudgetCapBrl: number;
  totalSpentThisMonthBrl: number;
  spentPercent: number;
  isAutoPaused: boolean;
  dailyUsageLimitCalls: number;
  currentDayCalls: number;
  alerts: string[];
  providerBreakdown: {
    providerId: AiProviderId;
    providerName: string;
    spentBrl: number;
    calls: number;
    tokens: number;
  }[];
}

export interface SystemStats {
  totalCompanies: number;
  totalAgents: number;
  active24hAgents: number;
  totalMissions: number;
  completedMissions: number;
  awaitingApproval: number;
  auditEntries: number;
  grossRevenue: number;
  mrr: number;
  totalCosts: number;
  netResult: number;
  netMarginPercent: number;
  totalReceivedRevenue: number;
  realVerifiedPixRevenue: number;
  seedDemoRevenue: number;
  estimatedTaxes: number;
  estimatedAiTokenCost: number;
  infrastructureCost: number;
  gatewayFees: number;
  partnerCommissionsCost: number;
  realOperatingCosts: number;
  realNetOperatingResult: number;
  realNetMarginPercent: number;
  defaultRate: number; // Inadimplência percentual
  defaultAmount: number; // Valor em atraso
  activeSubscriptions: number;
  churnedSubscriptions: number;
  pendingPixCharges: number;
  totalContracts: number;
  activeContracts: number;
  // New Operational Metrics for Phase 01
  totalProjects: number;
  activeProjects: number;
  deliveredProjects: number;
  totalSupportTickets: number;
  openSupportTickets: number;
  resolvedSupportTickets: number;
  totalAgentInteractions: number;
  isEmergencyPaused: boolean;
  // Enterprise Stack 3.0 Telemetry
  activeAiProvidersCount: number;
  totalEnterpriseIntegrations: number;
  techBudgetCapBrl: number;
  techBudgetSpentBrl: number;
  pendingRefundRequestsCount: number;
}
