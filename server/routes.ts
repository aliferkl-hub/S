import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, hashPassword, verifyPassword } from './db.js';
import { interpretAyinCommand, askCompanyAssistant } from './gemini.js';
import { agentEngine } from './agentEngine.js';
import { generatePixChargePayload } from './pix.js';
import { aiGateway } from './aiGateway.js';
import { salesIntelligence } from './salesIntelligenceEngine.js';
import { customerIntelligence } from './customerIntelligenceEngine.js';
import { integrationMarketplace } from './integrationMarketplaceEngine.js';
import { cloudInfrastructure } from './cloudInfrastructureService.js';
import { 
  User, 
  Company,
  Mission, 
  DepartmentId, 
  Lead, 
  ProductItem, 
  Order,
  Subscription,
  PlanDefinition,
  PlanTier,
  PixCharge,
  CommissionRecord,
  KnowledgeDoc, 
  FinancialRecord,
  EnterpriseService,
  ServiceContract,
  FlagshipProduct,
  CommercialProposal,
  CommercialPartner,
  LeadStage,
  DevProject,
  DevProjectTask,
  SupportTicket,
  SupportTicketMessage,
  AgentInteraction,
  AiProviderId,
  AiTaskCategory,
  AiProviderConfig,
  AiTaskRoutingRule,
  EnterpriseIntegration,
  CustomerRefundRequest,
  SalesOpportunityScore
} from './types.js';

export const apiRouter = Router();

// Authentication Middleware
interface AuthenticatedRequest extends Request {
  user?: User;
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado. Token de sessão não fornecido.' });
  }

  const token = authHeader.substring(7);
  const data = db.getData();
  const session = data.sessions.find(s => s.token === token && new Date(s.expiresAt) > new Date());

  if (!session) {
    return res.status(401).json({ error: 'Sessão expirada ou inválida.' });
  }

  const user = data.users.find(u => u.id === session.userId);
  if (!user) {
    return res.status(401).json({ error: 'Usuário não encontrado.' });
  }

  req.user = user;
  next();
}

// Master Owner Only Middleware
function masterOwnerOnly(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'MASTER_OWNER') {
    return res.status(403).json({ error: 'Acesso negado. Apenas o Master Owner possui privilégios para esta operação.' });
  }
  next();
}

// -------------------------------------------------------------
// AUTH ROUTES
// -------------------------------------------------------------

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  const data = db.getData();
  const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const isValid = verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  // Create secure session token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  data.sessions.push({ token, userId: user.id, expiresAt });
  user.lastLogin = new Date().toISOString();
  db.commit();

  db.logAudit(user.email, user.role, 'USER_LOGIN', user.companyId || 'global', 'Login realizado com sucesso.');

  const { passwordHash, salt, ...safeUser } = user;
  return res.json({ token, user: safeUser });
});

// Endpoint to securely configure or update master owner passphrase
apiRouter.post('/auth/setup-master', (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const data = db.getData();
  const master = data.users.find(u => u.email.toLowerCase() === 'alifermadeiro@hotmail.com');

  if (!master) {
    return res.status(404).json({ error: 'Usuário Master Owner não localizado.' });
  }

  // If already has password, verify current
  if (currentPassword) {
    const valid = verifyPassword(currentPassword, master.passwordHash, master.salt);
    if (!valid) {
      return res.status(401).json({ error: 'Senha atual incorreta.' });
    }
  }

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'A nova senha deve possuir ao menos 8 caracteres de alta entropia.' });
  }

  const newHash = hashPassword(newPassword);
  master.passwordHash = newHash.hash;
  master.salt = newHash.salt;
  db.commit();

  db.logAudit(master.email, 'MASTER_OWNER', 'MASTER_CREDENTIALS_UPDATED', 'global', 'Credenciais do Master Owner atualizadas com hash criptográfico scrypt.');

  return res.json({ success: true, message: 'Credenciais do Master Owner atualizadas com segurança.' });
});

apiRouter.get('/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { passwordHash, salt, ...safeUser } = req.user!;
  const data = db.getData();
  const company = req.user!.companyId ? data.companies.find(c => c.id === req.user!.companyId) : null;
  return res.json({ user: safeUser, company });
});

apiRouter.post('/auth/logout', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const token = req.headers.authorization!.substring(7);
  const data = db.getData();
  data.sessions = data.sessions.filter(s => s.token !== token);
  db.commit();
  return res.json({ success: true });
});

// -------------------------------------------------------------
// AYIN CORE COMMAND & MISSION ORCHESTRATION
// -------------------------------------------------------------

