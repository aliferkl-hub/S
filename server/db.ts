import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { 
  User, 
  Company, 
  AutonomousAgent, 
  Mission, 
  KnowledgeDoc, 
  Lead, 
  ProductItem, 
  Order,
  Subscription,
  PlanDefinition,
  PixCharge,
  CommissionRecord,
  EngineGovernanceSettings,
  FinancialRecord, 
  AuditLog,
  EnterpriseService,
  ServiceContract,
  FlagshipProduct,
  CommercialProposal,
  CommercialPartner,
  DevProject,
  SupportTicket,
  AgentInteraction,
  AiProviderConfig,
  AiTaskRoutingRule,
  EnterpriseIntegration,
  CustomerRefundRequest,
  SalesOpportunityScore,
  CloudInfrastructureComparison,
  TechCostGovernance
} from './types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'shefa_db.json');

export interface DatabaseSchema {
  users: User[];
  companies: Company[];
  agents: AutonomousAgent[];
  missions: Mission[];
  knowledge: KnowledgeDoc[];
  leads: Lead[];
  products: ProductItem[];
  orders: Order[];
  subscriptions: Subscription[];
  plans: PlanDefinition[];
  enterpriseServices: EnterpriseService[];
  serviceContracts: ServiceContract[];
  flagshipProducts: FlagshipProduct[];
  proposals: CommercialProposal[];
  partners: CommercialPartner[];
  pixCharges: PixCharge[];
  commissions: CommissionRecord[];
  governance: EngineGovernanceSettings;
  finances: FinancialRecord[];
  auditLogs: AuditLog[];
  projects: DevProject[];
  supportTickets: SupportTicket[];
  agentInteractions: AgentInteraction[];
  aiProviders: AiProviderConfig[];
  aiRoutingRules: AiTaskRoutingRule[];
  enterpriseIntegrations: EnterpriseIntegration[];
  customerRefunds: CustomerRefundRequest[];
  salesOpportunityScores: SalesOpportunityScore[];
  cloudComparison: CloudInfrastructureComparison;
  techGovernance: TechCostGovernance;
  sessions: { token: string; userId: string; expiresAt: string }[];
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, generatedSalt, 64);
  return {
    hash: derivedKey.toString('hex'),
    salt: generatedSalt
  };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), derivedKey);
}

// ---------------------------------------------------------------------
// 1. OFFICIAL COMMERCIAL PLANS (Astral R$ 197, Cosmic R$ 497, Infinity R$ 1.497)
// ---------------------------------------------------------------------
export const INITIAL_PLANS: PlanDefinition[] = [
  {
    id: 'plan_astral_starter',
    tier: 'Astral Starter',
    name: 'SHEFA ASTRAL · Start',
    monthlyPrice: 197,
    annualPrice: 1970,
    description: 'Central de IA autônoma para negócios em aceleração e estruturação de canais comerciais.',
    targetAudience: 'Para negócios em estruturação e primeiros passos em IA',
    features: [
      'Núcleo neural AYIN CORE integrado',
      'Até 3 agentes autônomos simultâneos',
      'Até 2 usuários com controle de acesso',
      '150 missões estratégicas/mês',
      'Radar de mercado e qualificação de leads',
      'Base de conhecimento privativa (até 15 docs)',
      'Cobrança e recebimento instantâneo via Pix'
    ],
    trialDays: 7,
    limits: {
      maxUsers: 2,
      monthlyMissions: 150,
      maxAgents: 3,
      maxKnowledgeDocs: 15,
      customAIPersona: false,
      prioritySupport: false
    }
  },
  {
    id: 'plan_cosmic_growth',
    tier: 'Cosmic Growth',
    name: 'SHEFA COSMIC · Growth',
    monthlyPrice: 497,
    annualPrice: 4970,
    description: 'Operação autônoma contínua 24h para empresas consolidadas com múltiplos canais e produtos.',
    targetAudience: 'Para empresas em aceleração comercial com times de vendas',
    features: [
      'Núcleo AYIN CORE com prioridade de processamento',
      'Suíte AYIN SALES e AYIN CUSTOMER incluídas',
      'Até 8 agentes especializados 24/7',
      'Até 5 usuários na plataforma',
      '600 missões estratégicas/mês',
      'Assistente de IA dedicado com persona própria da empresa',
      'Automação completa de propostas e follow-ups',
      'Base de conhecimento privativa (até 50 docs)',
      'Conciliação Pix automatizada com baixa instantânea'
    ],
    trialDays: 7,
    limits: {
      maxUsers: 5,
      monthlyMissions: 600,
      maxAgents: 8,
      maxKnowledgeDocs: 50,
      customAIPersona: true,
      prioritySupport: false
    }
  },
  {
    id: 'plan_infinity_enterprise',
    tier: 'Infinity Enterprise',
    name: 'SHEFA INFINITY · Enterprise',
    monthlyPrice: 1497,
    annualPrice: 14970,
    description: 'Soberania corporativa total, rede irrestrita de agentes 24/7, blindagem e consultoria tática contínua.',
    targetAudience: 'Para grandes corporações e operações de missão crítica',
    features: [
      'Acesso total à constelação com os 11 agentes autônomos',
      'Suíte completa: AYIN SALES, CUSTOMER, FINANCE e CORE',
      'Usuários corporativos ilimitados (até 25 assentos)',
      '3.000+ missões e tarefas estratégicas/mês',
      'Blindagem LGPD & Isolamento multitenant hermético',
      'Módulo 24/7 ininterrupto no servidor',
      'Aprovações do Master Owner com travas personalizadas',
      'Gestão de comissionamento dinâmico de afiliados e parceiros',
      'Suporte consultivo prioritário e onboarding hands-on'
    ],
    trialDays: 14,
    limits: {
      maxUsers: 25,
      monthlyMissions: 3000,
      maxAgents: 11,
      maxKnowledgeDocs: 200,
      customAIPersona: true,
      prioritySupport: true,
      dedicatedAccountManager: true
    }
  }
];

// ---------------------------------------------------------------------
// 2. ENTERPRISE SERVICES (Configurable by Master Owner)
// ---------------------------------------------------------------------
export const INITIAL_SERVICES: EnterpriseService[] = [
  {
    id: 'srv_diagnostic_01',
    code: 'DIAGNOSTIC',
    name: 'Diagnóstico Estratégico de IA & Mapeamento de Oportunidades',
    tagline: 'Auditoria profunda de processos, funis e arquitetura para implantação de IA.',
    description: 'Imersão completa na operação da sua empresa conduzida por especialistas e agentes analíticos. Mapeamento de gargalos manuais, identificação de rotinas automatizáveis e plano tático detalhado com projeção de ROI.',
    basePrice: 2490,
    deliveryTimelineDays: 5,
    deliverables: [
      'Relatório Executivo de Maturidade em Inteligência Artificial',
      'Mapeamento dos 10 maiores gargalos operacionais da empresa',
      'Blueprint de arquitetura dos agentes necessários',
      'Projeção de economia de tempo e incremento de receita em 12 meses',
      'Sessão executiva de alinhamento com a diretoria'
    ],
    recommendedFor: 'Empresas que querem adotar IA mas precisam de clareza prévia sobre prioridades e ROI.',
    isActive: true
  },
  {
    id: 'srv_deployment_02',
    code: 'DEPLOYMENT',
    name: 'Implantação & Onboarding Hands-on de Agentes Autônomos',
    tagline: 'Configuração integral, treinamento de dados e ativação 24/7 guiada por engenheiros.',
    description: 'Implementação assistida da constelação SHEFA AYIN no ambiente corporativo. Parametrização dos agentes, integração de base de conhecimento da empresa, definição das personas e políticas de segurança sob medida.',
    basePrice: 5900,
    deliveryTimelineDays: 14,
    deliverables: [
      'Setup completo do tenant corporativo isolado',
      'Estruturação da Base de Conhecimento e manuais internos',
      'Personalização da Persona do Assistente Corporativo',
      'Testes assistidos de missões reais e homologação com a equipe',
      'Treinamento ao vivo da equipe interna e material de onboarding'
    ],
    recommendedFor: 'Empresas contratantes que desejam acelerar o time-to-value com suporte técnico presencial/remoto.',
    isActive: true
  },
  {
    id: 'srv_custom_automation_03',
    code: 'CUSTOM_AUTOMATION',
    name: 'Automações Personalizadas de Fluxos & Conectores de APIs',
    tagline: 'Desenvolvimento de fluxos sob demanda, integrações com ERPs, CRMs e canais externos.',
    description: 'Criação de pipelines proprietários conectando os 11 agentes aos sistemas legados do cliente (CRM, ERP, WhatsApp API, gateways de pagamento, planilhas e bancos de dados externos).',
    basePrice: 8900,
    deliveryTimelineDays: 21,
    deliverables: [
      'Desenvolvimento de conectores customizados de entrada e saída',
      'Regras táticas de validação e desvio seguro de exceções',
      'Painéis de monitoramento de fluxo e telemetria',
      'Homologação de segurança e isolamento de dados LGPD',
      'Garantia de 90 dias de suporte e estabilidade de código'
    ],
    recommendedFor: 'Operações que necessitam de integrações customizadas com sistemas proprietários existentes.',
    isActive: true
  },
  {
    id: 'srv_consulting_04',
    code: 'CONSULTING',
    name: 'Consultoria Estratégica Contínua & Comitê de IA',
    tagline: 'Acompanhamento mensal tático com reuniões quinzenais de otimização de resultados.',
    description: 'Apoio contínuo de conselho estratégico em IA para sustentação e expansão de margem. Revisão quinzenal dos relatórios dos agentes, fine-tuning das personas e calibração dos funis de vendas.',
    basePrice: 3500,
    deliveryTimelineDays: 30,
    deliverables: [
      '2 Reuniões executivas mensais de avaliação de indicadores',
      'Ajustes de prompts estratégicos e regras de negócios dos agentes',
      'Priorização contínua do backlog de novas missões',
      'Acesso a canal prioritário no WhatsApp com engenheiro sênior',
      'Relatório mensal de impacto financeiro e produtividade'
    ],
    recommendedFor: 'Empresas em forte expansão que querem acompanhamento consultivo contínuo de alta senioridade.',
    isActive: true
  }
];

