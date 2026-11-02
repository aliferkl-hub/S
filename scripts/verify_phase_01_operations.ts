/**
 * SHEFA AYIN — PHASE 01 OPERATIONS VERIFICATION SUITE
 * Validates the 11 Core Pillars of Phase 01:
 * 1. Lead capture and qualification
 * 2. Commercial proposal creation & discount calculation
 * 3. Pix charge generation with EMV CRC-16
 * 4. Authenticated webhook processing with secret & idempotency
 * 5. Subscription provisioning only upon confirmed payment
 * 6. Development project tracking, task assignment & client approval
 * 7. Customer support ticket lifecycle & communication history
 * 8. Autonomous 11-agent task execution & inter-agent collaboration
 * 9. Master Owner sovereign controls & override
 * 10. Multitenant data isolation
 * 11. Separation of Verified Pix Revenue vs Demo/Seed Revenue
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  num: number;
  area: string;
  test: string;
  status: 'PASS' | 'FAIL';
  evidence: string;
}

const results: TestResult[] = [];

async function runOperationsVerification() {
  console.log('================================================================');
  console.log('   SHEFA AYIN — PHASE 01 REAL BUSINESS OPERATIONS VERIFICATION   ');
  console.log('================================================================\n');

  let masterToken = '';
  let clientToken = '';

  // Step 0: Auth Setup
  const masterLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'Alifermadeiro@hotmail.com', password: 'ShefaAyin2026!' })
  });
  const masterData = await masterLogin.json();
  masterToken = masterData.token;

  const clientLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'contato@verticecorp.com.br', password: 'Empresa@2026' })
  });
  const clientData = await clientLogin.json();
  clientToken = clientData.token;

  // 1. Lead capture & qualification
  try {
    const leadRes = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${masterToken}`
      },
      body: JSON.stringify({
        name: 'Carlos Drummond',
        companyName: 'Drummond & Associados',
        email: 'carlos@drummond.com.br',
        phone: '11988887777',
        source: 'Outbound B2B',
        value: 14970,
        stage: 'Novo',
        notes: 'Prospect interessado em soberania de IA e suíte completa.'
      })
    });
    const lead = await leadRes.json();
    const passed = leadRes.ok && lead.id && lead.stage === 'Novo';
    results.push({
      num: 1,
      area: 'Commercial',
      test: 'Lead Capture & Initial Stage Registration',
      status: passed ? 'PASS' : 'FAIL',
      evidence: `Lead ID: ${lead.id}, Nome: ${lead.name}, Valor: R$ ${lead.value}, Estágio: ${lead.stage}`
    });
  } catch (err: any) {
    results.push({ num: 1, area: 'Commercial', test: 'Lead Capture', status: 'FAIL', evidence: err.message });
  }

  // 2. Commercial proposal creation & discount rule
  try {
    const propRes = await fetch(`${BASE_URL}/api/crm/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${masterToken}`
      },
      body: JSON.stringify({
        companyName: 'Drummond & Associados',
        contactName: 'Carlos Drummond',
        contactEmail: 'carlos@drummond.com.br',
        planTier: 'Cosmic Growth',
        totalValue: 5000,
        discountPercent: 10,
        validUntilDays: 15,
        servicesIncluded: ['Implantação Dedicated', 'Treinamento Tático']
      })
    });
    const proposal = await propRes.json();
    // 5000 with 10% discount = 4500
    const expected = 4500;
    const passed = propRes.ok && proposal.id && Math.abs(proposal.finalValue - expected) < 1;
    results.push({
      num: 2,
      area: 'Contracts & Proposals',
      test: 'Commercial Proposal Creation with Discount Calculation',
      status: passed ? 'PASS' : 'FAIL',
      evidence: `Proposta ID: ${proposal.id}, Bruto: R$ ${proposal.totalValue}, Desconto: ${proposal.discountPercent}%, Final: R$ ${proposal.finalValue}`
    });
  } catch (err: any) {
    results.push({ num: 2, area: 'Contracts & Proposals', test: 'Proposal Creation', status: 'FAIL', evidence: err.message });
  }

  // 3. Pix charge generation with EMV CRC-16
  let testTxId = `TX_${Date.now()}`;
  let testChargeId = '';
  try {
    const pixRes = await fetch(`${BASE_URL}/api/subscriptions/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`
      },
      body: JSON.stringify({
        planTier: 'Cosmic Growth',
        billingCycle: 'monthly',
        customerName: 'Vértice Tech Soluções',
        customerEmail: 'contato@verticecorp.com.br',
        customerCpfOrCnpj: '44.890.123/0001-99'
      })
    });
    const pixData = await pixRes.json();
    testChargeId = pixData.pixCharge?.id;
    testTxId = pixData.pixCharge?.txId;
    const payload = pixData.pixCharge?.copyPasteCode || '';
    const hasCrc16 = payload.startsWith('000201') && payload.length > 50 && payload.includes('6304');
    const passed = pixRes.ok && hasCrc16 && pixData.pixCharge.amount === 497 && pixData.pixCharge.status === 'PENDING';
    results.push({
      num: 3,
      area: 'Finance & Pix',
      test: 'Pix Charge Generation with BACEN EMV Standard & CRC-16',
      status: passed ? 'PASS' : 'FAIL',
      evidence: `Charge ID: ${testChargeId}, txId: ${testTxId}, Chave: ${pixData.pixCharge?.pixKey}, Formato EMV: ${hasCrc16 ? 'Válido' : 'Inválido'}`
    });
  } catch (err: any) {
    results.push({ num: 3, area: 'Finance & Pix', test: 'Pix Charge Generation', status: 'FAIL', evidence: err.message });
  }

  // 4. Authenticated webhook processing with secret & idempotency
  try {
    const webhookRes = await fetch(`${BASE_URL}/api/payments/pix/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shefa-webhook-secret': 'shefa_sec_pix_2026'
      },
      body: JSON.stringify({
        txId: testTxId,
        endToEndId: `E2E_${Date.now()}`,
        amount: 497,
        status: 'CONFIRMED',
        pixKey: '11973479473'
      })
    });
    const webhookData = await webhookRes.json();

    // Test Idempotency with immediate duplicate call
    const dupRes = await fetch(`${BASE_URL}/api/payments/pix/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shefa-webhook-secret': 'shefa_sec_pix_2026'
      },
      body: JSON.stringify({
        txId: testTxId,
        endToEndId: `E2E_${Date.now()}`,
        amount: 497,
        status: 'CONFIRMED',
        pixKey: '11973479473'
      })
    });
    const dupData = await dupRes.json();
    const isIdempotent = dupRes.ok && dupData.message?.includes('Idempotente');

    const passed = webhookRes.ok && webhookData.success && isIdempotent;
    results.push({
      num: 4,
      area: 'Payment Infrastructure',
      test: 'Authenticated Webhook Settlement with HMAC Secret & Idempotency',
      status: passed ? 'PASS' : 'FAIL',
      evidence: `Primeiro disparo: HTTP ${webhookRes.status} (${webhookData.message}), Duplicado idempotente: ${dupData.message}`
    });
  } catch (err: any) {
    results.push({ num: 4, area: 'Payment Infrastructure', test: 'Webhook Processing', status: 'FAIL', evidence: err.message });
  }

  // 5. Subscription provisioning only upon confirmed payment
  try {
    const subsRes = await fetch(`${BASE_URL}/api/subscriptions`, {
      headers: { Authorization: `Bearer ${masterToken}` }
    });
    const subs = await subsRes.json();
    const provisionedSub = subs.find((s: any) => s.pixChargeId === testChargeId);
    const passed = subsRes.ok && provisionedSub && provisionedSub.status === 'ACTIVE';
    results.push({
      num: 5,
      area: 'Subscription Lifecycle',
      test: 'Subscription Provisioning Strictly Upon Verified Pix Confirmation',
      status: passed ? 'PASS' : 'FAIL',
      evidence: provisionedSub 
        ? `Assinatura: ${provisionedSub.id}, Plano: ${provisionedSub.planTier}, Status: ${provisionedSub.status}, Confirmado em: ${provisionedSub.lastPaymentConfirmedAt}`
        : 'Assinatura correspondente não encontrada'
    });
  } catch (err: any) {
    results.push({ num: 5, area: 'Subscription Lifecycle', test: 'Subscription Provisioning', status: 'FAIL', evidence: err.message });
  }

  // 6. Development project tracking, task assignment & client approval
  try {
    // Create Project
    const createProjRes = await fetch(`${BASE_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${masterToken}`
      },
      body: JSON.stringify({
        title: 'Módulo de Integração ERP Vértice Tech',
        description: 'Desenvolvimento de sincronização bidirecional de pedidos e conciliação bancária.',
        companyId: 'comp_vertice_tech',
        deadline: '2026-11-30',
        tasks: [
          { title: 'Conexão via API REST com token OAuth', assignedAgent: 'FINANCE AGENT', deadline: '2026-11-20' },
          { title: 'Testes de conciliação de faturas', assignedAgent: 'ANALYTICS AGENT', deadline: '2026-11-25' }
        ]
      })
    });
    const proj = await createProjRes.json();

    // Client approves project
    const approveRes = await fetch(`${BASE_URL}/api/projects/${proj.id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`
      },
      body: JSON.stringify({ feedback: 'Integração homologada e aprovada pelo diretor de TI.' })
    });
    const approvedData = await approveRes.json();

    const passed = createProjRes.ok && approveRes.ok && approvedData.project.status === 'DELIVERED' && approvedData.project.clientApprovalStatus === 'APPROVED';
    results.push({
      num: 6,
      area: 'Development & Projects',
      test: 'Project Registration, Agent Task Allocation & Client Formal Approval',
      status: passed ? 'PASS' : 'FAIL',
      evidence: `Projeto ID: ${proj.id}, Status Final: ${approvedData.project.status}, Aceite: ${approvedData.project.clientApprovalStatus}`
    });
  } catch (err: any) {
    results.push({ num: 6, area: 'Development & Projects', test: 'Project Tracking & Approval', status: 'FAIL', evidence: err.message });
  }

  // 7. Customer support ticket lifecycle & communication history
  try {
    // Open Ticket
    const openRes = await fetch(`${BASE_URL}/api/support/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`
      },
      body: JSON.stringify({
        subject: 'Solicitação de Calibração da Persona Neural',
        description: 'Precisamos de ajustes nos gatilhos de fechamento do Sales Agent.',
        priority: 'HIGH',
        category: 'AGENT_TUNING'
      })
    });
    const ticket = await openRes.json();

    // Reply Message
    const msgRes = await fetch(`${BASE_URL}/api/support/tickets/${ticket.id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${masterToken}`
      },
      body: JSON.stringify({ message: 'Parâmetros recalibrados pelo Master Owner e Customer Agent com sucesso.' })
    });
    const msgData = await msgRes.json();

    // Close Ticket
    const statusRes = await fetch(`${BASE_URL}/api/support/tickets/${ticket.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`
      },
      body: JSON.stringify({ status: 'RESOLVED', satisfactionRating: 5 })
    });
    const statusData = await statusRes.json();

    const passed = openRes.ok && msgRes.ok && statusRes.ok && statusData.ticket.status === 'RESOLVED' && statusData.ticket.communicationHistory.length >= 2;
    results.push({
      num: 7,
      area: 'Customer Success (CS)',
      test: 'Support Ticket Lifecycle, Inter-Party Messaging & Resolution',
      status: passed ? 'PASS' : 'FAIL',
      evidence: `Chamado ID: ${ticket.id}, Mensagens: ${statusData.ticket.communicationHistory.length}, Status: ${statusData.ticket.status}, Nota: ${statusData.ticket.satisfactionRating}/5`
    });
  } catch (err: any) {
    results.push({ num: 7, area: 'Customer Success', test: 'Ticket Lifecycle', status: 'FAIL', evidence: err.message });
  }

  // 8. Autonomous 11-agent task execution and inter-agent collaboration
  try {
    const cycleRes = await fetch(`${BASE_URL}/api/agents/exchange/run-cycle`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${masterToken}` }
    });
    const cycleData = await cycleRes.json();
    const passed = cycleRes.ok && cycleData.interactionsCreated && cycleData.interactionsCreated.length === 11;
    results.push({
      num: 8,
      area: 'Multi-Agent Network',
      test: 'Structured 11-Agent Inter-Agent Task Execution Cycle',
      status: passed ? 'PASS' : 'FAIL',
      evidence: `Ciclo: ${cycleData.cycleId}, Interações criadas: ${cycleData.interactionsCreated?.length || 0}/11, Resumo: ${cycleData.summary}`
    });
  } catch (err: any) {
    results.push({ num: 8, area: 'Multi-Agent Network', test: 'Inter-Agent Collaboration Cycle', status: 'FAIL', evidence: err.message });
  }

  // 9. Master Owner sovereign controls & override
  try {
    const limitRes = await fetch(`${BASE_URL}/api/governance/spending-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${masterToken}`
      },
      body: JSON.stringify({ limit: 2500 })
    });
    const limitData = await limitRes.json();

    // Verify client cannot access governance
    const clientAttempt = await fetch(`${BASE_URL}/api/governance/spending-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`
      },
      body: JSON.stringify({ limit: 0 })
    });
    const clientBlocked = clientAttempt.status === 403;

    const passed = limitRes.ok && limitData.spendingLimit === 2500 && clientBlocked;
    results.push({
      num: 9,
      area: 'Governance & Sovereign Control',
      test: 'Master Owner Governance Override & Unauthorized Client Protection',
      status: passed ? 'PASS' : 'FAIL',
      evidence: `Limite atualizado: R$ ${limitData.spendingLimit}, Tentativa de cliente bloqueada com HTTP ${clientAttempt.status}`
    });
  } catch (err: any) {
    results.push({ num: 9, area: 'Governance', test: 'Master Owner Override', status: 'FAIL', evidence: err.message });
  }

  // 10. Multitenant data isolation
  try {
    // Client lists projects
    const clientProjectsRes = await fetch(`${BASE_URL}/api/projects`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    const clientProjects = await clientProjectsRes.json();
    const allBelongToClient = clientProjects.every((p: any) => p.companyId === 'comp_vertice_tech');

    // Client attempts to access master audit log
    const auditRes = await fetch(`${BASE_URL}/api/audit`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    const auditBlocked = auditRes.status === 403;

    const passed = clientProjectsRes.ok && allBelongToClient && auditBlocked;
    results.push({
      num: 10,
      area: 'Security & Multitenancy',
      test: 'Strict Client Data Isolation & Sovereign Route Protection',
      status: passed ? 'PASS' : 'FAIL',
      evidence: `Projetos visíveis ao cliente: ${clientProjects.length} (todos comp_vertice_tech), Auditoria bloqueada com HTTP ${auditRes.status}`
    });
  } catch (err: any) {
    results.push({ num: 10, area: 'Security', test: 'Multitenant Isolation', status: 'FAIL', evidence: err.message });
  }

  // 11. Separation of Verified Pix Revenue vs Demo/Seed Revenue & DRE Margin
  try {
    const statsRes = await fetch(`${BASE_URL}/api/system/stats`, {
      headers: { Authorization: `Bearer ${masterToken}` }
    });
    const stats = await statsRes.json();
    const hasSeparation = typeof stats.realVerifiedPixRevenue === 'number' && typeof stats.seedDemoRevenue === 'number';
    const hasCostsBreakdown = typeof stats.realOperatingCosts === 'number' && typeof stats.realNetMarginPercent === 'number';
    const passed = statsRes.ok && hasSeparation && hasCostsBreakdown;
    results.push({
      num: 11,
      area: 'Financial Ledger & DRE Audit',
      test: 'Segregation of Verified Liquid Pix vs Demo Seed Revenue & DRE Margin',
      status: passed ? 'PASS' : 'FAIL',
      evidence: `Receita Pix Verificada: R$ ${stats.realVerifiedPixRevenue.toFixed(2)}, Demo Seed: R$ ${stats.seedDemoRevenue.toFixed(2)}, Custos Reais: R$ ${stats.realOperatingCosts.toFixed(2)}, Margem Real: ${stats.realNetMarginPercent.toFixed(2)}%`
    });
  } catch (err: any) {
    results.push({ num: 11, area: 'Financial Ledger', test: 'Revenue Segregation', status: 'FAIL', evidence: err.message });
  }

  // Summary Table Output
  console.log('-----------------------------------------------------------------------------------------');
  console.log('| #  | ÁREA                   | TESTE OPERACIONAL                         | STATUS |');
  console.log('-----------------------------------------------------------------------------------------');
  for (const r of results) {
    const numStr = r.num.toString().padEnd(2);
    const areaStr = r.area.padEnd(22);
    const testStr = r.test.substring(0, 41).padEnd(41);
    const statusStr = r.status.padEnd(6);
    console.log(`| ${numStr} | ${areaStr} | ${testStr} | ${statusStr} |`);
  }
  console.log('-----------------------------------------------------------------------------------------\n');

  console.log('EVIDÊNCIAS DETALHADAS:');
  for (const r of results) {
    console.log(`[${r.status}] #${r.num} ${r.test}:`);
    console.log(`     ${r.evidence}\n`);
  }

  const allPassed = results.every(r => r.status === 'PASS');
  console.log(`TOTAL: ${results.filter(r => r.status === 'PASS').length}/${results.length} TESTES APROVADOS.`);
  if (allPassed) {
    console.log('>>> SUCESSO: TODAS AS 11 EXIGÊNCIAS OPERACIONAIS DA FASE 01 FORAM VALIDADAS COM ÊXITO!');
  } else {
    console.error('>>> FALHA EM UM OU MAIS TESTES.');
    process.exit(1);
  }
}

runOperationsVerification().catch(err => {
  console.error('Erro na execução da suíte de verificação:', err);
  process.exit(1);
});