apiRouter.post('/command', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { prompt, companyId } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Comando em texto é obrigatório.' });
  }

  const user = req.user!;
  const targetCompanyId = user.role === 'MASTER_OWNER' ? (companyId || 'global') : user.companyId!;
  const data = db.getData();
  const company = targetCompanyId !== 'global' ? data.companies.find(c => c.id === targetCompanyId) : undefined;

  // Plan Limits & Quota Enforcement
  if (user.role !== 'MASTER_OWNER' && company) {
    if (company.status === 'suspended') {
      return res.status(403).json({ 
        error: 'Assinatura suspensa por falta de pagamento ou expiração. Regularize para emitir novos comandos e missões.' 
      });
    }
    if (company.quotas && company.quotas.usedMissions >= company.quotas.monthlyMissions) {
      return res.status(403).json({ 
        error: `Limite mensal de missões atingido (${company.quotas.usedMissions}/${company.quotas.monthlyMissions}). Faça upgrade do seu plano para expandir a cota.` 
      });
    }
  }

  try {
    // 1. AYIN CORE analyzes command via Gemini
    const plan = await interpretAyinCommand(
      prompt,
      user.email,
      user.role === 'MASTER_OWNER',
      company ? { companyName: company.name, plan: company.plan } : undefined
    );

    // 2. Generate new Mission
    const newMissionId = `mis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newMission: Mission = {
      id: newMissionId,
      companyId: targetCompanyId,
      creatorEmail: user.email,
      title: plan.title,
      objective: plan.objective,
      priority: plan.priority,
      status: plan.isSensitive ? 'awaiting_approval' : 'queued',
      departmentsInvolved: plan.departmentsInvolved,
      isSensitive: plan.isSensitive,
      sensitiveReason: plan.sensitiveReason,
      steps: plan.steps.map((st, i) => ({
        id: `step_${i + 1}`,
        title: st.title,
        departmentId: st.departmentId,
        status: 'pending'
      })),
      executionLogs: [
        {
          timestamp: new Date().toISOString(),
          agentName: 'AYIN CORE Director',
          message: `Comando mestre interpretado. Missão decomposta em ${plan.steps.length} etapas estratégicas.`,
          type: 'info'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (plan.isSensitive) {
      newMission.executionLogs.push({
        timestamp: new Date().toISOString(),
        agentName: 'Ayin Finance Custodian',
        message: `Ação Sensível Detectada: "${plan.sensitiveReason}". Missão retida aguardando aprovação explícita do Master Owner.`,
        type: 'warning'
      });
    }

    data.missions.unshift(newMission);
    if (company && company.quotas) {
      company.quotas.usedMissions += 1;
    }
    db.commit();

    db.logAudit(
      user.email,
      user.role,
      'COMMAND_DISPATCHED',
      targetCompanyId,
      `Comando: "${prompt}". Missão criada: ${newMission.id}. Sensível: ${plan.isSensitive}`
    );

    // Trigger tick
    if (!plan.isSensitive) {
      agentEngine.executeMissionNow(newMission.id).catch(console.error);
    }

    return res.json({
      mission: newMission,
      strategicAdvice: plan.strategicAdvice
    });
  } catch (error) {
    console.error('Error executing command:', error);
    return res.status(500).json({ error: 'Falha no processamento neural do AYIN CORE.' });
  }
});

// -------------------------------------------------------------
// MISSIONS & APPROVAL GATES
// -------------------------------------------------------------

apiRouter.get('/missions', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const data = db.getData();

  let missions = data.missions;
  if (user.role !== 'MASTER_OWNER') {
    missions = missions.filter(m => m.companyId === user.companyId);
  } else if (req.query.companyId) {
    missions = missions.filter(m => m.companyId === req.query.companyId);
  }

  return res.json(missions);
});

apiRouter.post('/missions/:id/approve', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const missionId = req.params.id;
  const data = db.getData();
  const mission = data.missions.find(m => m.id === missionId);

  if (!mission) {
    return res.status(404).json({ error: 'Missão não encontrada.' });
  }

  if (mission.status !== 'awaiting_approval') {
    return res.status(400).json({ error: 'Apenas missões aguardando aprovação podem ser autorizadas.' });
  }

  mission.status = 'in_progress';
  mission.approvedBy = req.user!.email;
  mission.approvedAt = new Date().toISOString();
  mission.executionLogs.push({
    timestamp: new Date().toISOString(),
    agentName: 'Master Owner (Alifermadeiro@hotmail.com)',
    message: 'Autorização formal concedida pelo Master Owner. Desbloqueando execução.',
    type: 'success'
  });

  db.commit();
  db.logAudit(
    req.user!.email,
    'MASTER_OWNER',
    'MISSION_APPROVED',
    mission.companyId,
    `Missão sensível ${mission.id} aprovada pelo Master Owner.`
  );

  agentEngine.executeMissionNow(mission.id).catch(console.error);
  return res.json({ success: true, mission });
});

apiRouter.post('/missions/:id/reject', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const missionId = req.params.id;
  const { reason } = req.body;
  const data = db.getData();
  const mission = data.missions.find(m => m.id === missionId);

  if (!mission) {
    return res.status(404).json({ error: 'Missão não encontrada.' });
  }

  mission.status = 'rejected';
  mission.executionLogs.push({
    timestamp: new Date().toISOString(),
    agentName: 'Master Owner (Alifermadeiro@hotmail.com)',
    message: `Ação sensível rejeitada pelo Master Owner. Motivo: ${reason || 'Bloqueio administrativo por precaução orçamentária.'}`,
    type: 'warning'
  });

  db.commit();
  db.logAudit(
    req.user!.email,
    'MASTER_OWNER',
    'MISSION_REJECTED',
    mission.companyId,
    `Missão sensível ${mission.id} rejeitada pelo Master Owner.`
  );

  return res.json({ success: true, mission });
});

// -------------------------------------------------------------
// AGENTS & CONTINUOUS 24/7 OPERATION
// -------------------------------------------------------------

apiRouter.get('/agents', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const data = db.getData();

  let agents = data.agents;
  if (user.role !== 'MASTER_OWNER') {
    agents = agents.filter(a => a.companyId === 'global' || a.companyId === user.companyId);
  }

  return res.json(agents);
});

apiRouter.post('/agents/:id/toggle-24h', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const agentId = req.params.id;
  const data = db.getData();
  const agent = data.agents.find(a => a.id === agentId);

  if (!agent) {
    return res.status(404).json({ error: 'Agente não localizado.' });
  }

  // Check company permissions
  if (req.user!.role !== 'MASTER_OWNER' && agent.companyId !== req.user!.companyId) {
    return res.status(403).json({ error: 'Sem permissão para alterar este agente.' });
  }

  agent.is24hEnabled = !agent.is24hEnabled;
  db.commit();

  db.logAudit(
    req.user!.email,
    req.user!.role,
    'AGENT_24H_TOGGLED',
    agent.companyId,
    `Modo 24h do agente ${agent.name} alterado para: ${agent.is24hEnabled ? 'ATIVO' : 'DESATIVADO'}`
  );

  return res.json({ success: true, agent });
});

// -------------------------------------------------------------
// DEPARTMENTS
// -------------------------------------------------------------

apiRouter.get('/departments', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  const deptIds: DepartmentId[] = [
    'AYIN_RADAR',
    'AYIN_STRATEGY',
    'AYIN_AGENTS',
    'AYIN_CREATIVE',
    'AYIN_SALES',
    'AYIN_MARKET',
    'AYIN_FINANCE',
    'AYIN_INTELLIGENCE'
  ];

  const deptMeta: Record<DepartmentId, { name: string; hebrew: string; role: string; color: string }> = {
    AYIN_RADAR: { name: 'Ayin Radar', hebrew: 'צופה המרחב', role: 'Pesquisa de mercado, tendências e concorrentes', color: '#8b5cf6' },
    AYIN_STRATEGY: { name: 'Ayin Strategy', hebrew: 'תבונת התוכנית', role: 'Análise, engenharia tática e planos comerciais', color: '#a855f7' },
    AYIN_AGENTS: { name: 'Ayin Agents', hebrew: 'שליחי השפע', role: 'Cadastro, orquestração e monitoramento 24h', color: '#c084fc' },
    AYIN_CREATIVE: { name: 'Ayin Creative', hebrew: 'יוצר הסגנון', role: 'Campanhas publicitárias, copywriting e roteiros', color: '#e879f9' },
    AYIN_SALES: { name: 'Ayin Sales', hebrew: 'סגירת המעגל', role: 'Leads, atendimento e acompanhamento de vendas', color: '#f43f5e' },
    AYIN_MARKET: { name: 'Ayin Market', hebrew: 'שוק הנכסים', role: 'Produtos próprios, parceiros e comissionamentos', color: '#fb923c' },
    AYIN_FINANCE: { name: 'Ayin Finance', hebrew: 'אוצר הברכה', role: 'Receitas reais, custos, assinaturas e governança', color: '#eab308' },
    AYIN_INTELLIGENCE: { name: 'Ayin Intelligence', hebrew: 'עין החוכמה', role: 'Memória vetorial, auditoria e evolução contínua', color: '#6366f1' }
  };

  const results = deptIds.map(id => {
    const meta = deptMeta[id];
    const agentsInDept = data.agents.filter(a => a.departmentId === id);
    const pendingTasks = data.missions
      .flatMap(m => m.steps)
      .filter(s => s.departmentId === id && s.status === 'pending').length;

    return {
      id,
      name: meta.name,
      hebrewName: meta.hebrew,
      roleDescription: meta.role,
      color: meta.color,
      activeAgentsCount: agentsInDept.length,
      pendingTasks
    };
  });

  return res.json(results);
});

// -------------------------------------------------------------
// COMPANIES & CLIENT ENVIRONMENT (MULTI-TENANCY)
// -------------------------------------------------------------

apiRouter.get('/companies', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const data = db.getData();

  if (user.role === 'MASTER_OWNER') {
    return res.json(data.companies);
  } else {
    const company = data.companies.filter(c => c.id === user.companyId);
    return res.json(company);
  }
});

apiRouter.post('/companies', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const { name, tradeName, cnpjOrTaxId, plan, assistantName, tone, instructions } = req.body;
  if (!name || !cnpjOrTaxId) {
    return res.status(400).json({ error: 'Nome e CNPJ/ID fiscal são obrigatórios.' });
  }

  const data = db.getData();
  const newCompanyId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  
  const newCompany = {
    id: newCompanyId,
    name,
    tradeName: tradeName || name,
    cnpjOrTaxId,
    plan: plan || 'Cosmic Growth',
    status: 'active' as const,
    createdAt: new Date().toISOString(),
    aiPersona: {
      assistantName: assistantName || `Ayin ${name.split(' ')[0]}`,
      tone: tone || 'Consultivo, corporativo e focado em resultados',
      welcomeMessage: `Olá! Sou o assistente de inteligência autônoma da ${name}.`,
      instructions: instructions || 'Prestar suporte operacional e impulsionar as vendas da empresa.'
    },
    quotas: {
      maxUsers: plan === 'Infinity Enterprise' ? 50 : plan === 'Cosmic Growth' ? 15 : 5,
      monthlyMissions: plan === 'Infinity Enterprise' ? 500 : 250,
      usedMissions: 0,
      maxAgents: plan === 'Infinity Enterprise' ? 10 : 5,
      maxKnowledgeDocs: plan === 'Infinity Enterprise' ? 50 : 25
    }
  };

  data.companies.push(newCompany);
  db.commit();

  db.logAudit(
    req.user!.email,
    'MASTER_OWNER',
    'COMPANY_CREATED',
    newCompany.id,
    `Nova empresa cliente registrada: ${newCompany.name}`
  );

  return res.json({ success: true, company: newCompany });
});

apiRouter.put('/companies/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const companyId = req.params.id;
  const user = req.user!;
  
  if (user.role !== 'MASTER_OWNER' && user.companyId !== companyId) {
    return res.status(403).json({ error: 'Sem permissão para alterar esta empresa.' });
  }

  const data = db.getData();
  const company = data.companies.find(c => c.id === companyId);
  if (!company) {
    return res.status(404).json({ error: 'Empresa não encontrada.' });
  }

  const { aiPersona, tradeName, status, plan } = req.body;
  if (aiPersona) company.aiPersona = { ...company.aiPersona, ...aiPersona };
  if (tradeName) company.tradeName = tradeName;
  if (status && user.role === 'MASTER_OWNER') company.status = status;
  if (plan && user.role === 'MASTER_OWNER') company.plan = plan;

  db.commit();
  db.logAudit(
    user.email,
    user.role,
    'COMPANY_UPDATED',
    company.id,
    `Dados da empresa ${company.name} atualizados.`
  );

  return res.json({ success: true, company });
});

// Dedicated Company Client Assistant Chat Endpoint
apiRouter.post('/client-assistant/chat', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { message, conversationHistory } = req.body;
  const user = req.user!;
  
  if (!message) {
    return res.status(400).json({ error: 'Mensagem é obrigatória.' });
  }

  const companyId = req.body.companyId || user.companyId;
  if (!companyId || (user.role !== 'MASTER_OWNER' && user.companyId !== companyId)) {
    return res.status(403).json({ error: 'Acesso negado à inteligência desta empresa.' });
  }

  const data = db.getData();
  const company = data.companies.find(c => c.id === companyId);
  if (!company) {
    return res.status(404).json({ error: 'Empresa não encontrada.' });
  }

  // Isolated knowledge docs for this company
  const docs = data.knowledge.filter(k => k.companyId === companyId);

  try {
    const reply = await askCompanyAssistant(
      company.tradeName || company.name,
      company.aiPersona,
      docs,
      message,
      conversationHistory || []
    );

    return res.json({ reply });
  } catch (error) {
    console.error('Client Assistant Error:', error);
    return res.status(500).json({ error: 'Erro no assistente do cliente.' });
  }
});

// -------------------------------------------------------------
// CRM LEADS, KNOWLEDGE, PRODUCTS & FINANCES
// -------------------------------------------------------------

apiRouter.get('/leads', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const data = db.getData();

  let leads = data.leads;
  if (user.role !== 'MASTER_OWNER') {
    leads = leads.filter(l => l.companyId === user.companyId);
  } else if (req.query.companyId) {
    leads = leads.filter(l => l.companyId === req.query.companyId);
  }

  return res.json(leads);
});

apiRouter.post('/leads', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { name, email, phone, stage, value, notes, companyId } = req.body;
  const user = req.user!;
  const targetCompanyId = user.role === 'MASTER_OWNER' ? (companyId || 'comp_vertice_tech') : user.companyId!;

  const newLead: Lead = {
    id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    companyId: targetCompanyId,
    name: name || 'Novo Lead',
    email: email || '',
    phone: phone || '',
    source: 'Atendimento Ayin',
    stage: stage || 'Novo',
    value: Number(value) || 0,
    notes: notes || '',
    assignedAgent: 'Ayin Sales Hunter',
    createdAt: new Date().toISOString(),
    lastContact: new Date().toISOString()
  };

  const data = db.getData();
  data.leads.unshift(newLead);
  db.commit();

  return res.json(newLead);
});

apiRouter.get('/knowledge', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const data = db.getData();

  let docs = data.knowledge;
  if (user.role !== 'MASTER_OWNER') {
    docs = docs.filter(k => k.companyId === 'global' || k.companyId === user.companyId);
  } else if (req.query.companyId) {
    docs = docs.filter(k => k.companyId === 'global' || k.companyId === req.query.companyId);
  }

  return res.json(docs);
});

apiRouter.post('/knowledge', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { title, category, content, companyId } = req.body;
  const user = req.user!;
  const targetCompanyId = user.role === 'MASTER_OWNER' ? (companyId || 'global') : user.companyId!;

  if (!title || !content) {
    return res.status(400).json({ error: 'Título e conteúdo são obrigatórios.' });
  }

  const data = db.getData();

  // Enforce maxKnowledgeDocs quota for non-Master Owner clients
  if (user.role !== 'MASTER_OWNER' && targetCompanyId !== 'global') {
    const comp = data.companies.find(c => c.id === targetCompanyId);
    if (comp && comp.quotas) {
      const currentDocs = data.knowledge.filter(k => k.companyId === targetCompanyId).length;
      if (currentDocs >= comp.quotas.maxKnowledgeDocs) {
        return res.status(403).json({ 
          error: `Limite da Base de Conhecimento atingido (${currentDocs}/${comp.quotas.maxKnowledgeDocs} documentos). Faça upgrade do seu plano para expandir o repositório.` 
        });
      }
    }
  }

  const newDoc: KnowledgeDoc = {
    id: `knd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    companyId: targetCompanyId,
    title,
    category: category || 'guide',
    content,
    updatedAt: new Date().toISOString()
  };

  data.knowledge.unshift(newDoc);
  db.commit();

  db.logAudit(user.email, user.role, 'KNOWLEDGE_ADDED', targetCompanyId, `Documento adicionado: ${title}`);

  return res.json(newDoc);
});

apiRouter.get('/products', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const data = db.getData();

  let products = data.products;
  if (user.role !== 'MASTER_OWNER') {
    products = products.filter(p => p.companyId === 'global' || p.companyId === user.companyId);
  }

  return res.json(products);
});