// ---------------------------------------------------------------------
// 3. FLAGSHIP PRODUCTS (AYIN SALES, AYIN CUSTOMER, AYIN FINANCE, AYIN CORE)
// ---------------------------------------------------------------------
export const INITIAL_FLAGSHIP_PRODUCTS: FlagshipProduct[] = [
  {
    id: 'prod_ayin_sales',
    code: 'AYIN_SALES',
    name: 'AYIN SALES',
    hebrewName: 'מערך המכירות (Noseh & Shoer)',
    tagline: 'Inteligência comercial autônoma para prospecção, qualificação e fechamento de negócios.',
    description: 'Módulo comercial de alta conversão. Conduz abordagem de leads, enriquece dados cadastrais, apresenta propostas formatadas com trava de desconto e realiza follow-up sistemático 24/7.',
    capabilities: [
      'Enriquecimento automático e pontuação de fit de leads B2B',
      'Geração instantânea de propostas comerciais personalizadas',
      'Negociação autônoma dentro de margens pré-estabelecidas',
      'Follow-up com cadência inteligente para redução de no-show',
      'Pipeline visual com transições automáticas de estágio'
    ],
    associatedAgents: ['Radar Sentinel', 'Lead Organizer', 'Sales Negotiator'],
    departmentId: 'AYIN_SALES',
    includedInPlans: ['Cosmic Growth', 'Infinity Enterprise'],
    standalonePriceMonthly: 390
  },
  {
    id: 'prod_ayin_customer',
    code: 'AYIN_CUSTOMER',
    name: 'AYIN CUSTOMER',
    hebrewName: 'שירות לקוחות (Ozer)',
    tagline: 'Concierge de atendimento e suporte corporativo com persona exclusiva 24 horas por dia.',
    description: 'Assistente corporativo dedicado à sua empresa com base de conhecimento privativa. Tira dúvidas de produtos, orienta clientes em checkout Pix, soluciona tickets de nível 1 e 2 e eleva o NPS.',
    capabilities: [
      'Atendimento ininterrupto 24/7 com tempo de resposta imediato',
      'Persona e tom de voz calibrados conforme as diretrizes da marca',
      'Busca semântica restrita aos manuais e documentos autorizados',
      'Onboarding interativo para novos clientes e usuários',
      'Escalonamento inteligente para atendentes humanos em casos críticos'
    ],
    associatedAgents: ['Customer Concierge 24/7'],
    departmentId: 'AYIN_AGENTS',
    includedInPlans: ['Cosmic Growth', 'Infinity Enterprise'],
    standalonePriceMonthly: 350
  },
  {
    id: 'prod_ayin_finance',
    code: 'AYIN_FINANCE',
    name: 'AYIN FINANCE',
    hebrewName: 'ניהול פיננסי (Gizbar & Natsiv)',
    tagline: 'Auditoria de receitas, conciliação Pix em tempo real e blindagem de margem.',
    description: 'Gestor financeiro autônomo. Concilia transações Pix de ponta a ponta, emite cobranças com QR Code padrão BACEN, monitora inadimplência, liquida comissões de parceiros e audita custos operacionais.',
    capabilities: [
      'Conciliação automatizada de pagamentos Pix com baixa instantânea',
      'Cálculo e monitoramento em tempo real de MRR e churn',
      'Régua inteligente de cobrança para mitigação de inadimplência',
      'Cálculo e liquidação de comissões de parceiros comerciais',
      'Relatórios de Demonstração de Resultado (DRE) com margem real'
    ],
    associatedAgents: ['Finance Custodian', 'Subscription Warden'],
    departmentId: 'AYIN_FINANCE',
    includedInPlans: ['Infinity Enterprise'],
    standalonePriceMonthly: 490
  },
  {
    id: 'prod_ayin_core',
    code: 'AYIN_CORE',
    name: 'AYIN CORE',
    hebrewName: 'עין השפע (Tzofeh, Chacham & Mazkir)',
    tagline: 'Cérebro central neural com soberania Master Owner e orquestração de missões.',
    description: 'O epicentro de inteligência do Observatório SHEFA AYIN. Decompõe comandos de alto nível em tarefas táticas distribuídas entre os 11 agentes, impõe travas de segurança orçamentária e gera relatórios executivos 360°.',
    capabilities: [
      'Interpretação neural de comandos estratégicos por voz ou texto',
      'Decomposição e despacho multi-agente com dependências de etapas',
      'Trava de soberania Master Owner para ações com impacto orçamentário',
      'Kill-switch de emergência e pausa geral com 1 clique',
      'Histórico imutável de auditoria com encadeamento criptográfico SHA-256'
    ],
    associatedAgents: ['Radar Sentinel', 'Analytics Strategist', 'Report Chronicler'],
    departmentId: 'AYIN_STRATEGY',
    includedInPlans: ['Astral Starter', 'Cosmic Growth', 'Infinity Enterprise'],
    standalonePriceMonthly: 690
  }
];

export const INITIAL_SERVICE_CONTRACTS: ServiceContract[] = [
  {
    id: 'ctr_vertice_01',
    companyId: 'comp_vertice_tech',
    companyName: 'Vértice Tech Global',
    customerEmail: 'contato@verticecorp.com.br',
    serviceId: 'srv_custom_automation_03',
    serviceCode: 'CUSTOM_AUTOMATION',
    serviceName: 'Automações Personalizadas de Processos & APIs',
    status: 'IN_PROGRESS',
    price: 8900,
    scopeNotes: 'Integração de pipeline de leads corporativos com conector de webhook e auditoria LGPD.',
    timelineDays: 21,
    assignedAgentCodename: 'Yoetz (Estrategista)',
    startDate: '2026-10-20T10:00:00Z',
    createdAt: '2026-10-18T14:00:00Z',
    updatedAt: '2026-10-25T09:30:00Z'
  },
  {
    id: 'ctr_aurora_02',
    companyId: 'comp_aurora_sa',
    companyName: 'Grupo Aurora Logística & Varejo',
    customerEmail: 'gestao@aurorabusiness.com',
    serviceId: 'srv_deployment_02',
    serviceCode: 'DEPLOYMENT',
    serviceName: 'Implantação & Onboarding Hands-on de Agentes Autônomos',
    status: 'DELIVERED',
    price: 5900,
    scopeNotes: 'Parametrização completa do assistente Ayin Aurora e upload de 25 manuais de frotas.',
    timelineDays: 14,
    assignedAgentCodename: 'Ozer (Customer)',
    startDate: '2026-03-12T08:00:00Z',
    deliveredAt: '2026-03-26T17:00:00Z',
    createdAt: '2026-03-10T15:00:00Z',
    updatedAt: '2026-03-26T17:00:00Z'
  }
];

export const INITIAL_PROPOSALS: CommercialProposal[] = [
  {
    id: 'prop_2026_01',
    leadId: 'lead_101',
    companyName: 'InovaLab Biotecnologia',
    contactName: 'Dra. Carolina Mendonça',
    contactEmail: 'carolina.m@inovalab.io',
    contactPhone: '+55 (11) 98765-4321',
    planTier: 'Infinity Enterprise',
    servicesIncluded: [
      'Assinatura Anual SHEFA INFINITY Enterprise (R$ 14.970/ano)',
      'Diagnóstico Estratégico de IA (R$ 2.490)',
      'Implantação & Onboarding Hands-on (R$ 5.900)'
    ],
    totalValue: 23360,
    discountPercent: 10,
    finalValue: 21024,
    status: 'SENT',
    validUntil: '2026-11-15T23:59:59Z',
    notes: 'Proposta customizada com foco em aceleração de 4 laboratórios subsidiários.',
    createdAt: '2026-10-29T14:00:00Z'
  },
  {
    id: 'prop_2026_02',
    leadId: 'lead_102',
    companyName: 'SindLog Transportes & Cargas',
    contactName: 'Eng. Roberto Albuquerque',
    contactEmail: 'roberto@sindlog.com.br',
    contactPhone: '+55 (21) 99123-8844',
    planTier: 'Cosmic Growth',
    servicesIncluded: [
      'Assinatura Anual SHEFA COSMIC Growth (R$ 4.970/ano)',
      'Automações Personalizadas de Processos & APIs (R$ 8.900)'
    ],
    totalValue: 13870,
    discountPercent: 5,
    finalValue: 13176,
    status: 'ACCEPTED',
    validUntil: '2026-11-05T23:59:59Z',
    notes: 'Aguardando validação do pagamento Pix do valor de entrada.',
    createdAt: '2026-10-30T10:00:00Z',
    acceptedAt: '2026-10-31T11:00:00Z'
  }
];

export const INITIAL_PARTNERS: CommercialPartner[] = [
  {
    id: 'prt_001',
    name: 'Rede de Expansão Alfa',
    email: 'parceiros@alfaexp.com.br',
    companyName: 'Alfa Expansão Comercial Ltda',
    referralCode: 'ALFA2026',
    commissionRate: 15,
    totalReferredLeads: 18,
    totalDealsClosed: 4,
    totalCommissionEarned: 3200,
    totalCommissionPaid: 1800,
    status: 'active',
    createdAt: '2026-02-01T00:00:00Z'
  },
  {
    id: 'prt_002',
    name: 'Consultoria Nexus B2B',
    email: 'contato@nexusb2b.com.br',
    companyName: 'Nexus Consultores Associados',
    referralCode: 'NEXUS_IA',
    commissionRate: 10,
    totalReferredLeads: 12,
    totalDealsClosed: 3,
    totalCommissionEarned: 1450,
    totalCommissionPaid: 1450,
    status: 'active',
    createdAt: '2026-04-15T00:00:00Z'
  }
];