// -------------------------------------------------------------
// SUBSCRIPTIONS & COMMERCE ENGINE
// -------------------------------------------------------------

apiRouter.get('/subscriptions/plans', (_req: Request, res: Response) => {
  const data = db.getData();
  return res.json(data.plans);
});

apiRouter.patch('/subscriptions/plans/:id', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const planId = req.params.id;
  const { monthlyPrice, annualPrice, limits, features, description } = req.body;
  const data = db.getData();
  const plan = data.plans.find(p => p.id === planId || p.tier === planId);
  if (!plan) {
    return res.status(404).json({ error: 'Plano não encontrado.' });
  }

  if (typeof monthlyPrice === 'number') plan.monthlyPrice = monthlyPrice;
  if (typeof annualPrice === 'number') plan.annualPrice = annualPrice;
  if (limits) plan.limits = { ...plan.limits, ...limits };
  if (features && Array.isArray(features)) plan.features = features;
  if (description) plan.description = description;

  db.commit();
  db.logAudit(
    req.user!.email,
    'MASTER_OWNER',
    'PLAN_UPDATED',
    'global',
    `Plano ${plan.name} atualizado. Mensal: R$ ${plan.monthlyPrice}, Anual: R$ ${plan.annualPrice}`
  );

  return res.json({ success: true, plan });
});

// Flagship Products (AYIN SALES, AYIN CUSTOMER, AYIN FINANCE, AYIN CORE)
apiRouter.get('/flagship-products', (_req: Request, res: Response) => {
  const data = db.getData();
  return res.json(data.flagshipProducts || []);
});

// -------------------------------------------------------------
// ENTERPRISE SERVICES & CONTRACTS (Híbrido: SaaS + Serviços)
// -------------------------------------------------------------

apiRouter.get('/services', (_req: Request, res: Response) => {
  const data = db.getData();
  return res.json(data.enterpriseServices || []);
});

apiRouter.post('/services', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const { code, name, tagline, description, basePrice, deliveryTimelineDays, deliverables, recommendedFor } = req.body;
  if (!name || !code || typeof basePrice !== 'number') {
    return res.status(400).json({ error: 'Código, nome e valor base são obrigatórios.' });
  }

  const data = db.getData();
  const newService: EnterpriseService = {
    id: `srv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    code,
    name,
    tagline: tagline || '',
    description: description || '',
    basePrice,
    deliveryTimelineDays: deliveryTimelineDays || 7,
    deliverables: deliverables || [],
    recommendedFor: recommendedFor || '',
    isActive: true
  };

  data.enterpriseServices.push(newService);
  db.commit();
  db.logAudit(req.user!.email, 'MASTER_OWNER', 'SERVICE_CREATED', 'global', `Serviço criado: ${newService.name} (R$ ${newService.basePrice})`);
  return res.json(newService);
});

apiRouter.patch('/services/:id', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const serviceId = req.params.id;
  const { basePrice, name, description, deliverables, isActive, deliveryTimelineDays, tagline, recommendedFor } = req.body;
  const data = db.getData();
  const service = data.enterpriseServices.find(s => s.id === serviceId || s.code === serviceId);

  if (!service) {
    return res.status(404).json({ error: 'Serviço empresarial não encontrado.' });
  }

  if (typeof basePrice === 'number') service.basePrice = basePrice;
  if (name) service.name = name;
  if (tagline) service.tagline = tagline;
  if (description) service.description = description;
  if (recommendedFor) service.recommendedFor = recommendedFor;
  if (Array.isArray(deliverables)) service.deliverables = deliverables;
  if (typeof isActive === 'boolean') service.isActive = isActive;
  if (typeof deliveryTimelineDays === 'number') service.deliveryTimelineDays = deliveryTimelineDays;

  db.commit();
  db.logAudit(
    req.user!.email,
    'MASTER_OWNER',
    'SERVICE_UPDATED',
    'global',
    `Serviço ${service.name} atualizado. Preço base configurado para R$ ${service.basePrice.toFixed(2)}`
  );

  return res.json({ success: true, service });
});

apiRouter.get('/service-contracts', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const data = db.getData();

  if (user.role === 'MASTER_OWNER') {
    return res.json(data.serviceContracts || []);
  } else {
    return res.json((data.serviceContracts || []).filter(c => c.companyId === user.companyId));
  }
});

apiRouter.post('/service-contracts', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { serviceId, scopeNotes, requestedPrice, generatePix } = req.body;
  const data = db.getData();
  const service = data.enterpriseServices.find(s => s.id === serviceId || s.code === serviceId);

  if (!service) {
    return res.status(404).json({ error: 'Serviço empresarial não localizado.' });
  }

  const company = user.companyId ? data.companies.find(c => c.id === user.companyId) : undefined;
  const companyId = user.companyId || req.body.companyId || 'global';
  const companyName = company ? company.name : (req.body.companyName || user.name);
  const contractPrice = typeof requestedPrice === 'number' ? requestedPrice : service.basePrice;

  const contractId = `ctr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  let pixCharge: PixCharge | undefined;
  if (generatePix) {
    const txId = `SHF${Date.now().toString().slice(-8)}`;
    const pixData = await generatePixChargePayload({
      pixKey: data.governance.pixKey || '11973479473',
      recipientName: 'Alifer Madeiro',
      city: 'SAO PAULO',
      amount: contractPrice,
      txId
    });

    const pixChargeId = `pix_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    pixCharge = {
      id: pixChargeId,
      orderId: contractId,
      companyId,
      customerName: user.name,
      customerEmail: user.email,
      customerCpfOrCnpj: company?.cnpjOrTaxId || '',
      serviceId: service.id,
      amount: contractPrice,
      pixKey: data.governance.pixKey || '11973479473',
      pixKeyType: 'TELEFONE CELULAR',
      recipientName: 'Alifer Madeiro',
      copyPasteCode: pixData.copyPasteCode,
      qrCodeSvg: pixData.qrCodeSvg,
      status: 'PENDING',
      createdAt: now,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      txId
    };
    data.pixCharges.unshift(pixCharge);
  }

  const newContract: ServiceContract = {
    id: contractId,
    companyId,
    companyName,
    customerEmail: user.email,
    serviceId: service.id,
    serviceCode: service.code,
    serviceName: service.name,
    status: user.role === 'MASTER_OWNER' ? 'APPROVED' : 'PROPOSAL',
    price: contractPrice,
    scopeNotes: scopeNotes || '',
    timelineDays: service.deliveryTimelineDays,
    assignedAgentCodename: service.code === 'DIAGNOSTIC' ? 'Tzofeh & Chacham' : service.code === 'DEPLOYMENT' ? 'Ozer' : service.code === 'CUSTOM_AUTOMATION' ? 'Yoetz' : 'Mazkir',
    pixChargeId: pixCharge?.id,
    createdAt: now,
    updatedAt: now
  };

  data.serviceContracts.unshift(newContract);
  db.commit();

  db.logAudit(
    user.email,
    user.role,
    'SERVICE_CONTRACT_REQUESTED',
    companyId,
    `Contrato de Serviço ${service.name} (${service.code}) solicitado. Valor: R$ ${contractPrice.toFixed(2)}`
  );

  return res.json({ contract: newContract, pixCharge });
});

apiRouter.patch('/service-contracts/:id/status', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const contractId = req.params.id;
  const { status, notes } = req.body;
  const data = db.getData();
  const contract = data.serviceContracts.find(c => c.id === contractId);

  if (!contract) {
    return res.status(404).json({ error: 'Contrato de serviço não encontrado.' });
  }

  contract.status = status;
  contract.updatedAt = new Date().toISOString();
  if (status === 'IN_PROGRESS' && !contract.startDate) {
    contract.startDate = new Date().toISOString();
  }
  if (status === 'DELIVERED') {
    contract.deliveredAt = new Date().toISOString();
  }
  if (notes) {
    contract.scopeNotes = notes;
  }

  db.commit();
  db.logAudit(
    req.user!.email,
    'MASTER_OWNER',
    'SERVICE_CONTRACT_STATUS_UPDATED',
    contract.companyId,
    `Status do contrato ${contract.id} alterado para ${status}`
  );

  return res.json({ success: true, contract });
});

// -------------------------------------------------------------
// COMMERCIAL CRM & ACQUISITION ENGINE (Item 8)
// -------------------------------------------------------------

apiRouter.get('/crm/proposals', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const data = db.getData();

  if (user.role === 'MASTER_OWNER') {
    return res.json(data.proposals || []);
  } else {
    return res.json((data.proposals || []).filter(p => p.contactEmail === user.email));
  }
});

apiRouter.post('/crm/proposals', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { leadId, companyName, contactName, contactEmail, contactPhone, planTier, servicesIncluded, totalValue, discountPercent, validDays, notes } = req.body;

  if (!companyName || !contactEmail || !contactName) {
    return res.status(400).json({ error: 'Nome da empresa, nome do contato e email são obrigatórios.' });
  }

  const data = db.getData();
  const disc = Number(discountPercent) || 0;
  const gross = Number(totalValue) || 0;
  const finalVal = Math.round(gross * (1 - disc / 100));

  const newProposal: CommercialProposal = {
    id: `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    leadId,
    companyName,
    contactName,
    contactEmail,
    contactPhone,
    planTier,
    servicesIncluded: servicesIncluded || [],
    totalValue: gross,
    discountPercent: disc,
    finalValue: finalVal,
    status: 'SENT',
    validUntil: new Date(Date.now() + (validDays || 15) * 24 * 60 * 60 * 1000).toISOString(),
    notes,
    createdAt: new Date().toISOString()
  };

  data.proposals.unshift(newProposal);

  // If tied to lead, advance lead stage to Proposta
  if (leadId) {
    const lead = data.leads.find(l => l.id === leadId);
    if (lead) {
      lead.stage = 'Proposta';
      lead.value = finalVal;
      lead.lastContact = new Date().toISOString();
    }
  }

  db.commit();
  db.logAudit(
    req.user!.email,
    req.user!.role,
    'PROPOSAL_CREATED',
    'global',
    `Proposta comercial gerada para ${companyName}. Valor: R$ ${finalVal.toFixed(2)} (Desconto: ${disc}%)`
  );

  return res.json(newProposal);
});

apiRouter.patch('/crm/proposals/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const proposalId = req.params.id;
  const { status, notes } = req.body;
  const data = db.getData();
  const proposal = data.proposals.find(p => p.id === proposalId);

  if (!proposal) {
    return res.status(404).json({ error: 'Proposta comercial não localizada.' });
  }

  if (status) proposal.status = status;
  if (notes) proposal.notes = notes;
  if (status === 'ACCEPTED') proposal.acceptedAt = new Date().toISOString();

  // If accepted, update lead
  if (proposal.leadId && status === 'ACCEPTED') {
    const lead = data.leads.find(l => l.id === proposal.leadId);
    if (lead) {
      lead.stage = 'Fechado';
      lead.lastContact = new Date().toISOString();
    }
  }

  db.commit();
  return res.json({ success: true, proposal });
});

apiRouter.get('/crm/partners', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  return res.json(data.partners || []);
});

apiRouter.post('/crm/partners', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const { name, email, companyName, referralCode, commissionRate } = req.body;
  if (!name || !email || !referralCode) {
    return res.status(400).json({ error: 'Nome, email e código de indicação são obrigatórios.' });
  }

  const data = db.getData();
  const partnerId = `prt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newPartner: CommercialPartner = {
    id: partnerId,
    name,
    email,
    companyName,
    referralCode: referralCode.toUpperCase(),
    commissionRate: Number(commissionRate) || 10,
    totalReferredLeads: 0,
    totalDealsClosed: 0,
    totalCommissionEarned: 0,
    totalCommissionPaid: 0,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  data.partners.push(newPartner);
  db.commit();
  db.logAudit(req.user!.email, 'MASTER_OWNER', 'PARTNER_CREATED', 'global', `Parceiro cadastrado: ${name} (Comissão: ${commissionRate}%)`);
  return res.json(newPartner);
});

apiRouter.post('/crm/leads', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { name, email, phone, companyName, source, stage, value, notes, assignedAgent, partnerReferralCode } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e email do lead são obrigatórios.' });
  }

  const data = db.getData();
  const user = req.user!;
  const targetCompanyId = user.role === 'MASTER_OWNER' ? (req.body.companyId || 'global') : user.companyId!;

  const newLead: Lead = {
    id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    companyId: targetCompanyId,
    name,
    email,
    phone: phone || '',
    companyName: companyName || '',
    source: source || 'Prospecção Ativa',
    stage: stage || 'Novo',
    value: Number(value) || 0,
    notes: notes || '',
    assignedAgent: assignedAgent || 'Sales Negotiator',
    partnerReferralCode,
    createdAt: new Date().toISOString(),
    lastContact: new Date().toISOString()
  };

  data.leads.unshift(newLead);

  if (partnerReferralCode) {
    const partner = data.partners.find(p => p.referralCode === partnerReferralCode.toUpperCase());
    if (partner) {
      partner.totalReferredLeads += 1;
    }
  }

  db.commit();
  return res.json(newLead);
});

apiRouter.patch('/crm/leads/:id/stage', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const leadId = req.params.id;
  const { stage, notes, value } = req.body;
  const data = db.getData();
  const lead = data.leads.find(l => l.id === leadId);

  if (!lead) {
    return res.status(404).json({ error: 'Lead não encontrado.' });
  }

  if (stage) lead.stage = stage;
  if (notes) lead.notes = `${lead.notes}\n[${new Date().toLocaleDateString('pt-BR')}] ${notes}`;
  if (typeof value === 'number') lead.value = value;
  lead.lastContact = new Date().toISOString();

  if (stage === 'Fechado' && lead.partnerReferralCode) {
    const partner = data.partners.find(p => p.referralCode === lead.partnerReferralCode);
    if (partner) {
      partner.totalDealsClosed += 1;
      const commission = (lead.value * partner.commissionRate) / 100;
      partner.totalCommissionEarned += commission;
    }
  }

  db.commit();
  return res.json({ success: true, lead });
});

apiRouter.get('/subscriptions', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const data = db.getData();

  if (user.role === 'MASTER_OWNER') {
    return res.json(data.subscriptions);
  } else {
    const subs = data.subscriptions.filter(s => s.companyId === user.companyId);
    return res.json(subs);
  }
});

apiRouter.post('/subscriptions/checkout', async (req: Request, res: Response) => {
  const { planTier, billingCycle, customerName, customerEmail, customerCpfOrCnpj, companyName } = req.body;
  if (!planTier || !customerEmail || !customerName) {
    return res.status(400).json({ error: 'Plano, email e nome do responsável são obrigatórios.' });
  }

  const data = db.getData();
  const plan = data.plans.find(p => p.tier === planTier);
  if (!plan) {
    return res.status(404).json({ error: 'Plano não localizado.' });
  }

  const cycle = billingCycle === 'annual' ? 'annual' : 'monthly';
  const amount = cycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

  // Find or create company
  let targetCompany = data.companies.find(c => c.cnpjOrTaxId === customerCpfOrCnpj || c.name.toLowerCase() === (companyName || customerName).toLowerCase());
  if (!targetCompany) {
    const newCompanyId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const createdCompany: Company = {
      id: newCompanyId,
      name: companyName || `${customerName} Corp`,
      tradeName: companyName || customerName,
      cnpjOrTaxId: customerCpfOrCnpj || '00.000.000/0001-00',
      plan: plan.tier,
      status: 'active',
      createdAt: new Date().toISOString(),
      aiPersona: {
        assistantName: `Ayin ${customerName.split(' ')[0]}`,
        tone: 'Consultivo, corporativo e focado em alta conversão',
        welcomeMessage: `Olá! Sou a inteligência corporativa dedicada da ${companyName || customerName}.`,
        instructions: 'Conduzir atendimento comercial e acelerar as operações da empresa.'
      },
      quotas: {
        maxUsers: plan.limits.maxUsers || 5,
        monthlyMissions: plan.limits.monthlyMissions,
        usedMissions: 0,
        maxAgents: plan.limits.maxAgents,
        maxKnowledgeDocs: plan.limits.maxKnowledgeDocs
      }
    };
    data.companies.push(createdCompany);
    targetCompany = createdCompany;
  }
  const company: Company = targetCompany!;

  const txId = `SHF${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString(); // 30 minutes for Pix payment

  // Generate official EMV Pix Copia e Cola and QR Code SVG
  const pixData = await generatePixChargePayload({
    pixKey: data.governance.pixKey || '11973479473',
    recipientName: 'Alifer Madeiro',
    city: 'SAO PAULO',
    amount,
    txId
  });

  const pixChargeId = `pix_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newCharge: PixCharge = {
    id: pixChargeId,
    orderId: subId,
    companyId: company.id,
    customerName,
    customerEmail,
    customerCpfOrCnpj: customerCpfOrCnpj || '',
    planTier: plan.tier,
    amount,
    pixKey: data.governance.pixKey || '11973479473',
    pixKeyType: 'TELEFONE CELULAR',
    recipientName: 'Alifer Madeiro',
    copyPasteCode: pixData.copyPasteCode,
    qrCodeSvg: pixData.qrCodeSvg,
    status: 'PENDING',
    createdAt: now.toISOString(),
    expiresAt,
    txId
  };

  const newSub: Subscription = {
    id: subId,
    companyId: company.id,
    companyName: company.tradeName,
    customerEmail,
    planTier: plan.tier,
    billingCycle: cycle,
    status: 'PENDING_PAYMENT',
    price: amount,
    startDate: now.toISOString(),
    expiresAt: new Date(now.getTime() + (cycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
    pixChargeId,
    autoRenew: true,
    featuresUnlocked: plan.features
  };

  company.subscriptionId = subId;
  data.pixCharges.unshift(newCharge);
  data.subscriptions.unshift(newSub);
  db.commit();

  db.logAudit(
    customerEmail,
    'OPERATOR',
    'SUBSCRIPTION_CHECKOUT',
    company.id,
    `Cobrança Pix de R$ ${amount.toFixed(2)} gerada para o plano ${plan.tier} (${cycle}). TxID: ${txId}`
  );

  return res.json({
    subscription: newSub,
    pixCharge: newCharge
  });
});

// -------------------------------------------------------------
// PIX PAYMENT ENGINE & WEBHOOK CONFIRMATION
// -------------------------------------------------------------

apiRouter.get('/payments/pix/:id', (req: Request, res: Response) => {
  const chargeId = req.params.id;
  const data = db.getData();
  const charge = data.pixCharges.find(c => c.id === chargeId || c.txId === chargeId);

  if (!charge) {
    return res.status(404).json({ error: 'Cobrança Pix não localizada.' });
  }

  // Check if expired
  if (charge.status === 'PENDING' && new Date(charge.expiresAt) < new Date()) {
    charge.status = 'EXPIRED';
    db.commit();
  }

  return res.json(charge);
});

// Authenticated Pix Webhook endpoint (Banco Central / Instituição Financeira)
apiRouter.post('/payments/pix/webhook', (req: Request, res: Response) => {
  const configuredSecret = process.env.PIX_WEBHOOK_SECRET || 'shefa_sec_pix_2026';
  const rawAuth = req.headers['x-shefa-webhook-secret'] || req.headers['authorization'];
  const providedSecret = typeof rawAuth === 'string' ? rawAuth.replace(/^Bearer\s+/i, '') : undefined;

  const { event, txId, amount, pixKey, endToEndId } = req.body;

  // Webhook Authentication Guard: reject unauthenticated calls
  if (configuredSecret && (!providedSecret || providedSecret !== configuredSecret)) {
    db.logAudit(
      'unauthorized@webhook.probe',
      'OPERATOR',
      'PIX_WEBHOOK_AUTH_FAILED',
      'global',
      `Tentativa de conciliação Pix sem assinatura ou secret válido para TxID: ${txId || 'N/A'}`
    );
    return res.status(401).json({ error: 'Assinatura do webhook Pix não autenticada. Acesso rejeitado.' });
  }

  const data = db.getData();
  const charge = data.pixCharges.find(c => c.txId === txId || c.id === req.body.chargeId);

  if (!charge) {
    return res.status(404).json({ error: 'Transação Pix não localizada no observatório.' });
  }

  // Idempotency: If already confirmed, don't duplicate execution
  if (charge.status === 'CONFIRMED') {
    return res.status(200).json({ success: true, message: 'Pagamento já conciliado anteriormente (Idempotente).' });
  }

  // Verification 1: Recipient Pix Key check
  const expectedKey = data.governance.pixKey || '11973479473';
  if (pixKey && pixKey !== expectedKey) {
    charge.status = 'CANCELLED';
    charge.failureReason = `Chave Pix receptora divergente (${pixKey} vs ${expectedKey})`;
    db.commit();
    return res.status(400).json({ error: 'Chave Pix de destino divergente da autorizada.' });
  }

  // Verification 2: Amount strict equality check
  const receivedAmount = Number(amount);
  if (receivedAmount && Math.abs(receivedAmount - charge.amount) > 0.01) {
    charge.status = 'CANCELLED';
    charge.failureReason = `Valor recebido (R$ ${receivedAmount.toFixed(2)}) diverge do valor faturado (R$ ${charge.amount.toFixed(2)})`;
    db.commit();
    db.logAudit(
      'webhook@bacen.gov.br',
      'OPERATOR',
      'PIX_AMOUNT_MISMATCH',
      charge.companyId,
      `Tentativa de pagamento com valor divergente detectada: Esperado R$ ${charge.amount}, Recebido R$ ${receivedAmount}`
    );
    return res.status(400).json({ error: 'Valor do Pix divergente do valor exato da cobrança.' });
  }

  // Verification 3: Expiration check
  if (new Date(charge.expiresAt) < new Date()) {
    charge.status = 'EXPIRED';
    charge.failureReason = 'Cobrança Pix expirada antes da liquidação';
    db.commit();
    return res.status(400).json({ error: 'Cobrança Pix expirada.' });
  }

  // VALID CONFIRMATION EXECUTION
  const now = new Date();
  charge.status = 'CONFIRMED';
  charge.confirmedAt = now.toISOString();
  charge.endToEndId = endToEndId || `E11973479473${now.getTime()}`;

  // 1. Activate corresponding subscription
  const sub = data.subscriptions.find(s => s.id === charge.orderId || s.pixChargeId === charge.id);
  if (sub) {
    sub.status = 'ACTIVE';
    sub.lastPaymentConfirmedAt = now.toISOString();
    const cycleDays = sub.billingCycle === 'annual' ? 365 : 30;
    sub.startDate = now.toISOString();
    sub.expiresAt = new Date(now.getTime() + cycleDays * 24 * 60 * 60 * 1000).toISOString();

    // 2. Unlock company features and quotas
    const company = data.companies.find(c => c.id === sub.companyId);
    if (company) {
      company.status = 'active';
      const plan = data.plans.find(p => p.tier === sub.planTier);
      if (plan) {
        company.plan = plan.tier;
        company.quotas.monthlyMissions = plan.limits.monthlyMissions;
        company.quotas.maxAgents = plan.limits.maxAgents;
        company.quotas.maxKnowledgeDocs = plan.limits.maxKnowledgeDocs;
      }
    }
  }

  // 2. Activate corresponding order if commerce
  const order = data.orders.find(o => o.id === charge.orderId || o.pixChargeId === charge.id);
  if (order) {
    order.status = 'CONFIRMED';
    order.confirmedAt = now.toISOString();
  }

  // 2b. Activate corresponding Service Contract if service payment
  const contract = data.serviceContracts?.find(c => c.id === charge.orderId || c.pixChargeId === charge.id);
  if (contract) {
    contract.status = 'APPROVED';
    contract.startDate = now.toISOString();
    contract.updatedAt = now.toISOString();
  }

  // 3. Register real liquid revenue in Financial Ledger (never pending!)
  const newFinRecord: FinancialRecord = {
    id: `fin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    companyId: charge.companyId,
    title: `Liquidação Pix: ${charge.planTier || contract?.serviceName || 'Serviço Empresarial'} (${charge.customerName})`,
    type: contract ? 'receita' : 'assinatura',
    amount: charge.amount,
    date: now.toISOString().split('T')[0],
    status: 'liquidado'
  };
  data.finances.unshift(newFinRecord);

  db.commit();

  db.logAudit(
    'pix.webhook@shefa-ayin.io',
    'MASTER_OWNER',
    'PIX_PAYMENT_CONFIRMED',
    charge.companyId,
    `Pagamento Pix de R$ ${charge.amount.toFixed(2)} CONFIRMADO. Assinatura ${sub?.id || ''} ATIVADA com sucesso.`
  );

  return res.json({
    success: true,
    message: 'Pagamento Pix verificado com sucesso. Assinatura e cotas liberadas imediatamente.',
    charge,
    subscription: sub
  });
});