function getInitialData(): DatabaseSchema {
  const masterAuth = hashPassword('ShefaAyin2026!');
  const clientAuth = hashPassword('Empresa@2026');

  const masterUser: User = {
    id: 'user_master_owner',
    email: 'Alifermadeiro@hotmail.com',
    name: 'Alifer Madeiro (Master Owner)',
    role: 'MASTER_OWNER',
    passwordHash: masterAuth.hash,
    salt: masterAuth.salt,
    createdAt: new Date().toISOString()
  };

  const clientUser: User = {
    id: 'user_client_vertice',
    email: 'contato@verticecorp.com.br',
    name: 'Diretoria Vértice',
    role: 'COMPANY_ADMIN',
    companyId: 'comp_vertice_tech',
    passwordHash: clientAuth.hash,
    salt: clientAuth.salt,
    createdAt: new Date().toISOString()
  };

  const clientUser2: User = {
    id: 'user_client_aurora',
    email: 'gestao@aurorabusiness.com',
    name: 'Gestão Aurora',
    role: 'COMPANY_ADMIN',
    companyId: 'comp_aurora_sa',
    passwordHash: clientAuth.hash,
    salt: clientAuth.salt,
    createdAt: new Date().toISOString()
  };

  const companies: Company[] = [
    {
      id: 'comp_vertice_tech',
      name: 'Vértice Tech Global',
      tradeName: 'Vértice Sistemas Inteligentes',
      cnpjOrTaxId: '42.891.023/0001-94',
      plan: 'Infinity Enterprise',
      status: 'active',
      createdAt: '2026-01-15T09:00:00Z',
      subscriptionId: 'sub_vertice_001',
      onboardingStep: 'LIVE_247',
      aiPersona: {
        assistantName: 'Ayin Vértice',
        tone: 'Consultivo, corporativo e analítico',
        welcomeMessage: 'Bem-vindo à Vértice Tech. Sou a inteligência dedicada às suas operações.',
        instructions: 'Focar na automação de processos B2B e expansão da receita com clientes corporativos.'
      },
      quotas: {
        maxUsers: 25,
        monthlyMissions: 3000,
        usedMissions: 142,
        maxAgents: 11,
        maxKnowledgeDocs: 200
      }
    },
    {
      id: 'comp_aurora_sa',
      name: 'Grupo Aurora Logística & Varejo',
      tradeName: 'Aurora Express',
      cnpjOrTaxId: '18.345.678/0001-12',
      plan: 'Cosmic Growth',
      status: 'active',
      createdAt: '2026-03-10T14:30:00Z',
      subscriptionId: 'sub_aurora_002',
      onboardingStep: 'LIVE_247',
      aiPersona: {
        assistantName: 'Ayin Aurora',
        tone: 'Ágil, comercial e focado em logística e entregas',
        welcomeMessage: 'Olá! Sou o assistente de inteligência de frotas e distribuição da Aurora.',
        instructions: 'Otimizar taxas de conversão de fretes e renegociação com transportadoras parceiras.'
      },
      quotas: {
        maxUsers: 5,
        monthlyMissions: 600,
        usedMissions: 88,
        maxAgents: 8,
        maxKnowledgeDocs: 50
      }
    }
  ];

  const subscriptions: Subscription[] = [
    {
      id: 'sub_vertice_001',
      companyId: 'comp_vertice_tech',
      companyName: 'Vértice Tech Global',
      customerEmail: 'contato@verticecorp.com.br',
      planTier: 'Infinity Enterprise',
      billingCycle: 'annual',
      status: 'ACTIVE',
      price: 14970, // Annual: R$ 14.970/ano
      startDate: '2026-01-15T00:00:00Z',
      expiresAt: '2027-01-15T00:00:00Z',
      autoRenew: true,
      featuresUnlocked: [
        'Constelação total 11 agentes',
        'Missões ilimitadas',
        'Conciliação Pix 24/7',
        'Blindagem dedicada'
      ],
      lastPaymentConfirmedAt: '2026-01-15T10:00:00Z'
    },
    {
      id: 'sub_aurora_002',
      companyId: 'comp_aurora_sa',
      companyName: 'Grupo Aurora Logística & Varejo',
      customerEmail: 'gestao@aurorabusiness.com',
      planTier: 'Cosmic Growth',
      billingCycle: 'monthly',
      status: 'ACTIVE',
      price: 497, // Monthly: R$ 497/mês
      startDate: '2026-10-10T00:00:00Z',
      expiresAt: '2026-11-10T00:00:00Z',
      autoRenew: true,
      featuresUnlocked: [
        'Até 8 agentes 24/7',
        '600 missões/mês',
        'Conciliação Pix automática'
      ],
      lastPaymentConfirmedAt: '2026-10-10T14:30:00Z'
    }
  ];

  // The 11 Autonomous Integrated Agents Network (Section 4 of user request)
  const agents: AutonomousAgent[] = [
    {
      id: 'agent_radar_01',
      companyId: 'global',
      name: 'Radar Sentinel',
      hebrewCodename: 'צופה (Tzofeh)',
      departmentId: 'AYIN_RADAR',
      agentRoleType: 'RADAR AGENT',
      role: 'Varredura Contínua de Oportunidades',
      specialty: 'Mapeamento de empresas corporativas com demanda para soluções da SHEFA AYIN',
      autonomyLevel: 'autonomous_safe',
      status: 'analyzing',
      is24hEnabled: true,
      isManuallyPaused: false,
      totalMissionsCompleted: 341,
      accuracyScore: 98,
      lastActive: new Date().toISOString()
    },
    {
      id: 'agent_lead_02',
      companyId: 'global',
      name: 'Lead Organizer',
      hebrewCodename: 'שומר (Shoer)',
      departmentId: 'AYIN_SALES',
      agentRoleType: 'LEAD AGENT',
      role: 'Qualificação & Estruturação de Contatos',
      specialty: 'Segmentação de leads corporativos, enriquecimento de dados e pontuação de fit',
      autonomyLevel: 'autonomous_safe',
      status: 'running',
      is24hEnabled: true,
      isManuallyPaused: false,
      totalMissionsCompleted: 452,
      accuracyScore: 97,
      lastActive: new Date().toISOString()
    },
    {
      id: 'agent_sales_03',
      companyId: 'global',
      name: 'Sales Negotiator',
      hebrewCodename: 'נושא (Noseh)',
      departmentId: 'AYIN_SALES',
      agentRoleType: 'SALES AGENT',
      role: 'Apresentação de Ofertas & Fechamento',
      specialty: 'Condução de negociações dentro dos limites autorizados e elaboração de propostas',
      autonomyLevel: 'autonomous_safe',
      status: 'running',
      is24hEnabled: true,
      isManuallyPaused: false,
      totalMissionsCompleted: 520,
      accuracyScore: 97,
      lastActive: new Date().toISOString()
    },
    {
      id: 'agent_customer_04',
      companyId: 'global',
      name: 'Customer Concierge 24/7',
      hebrewCodename: 'עוזר (Ozer)',
      departmentId: 'AYIN_AGENTS',
      agentRoleType: 'CUSTOMER AGENT',
      role: 'Atendimento & Suporte Contínuo',
      specialty: 'Tira-dúvidas 24h, orientação de planos, checkout Pix e suporte consultivo',
      autonomyLevel: 'full_autonomous',
      status: 'running',
      is24hEnabled: true,
      isManuallyPaused: false,
      totalMissionsCompleted: 885,
      accuracyScore: 99,
      lastActive: new Date().toISOString()
    },
    {
      id: 'agent_marketing_05',
      companyId: 'global',
      name: 'Marketing Herald',
      hebrewCodename: 'מבשר (Mevaser)',
      departmentId: 'AYIN_CREATIVE',
      agentRoleType: 'MARKETING AGENT',
      role: 'Planejamento de Campanhas & Ativação',
      specialty: 'Estratégias de conteúdo de atração e acompanhamento de métricas de alcance',
      autonomyLevel: 'autonomous_safe',
      status: 'idle',
      is24hEnabled: true,
      isManuallyPaused: false,
      totalMissionsCompleted: 290,
      accuracyScore: 95,
      lastActive: new Date().toISOString()
    },
    {
      id: 'agent_creative_06',
      companyId: 'global',
      name: 'Creative Scribe',
      hebrewCodename: 'סופר (Sofer)',
      departmentId: 'AYIN_CREATIVE',
      agentRoleType: 'CREATIVE AGENT',
      role: 'Produção de Propostas & Copywriting',
      specialty: 'Copywriting de alta persuasão, pitches comerciais e materiais de divulgação',
      autonomyLevel: 'autonomous_safe',
      status: 'idle',
      is24hEnabled: true,
      isManuallyPaused: false,
      totalMissionsCompleted: 412,
      accuracyScore: 96,
      lastActive: new Date().toISOString()
    },
    {
      id: 'agent_market_07',
      companyId: 'global',
      name: 'Market Intelligence Scout',
      hebrewCodename: 'סוחר (Socher)',
      departmentId: 'AYIN_MARKET',
      agentRoleType: 'MARKET AGENT',
      role: 'Monitoramento de Concorrência & Tendências',
      specialty: 'Acompanhamento de precificação concorrencial e oportunidades de arbitragem',
      autonomyLevel: 'supervised',
      status: 'idle',
      is24hEnabled: false,
      isManuallyPaused: false,
      totalMissionsCompleted: 145,
      accuracyScore: 94,
      lastActive: new Date().toISOString()
    },
    {
      id: 'agent_finance_08',
      companyId: 'global',
      name: 'Finance Custodian',
      hebrewCodename: 'גזבר (Gizbar)',
      departmentId: 'AYIN_FINANCE',
      agentRoleType: 'FINANCE AGENT',
      role: 'Auditoria de Receitas & Despesas',
      specialty: 'Acompanhamento de pagamentos Pix, liquidações, comissões e proteção de margem',
      autonomyLevel: 'supervised',
      status: 'idle',
      is24hEnabled: true,
      isManuallyPaused: false,
      totalMissionsCompleted: 388,
      accuracyScore: 100,
      lastActive: new Date().toISOString()
    },
    {
      id: 'agent_sub_09',
      companyId: 'global',
      name: 'Subscription Warden',
      hebrewCodename: 'נציב (Natsiv)',
      departmentId: 'AYIN_FINANCE',
      agentRoleType: 'SUBSCRIPTION AGENT',
      role: 'Gestão de Assinaturas & Acessos',
      specialty: 'Ativação imediata pós-Pix, controle de vencimentos, trials e cotas de uso',
      autonomyLevel: 'autonomous_safe',
      status: 'running',
      is24hEnabled: true,
      isManuallyPaused: false,
      totalMissionsCompleted: 610,
      accuracyScore: 99,
      lastActive: new Date().toISOString()
    },
    {
      id: 'agent_analytics_10',
      companyId: 'global',
      name: 'Analytics Strategist',
      hebrewCodename: 'חכם (Chacham)',
      departmentId: 'AYIN_STRATEGY',
      agentRoleType: 'ANALYTICS AGENT',
      role: 'Otimização Comercial & Operacional',
      specialty: 'Identificação de melhorias no funil de conversão e eficiência dos agentes',
      autonomyLevel: 'full_autonomous',
      status: 'running',
      is24hEnabled: true,
      isManuallyPaused: false,
      totalMissionsCompleted: 672,
      accuracyScore: 99,
      lastActive: new Date().toISOString()
    },
    {
      id: 'agent_report_11',
      companyId: 'global',
      name: 'Report Chronicler',
      hebrewCodename: 'מזכיר (Mazkir)',
      departmentId: 'AYIN_INTELLIGENCE',
      agentRoleType: 'REPORT AGENT',
      role: 'Geração de Relatórios Executivos',
      specialty: 'Consolidação de relatórios executivos para o Master Owner com visão 360°',
      autonomyLevel: 'autonomous_safe',
      status: 'idle',
      is24hEnabled: true,
      isManuallyPaused: false,
      totalMissionsCompleted: 430,
      accuracyScore: 98,
      lastActive: new Date().toISOString()
    }
  ];

  const missions: Mission[] = [
    {
      id: 'mis_001_market_radar',
      companyId: 'global',
      creatorEmail: 'Alifermadeiro@hotmail.com',
      title: 'Mapeamento Global de Soluções Corporativas de IA 2026',
      objective: 'Identificar movimentos de mercado no setor de IA corporativa e mapear oportunidades de consolidação de clientes no modelo híbrido (SaaS + Serviços).',
      priority: 'high',
      status: 'completed',
      departmentsInvolved: ['AYIN_RADAR', 'AYIN_STRATEGY'],
      steps: [
        {
          id: 'step_1',
          title: 'Varredura de 14 plataformas corporativas emergentes',
          departmentId: 'AYIN_RADAR',
          assignedAgentId: 'agent_radar_01',
          status: 'completed',
          result: 'Mapeadas 14 soluções. Oportunidade identificada: carência de observatórios integrados com execução 24/7 em background e modelo híbrido com consultoria hands-on.'
        },
        {
          id: 'step_2',
          title: 'Elaboração da Matriz de Diferenciação Shefa',
          departmentId: 'AYIN_STRATEGY',
          assignedAgentId: 'agent_analytics_10',
          status: 'completed',
          result: 'Matriz consolidada. Destaque para governança multi-tenant e aprovações do Master Owner.'
        }
      ],
      isSensitive: false,
      executionLogs: [
        {
          timestamp: '2026-10-30T14:00:00Z',
          agentName: 'Radar Sentinel',
          message: 'Iniciada varredura de sinais de mercado via conectores autorizados.',
          type: 'info'
        },
        {
          timestamp: '2026-10-30T14:15:00Z',
          agentName: 'Analytics Strategist',
          message: 'Análise sintética concluída com 98% de precisão.',
          type: 'success'
        }
      ],
      finalReport: 'Relatório Executivo Shefa: O mercado busca plataformas de inteligência com soberania de dados, integração de serviços empresariais e sem falsas simulações.',
      createdAt: '2026-10-30T13:50:00Z',
      updatedAt: '2026-10-30T14:20:00Z'
    }
  ];

  const knowledge: KnowledgeDoc[] = [
    {
      id: 'knd_001',
      companyId: 'global',
      title: 'Constituição Operacional SHEFA AYIN',
      category: 'policy',
      content: 'A Shefa Ayin opera sob três pilares inegociáveis: Transparência Absoluta (sem números simulados), Soberania do Master Owner (ações sensíveis exigem aprovação manual) e Isolamento Multitenant Hermético.',
      updatedAt: '2026-10-25T10:00:00Z'
    },
    {
      id: 'knd_002',
      companyId: 'comp_vertice_tech',
      title: 'Manual de Soluções e Acordos de Nível de Serviço (SLA)',
      category: 'guide',
      content: 'A Vértice Tech garante 99.9% de uptime para sistemas de missão crítica, com resposta inicial do suporte em até 15 minutos para clientes Enterprise.',
      updatedAt: '2026-10-20T12:00:00Z'
    }
  ];

  const leads: Lead[] = [
    {
      id: 'lead_101',
      companyId: 'comp_vertice_tech',
      name: 'Dra. Carolina Mendonça',
      email: 'carolina.m@inovalab.io',
      phone: '+55 (11) 98765-4321',
      companyName: 'InovaLab Biotecnologia',
      source: 'Inbound Conectado',
      stage: 'Negociação',
      value: 21024,
      notes: 'Interesse em implantar agentes de automação contínua e contratar Diagnóstico Estratégico.',
      assignedAgent: 'Sales Negotiator',
      partnerReferralCode: 'ALFA2026',
      createdAt: '2026-10-28T11:20:00Z',
      lastContact: '2026-10-30T17:40:00Z'
    },
    {
      id: 'lead_102',
      companyId: 'comp_vertice_tech',
      name: 'Eng. Roberto Albuquerque',
      email: 'roberto@sindlog.com.br',
      phone: '+55 (21) 99123-8844',
      companyName: 'SindLog Transportes & Cargas',
      source: 'Radar de Oportunidades',
      stage: 'Proposta',
      value: 13176,
      notes: 'Solicitou proposta com integração de dados sensíveis e automação de APIs.',
      assignedAgent: 'Sales Negotiator',
      partnerReferralCode: 'NEXUS_IA',
      createdAt: '2026-10-29T09:15:00Z',
      lastContact: '2026-10-30T15:00:00Z'
    },
    {
      id: 'lead_103',
      companyId: 'global',
      name: 'Marcelo Silveira',
      email: 'marcelo@silveirafarma.com.br',
      phone: '+55 (31) 98877-6655',
      companyName: 'Silveira Distribuidora Farma',
      source: 'Radar Sentinel',
      stage: 'Qualificado',
      value: 5900,
      notes: 'Empresa com 45 funcionários buscando atendimento 24h para pedidos B2B.',
      assignedAgent: 'Lead Organizer',
      createdAt: '2026-10-31T08:00:00Z',
      lastContact: '2026-10-31T14:30:00Z'
    }
  ];

  const products: ProductItem[] = [
    {
      id: 'prod_001',
      companyId: 'global',
      title: 'SHEFA AYIN Enterprise Hub (Licença Anual)',
      category: 'Plataforma Core',
      price: 14970,
      commissionRate: 15,
      type: 'proprio',
      status: 'active'
    },
    {
      id: 'prod_002',
      companyId: 'global',
      title: 'Módulo de Operação Contínua 24h & Rede de Agentes',
      category: 'Expansão de Inteligência',
      price: 4970,
      commissionRate: 20,
      type: 'proprio',
      status: 'active'
    },
    {
      id: 'prod_003',
      companyId: 'comp_vertice_tech',
      title: 'Vértice Core API - Middleware de Alta Disponibilidade',
      category: 'Software Corporativo',
      price: 8900,
      commissionRate: 10,
      type: 'proprio',
      status: 'active'
    }
  ];

  const orders: Order[] = [
    {
      id: 'ord_2026_01',
      companyId: 'comp_vertice_tech',
      customerName: 'Vértice Tech Global',
      customerEmail: 'contato@verticecorp.com.br',
      items: [
        {
          productId: 'prod_001',
          title: 'SHEFA AYIN Enterprise Hub (Licença Anual)',
          price: 14970,
          quantity: 1
        }
      ],
      totalAmount: 14970,
      status: 'CONFIRMED',
      paymentMethod: 'PIX',
      pixChargeId: 'pix_initial_01',
      createdAt: '2026-01-15T09:30:00Z',
      confirmedAt: '2026-01-15T10:00:00Z'
    }
  ];

  const pixCharges: PixCharge[] = [
    {
      id: 'pix_initial_01',
      orderId: 'ord_2026_01',
      companyId: 'comp_vertice_tech',
      customerName: 'Vértice Tech Global',
      customerEmail: 'contato@verticecorp.com.br',
      customerCpfOrCnpj: '42.891.023/0001-94',
      planTier: 'Infinity Enterprise',
      amount: 14970,
      pixKey: '11973479473',
      pixKeyType: 'TELEFONE CELULAR',
      recipientName: 'Alifer Madeiro',
      copyPasteCode: '00020126360014br.gov.bcb.pix011111973479473520400005303986540814970.005802BR5914Alifer Madeiro6009SAO PAULO62110507SHEFA016304C91E',
      status: 'CONFIRMED',
      createdAt: '2026-01-15T09:30:00Z',
      expiresAt: '2026-01-15T10:30:00Z',
      confirmedAt: '2026-01-15T10:00:00Z',
      txId: 'SHEFA01'
    }
  ];

  const commissions: CommissionRecord[] = [
    {
      id: 'com_001',
      orderId: 'ord_2026_01',
      subscriptionId: 'sub_vertice_001',
      partnerName: 'Rede de Expansão Alfa',
      partnerEmail: 'parceiros@alfaexp.com.br',
      rate: 15,
      amount: 2245.5,
      status: 'liquidado',
      date: '2026-01-16T00:00:00Z'
    }
  ];

  const finances: FinancialRecord[] = [
    {
      id: 'fin_001',
      companyId: 'global',
      title: 'Assinatura Anual Infinity Enterprise - Vértice Tech',
      type: 'assinatura',
      amount: 14970,
      date: '2026-01-15',
      status: 'liquidado'
    },
    {
      id: 'fin_002',
      companyId: 'global',
      title: 'Assinatura Mensal Cosmic Growth - Aurora Logística',
      type: 'assinatura',
      amount: 497,
      date: '2026-10-10',
      status: 'liquidado'
    },
    {
      id: 'fin_003',
      companyId: 'global',
      title: 'Serviço de Implantação Entregue - Aurora Logística',
      type: 'receita',
      amount: 5900,
      date: '2026-03-26',
      status: 'liquidado'
    },
    {
      id: 'fin_004',
      companyId: 'global',
      title: 'Custo de Servidores Cloud & Cluster GPU Dedicado',
      type: 'custo',
      amount: 2800,
      date: '2026-10-25',
      status: 'liquidado'
    }
  ];

  const governance: EngineGovernanceSettings = {
    isEmergencyPaused: false,
    financialSpendingLimit: 1000,
    maxConcurrentTasks: 5,
    autoRetryCount: 3,
    pixKey: '11973479473',
    pixKeyType: 'TELEFONE CELULAR',
    masterRecipient: 'Alifer Madeiro (Master Owner)'
  };

  const genesisLog: AuditLog = {
    id: 'audit_genesis',
    timestamp: '2026-10-31T00:00:00Z',
    actorEmail: 'system@shefa-ayin.io',
    actorRole: 'MASTER_OWNER',
    action: 'INIT_BUSINESS_ENGINE',
    companyId: 'global',
    details: 'Autonomous Business Engine, modelo híbrido (SaaS + Serviços) e módulo Pix 11973479473 inicializados.',
    hash: crypto.createHash('sha256').update('INIT_BUSINESS_ENGINE_HYBRID_2026').digest('hex')
  };

  const initialProjects: DevProject[] = [
    {
      id: 'proj_vertice_omnichannel',
      companyId: 'comp_vertice_tech',
      companyName: 'Vértice Tech Soluções',
      serviceContractId: 'contract_001',
      title: 'Implantação Omnichannel do Motor Neural AYIN SALES',
      description: 'Integração completa do pipeline comercial e qualificação autônoma de leads via WhatsApp e CRM corporativo.',
      assignedAgentCodename: 'SALES AGENT',
      status: 'IN_DEVELOPMENT',
      tasks: [
        {
          id: 'task_001',
          title: 'Mapeamento de jornada e regras de qualificação de leads',
          description: 'Definir critérios BANT para qualificação automática no Lead Agent.',
          status: 'completed',
          assignedAgent: 'LEAD AGENT',
          deadline: '2026-11-05',
          completedAt: '2026-11-03T14:20:00Z'
        },
        {
          id: 'task_002',
          title: 'Configuração do webhook bancário Pix para liberação instantânea',
          description: 'Testar endpoint autenticado com chave secreta HMAC e idempotência de txId.',
          status: 'in_progress',
          assignedAgent: 'FINANCE AGENT',
          deadline: '2026-11-08'
        },
        {
          id: 'task_003',
          title: 'Homologação assistida e treinamento da equipe de vendas',
          description: 'Validação final de aceite pelo cliente Vértice Tech.',
          status: 'pending',
          assignedAgent: 'CUSTOMER AGENT',
          deadline: '2026-11-12'
        }
      ],
      deadline: '2026-11-15',
      clientApprovalStatus: 'PENDING',
      createdAt: '2026-11-01T10:00:00Z',
      updatedAt: '2026-11-03T14:20:00Z'
    },
    {
      id: 'proj_aurora_custom_ai',
      companyId: 'comp_aurora_sa',
      companyName: 'Aurora Logística Global',
      title: 'Automação Tática de Roteirização e Atendimento com AYIN CORE',
      description: 'Desenvolvimento e ajuste fino de persona logística com base de conhecimento privativa.',
      assignedAgentCodename: 'CREATIVE AGENT',
      status: 'PLANNING',
      tasks: [
        {
          id: 'task_aurora_01',
          title: 'Estruturação da Base de Conhecimento RAG com manuais operacionais',
          status: 'in_progress',
          assignedAgent: 'REPORT AGENT',
          deadline: '2026-11-10'
        }
      ],
      deadline: '2026-11-20',
      clientApprovalStatus: 'PENDING',
      createdAt: '2026-11-02T08:00:00Z',
      updatedAt: '2026-11-02T08:00:00Z'
    }
  ];

  const initialSupportTickets: SupportTicket[] = [
    {
      id: 'ticket_vertice_001',
      companyId: 'comp_vertice_tech',
      companyName: 'Vértice Tech Soluções',
      customerEmail: 'contato@verticecorp.com.br',
      subject: 'Ajuste de persona e tom de voz no AYIN SALES',
      description: 'Gostaríamos de calibrar o assistente de vendas para um tom mais corporativo e consultivo no segmento B2B SaaS.',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      category: 'AGENT_TUNING',
      assignedAgent: 'CUSTOMER AGENT',
      communicationHistory: [
        {
          id: 'msg_001',
          senderEmail: 'contato@verticecorp.com.br',
          senderName: 'Diretoria Vértice Tech',
          senderRole: 'CLIENT',
          message: 'Prezados, gostaríamos de ajustar o prompt da persona para incluir terminologia técnica de infraestrutura em nuvem.',
          timestamp: '2026-11-02T11:00:00Z'
        },
        {
          id: 'msg_002',
          senderEmail: 'customer.agent@shefa-ayin.io',
          senderName: 'Customer Success Agent (SHEFA AYIN)',
          senderRole: 'AGENT',
          message: 'Perfeito! O CREATIVE AGENT e o LEAD AGENT recalibraram os parâmetros de síntese. A nova persona já está em produção.',
          timestamp: '2026-11-02T11:30:00Z'
        }
      ],
      createdAt: '2026-11-02T11:00:00Z',
      updatedAt: '2026-11-02T11:30:00Z'
    }
  ];

  const initialInteractions: AgentInteraction[] = [
    {
      id: 'interaction_001',
      timestamp: '2026-11-02T09:15:00Z',
      fromAgent: 'RADAR AGENT',
      toAgent: 'LEAD AGENT',
      actionType: 'MARKET_RADAR_OPPORTUNITY',
      subject: 'Detecção de oportunidade corporativa: demanda de IA em infraestrutura',
      payload: { sector: 'Saúde & Diagnóstico', marketScore: 94, estimatedAnnualBudget: 180000 },
      verifiableOutput: '3 prospects corporativos indexados e transferidos para estruturação de cadência comercial.',
      status: 'PROCESSED',
      isSensitive: false
    },
    {
      id: 'interaction_002',
      timestamp: '2026-11-02T10:00:00Z',
      fromAgent: 'LEAD AGENT',
      toAgent: 'SALES AGENT',
      actionType: 'LEAD_QUALIFICATION_HANDOFF',
      subject: 'Handoff de lead qualificado com score 89/100 (Grupo Hospitalar San Raphael)',
      payload: { leadId: 'lead_002', company: 'Grupo Hospitalar San Raphael', planSuggested: 'Infinity Enterprise' },
      verifiableOutput: 'Proposta comercial pré-gerada no CRM com cotação de implantação dedicada.',
      status: 'PROCESSED',
      isSensitive: false
    },
    {
      id: 'interaction_003',
      timestamp: '2026-11-02T10:30:00Z',
      fromAgent: 'SALES AGENT',
      toAgent: 'FINANCE AGENT',
      actionType: 'SALES_PROPOSAL_DISPATCH',
      subject: 'Solicitação de emissão de cobrança Pix e homologação de contrato comercial',
      payload: { proposalId: 'prop_002', amount: 8900, termMonths: 12 },
      verifiableOutput: 'QR Code e payload EMV padrão BACEN emitidos para cobrança sob chave 11973479473.',
      status: 'PROCESSED',
      isSensitive: false
    }
  ];

  const initialAiProviders: AiProviderConfig[] = [
    {
      providerId: 'gemini',
      providerName: 'Google Gemini 3.8 Flash & Pro (Native)',
      isActive: true,
      isMasterApproved: true,
      modelId: 'gemini-3.8-flash',
      status: 'ACTIVE',
      latencyMs: 280,
      costPer1kInputTokensUsd: 0.00015,
      costPer1kOutputTokensUsd: 0.00060,
      monthlyBudgetCpmBrl: 500,
      currentMonthSpentBrl: 38.40,
      callsCount: 412,
      tokensConsumed: 198400,
      isFallbackAuthorized: true,
      fallbackProviderId: 'mock_sandbox',
      maskedApiKey: 'AIzaSy********************',
      notes: 'Provedor primário nativo do ecossistema SHEFA AYIN.'
    },
    {
      providerId: 'openai',
      providerName: 'OpenAI Enterprise Gateway (GPT-4o & o3-mini)',
      isActive: false,
      isMasterApproved: false,
      modelId: 'gpt-4o',
      status: 'AVAILABLE',
      latencyMs: 420,
      costPer1kInputTokensUsd: 0.0025,
      costPer1kOutputTokensUsd: 0.010,
      monthlyBudgetCpmBrl: 800,
      currentMonthSpentBrl: 0.00,
      callsCount: 0,
      tokensConsumed: 0,
      isFallbackAuthorized: false,
      fallbackProviderId: 'gemini',
      notes: 'Disponível para homologação. Requer autorização e chave do Master Owner.'
    },
    {
      providerId: 'bedrock',
      providerName: 'Amazon Bedrock AgentCore (Anthropic Claude 3.5 Sonnet)',
      isActive: false,
      isMasterApproved: false,
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      status: 'AVAILABLE',
      latencyMs: 490,
      costPer1kInputTokensUsd: 0.0030,
      costPer1kOutputTokensUsd: 0.0150,
      monthlyBudgetCpmBrl: 1000,
      currentMonthSpentBrl: 0.00,
      callsCount: 0,
      tokensConsumed: 0,
      isFallbackAuthorized: false,
      fallbackProviderId: 'gemini',
      notes: 'Arquitetura AgentCore compatível com AWS Bedrock.'
    },
    {
      providerId: 'nova',
      providerName: 'Amazon Nova Enterprise (Nova Pro & Nova Lite)',
      isActive: false,
      isMasterApproved: false,
      modelId: 'amazon.nova-pro-v1:0',
      status: 'AVAILABLE',
      latencyMs: 310,
      costPer1kInputTokensUsd: 0.0008,
      costPer1kOutputTokensUsd: 0.0032,
      monthlyBudgetCpmBrl: 400,
      currentMonthSpentBrl: 0.00,
      callsCount: 0,
      tokensConsumed: 0,
      isFallbackAuthorized: false,
      fallbackProviderId: 'gemini',
      notes: 'Modelo multimodal de alta velocidade e baixo custo para processamento em lote.'
    },
    {
      providerId: 'mock_sandbox',
      providerName: 'AYIN Neural Sandbox Emulator (Zero Cost)',
      isActive: true,
      isMasterApproved: true,
      modelId: 'shefa-sandbox-v1',
      status: 'ACTIVE',
      latencyMs: 45,
      costPer1kInputTokensUsd: 0.0,
      costPer1kOutputTokensUsd: 0.0,
      monthlyBudgetCpmBrl: 0,
      currentMonthSpentBrl: 0.00,
      callsCount: 156,
      tokensConsumed: 85200,
      isFallbackAuthorized: true,
      notes: 'Emulador seguro para fallback offline, testes sintéticos e garantia de continuidade.'
    }
  ];

  const initialAiRoutingRules: AiTaskRoutingRule[] = [
    {
      taskCategory: 'CORE_STRATEGY',
      preferredProvider: 'gemini',
      fallbackProvider: 'mock_sandbox',
      maxTokens: 2048,
      temperature: 0.2,
      authorizedByMaster: true
    },
    {
      taskCategory: 'SALES_INTELLIGENCE',
      preferredProvider: 'gemini',
      fallbackProvider: 'mock_sandbox',
      maxTokens: 2048,
      temperature: 0.3,
      authorizedByMaster: true
    },
    {
      taskCategory: 'CUSTOMER_SUPPORT',
      preferredProvider: 'gemini',
      fallbackProvider: 'mock_sandbox',
      maxTokens: 1024,
      temperature: 0.4,
      authorizedByMaster: true
    },
    {
      taskCategory: 'CODE_DEVELOPMENT',
      preferredProvider: 'gemini',
      fallbackProvider: 'mock_sandbox',
      maxTokens: 4096,
      temperature: 0.1,
      authorizedByMaster: true
    },
    {
      taskCategory: 'CREATIVE_CAMPAIGNS',
      preferredProvider: 'gemini',
      fallbackProvider: 'mock_sandbox',
      maxTokens: 3000,
      temperature: 0.7,
      authorizedByMaster: true
    },
    {
      taskCategory: 'EXECUTIVE_BRIEFING',
      preferredProvider: 'gemini',
      fallbackProvider: 'mock_sandbox',
      maxTokens: 2500,
      temperature: 0.2,
      authorizedByMaster: true
    }
  ];

  const initialEnterpriseIntegrations: EnterpriseIntegration[] = [
    {
      id: 'int_gemini_primary',
      provider: 'Google Cloud Platform',
      productName: 'Gemini 3.8 Flash & Pro Living Neural Core',
      departmentId: 'AYIN_INTELLIGENCE',
      category: 'AI_GATEWAY',
      purpose: 'Cérebro central, orquestração de missões e desdobramento tático dos 11 agentes.',
      status: 'ACTIVE',
      apiAvailability: 'ONLINE',
      authStatus: 'VERIFIED',
      estimatedMonthlyCostBrl: 180.00,
      actualBilledCostBrl: 38.40,
      usageVolumeCalls: 412,
      lastSuccessfulTest: new Date().toISOString(),
      permissionsRequired: ['generateContent', 'embeddings', 'multimodal'],
      isMasterApproved: true,
      monthlyBudgetCpmBrl: 500,
      dailyLimitCalls: 5000,
      latencyMs: 280,
      maskedApiKey: 'AIzaSy********************'
    },
    {
      id: 'int_openai_gateway',
      provider: 'OpenAI Enterprise',
      productName: 'OpenAI API Gateway (GPT-4o / o3-mini)',
      departmentId: 'AYIN_AGENTS',
      category: 'AI_GATEWAY',
      purpose: 'Gateway de contingência e benchmark analítico comparativo.',
      status: 'AVAILABLE',
      apiAvailability: 'STANDBY',
      authStatus: 'PENDING_KEYS',
      estimatedMonthlyCostBrl: 350.00,
      actualBilledCostBrl: 0.00,
      usageVolumeCalls: 0,
      lastSuccessfulTest: '2026-10-25T14:00:00Z',
      permissionsRequired: ['chat.completions', 'embeddings'],
      isMasterApproved: false,
      monthlyBudgetCpmBrl: 800,
      dailyLimitCalls: 1000,
      latencyMs: 0
    },
    {
      id: 'int_bedrock_agentcore',
      provider: 'Amazon Web Services',
      productName: 'AWS Bedrock AgentCore & Claude 3.5',
      departmentId: 'AYIN_AGENTS',
      category: 'AI_GATEWAY',
      purpose: 'Orquestração avançada em grafo multi-agentes e análise de conformidade de código.',
      status: 'AVAILABLE',
      apiAvailability: 'STANDBY',
      authStatus: 'PENDING_KEYS',
      estimatedMonthlyCostBrl: 420.00,
      actualBilledCostBrl: 0.00,
      usageVolumeCalls: 0,
      lastSuccessfulTest: '2026-10-20T10:00:00Z',
      permissionsRequired: ['bedrock:InvokeModel', 'bedrock:InvokeAgent'],
      isMasterApproved: false,
      monthlyBudgetCpmBrl: 1000,
      dailyLimitCalls: 1000,
      latencyMs: 0
    },
    {
      id: 'int_nova_enterprise',
      provider: 'Amazon Web Services',
      productName: 'Amazon Nova Multimodal Suite',
      departmentId: 'AYIN_RADAR',
      category: 'AI_GATEWAY',
      purpose: 'Análise massiva de documentos corporativos, balanços e prospecção de mercado.',
      status: 'AVAILABLE',
      apiAvailability: 'STANDBY',
      authStatus: 'PENDING_KEYS',
      estimatedMonthlyCostBrl: 150.00,
      actualBilledCostBrl: 0.00,
      usageVolumeCalls: 0,
      lastSuccessfulTest: '2026-10-18T16:00:00Z',
      permissionsRequired: ['bedrock:InvokeModel'],
      isMasterApproved: false,
      monthlyBudgetCpmBrl: 400,
      dailyLimitCalls: 2000,
      latencyMs: 0
    },
    {
      id: 'int_m365_productivity',
      provider: 'Microsoft Corporation',
      productName: 'Microsoft 365 & Copilot Studio Graph Connector',
      departmentId: 'AYIN_STRATEGY',
      category: 'PRODUCTIVITY',
      purpose: 'Sincronização corporativa de agenda executiva, minutas de reunião e documentos Office.',
      status: 'CONNECTED',
      apiAvailability: 'ONLINE',
      authStatus: 'VERIFIED',
      estimatedMonthlyCostBrl: 95.00,
      actualBilledCostBrl: 95.00,
      usageVolumeCalls: 124,
      lastSuccessfulTest: new Date().toISOString(),
      permissionsRequired: ['Calendars.ReadWrite', 'Files.ReadWrite.All', 'User.Read'],
      isMasterApproved: true,
      monthlyBudgetCpmBrl: 200,
      dailyLimitCalls: 1500,
      latencyMs: 145
    },
    {
      id: 'int_teams_webhook',
      provider: 'Microsoft Corporation',
      productName: 'Microsoft Teams Enterprise Bot & Channel Webhooks',
      departmentId: 'AYIN_CUSTOMER',
      category: 'COMMUNICATION',
      purpose: 'Notificações instantâneas de chamados urgentes, alertas de incidentes e despachos de agentes.',
      status: 'CONNECTED',
      apiAvailability: 'ONLINE',
      authStatus: 'VERIFIED',
      estimatedMonthlyCostBrl: 0.00,
      actualBilledCostBrl: 0.00,
      usageVolumeCalls: 89,
      lastSuccessfulTest: new Date().toISOString(),
      permissionsRequired: ['IncomingWebhook.Post'],
      isMasterApproved: true,
      monthlyBudgetCpmBrl: 100,
      dailyLimitCalls: 2000,
      latencyMs: 110
    },
    {
      id: 'int_business_email',
      provider: 'SHEFA Enterprise Mail',
      productName: 'Corporate SMTP / IMAP & Exchange Relay',
      departmentId: 'AYIN_SALES',
      category: 'COMMUNICATION',
      purpose: 'Envio formal de propostas comerciais aceitas, contratos e confirmações de pagamento Pix.',
      status: 'ACTIVE',
      apiAvailability: 'ONLINE',
      authStatus: 'VERIFIED',
      estimatedMonthlyCostBrl: 45.00,
      actualBilledCostBrl: 45.00,
      usageVolumeCalls: 218,
      lastSuccessfulTest: new Date().toISOString(),
      permissionsRequired: ['SMTP.Send', 'TLS.Encrypted'],
      isMasterApproved: true,
      monthlyBudgetCpmBrl: 150,
      dailyLimitCalls: 500,
      latencyMs: 85
    },
    {
      id: 'int_adobe_firefly',
      provider: 'Adobe Systems',
      productName: 'Adobe Firefly Creative Suite API',
      departmentId: 'AYIN_CREATIVE',
      category: 'CREATIVE',
      purpose: 'Geração de identidade visual, materiais de marketing institucional e criativos publicitários.',
      status: 'AVAILABLE',
      apiAvailability: 'STANDBY',
      authStatus: 'PENDING_KEYS',
      estimatedMonthlyCostBrl: 180.00,
      actualBilledCostBrl: 0.00,
      usageVolumeCalls: 0,
      lastSuccessfulTest: '2026-10-22T08:00:00Z',
      permissionsRequired: ['firefly:generate_images'],
      isMasterApproved: false,
      monthlyBudgetCpmBrl: 300,
      dailyLimitCalls: 500,
      latencyMs: 0
    },
    {
      id: 'int_midjourney_proxy',
      provider: 'Midjourney Labs',
      productName: 'Midjourney Creative Variation Pipeline',
      departmentId: 'AYIN_CREATIVE',
      category: 'CREATIVE',
      purpose: 'Produção de imagens conceituais de alta fidelidade e variações publicitárias A/B.',
      status: 'AVAILABLE',
      apiAvailability: 'STANDBY',
      authStatus: 'PENDING_KEYS',
      estimatedMonthlyCostBrl: 120.00,
      actualBilledCostBrl: 0.00,
      usageVolumeCalls: 0,
      lastSuccessfulTest: '2026-10-21T18:00:00Z',
      permissionsRequired: ['midjourney:generate'],
      isMasterApproved: false,
      monthlyBudgetCpmBrl: 250,
      dailyLimitCalls: 300,
      latencyMs: 0
    },
    {
      id: 'int_erp_connector',
      provider: 'SAP / TOTVS / ContaAzul Adapter',
      productName: 'Universal Enterprise ERP Bridge',
      departmentId: 'AYIN_FINANCE',
      category: 'ERP_FINANCE',
      purpose: 'Validação automática de faturamento corporativo, notas fiscais eletrônicas e centros de custo.',
      status: 'CONNECTED',
      apiAvailability: 'ONLINE',
      authStatus: 'VERIFIED',
      estimatedMonthlyCostBrl: 110.00,
      actualBilledCostBrl: 40.00,
      usageVolumeCalls: 67,
      lastSuccessfulTest: new Date().toISOString(),
      permissionsRequired: ['invoice:create', 'financial:reconcile'],
      isMasterApproved: true,
      monthlyBudgetCpmBrl: 300,
      dailyLimitCalls: 1000,
      latencyMs: 195
    },
    {
      id: 'int_pix_central_bank',
      provider: 'Banco Central do Brasil / SPI',
      productName: 'PIX Direct EMV Engine & Webhook HMAC Reconciler',
      departmentId: 'AYIN_FINANCE',
      category: 'ERP_FINANCE',
      purpose: 'Geração de cobrança instantânea com chave 11973479473 e liquidação em tempo real.',
      status: 'ACTIVE',
      apiAvailability: 'ONLINE',
      authStatus: 'VERIFIED',
      estimatedMonthlyCostBrl: 0.00,
      actualBilledCostBrl: 0.00,
      usageVolumeCalls: 48,
      lastSuccessfulTest: new Date().toISOString(),
      permissionsRequired: ['pix:read', 'pix:write', 'webhook:validate_hmac'],
      isMasterApproved: true,
      monthlyBudgetCpmBrl: 100,
      dailyLimitCalls: 10000,
      latencyMs: 65
    },
    {
      id: 'int_neo4j_graph',
      provider: 'Neo4j Inc.',
      productName: 'Neo4j Aura Enterprise Graph DB (Evaluation)',
      departmentId: 'AYIN_INTELLIGENCE',
      category: 'DATA_GRAPH',
      purpose: 'Mapeamento de relações complexas entre clientes, agentes e histórico de interações.',
      status: 'AVAILABLE',
      apiAvailability: 'STANDBY',
      authStatus: 'VERIFIED',
      estimatedMonthlyCostBrl: 320.00,
      actualBilledCostBrl: 0.00,
      usageVolumeCalls: 0,
      lastSuccessfulTest: '2026-10-30T12:00:00Z',
      permissionsRequired: ['neo4j:bolt', 'cypher:read_write'],
      isMasterApproved: false,
      monthlyBudgetCpmBrl: 500,
      dailyLimitCalls: 5000,
      latencyMs: 0
    },
    {
      id: 'int_gcp_cloudrun',
      provider: 'Google Cloud Platform',
      productName: 'Cloud Run Enterprise Serverless & Edge Engine',
      departmentId: 'AYIN_INTELLIGENCE',
      category: 'INFRASTRUCTURE',
      purpose: 'Hospedagem segura de microsserviços, execução contínua de tarefas em background e failover.',
      status: 'ACTIVE',
      apiAvailability: 'ONLINE',
      authStatus: 'VERIFIED',
      estimatedMonthlyCostBrl: 210.00,
      actualBilledCostBrl: 95.00,
      usageVolumeCalls: 18420,
      lastSuccessfulTest: new Date().toISOString(),
      permissionsRequired: ['run.services.get', 'storage.buckets.get'],
      isMasterApproved: true,
      monthlyBudgetCpmBrl: 500,
      dailyLimitCalls: 50000,
      latencyMs: 42
    }
  ];

  const initialRefundRequests: CustomerRefundRequest[] = [
    {
      id: 'refund_req_001',
      ticketId: 'ticket_001',
      companyId: 'comp_vertice_tech',
      companyName: 'Vértice Tech Global',
      customerEmail: 'contato@verticecorp.com.br',
      orderOrSubscriptionId: 'sub_vertice_001',
      amount: 497.00,
      reason: 'Compensação proporcional de crédito da transição do plano Cosmic para Infinity Enterprise.',
      status: 'PENDING_MASTER_APPROVAL',
      createdAt: '2026-11-02T08:00:00Z',
      notes: 'Exige soberania expressa do Master Owner para reversão bancária via Pix.'
    }
  ];

  const initialOpportunityScores: SalesOpportunityScore[] = [
    {
      leadId: 'lead_001',
      companyName: 'Inova Varejo Digital',
      score: 88,
      intent: 'READY_TO_BUY',
      buyingSignals: [
        'Visualizou proposta do plano Cosmic Growth 4 vezes em 24h',
        'Perguntou sobre prazos de implantação do AYIN CUSTOMER',
        'Diretoria executiva presente no canal de atendimento'
      ],
      painPoints: ['Gargalo no atendimento via WhatsApp nos fins de semana', 'Perda de 25% de carrinhos por lentidão de resposta'],
      competitorMentions: ['Blip', 'Zendesk'],
      recommendedNextAction: 'Enviar convite executivo para fechamento anual com condição de implantação em 72h.',
      recommendedChannel: 'WHATSAPP',
      recommendedDate: '2026-11-03T10:00:00Z',
      coachingNotes: 'Focar na velocidade de resposta de 800ms dos 11 agentes autônomos.',
      isStaleRisk: false,
      estimatedDealValue: 4970,
      calculatedAt: new Date().toISOString()
    },
    {
      leadId: 'lead_002',
      companyName: 'Grupo Hospitalar San Raphael',
      score: 95,
      intent: 'TECHNICAL_VALIDATION',
      buyingSignals: [
        'Solicitou minuta de contrato de confidencialidade e DPA LGPD',
        'Interesse na blindagem e soberania do Master Owner',
        'Orçamento anual aprovado pela governança clínica'
      ],
      painPoints: ['Necessidade de isolamento estrito de dados sensíveis de pacientes', 'SLA de resposta médica ininterrupta 24/7'],
      competitorMentions: ['IBM Watson Health'],
      recommendedNextAction: 'Apresentar dossier técnico de soberania criptográfica e agendar alinhamento com Master Owner.',
      recommendedChannel: 'EXECUTIVE_MEETING',
      recommendedDate: '2026-11-03T15:00:00Z',
      coachingNotes: 'Destacar que nenhum dado hospitalar é compartilhado entre instâncias ou usado para retreino público.',
      isStaleRisk: false,
      estimatedDealValue: 14970,
      calculatedAt: new Date().toISOString()
    },
    {
      leadId: 'lead_003',
      companyName: 'Nexus Logística Internacional',
      score: 72,
      intent: 'PRICE_SENSITIVE',
      buyingSignals: [
        'Aprovou a capacidade de rastreamento de frotas e automação de alertas',
        'Pediu simulação de parcelamento ou desconto para pagamento via Pix'
      ],
      painPoints: ['Custos elevados de combustíveis exigem redução drástica em SAC'],
      competitorMentions: ['Salesforce'],
      recommendedNextAction: 'Emitir proposta formal via Pix com desconto de 10% para pagamento à vista.',
      recommendedChannel: 'EMAIL',
      recommendedDate: '2026-11-02T16:00:00Z',
      coachingNotes: 'Alerta de estagnação: Sem contato há 4 dias. Reativar o prospect com simulação de economia líquida.',
      isStaleRisk: true,
      estimatedDealValue: 1970,
      calculatedAt: new Date().toISOString()
    }
  ];

  const initialCloudComparison: CloudInfrastructureComparison = {
    currentHosting: {
      provider: 'GOOGLE_CLOUD_RUN',
      region: 'us-east1',
      status: 'ACTIVE_HEALTHY',
      monthlyCostBrl: 210.00,
      containerSpecs: '2 vCPU, 4GB RAM, Autoscaling 0-10 containers, Edge CDN ativa',
      rtoMinutes: 10,
      rpoMinutes: 30,
      benefits: [
        'Latência ultra-baixa com API Gemini nativa',
        'Scale-to-zero com custo zero em períodos ociosos',
        'Deploy atômico sem downtime',
        'SSL gerenciado e proteção contra DDoS integrada'
      ]
    },
    awsAlternative: {
      provider: 'AWS_ECS_FARGATE_BEDROCK',
      region: 'sa-east-1 (São Paulo)',
      status: 'EVALUATED_READY_TO_PROVISION',
      monthlyCostBrl: 540.00,
      containerSpecs: 'Fargate 2 vCPU, 4GB RAM + S3 Glacier + Bedrock Endpoint dedicado',
      rtoMinutes: 15,
      rpoMinutes: 45,
      benefits: [
        'Residência dos dados no território brasileiro (São Paulo)',
        'Acesso direto ao ecossistema AWS Bedrock AgentCore',
        'Integração nativa com Amazon Nova e VPC corporativa'
      ]
    },
    neo4jEvaluation: {
      product: 'Neo4j Aura Enterprise Graph DB',
      status: 'EVALUATION_DOCUMENTED',
      monthlyCostBrl: 320.00,
      recommendation: 'MANTER_JSON_UNIFICADO_ATE_100K_NODES',
      justification: 'O banco de dados relacional e unificado SHEFA em JSON indexado com commit atômico atende com latência inferior a 5ms para as volumetrias atuais. Recomenda-se provisionar Neo4j apenas quando o grafo corporativo ultrapassar 100.000 nós de interconexão entre agentes e clientes.',
      graphSchemaPreview: {
        nodes: ['(:Company)', '(:AutonomousAgent)', '(:ServiceContract)', '(:Lead)', '(:PixCharge)', '(:SupportTicket)'],
        relationships: [
          '(:Company)-[:SUBSCRIBES_TO]->(:Plan)',
          '(:Company)-[:OWNS_LEAD]->(:Lead)',
          '(:AutonomousAgent)-[:EXECUTES_FOR]->(:Company)',
          '(:AutonomousAgent)-[:COLLABORATES_WITH]->(:AutonomousAgent)',
          '(:Lead)-[:CONVERTS_INTO]->(:ServiceContract)',
          '(:ServiceContract)-[:PAID_VIA]->(:PixCharge)'
        ]
      }
    },
    disasterRecovery: {
      lastBackupTimestamp: new Date().toISOString(),
      backupLocation: '/data/shefa_db.backup.json',
      backupIntegrityCheck: 'PASSED',
      automatedSnapshotIntervalHours: 6
    },
    isMigrationApprovedByMaster: false
  };

  const initialTechGovernance: TechCostGovernance = {
    monthlyBudgetCapBrl: 2500.00,
    totalSpentThisMonthBrl: 218.40,
    spentPercent: 8.74,
    isAutoPaused: false,
    dailyUsageLimitCalls: 5000,
    currentDayCalls: 382,
    alerts: [
      'Orçamento de IA e infraestrutura em 8.74% do limite mensal estipulado (R$ 2.500,00).',
      'Todos os provedores secundários (OpenAI, Bedrock, Nova) mantidos em standby sob controle Master Owner.'
    ],
    providerBreakdown: [
      { providerId: 'gemini', providerName: 'Google Gemini', spentBrl: 38.40, calls: 412, tokens: 198400 },
      { providerId: 'openai', providerName: 'OpenAI Gateway', spentBrl: 0.00, calls: 0, tokens: 0 },
      { providerId: 'bedrock', providerName: 'AWS Bedrock', spentBrl: 0.00, calls: 0, tokens: 0 },
      { providerId: 'nova', providerName: 'Amazon Nova', spentBrl: 0.00, calls: 0, tokens: 0 },
      { providerId: 'mock_sandbox', providerName: 'AYIN Sandbox', spentBrl: 0.00, calls: 156, tokens: 85200 }
    ]
  };

  return {
    users: [masterUser, clientUser, clientUser2],
    companies,
    agents,
    missions,
    knowledge,
    leads,
    products,
    orders,
    subscriptions,
    plans: INITIAL_PLANS,
    enterpriseServices: INITIAL_SERVICES,
    serviceContracts: INITIAL_SERVICE_CONTRACTS,
    flagshipProducts: INITIAL_FLAGSHIP_PRODUCTS,
    proposals: INITIAL_PROPOSALS,
    partners: INITIAL_PARTNERS,
    pixCharges,
    commissions,
    governance,
    finances,
    auditLogs: [genesisLog],
    projects: initialProjects,
    supportTickets: initialSupportTickets,
    agentInteractions: initialInteractions,
    aiProviders: initialAiProviders,
    aiRoutingRules: initialAiRoutingRules,
    enterpriseIntegrations: initialEnterpriseIntegrations,
    customerRefunds: initialRefundRequests,
    salesOpportunityScores: initialOpportunityScores,
    cloudComparison: initialCloudComparison,
    techGovernance: initialTechGovernance,
    sessions: []
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        const initial = getInitialData();
        
        // Backward-compatible schema evolution: ensure new collections exist
        this.data = {
          users: parsed.users || initial.users,
          companies: parsed.companies || initial.companies,
          agents: parsed.agents && parsed.agents.length >= 11 ? parsed.agents : initial.agents,
          missions: parsed.missions || initial.missions,
          knowledge: parsed.knowledge || initial.knowledge,
          leads: parsed.leads && parsed.leads.length ? parsed.leads : initial.leads,
          products: parsed.products || initial.products,
          orders: parsed.orders || initial.orders,
          subscriptions: parsed.subscriptions || initial.subscriptions,
          plans: INITIAL_PLANS, // Ensure latest official pricing (197, 497, 1497)
          enterpriseServices: parsed.enterpriseServices && parsed.enterpriseServices.length ? parsed.enterpriseServices : initial.enterpriseServices,
          serviceContracts: parsed.serviceContracts && parsed.serviceContracts.length ? parsed.serviceContracts : initial.serviceContracts,
          flagshipProducts: parsed.flagshipProducts && parsed.flagshipProducts.length ? parsed.flagshipProducts : initial.flagshipProducts,
          proposals: parsed.proposals && parsed.proposals.length ? parsed.proposals : initial.proposals,
          partners: parsed.partners && parsed.partners.length ? parsed.partners : initial.partners,
          pixCharges: parsed.pixCharges || initial.pixCharges,
          commissions: parsed.commissions || initial.commissions,
          governance: parsed.governance || initial.governance,
          finances: parsed.finances || initial.finances,
          auditLogs: parsed.auditLogs || initial.auditLogs,
          projects: parsed.projects && parsed.projects.length ? parsed.projects : initial.projects,
          supportTickets: parsed.supportTickets && parsed.supportTickets.length ? parsed.supportTickets : initial.supportTickets,
          agentInteractions: parsed.agentInteractions && parsed.agentInteractions.length ? parsed.agentInteractions : initial.agentInteractions,
          aiProviders: parsed.aiProviders && parsed.aiProviders.length ? parsed.aiProviders : initial.aiProviders,
          aiRoutingRules: parsed.aiRoutingRules && parsed.aiRoutingRules.length ? parsed.aiRoutingRules : initial.aiRoutingRules,
          enterpriseIntegrations: parsed.enterpriseIntegrations && parsed.enterpriseIntegrations.length ? parsed.enterpriseIntegrations : initial.enterpriseIntegrations,
          customerRefunds: parsed.customerRefunds && parsed.customerRefunds.length ? parsed.customerRefunds : initial.customerRefunds,
          salesOpportunityScores: parsed.salesOpportunityScores && parsed.salesOpportunityScores.length ? parsed.salesOpportunityScores : initial.salesOpportunityScores,
          cloudComparison: parsed.cloudComparison || initial.cloudComparison,
          techGovernance: parsed.techGovernance || initial.techGovernance,
          sessions: parsed.sessions || []
        };

        // Ensure Master Owner exists with Alifermadeiro@hotmail.com
        const masterExists = this.data.users.find(u => u.email.toLowerCase() === 'alifermadeiro@hotmail.com');
        if (!masterExists) {
          const masterAuth = hashPassword('ShefaAyin2026!');
          this.data.users.push({
            id: 'user_master_owner',
            email: 'Alifermadeiro@hotmail.com',
            name: 'Alifer Madeiro (Master Owner)',
            role: 'MASTER_OWNER',
            passwordHash: masterAuth.hash,
            salt: masterAuth.salt,
            createdAt: new Date().toISOString()
          });
        }
        this.save();
      } catch (err) {
        console.error('Failed reading DB file, reinitializing:', err);
        this.data = getInitialData();
        this.save();
      }
    } else {
      this.data = getInitialData();
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed saving database:', err);
    }
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  public commit() {
    this.save();
  }

  public logAudit(actorEmail: string, actorRole: 'MASTER_OWNER' | 'COMPANY_ADMIN' | 'OPERATOR', action: string, companyId: string, details: string): AuditLog {
    const lastLog = this.data.auditLogs[this.data.auditLogs.length - 1];
    const prevHash = lastLog ? lastLog.hash : '00000000000000000000000000000000';
    const timestamp = new Date().toISOString();
    
    const hash = crypto.createHash('sha256')
      .update(`${prevHash}:${timestamp}:${actorEmail}:${action}:${companyId}:${details}`)
      .digest('hex');

    const log: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp,
      actorEmail,
      actorRole,
      action,
      companyId,
      details,
      hash
    };

    this.data.auditLogs.push(log);
    this.save();
    return log;
  }
}

export const db = new Database();