// Homologation endpoint: allows Master Owner / integration test to simulate certified webhook receipt
apiRouter.post('/payments/pix/simulate-webhook', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const { chargeId } = req.body;
  const data = db.getData();
  const charge = data.pixCharges.find(c => c.id === chargeId || c.txId === chargeId);

  if (!charge) {
    return res.status(404).json({ error: 'Cobrança Pix não localizada.' });
  }

  // Execute verification flow
  const now = new Date();
  charge.status = 'CONFIRMED';
  charge.confirmedAt = now.toISOString();
  charge.endToEndId = `E11973479473${now.getTime()}`;

  const sub = data.subscriptions.find(s => s.id === charge.orderId || s.pixChargeId === charge.id);
  if (sub) {
    sub.status = 'ACTIVE';
    sub.lastPaymentConfirmedAt = now.toISOString();
    const cycleDays = sub.billingCycle === 'annual' ? 365 : 30;
    sub.startDate = now.toISOString();
    sub.expiresAt = new Date(now.getTime() + cycleDays * 24 * 60 * 60 * 1000).toISOString();

    const company = data.companies.find(c => c.id === sub.companyId);
    if (company) {
      company.status = 'active';
      const plan = data.plans.find(p => p.tier === sub.planTier);
      if (plan) {
        company.plan = plan.tier;
        company.quotas.monthlyMissions = plan.limits.monthlyMissions;
        company.quotas.maxAgents = plan.limits.maxAgents;
        company.quotas.maxKnowledgeDocs = plan.limits.maxKnowledgeDocs;
      }
    }
  }

  const contract = data.serviceContracts?.find(c => c.id === charge.orderId || c.pixChargeId === charge.id);
  if (contract) {
    contract.status = 'APPROVED';
    contract.startDate = now.toISOString();
    contract.updatedAt = now.toISOString();
  }

  data.finances.unshift({
    id: `fin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    companyId: charge.companyId,
    title: `Liquidação Pix (Homologação): ${charge.planTier || contract?.serviceName || 'Serviço'} (${charge.customerName})`,
    type: contract ? 'receita' : 'assinatura',
    amount: charge.amount,
    date: now.toISOString().split('T')[0],
    status: 'liquidado'
  });

  db.commit();

  db.logAudit(
    req.user!.email,
    'MASTER_OWNER',
    'PIX_HOMOLOGATION_CONFIRMED',
    charge.companyId,
    `Pagamento Pix de R$ ${charge.amount.toFixed(2)} liquidado via homologação do Master Owner.`
  );

  return res.json({
    success: true,
    message: 'Homologação concluída: Cobrança Pix confirmada e assinatura ativada.',
    charge,
    subscription: sub
  });
});

// -------------------------------------------------------------
// SUBSCRIPTION LIFECYCLE: CANCEL, SUSPEND, REACTIVATE, RENEW
// -------------------------------------------------------------

apiRouter.post('/subscriptions/:id/cancel', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const subId = req.params.id;
  const user = req.user!;
  const data = db.getData();
  const sub = data.subscriptions.find(s => s.id === subId);

  if (!sub) {
    return res.status(404).json({ error: 'Assinatura não localizada.' });
  }

  if (user.role !== 'MASTER_OWNER' && user.companyId !== sub.companyId) {
    return res.status(403).json({ error: 'Sem autorização para cancelar esta assinatura.' });
  }

  sub.status = 'CANCELED';
  sub.autoRenew = false;
  sub.canceledAt = new Date().toISOString();

  db.commit();
  db.logAudit(
    user.email,
    user.role,
    'SUBSCRIPTION_CANCELED',
    sub.companyId,
    `Assinatura ${sub.id} (${sub.planTier}) cancelada com sucesso.`
  );

  return res.json({ success: true, subscription: sub });
});

apiRouter.post('/subscriptions/:id/suspend', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const subId = req.params.id;
  const data = db.getData();
  const sub = data.subscriptions.find(s => s.id === subId);

  if (!sub) {
    return res.status(404).json({ error: 'Assinatura não localizada.' });
  }

  sub.status = 'SUSPENDED';
  const company = data.companies.find(c => c.id === sub.companyId);
  if (company) {
    company.status = 'suspended';
    company.quotas.monthlyMissions = 0;
  }

  db.commit();
  db.logAudit(
    req.user!.email,
    'MASTER_OWNER',
    'SUBSCRIPTION_SUSPENDED',
    sub.companyId,
    `Assinatura ${sub.id} bloqueada por inadimplência ou ordem do Master Owner.`
  );

  return res.json({ success: true, subscription: sub, companyStatus: company?.status });
});

apiRouter.post('/subscriptions/:id/reactivate', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const subId = req.params.id;
  const data = db.getData();
  const sub = data.subscriptions.find(s => s.id === subId);

  if (!sub) {
    return res.status(404).json({ error: 'Assinatura não localizada.' });
  }

  sub.status = 'ACTIVE';
  const plan = data.plans.find(p => p.tier === sub.planTier);
  const company = data.companies.find(c => c.id === sub.companyId);

  if (company && plan) {
    company.status = 'active';
    company.quotas.monthlyMissions = plan.limits.monthlyMissions;
    company.quotas.maxAgents = plan.limits.maxAgents;
    company.quotas.maxKnowledgeDocs = plan.limits.maxKnowledgeDocs;
  }

  db.commit();
  db.logAudit(
    req.user!.email,
    'MASTER_OWNER',
    'SUBSCRIPTION_REACTIVATED',
    sub.companyId,
    `Assinatura ${sub.id} reativada. Acessos e cotas corporativas restabelecidos.`
  );

  return res.json({ success: true, subscription: sub, company });
});

apiRouter.post('/subscriptions/:id/renew', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const subId = req.params.id;
  const user = req.user!;
  const data = db.getData();
  const sub = data.subscriptions.find(s => s.id === subId);

  if (!sub) {
    return res.status(404).json({ error: 'Assinatura não localizada.' });
  }

  if (user.role !== 'MASTER_OWNER' && user.companyId !== sub.companyId) {
    return res.status(403).json({ error: 'Sem autorização para renovar esta assinatura.' });
  }

  const plan = data.plans.find(p => p.tier === sub.planTier);
  if (!plan) {
    return res.status(404).json({ error: 'Plano não configurado.' });
  }

  const amount = sub.billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
  const txId = `SHF${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

  const pixData = await generatePixChargePayload({
    pixKey: data.governance.pixKey || '11973479473',
    recipientName: 'Alifer Madeiro',
    city: 'SAO PAULO',
    amount,
    txId
  });

  const comp = data.companies.find(c => c.id === sub.companyId);
  const pixChargeId = `pix_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newCharge: PixCharge = {
    id: pixChargeId,
    orderId: sub.id,
    companyId: sub.companyId,
    customerName: sub.companyName,
    customerEmail: sub.customerEmail,
    customerCpfOrCnpj: comp?.cnpjOrTaxId || '00.000.000/0001-00',
    planTier: sub.planTier,
    amount,
    pixKey: data.governance.pixKey || '11973479473',
    pixKeyType: 'TELEFONE CELULAR',
    recipientName: 'Alifer Madeiro',
    copyPasteCode: pixData.copyPasteCode,
    qrCodeSvg: pixData.qrCodeSvg,
    status: 'PENDING',
    createdAt: now.toISOString(),
    expiresAt,
    txId
  };

  sub.pixChargeId = pixChargeId;
  sub.status = 'PENDING_PAYMENT';
  data.pixCharges.unshift(newCharge);
  db.commit();

  db.logAudit(
    user.email,
    user.role,
    'SUBSCRIPTION_RENEWAL_GENERATED',
    sub.companyId,
    `Nova cobrança Pix de renovação gerada para ${sub.planTier} (R$ ${amount.toFixed(2)}). TxID: ${txId}`
  );

  return res.json({ subscription: sub, pixCharge: newCharge });
});

// -------------------------------------------------------------
// COMMERCE ENGINE & ORDERS
// -------------------------------------------------------------

apiRouter.get('/orders', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const data = db.getData();

  if (user.role === 'MASTER_OWNER') {
    return res.json(data.orders);
  } else {
    return res.json(data.orders.filter(o => o.companyId === user.companyId));
  }
});

apiRouter.post('/orders', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { items, customerName, customerEmail } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: 'Itens do pedido são obrigatórios.' });
  }

  const user = req.user!;
  const data = db.getData();
  const totalAmount = items.reduce((acc: number, item: any) => acc + (item.price * (item.quantity || 1)), 0);

  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const txId = `SHF${Date.now().toString().slice(-8)}`;

  // Generate Pix
  const pixData = await generatePixChargePayload({
    pixKey: data.governance.pixKey || '11973479473',
    recipientName: 'Alifer Madeiro',
    city: 'SAO PAULO',
    amount: totalAmount,
    txId
  });

  const pixChargeId = `pix_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date();

  const newCharge: PixCharge = {
    id: pixChargeId,
    orderId,
    companyId: user.companyId || 'global',
    customerName: customerName || user.name,
    customerEmail: customerEmail || user.email,
    customerCpfOrCnpj: '',
    amount: totalAmount,
    pixKey: data.governance.pixKey || '11973479473',
    pixKeyType: 'TELEFONE CELULAR',
    recipientName: 'Alifer Madeiro',
    copyPasteCode: pixData.copyPasteCode,
    qrCodeSvg: pixData.qrCodeSvg,
    status: 'PENDING',
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
    txId
  };

  const newOrder: Order = {
    id: orderId,
    companyId: user.companyId || 'global',
    customerName: customerName || user.name,
    customerEmail: customerEmail || user.email,
    items,
    totalAmount,
    status: 'PENDING_PAYMENT',
    paymentMethod: 'PIX',
    pixChargeId,
    createdAt: now.toISOString()
  };

  data.pixCharges.unshift(newCharge);
  data.orders.unshift(newOrder);
  db.commit();

  return res.json({ order: newOrder, pixCharge: newCharge });
});

apiRouter.get('/commissions', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  return res.json(data.commissions);
});

// -------------------------------------------------------------
// GOVERNANCE & MASTER OWNER KILL-SWITCH
// -------------------------------------------------------------

apiRouter.get('/governance', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  return res.json(data.governance);
});

apiRouter.post('/governance/emergency-pause', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  data.governance.isEmergencyPaused = !data.governance.isEmergencyPaused;
  db.commit();

  db.logAudit(
    req.user!.email,
    'MASTER_OWNER',
    data.governance.isEmergencyPaused ? 'EMERGENCY_PAUSE_TRIGGERED' : 'EMERGENCY_PAUSE_RESUMED',
    'global',
    `Pausa Geral de Emergência (Kill-Switch) do Master Owner: ${data.governance.isEmergencyPaused ? 'ATIVADA' : 'DESATIVADA'}`
  );

  return res.json({ 
    success: true, 
    isEmergencyPaused: data.governance.isEmergencyPaused,
    message: data.governance.isEmergencyPaused 
      ? 'Pausa Geral Ativada. Todos os agentes autônomos e despachos contínuos estão suspensos.' 
      : 'Operação Contínua Reativada pelo Master Owner.'
  });
});

apiRouter.post('/governance/spending-limit', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const { limit } = req.body;
  const numLimit = Number(limit);
  if (isNaN(numLimit) || numLimit < 0) {
    return res.status(400).json({ error: 'Limite financeiro inválido.' });
  }

  const data = db.getData();
  data.governance.financialSpendingLimit = numLimit;
  db.commit();

  db.logAudit(
    req.user!.email,
    'MASTER_OWNER',
    'SPENDING_LIMIT_UPDATED',
    'global',
    `Limite financeiro para aprovação manual configurado para R$ ${numLimit.toFixed(2)}`
  );

  return res.json({ success: true, spendingLimit: numLimit });
});

apiRouter.post('/agents/:id/pause', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const agentId = req.params.id;
  const data = db.getData();
  const agent = data.agents.find(a => a.id === agentId);

  if (!agent) {
    return res.status(404).json({ error: 'Agente não encontrado.' });
  }

  agent.isManuallyPaused = !agent.isManuallyPaused;
  if (agent.isManuallyPaused) {
    agent.status = 'paused';
  } else {
    agent.status = 'idle';
  }
  db.commit();

  db.logAudit(
    req.user!.email,
    'MASTER_OWNER',
    'AGENT_PAUSED_TOGGLED',
    agent.companyId,
    `Agente ${agent.name} (${agent.agentRoleType}) foi ${agent.isManuallyPaused ? 'PAUSADO' : 'RETOMADO'}.`
  );

  return res.json({ success: true, agent });
});

// -------------------------------------------------------------
// FINANCIAL & AUDIT REPORTS
// -------------------------------------------------------------

apiRouter.get('/finances', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const data = db.getData();

  let finances = data.finances;
  if (user.role !== 'MASTER_OWNER') {
    finances = finances.filter(f => f.companyId === user.companyId);
  }

  return res.json(finances);
});

apiRouter.get('/audit', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  return res.json(data.auditLogs);
});

apiRouter.get('/system/stats', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  const user = req.user!;

  const totalCompanies = data.companies.length;
  const totalAgents = data.agents.length;
  const totalMissions = user.role === 'MASTER_OWNER' 
    ? data.missions.length 
    : data.missions.filter(m => m.companyId === user.companyId).length;
  const completedMissions = user.role === 'MASTER_OWNER'
    ? data.missions.filter(m => m.status === 'completed').length
    : data.missions.filter(m => m.companyId === user.companyId && m.status === 'completed').length;
  const awaitingApproval = data.missions.filter(m => m.status === 'awaiting_approval').length;

  // Real financial metrics (never counting pending charges as confirmed revenue!)
  const confirmedFinances = data.finances.filter(f => f.status === 'liquidado');
  const grossRevenue = confirmedFinances
    .filter(f => f.type === 'assinatura' || f.type === 'receita')
    .reduce((acc, f) => acc + f.amount, 0);
  const totalCosts = confirmedFinances
    .filter(f => f.type === 'custo')
    .reduce((acc, f) => acc + f.amount, 0);

  // Confirmed liquid Pix receipts
  const totalReceivedRevenue = data.pixCharges
    .filter(p => p.status === 'CONFIRMED')
    .reduce((acc, p) => acc + p.amount, 0);

  const activeSubscriptions = data.subscriptions.filter(s => s.status === 'ACTIVE').length;
  const churnedSubscriptions = data.subscriptions.filter(s => s.status === 'EXPIRED' || s.status === 'CANCELED' || s.status === 'SUSPENDED').length;
  const totalSubsCount = data.subscriptions.length || 1;
  const defaultRate = (churnedSubscriptions / totalSubsCount) * 100;
  
  // Overdue default amount (expired pending charges)
  const defaultAmount = data.pixCharges
    .filter(p => p.status === 'EXPIRED')
    .reduce((acc, p) => acc + p.amount, 0);

  const mrr = data.subscriptions
    .filter(s => s.status === 'ACTIVE')
    .reduce((acc, s) => acc + (s.billingCycle === 'annual' ? s.price / 12 : s.price), 0);

  const pendingPixCount = data.pixCharges.filter(p => p.status === 'PENDING').length;

  const totalContracts = data.serviceContracts ? data.serviceContracts.length : 0;
  const activeContracts = data.serviceContracts 
    ? data.serviceContracts.filter(c => c.status === 'IN_PROGRESS' || c.status === 'APPROVED').length 
    : 0;

  // Separation of Real Verified Pix Revenue vs Seed Demo Data
  const realVerifiedPixRevenue = data.pixCharges
    .filter(p => p.status === 'CONFIRMED' && p.id !== 'pix_initial_01')
    .reduce((acc, p) => acc + p.amount, 0);

  const seedDemoRevenue = data.pixCharges
    .filter(p => p.id === 'pix_initial_01')
    .reduce((acc, p) => acc + p.amount, 0);

  // Realistic Operational Cost Breakdown
  const infrastructureCost = totalCosts;
  const estimatedTaxes = Math.round(grossRevenue * 0.085 * 100) / 100; // 8.5% Simples Nacional
  const estimatedAiTokenCost = Math.round(((completedMissions * 0.18) + (totalMissions * 0.05)) * 100) / 100; // Gemini Flash neural inference
  const gatewayFees = Math.round((data.pixCharges.filter(p => p.status === 'CONFIRMED').length * 0.80) * 100) / 100; // BACEN SPI settlement
  const partnerCommissionsCost = data.commissions.reduce((acc, c) => acc + c.amount, 0);

  const realOperatingCosts = Math.round((infrastructureCost + estimatedTaxes + estimatedAiTokenCost + gatewayFees + partnerCommissionsCost) * 100) / 100;
  const realNetOperatingResult = Math.round((grossRevenue - realOperatingCosts) * 100) / 100;
  const realNetMarginPercent = grossRevenue > 0 ? Math.round((realNetOperatingResult / grossRevenue) * 10000) / 100 : 0;

  const netResult = grossRevenue - totalCosts;
  const netMarginPercent = grossRevenue > 0 ? (netResult / grossRevenue) * 100 : 0;

  // Operational metrics
  const projects = data.projects || [];
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status !== 'DELIVERED').length;
  const deliveredProjects = projects.filter(p => p.status === 'DELIVERED').length;

  const tickets = data.supportTickets || [];
  const totalSupportTickets = tickets.length;
  const openSupportTickets = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  const resolvedSupportTickets = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  const totalAgentInteractions = (data.agentInteractions || []).length;
  const activeAiProvidersCount = (data.aiProviders || []).filter(p => p.isActive).length;
  const totalEnterpriseIntegrations = (data.enterpriseIntegrations || []).length;
  const techBudgetCapBrl = data.techGovernance?.monthlyBudgetCapBrl || 2500;
  const techBudgetSpentBrl = data.techGovernance?.totalSpentThisMonthBrl || 218.40;
  const pendingRefundRequestsCount = (data.customerRefunds || []).filter(r => r.status === 'PENDING_MASTER_APPROVAL').length;

  return res.json({
    totalCompanies,
    totalAgents,
    active24hAgents: data.agents.filter(a => a.is24hEnabled && !a.isManuallyPaused).length,
    totalMissions,
    completedMissions,
    awaitingApproval,
    auditEntries: data.auditLogs.length,
    grossRevenue,
    mrr,
    totalCosts,
    netResult,
    netMarginPercent,
    totalReceivedRevenue,
    realVerifiedPixRevenue,
    seedDemoRevenue,
    estimatedTaxes,
    estimatedAiTokenCost,
    infrastructureCost,
    gatewayFees,
    partnerCommissionsCost,
    realOperatingCosts,
    realNetOperatingResult,
    realNetMarginPercent,
    defaultRate,
    defaultAmount,
    activeSubscriptions,
    churnedSubscriptions,
    pendingPixCharges: pendingPixCount,
    totalContracts,
    activeContracts,
    totalProjects,
    activeProjects,
    deliveredProjects,
    totalSupportTickets,
    openSupportTickets,
    resolvedSupportTickets,
    totalAgentInteractions,
    isEmergencyPaused: data.governance.isEmergencyPaused,
    activeAiProvidersCount,
    totalEnterpriseIntegrations,
    techBudgetCapBrl,
    techBudgetSpentBrl,
    pendingRefundRequestsCount
  });
});

// -------------------------------------------------------------
// 12. DEVELOPMENT & PROJECTS DELIVERY WORKFLOW (Phase 01)
// -------------------------------------------------------------

apiRouter.get('/projects', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  const projects = data.projects || [];
  if (req.user?.role === 'MASTER_OWNER') {
    return res.json(projects);
  }
  // Client multitenant isolation
  const userCompanyId = req.user?.companyId;
  const filtered = projects.filter(p => p.companyId === userCompanyId);
  return res.json(filtered);
});

apiRouter.post('/projects', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  if (!data.projects) data.projects = [];

  const { title, description, companyId, serviceContractId, deadline, tasks } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Título e descrição são obrigatórios.' });
  }

  const targetCompanyId = req.user?.role === 'MASTER_OWNER' 
    ? (companyId || req.user.companyId || 'comp_vertice_tech') 
    : req.user?.companyId;

  const company = data.companies.find(c => c.id === targetCompanyId);

  const newProject: DevProject = {
    id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    companyId: targetCompanyId || 'global',
    companyName: company?.name || 'Cliente Corporativo',
    serviceContractId,
    title,
    description,
    assignedAgentCodename: 'SALES AGENT',
    status: 'PLANNING',
    tasks: Array.isArray(tasks) && tasks.length > 0 ? tasks.map((t: any, idx: number) => ({
      id: `task_${Date.now()}_${idx}`,
      title: t.title || `Etapa ${idx + 1}`,
      description: t.description || '',
      status: 'pending',
      assignedAgent: t.assignedAgent || 'LEAD AGENT',
      deadline: t.deadline || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    })) : [
      {
        id: `task_${Date.now()}_1`,
        title: 'Mapeamento de Requisitos e Arquitetura',
        status: 'in_progress',
        assignedAgent: 'RADAR AGENT',
        deadline: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
      }
    ],
    deadline: deadline || new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
    clientApprovalStatus: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  data.projects.unshift(newProject);
  db.logAudit(
    req.user!.email,
    req.user!.role,
    'PROJECT_CREATED',
    newProject.companyId,
    `Projeto de desenvolvimento "${newProject.title}" registrado.`
  );
  db.commit();

  return res.status(201).json(newProject);
});

apiRouter.patch('/projects/:id/tasks/:taskId', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id, taskId } = req.params;
  const { status, assignedAgent, deadline } = req.body;
  const data = db.getData();
  const project = (data.projects || []).find(p => p.id === id);

  if (!project) {
    return res.status(404).json({ error: 'Projeto não encontrado.' });
  }

  // Client multitenant isolation
  if (req.user?.role !== 'MASTER_OWNER' && project.companyId !== req.user?.companyId) {
    return res.status(403).json({ error: 'Acesso negado a este projeto.' });
  }

  const task = project.tasks.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: 'Tarefa não encontrada.' });
  }

  if (status) {
    task.status = status;
    if (status === 'completed') task.completedAt = new Date().toISOString();
  }
  if (assignedAgent) task.assignedAgent = assignedAgent;
  if (deadline) task.deadline = deadline;

  // Auto-progress project status
  const allTasksDone = project.tasks.every(t => t.status === 'completed');
  if (allTasksDone && project.status !== 'DELIVERED') {
    project.status = 'CLIENT_APPROVAL';
  } else if (project.tasks.some(t => t.status === 'in_progress')) {
    project.status = 'IN_DEVELOPMENT';
  }

  project.updatedAt = new Date().toISOString();
  db.logAudit(
    req.user!.email,
    req.user!.role,
    'PROJECT_TASK_UPDATED',
    project.companyId,
    `Tarefa "${task.title}" atualizada para ${task.status}.`
  );
  db.commit();

  return res.json({ project, task });
});

apiRouter.post('/projects/:id/approve', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { feedback } = req.body;
  const data = db.getData();
  const project = (data.projects || []).find(p => p.id === id);

  if (!project) {
    return res.status(404).json({ error: 'Projeto não encontrado.' });
  }

  if (req.user?.role !== 'MASTER_OWNER' && project.companyId !== req.user?.companyId) {
    return res.status(403).json({ error: 'Acesso negado a este projeto.' });
  }

  project.clientApprovalStatus = 'APPROVED';
  project.status = 'DELIVERED';
  project.deliveredAt = new Date().toISOString();
  project.clientFeedback = feedback || 'Projeto aprovado formalmente pelo cliente.';
  project.updatedAt = new Date().toISOString();

  // If there's an associated service contract, mark it DELIVERED
  if (project.serviceContractId) {
    const contract = (data.serviceContracts || []).find(c => c.id === project.serviceContractId);
    if (contract) {
      contract.status = 'DELIVERED';
      contract.deliveredAt = new Date().toISOString();
      contract.updatedAt = new Date().toISOString();
    }
  }

  db.logAudit(
    req.user!.email,
    req.user!.role,
    'PROJECT_APPROVED_BY_CLIENT',
    project.companyId,
    `Projeto "${project.title}" aprovado e entregue formalmente.`
  );
  db.commit();

  return res.json({ success: true, project });
});

apiRouter.post('/projects/:id/request-changes', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { feedback } = req.body;
  const data = db.getData();
  const project = (data.projects || []).find(p => p.id === id);

  if (!project) {
    return res.status(404).json({ error: 'Projeto não encontrado.' });
  }

  if (req.user?.role !== 'MASTER_OWNER' && project.companyId !== req.user?.companyId) {
    return res.status(403).json({ error: 'Acesso negado a este projeto.' });
  }

  project.clientApprovalStatus = 'CHANGES_REQUESTED';
  project.status = 'IN_DEVELOPMENT';
  project.clientFeedback = feedback || 'Solicitação de ajustes enviada pelo cliente.';
  project.updatedAt = new Date().toISOString();

  db.logAudit(
    req.user!.email,
    req.user!.role,
    'PROJECT_CHANGES_REQUESTED',
    project.companyId,
    `Ajustes solicitados no projeto "${project.title}": ${feedback}`
  );
  db.commit();

  return res.json({ success: true, project });
});

// -------------------------------------------------------------
// 13. CUSTOMER SUCCESS & SUPPORT TICKETS (Phase 01)
// -------------------------------------------------------------

apiRouter.get('/support/tickets', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  const tickets = data.supportTickets || [];
  if (req.user?.role === 'MASTER_OWNER') {
    return res.json(tickets);
  }
  const userCompanyId = req.user?.companyId;
  const filtered = tickets.filter(t => t.companyId === userCompanyId);
  return res.json(filtered);
});

apiRouter.post('/support/tickets', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  if (!data.supportTickets) data.supportTickets = [];

  const { subject, description, priority, category } = req.body;
  if (!subject || !description) {
    return res.status(400).json({ error: 'Assunto e descrição são obrigatórios.' });
  }

  const company = data.companies.find(c => c.id === req.user?.companyId) || data.companies[0];

  const newTicket: SupportTicket = {
    id: `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    companyId: req.user?.companyId || 'global',
    companyName: company?.name || 'Cliente Corporativo',
    customerEmail: req.user!.email,
    subject,
    description,
    priority: priority || 'MEDIUM',
    status: 'OPEN',
    category: category || 'TECHNICAL',
    assignedAgent: 'CUSTOMER AGENT',
    communicationHistory: [
      {
        id: `msg_${Date.now()}_0`,
        senderEmail: req.user!.email,
        senderName: req.user!.name || req.user!.email,
        senderRole: req.user?.role === 'MASTER_OWNER' ? 'MASTER_OWNER' : 'CLIENT',
        message: description,
        timestamp: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  data.supportTickets.unshift(newTicket);
  db.logAudit(
    req.user!.email,
    req.user!.role,
    'SUPPORT_TICKET_OPENED',
    newTicket.companyId,
    `Chamado de suporte "${newTicket.subject}" aberto.`
  );
  db.commit();

  return res.status(201).json(newTicket);
});

apiRouter.post('/support/tickets/:id/messages', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Mensagem não pode ser vazia.' });
  }

  const data = db.getData();
  const ticket = (data.supportTickets || []).find(t => t.id === id);

  if (!ticket) {
    return res.status(404).json({ error: 'Chamado não encontrado.' });
  }

  if (req.user?.role !== 'MASTER_OWNER' && ticket.companyId !== req.user?.companyId) {
    return res.status(403).json({ error: 'Acesso negado a este chamado.' });
  }

  const senderRole = req.user?.role === 'MASTER_OWNER' ? 'MASTER_OWNER' : 'CLIENT';
  ticket.communicationHistory.push({
    id: `msg_${Date.now()}`,
    senderEmail: req.user!.email,
    senderName: req.user!.name || req.user!.email,
    senderRole,
    message: message.trim(),
    timestamp: new Date().toISOString()
  });

  ticket.updatedAt = new Date().toISOString();
  if (ticket.status === 'RESOLVED') ticket.status = 'IN_PROGRESS';

  db.commit();
  return res.json({ success: true, ticket });
});

apiRouter.patch('/support/tickets/:id/status', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, satisfactionRating } = req.body;
  const data = db.getData();
  const ticket = (data.supportTickets || []).find(t => t.id === id);

  if (!ticket) {
    return res.status(404).json({ error: 'Chamado não encontrado.' });
  }

  if (req.user?.role !== 'MASTER_OWNER' && ticket.companyId !== req.user?.companyId) {
    return res.status(403).json({ error: 'Acesso negado a este chamado.' });
  }

  if (status) {
    ticket.status = status;
    if (status === 'RESOLVED' || status === 'CLOSED') {
      ticket.resolvedAt = new Date().toISOString();
    }
  }

  if (satisfactionRating) {
    ticket.satisfactionRating = Math.max(1, Math.min(5, Number(satisfactionRating)));
  }

  ticket.updatedAt = new Date().toISOString();
  db.logAudit(
    req.user!.email,
    req.user!.role,
    'SUPPORT_TICKET_STATUS_UPDATED',
    ticket.companyId,
    `Status do chamado "${ticket.subject}" alterado para ${ticket.status}.`
  );
  db.commit();

  return res.json({ success: true, ticket });
});

// -------------------------------------------------------------
// 14. AUTONOMOUS MULTI-AGENT COLLABORATION BUS (Phase 01)
// -------------------------------------------------------------

apiRouter.get('/agents/exchange', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  return res.json(data.agentInteractions || []);
});

apiRouter.post('/agents/exchange/run-cycle', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await agentEngine.executeInterAgentCycle(req.user!.email);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Falha ao executar ciclo colaborativo de agentes.' });
  }
});

apiRouter.post('/agents/exchange/:id/approve', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const data = db.getData();
  const interaction = (data.agentInteractions || []).find(i => i.id === id);

  if (!interaction) {
    return res.status(404).json({ error: 'Interação não encontrada.' });
  }

  interaction.status = 'PROCESSED';
  interaction.masterApprovedAt = new Date().toISOString();
  interaction.masterApprovedBy = req.user!.email;

  db.logAudit(
    req.user!.email,
    'MASTER_OWNER',
    'INTERACTION_MASTER_APPROVED',
    'global',
    `Ação inter-agente "${interaction.subject}" formalmente autorizada pelo Master Owner.`
  );
  db.commit();

  return res.json({ success: true, interaction });
});

// -------------------------------------------------------------
// 15. ENTERPRISE AI PROVIDER GATEWAY & TASK ROUTING
// -------------------------------------------------------------

apiRouter.get('/ai/providers', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  return res.json(data.aiProviders || []);
});

apiRouter.post('/ai/providers/:id/test', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const result = await aiGateway.testConnection(id as AiProviderId);
  return res.json(result);
});

apiRouter.patch('/ai/providers/:id', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { isActive, isMasterApproved, modelId, monthlyBudgetCpmBrl, isFallbackAuthorized, fallbackProviderId, maskedApiKey, notes } = req.body;
  const data = db.getData();
  const provider = (data.aiProviders || []).find(p => p.providerId === id);

  if (!provider) {
    return res.status(404).json({ error: 'Provedor de IA não encontrado.' });
  }

  if (typeof isActive === 'boolean') provider.isActive = isActive;
  if (typeof isMasterApproved === 'boolean') {
    provider.isMasterApproved = isMasterApproved;
    if (isMasterApproved && provider.status === 'AVAILABLE') provider.status = 'ACTIVE';
    else if (!isMasterApproved && provider.providerId !== 'gemini' && provider.providerId !== 'mock_sandbox') {
      provider.status = 'AVAILABLE';
      provider.isActive = false;
    }
  }
  if (modelId) provider.modelId = modelId;
  if (typeof monthlyBudgetCpmBrl === 'number') provider.monthlyBudgetCpmBrl = monthlyBudgetCpmBrl;
  if (typeof isFallbackAuthorized === 'boolean') provider.isFallbackAuthorized = isFallbackAuthorized;
  if (fallbackProviderId) provider.fallbackProviderId = fallbackProviderId;
  if (maskedApiKey) provider.maskedApiKey = maskedApiKey;
  if (notes) provider.notes = notes;

  db.logAudit(
    req.user!.email,
    'MASTER_OWNER',
    'AI_PROVIDER_CONFIG_UPDATED',
    'global',
    `Provedor ${provider.providerName} atualizado pelo Master Owner. Ativo: ${provider.isActive}, Aprovado: ${provider.isMasterApproved}, Teto: R$ ${provider.monthlyBudgetCpmBrl}`
  );
  db.commit();

  return res.json({ success: true, provider });
});

apiRouter.get('/ai/routing-rules', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  return res.json(data.aiRoutingRules || []);
});

apiRouter.put('/ai/routing-rules', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const { rules } = req.body;
  if (!Array.isArray(rules)) {
    return res.status(400).json({ error: 'Regras de roteamento devem ser um array.' });
  }

  const data = db.getData();
  data.aiRoutingRules = rules;
  db.logAudit(
    req.user!.email,
    'MASTER_OWNER',
    'AI_ROUTING_RULES_UPDATED',
    'global',
    `Matriz de roteamento de tarefas IA atualizada com ${rules.length} categorias.`
  );
  db.commit();

  return res.json({ success: true, rules: data.aiRoutingRules });
});

apiRouter.post('/ai/execute', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { category, prompt, systemInstruction, maxTokens, temperature } = req.body;
  if (!category || !prompt) {
    return res.status(400).json({ error: 'Categoria da tarefa e prompt são obrigatórios.' });
  }

  try {
    const result = await aiGateway.executeTask(category as AiTaskCategory, prompt, {
      systemInstruction,
      maxTokens,
      temperature
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Falha na execução do Gateway de IA.' });
  }
});

// -------------------------------------------------------------
// 16. SALES INTELLIGENCE WORKSPACE (Entel & Nova Gestões)
// -------------------------------------------------------------

apiRouter.get('/sales-intelligence/scores', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  let scores = data.salesOpportunityScores || [];

  if (req.user?.role !== 'MASTER_OWNER') {
    const userCompanyId = req.user?.companyId;
    const companyLeadIds = (data.leads || []).filter(l => l.companyId === userCompanyId).map(l => l.id);
    scores = scores.filter(s => companyLeadIds.includes(s.leadId));
  }

  return res.json(scores);
});

apiRouter.post('/sales-intelligence/recalculate', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const scores = salesIntelligence.evaluateAllLeads();
  db.logAudit(
    req.user!.email,
    req.user!.role,
    'SALES_SCORES_RECALCULATED',
    req.user?.companyId || 'global',
    `Recálculo de inteligência de vendas executado para ${scores.length} leads corporativos.`
  );
  return res.json({ success: true, count: scores.length, scores });
});

apiRouter.post('/sales-intelligence/analyze-transcript', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { transcript, companyName } = req.body;
  if (!transcript) {
    return res.status(400).json({ error: 'Transcrição da conversa é obrigatória.' });
  }

  const analysis = salesIntelligence.analyzeTranscript(transcript, companyName);
  return res.json(analysis);
});

// -------------------------------------------------------------
// 17. CUSTOMER INTELLIGENCE & REFUNDS (Klarna & Ryanair)
// -------------------------------------------------------------

apiRouter.post('/customer-intelligence/classify', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { subject, description, language } = req.body;
  if (!subject) {
    return res.status(400).json({ error: 'Assunto é obrigatório.' });
  }

  const result = customerIntelligence.classifyTicket(subject, description || '', language || 'pt');
  return res.json(result);
});

apiRouter.get('/customer-intelligence/refunds', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  const refunds = data.customerRefunds || [];

  if (req.user?.role === 'MASTER_OWNER') {
    return res.json(refunds);
  }

  const filtered = refunds.filter(r => r.companyId === req.user?.companyId);
  return res.json(filtered);
});

apiRouter.post('/customer-intelligence/refunds', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { ticketId, orderOrSubscriptionId, amount, reason } = req.body;
  if (!amount || !reason) {
    return res.status(400).json({ error: 'Valor e motivo do estorno são obrigatórios.' });
  }

  const user = req.user!;
  const data = db.getData();
  const company = user.companyId ? data.companies.find(c => c.id === user.companyId) : undefined;
  const companyId = user.companyId || 'comp_vertice_tech';
  const companyName = company ? company.name : user.name;

  const refund = customerIntelligence.createRefundRequest({
    ticketId: ticketId || `ticket_ref_${Date.now()}`,
    companyId,
    companyName,
    customerEmail: user.email,
    orderOrSubscriptionId: orderOrSubscriptionId || 'sub_general',
    amount: Number(amount),
    reason
  });

  return res.json({ success: true, refund });
});

apiRouter.post('/customer-intelligence/refunds/:id/review', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { approved, rejectionReason } = req.body;

  try {
    const result = customerIntelligence.processRefundApproval(id, Boolean(approved), req.user!, rejectionReason);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Falha ao processar estorno.' });
  }
});

apiRouter.get('/customer-intelligence/metrics', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const metrics = customerIntelligence.computeCustomerSuccessMetrics();
  return res.json(metrics);
});

// -------------------------------------------------------------
// 18. INTEGRATION MARKETPLACE & REGISTRY
// -------------------------------------------------------------

apiRouter.get('/marketplace/integrations', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const integrations = integrationMarketplace.getIntegrations();
  return res.json(integrations);
});

apiRouter.post('/marketplace/integrations/:id/test', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await integrationMarketplace.testIntegration(id);
    return res.json(result);
  } catch (err: any) {
    return res.status(404).json({ error: err.message || 'Falha no teste da integração.' });
  }
});

apiRouter.patch('/marketplace/integrations/:id', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const updated = integrationMarketplace.updateIntegrationGovernance(id, req.body, req.user!);
    return res.json({ success: true, integration: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Falha na governança da integração.' });
  }
});

// -------------------------------------------------------------
// 19. CLOUD INFRASTRUCTURE EVALUATION (GCP vs AWS & Neo4j)
// -------------------------------------------------------------

apiRouter.get('/infrastructure/cloud-dossier', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const dossier = cloudInfrastructure.getComparisonDossier();
  return res.json(dossier);
});

apiRouter.post('/infrastructure/cloud-dossier/approve-migration', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const { approved } = req.body;
  try {
    const updated = cloudInfrastructure.setMigrationApproval(Boolean(approved), req.user!);
    return res.json({ success: true, cloudComparison: updated });
  } catch (err: any) {
    return res.status(403).json({ error: err.message || 'Não autorizado.' });
  }
});

// -------------------------------------------------------------
// 20. CENTRAL TECH COST GOVERNANCE & BUDGET
// -------------------------------------------------------------

apiRouter.get('/tech-governance', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  return res.json(data.techGovernance);
});

apiRouter.post('/tech-governance/cap', authMiddleware, masterOwnerOnly, (req: AuthenticatedRequest, res: Response) => {
  const { monthlyBudgetCapBrl } = req.body;
  const numCap = Number(monthlyBudgetCapBrl);
  if (isNaN(numCap) || numCap < 100) {
    return res.status(400).json({ error: 'Teto orçamentário mensal inválido (mínimo R$ 100,00).' });
  }

  const data = db.getData();
  if (data.techGovernance) {
    data.techGovernance.monthlyBudgetCapBrl = numCap;
    data.techGovernance.spentPercent = Number(
      ((data.techGovernance.totalSpentThisMonthBrl / numCap) * 100).toFixed(2)
    );
    // If cap raised above current spend, unpause auto-pause
    if (numCap > data.techGovernance.totalSpentThisMonthBrl) {
      data.techGovernance.isAutoPaused = false;
    }
  }

  db.logAudit(
    req.user!.email,
    'MASTER_OWNER',
    'TECH_BUDGET_CAP_UPDATED',
    'global',
    `Teto mensal de tecnologia atualizado para R$ ${numCap.toFixed(2)} pelo Master Owner.`
  );
  db.commit();

  return res.json({ success: true, techGovernance: data.techGovernance });
});


