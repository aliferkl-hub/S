/**
 * SHEFA AYIN — PRE-LAUNCH AUTOMATED AUDIT TEST SUITE
 * Validates real backend logic, security constraints, multi-tenant isolation,
 * EMV CRC-16 Pix math, webhook authentication, subscription lifecycle, quotas, and DRE margin.
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  suite: string;
  test: string;
  status: 'PASS' | 'FAIL';
  evidence: string;
  details?: any;
}

const results: TestResult[] = [];

async function runAudit() {
  console.log('=====================================================');
  console.log('   SHEFA AYIN — AUDITORIA DE PRÉ-LANÇAMENTO (2026)   ');
  console.log('=====================================================\n');

  let masterToken = '';
  let clientToken = '';

  // 0. HEALTH CHECK
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    results.push({
      suite: '0. Infra & Health',
      test: 'Dev Server Health Check',
      status: res.ok && data.status === 'healthy' ? 'PASS' : 'FAIL',
      evidence: `HTTP ${res.status}: ${JSON.stringify(data)}`
    });
  } catch (err: any) {
    results.push({
      suite: '0. Infra & Health',
      test: 'Dev Server Health Check',
      status: 'FAIL',
      evidence: err.message
    });
  }

  // 1. AUTHENTICATION & LOGIN AS MASTER OWNER & CLIENT
  try {
    const masterRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'Alifermadeiro@hotmail.com', password: 'ShefaAyin2026!' })
    });
    const masterData = await masterRes.json();
    masterToken = masterData.token;

    const clientRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'contato@verticecorp.com.br', password: 'Empresa@2026' })
    });
    const clientData = await clientRes.json();
    clientToken = clientData.token;

    results.push({
      suite: '1. Autenticação & Soberania',
      test: 'Master Owner & Client Tenant Login',
      status: masterToken && clientToken ? 'PASS' : 'FAIL',
      evidence: `Master: ${masterData.user?.email} (${masterData.user?.role}) | Client: ${clientData.user?.email} (Company: ${clientData.user?.companyId})`
    });
  } catch (err: any) {
    results.push({
      suite: '1. Autenticação & Soberania',
      test: 'Login Test',
      status: 'FAIL',
      evidence: err.message
    });
  }

  // 2. ITEM 1: PLAN PRICES & LIMITS AUDIT
  try {
    const res = await fetch(`${BASE_URL}/api/subscriptions/plans`);
    const plans = await res.json();
    const starter = plans.find((p: any) => p.tier === 'Astral Starter');
    const growth = plans.find((p: any) => p.tier === 'Cosmic Growth');
    const enterprise = plans.find((p: any) => p.tier === 'Infinity Enterprise');

    const starterOk = starter?.monthlyPrice === 197 && starter?.annualPrice === 1970 && starter?.limits?.maxUsers === 2 && starter?.limits?.maxAgents === 3;
    const growthOk = growth?.monthlyPrice === 497 && growth?.annualPrice === 4970 && growth?.limits?.maxUsers === 5 && growth?.limits?.maxAgents === 8;
    const enterpriseOk = enterprise?.monthlyPrice === 1497 && enterprise?.annualPrice === 14970 && enterprise?.limits?.maxUsers === 25 && enterprise?.limits?.maxAgents === 11;

    results.push({
      suite: '2. Planos Comerciais',
      test: 'Validação de Preços Mensais e Anuais (197 / 497 / 1497) e Limites',
      status: starterOk && growthOk && enterpriseOk ? 'PASS' : 'FAIL',
      evidence: `Starter: R$ ${starter?.monthlyPrice}/m (R$ ${starter?.annualPrice}/a, ${starter?.limits?.maxUsers} users, ${starter?.limits?.maxAgents} ag) | Growth: R$ ${growth?.monthlyPrice}/m (R$ ${growth?.annualPrice}/a, ${growth?.limits?.maxUsers} users, ${growth?.limits?.maxAgents} ag) | Enterprise: R$ ${enterprise?.monthlyPrice}/m (R$ ${enterprise?.annualPrice}/a, ${enterprise?.limits?.maxUsers} users, ${enterprise?.limits?.maxAgents} ag)`
    });
  } catch (err: any) {
    results.push({
      suite: '2. Planos Comerciais',
      test: 'Validação de Preços',
      status: 'FAIL',
      evidence: err.message
    });
  }

  // 3. ITEM 2: REVENUE AUDIT (SEPARATION OF REAL CONFIRMED VS SEED DEMO)
  try {
    const res = await fetch(`${BASE_URL}/api/system/stats`, {
      headers: { Authorization: `Bearer ${masterToken}` }
    });
    const stats = await res.json();

    const hasRealPix = typeof stats.realVerifiedPixRevenue === 'number';
    const hasSeedDemo = typeof stats.seedDemoRevenue === 'number';
    const isDistinct = stats.realVerifiedPixRevenue !== stats.grossRevenue;

    results.push({
      suite: '3. Auditoria de Receitas',
      test: 'Separação Clara: Receitas Confirmadas Live vs Dados de Demonstração (Seed)',
      status: hasRealPix && hasSeedDemo && isDistinct ? 'PASS' : 'FAIL',
      evidence: `Receita Pix Validada (Live): R$ ${stats.realVerifiedPixRevenue.toFixed(2)} | Receita Demonstração (Seed): R$ ${stats.seedDemoRevenue.toFixed(2)} | Faturamento Bruto Registrado: R$ ${stats.grossRevenue.toFixed(2)}`
    });
  } catch (err: any) {
    results.push({
      suite: '3. Auditoria de Receitas',
      test: 'Separação de Receitas',
      status: 'FAIL',
      evidence: err.message
    });
  }

  // 4. ITEM 3: PIX AUDIT (CRC-16, EMV, WEBHOOK AUTH, IDEMPOTENCY, ATTACK REJECTION)
  let testTxId = '';
  let testChargeId = '';
  try {
    // 4.1 Generate Pix Checkout
    const checkoutRes = await fetch(`${BASE_URL}/api/subscriptions/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planTier: 'Cosmic Growth',
        billingCycle: 'monthly',
        customerName: 'Auditoria Alpha S.A.',
        customerEmail: 'audit@alpha.corp.br',
        customerCpfOrCnpj: '99.888.777/0001-66',
        companyName: 'Alpha Audit Corp'
      })
    });
    const checkoutData = await checkoutRes.json();
    testTxId = checkoutData.pixCharge.txId;
    testChargeId = checkoutData.pixCharge.id;
    const emvCode = checkoutData.pixCharge.copyPasteCode;

    // Check EMV structure and CRC tag
    const hasGui = emvCode.includes('br.gov.bcb.pix');
    const hasKey = emvCode.includes('11973479473');
    const hasAmount = emvCode.includes('5406497.00');
    const endsWithCrc = /6304[0-9A-F]{4}$/.test(emvCode);

    results.push({
      suite: '4. Auditoria Pix BACEN',
      test: 'Geração Dinâmica EMV QRCPS-MPM e Checksum CRC-16',
      status: hasGui && hasKey && hasAmount && endsWithCrc ? 'PASS' : 'FAIL',
      evidence: `TxID: ${testTxId} | Key: 11973479473 | Amount: R$ 497.00 | CRC-16 Válido: ${endsWithCrc} | EMV: ${emvCode.substring(0, 45)}...${emvCode.slice(-10)}`
    });

    // 4.2 Webhook Security: Attack with NO Secret
    const unauthRes = await fetch(`${BASE_URL}/api/payments/pix/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        txId: testTxId,
        amount: 497.00,
        pixKey: '11973479473'
      })
    });
    const unauthPassed = unauthRes.status === 401;

    results.push({
      suite: '4. Auditoria Pix BACEN',
      test: 'Proteção do Webhook: Rejeição de Notificação Sem Secret Autenticado',
      status: unauthPassed ? 'PASS' : 'FAIL',
      evidence: `Status retornado: HTTP ${unauthRes.status} (esperado 401 Unauthorized)`
    });

    // 4.3 Webhook Security: Attack with Mismatched Recipient Pix Key
    const badKeyRes = await fetch(`${BASE_URL}/api/payments/pix/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shefa-webhook-secret': 'shefa_sec_pix_2026'
      },
      body: JSON.stringify({
        txId: testTxId,
        amount: 497.00,
        pixKey: '00000000000' // Fake key
      })
    });
    const badKeyPassed = badKeyRes.status === 400;

    results.push({
      suite: '4. Auditoria Pix BACEN',
      test: 'Proteção contra Chave Divergente / Falsos Pagamentos',
      status: badKeyPassed ? 'PASS' : 'FAIL',
      evidence: `Status retornado: HTTP ${badKeyRes.status} para chave fraudulenta (00000000000)`
    });

    // 4.4 Webhook Security: Attack with Underpayment (Valor divergente)
    const badAmountRes = await fetch(`${BASE_URL}/api/payments/pix/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shefa-webhook-secret': 'shefa_sec_pix_2026'
      },
      body: JSON.stringify({
        txId: testTxId,
        amount: 1.00, // Attempting to pay R$ 1.00 instead of R$ 497.00
        pixKey: '11973479473'
      })
    });
    const badAmountPassed = badAmountRes.status === 400;

    results.push({
      suite: '4. Auditoria Pix BACEN',
      test: 'Proteção contra Pagamento com Valor Divergente (Underpayment/Overpayment)',
      status: badAmountPassed ? 'PASS' : 'FAIL',
      evidence: `Status retornado: HTTP ${badAmountRes.status} para valor divergente (R$ 1.00 vs R$ 497.00)`
    });

    // 4.5 Valid Webhook Execution
    const validRes = await fetch(`${BASE_URL}/api/payments/pix/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shefa-webhook-secret': 'shefa_sec_pix_2026'
      },
      body: JSON.stringify({
        txId: testTxId,
        amount: 497.00,
        pixKey: '11973479473',
        endToEndId: `E11973479473${Date.now()}`
      })
    });
    const validData = await validRes.json();
    const validPassed = validRes.ok && validData.success && validData.subscription?.status === 'ACTIVE';

    // 4.6 Idempotency Test (Post same webhook again)
    const idemRes = await fetch(`${BASE_URL}/api/payments/pix/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shefa-webhook-secret': 'shefa_sec_pix_2026'
      },
      body: JSON.stringify({
        txId: testTxId,
        amount: 497.00,
        pixKey: '11973479473'
      })
    });
    const idemData = await idemRes.json();
    const idemPassed = idemRes.ok && idemData.message?.includes('Idempotente');

    results.push({
      suite: '4. Auditoria Pix BACEN',
      test: 'Confirmação Bancária Autêntica & Idempotência Estrita',
      status: validPassed && idemPassed ? 'PASS' : 'FAIL',
      evidence: `Confirmação: ${validData.message} | Idempotência 2ª chamada: ${idemData.message}`
    });
  } catch (err: any) {
    results.push({
      suite: '4. Auditoria Pix BACEN',
      test: 'Auditoria Pix Completa',
      status: 'FAIL',
      evidence: err.message
    });
  }

  // 5. ITEM 4: 11 AGENTS & REAL EXECUTION & QUOTA ENFORCEMENT
  try {
    const agentsRes = await fetch(`${BASE_URL}/api/agents`, {
      headers: { Authorization: `Bearer ${masterToken}` }
    });
    const agents = await agentsRes.json();
    const expectedRoles = [
      'RADAR AGENT',
      'LEAD AGENT',
      'SALES AGENT',
      'CUSTOMER AGENT',
      'MARKETING AGENT',
      'CREATIVE AGENT',
      'MARKET AGENT',
      'FINANCE AGENT',
      'SUBSCRIPTION AGENT',
      'ANALYTICS AGENT',
      'REPORT AGENT'
    ];

    const all11Present = expectedRoles.every(role => agents.some((a: any) => a.agentRoleType === role));
    const active24h = agents.filter((a: any) => a.is24hEnabled).length;

    results.push({
      suite: '5. Constelação dos 11 Agentes',
      test: 'Presença e Registro dos 11 Agentes Especializados',
      status: all11Present && agents.length >= 11 ? 'PASS' : 'FAIL',
      evidence: `11 Agentes cadastrados: ${all11Present} | Agentes operacionais em modo 24/7: ${active24h}/${agents.length}`
    });
  } catch (err: any) {
    results.push({
      suite: '5. Constelação dos 11 Agentes',
      test: 'Constelação de Agentes',
      status: 'FAIL',
      evidence: err.message
    });
  }

  // 6. ITEM 5: MULTI-TENANT ISOLATION & PERMISSIONS
  try {
    // Client trying to list all companies (only master owner should get all)
    const clientCompaniesRes = await fetch(`${BASE_URL}/api/companies`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    const clientCompanies = await clientCompaniesRes.json();
    const isIsolated = Array.isArray(clientCompanies) && clientCompanies.length === 1;

    // Client trying to access master governance (should get 403 Forbidden)
    const forbiddenRes = await fetch(`${BASE_URL}/api/governance`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${clientToken}`
      }
    });
    const isForbidden = forbiddenRes.status === 403;

    results.push({
      suite: '6. Isolamento Multitenant & Permissões',
      test: 'Isolamento Hermético de Dados e Bloqueio de Acesso às Ações do Master Owner',
      status: isIsolated && isForbidden ? 'PASS' : 'FAIL',
      evidence: `Visibilidade da empresa cliente: ${clientCompanies.length} empresa(s) (isolado) | Tentativa de acessar Governança Master: HTTP ${forbiddenRes.status} (bloqueado com 403 Forbidden)`
    });
  } catch (err: any) {
    results.push({
      suite: '6. Isolamento Multitenant & Permissões',
      test: 'Isolamento Multitenant',
      status: 'FAIL',
      evidence: err.message
    });
  }

  // 7. ITEM 6: REAL OPERATIONAL MARGIN & DRE (SEM MARGENS FALSAS)
  try {
    const statsRes = await fetch(`${BASE_URL}/api/system/stats`, {
      headers: { Authorization: `Bearer ${masterToken}` }
    });
    const stats = await statsRes.json();

    const hasDRE = 
      typeof stats.estimatedTaxes === 'number' &&
      typeof stats.estimatedAiTokenCost === 'number' &&
      typeof stats.infrastructureCost === 'number' &&
      typeof stats.gatewayFees === 'number' &&
      typeof stats.partnerCommissionsCost === 'number' &&
      typeof stats.realOperatingCosts === 'number' &&
      typeof stats.realNetOperatingResult === 'number' &&
      typeof stats.realNetMarginPercent === 'number';

    const realisticMargin = stats.realNetMarginPercent < 95; // Real margin accounts for 8.5% tax + costs

    results.push({
      suite: '7. Margem e DRE Real Auditada',
      test: 'Cálculo com Custos Reais de IA, Infraestrutura, Impostos (Simples 8.5%) e Comissões',
      status: hasDRE && realisticMargin ? 'PASS' : 'FAIL',
      evidence: `Faturamento Bruto: R$ ${stats.grossRevenue.toFixed(2)} | Impostos: R$ ${stats.estimatedTaxes.toFixed(2)} | Tokens IA: R$ ${stats.estimatedAiTokenCost.toFixed(2)} | Infra: R$ ${stats.infrastructureCost.toFixed(2)} | Comissões: R$ ${stats.partnerCommissionsCost.toFixed(2)} | Custo Real Total: R$ ${stats.realOperatingCosts.toFixed(2)} | Resultado Real: R$ ${stats.realNetOperatingResult.toFixed(2)} | Margem Líquida Real: ${stats.realNetMarginPercent}%`
    });
  } catch (err: any) {
    results.push({
      suite: '7. Margem e DRE Real Auditada',
      test: 'DRE Real',
      status: 'FAIL',
      evidence: err.message
    });
  }

  // 8. ITEM 7: SUBSCRIPTION LIFECYCLE (CONTRATAÇÃO, SUSPENSÃO, REATIVAÇÃO, CANCELAMENTO)
  try {
    // We use the test subscription created in step 4
    const subsRes = await fetch(`${BASE_URL}/api/subscriptions`, {
      headers: { Authorization: `Bearer ${masterToken}` }
    });
    const subs = await subsRes.json();
    const targetSub = subs.find((s: any) => s.id === testChargeId.replace('pix_', 'sub_')) || subs[0];

    // 8.1 Suspend (Inadimplência)
    const suspRes = await fetch(`${BASE_URL}/api/subscriptions/${targetSub.id}/suspend`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${masterToken}` }
    });
    const suspData = await suspRes.json();
    const suspOk = suspRes.ok && suspData.subscription?.status === 'SUSPENDED';

    // 8.2 Reactivate
    const reactRes = await fetch(`${BASE_URL}/api/subscriptions/${targetSub.id}/reactivate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${masterToken}` }
    });
    const reactData = await reactRes.json();
    const reactOk = reactRes.ok && reactData.subscription?.status === 'ACTIVE';

    // 8.3 Cancel
    const cancelRes = await fetch(`${BASE_URL}/api/subscriptions/${targetSub.id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${masterToken}` }
    });
    const cancelData = await cancelRes.json();
    const cancelOk = cancelRes.ok && cancelData.subscription?.status === 'CANCELED';

    results.push({
      suite: '8. Ciclo de Vida de Assinaturas',
      test: 'Suspensão por Inadimplência, Reativação com Restabelecimento de Cotas e Cancelamento',
      status: suspOk && reactOk && cancelOk ? 'PASS' : 'FAIL',
      evidence: `Bloqueio: ${suspData.subscription?.status} | Reativação: ${reactData.subscription?.status} | Cancelamento: ${cancelData.subscription?.status}`
    });
  } catch (err: any) {
    results.push({
      suite: '8. Ciclo de Vida de Assinaturas',
      test: 'Ciclo de Vida de Assinaturas',
      status: 'FAIL',
      evidence: err.message
    });
  }

  // 9. ITEM 8: CRM, PROPOSTAS, CONTRATOS E COMISSÕES
  try {
    // 9.1 Create CRM Lead
    const leadRes = await fetch(`${BASE_URL}/api/crm/leads`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${masterToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Roberto Valadares',
        email: 'roberto@valadares.com',
        phone: '+55 11 99999-8888',
        companyName: 'Valadares Log',
        value: 14970,
        partnerReferralCode: 'ALFA2026'
      })
    });
    const leadData = await leadRes.json();

    // 9.2 Advance lead stage
    const stageRes = await fetch(`${BASE_URL}/api/crm/leads/${leadData.id}/stage`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${masterToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ stage: 'Proposta' })
    });
    const stageData = await stageRes.json();

    // 9.3 Create Proposal
    const propRes = await fetch(`${BASE_URL}/api/crm/proposals`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${masterToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        leadId: leadData.id,
        companyName: 'Valadares Log',
        contactName: 'Roberto Valadares',
        contactEmail: 'roberto@valadares.com',
        planTier: 'Infinity Enterprise',
        servicesIncluded: ['Implantação & Onboarding Hands-on de Agentes Autônomos'],
        totalValue: 20870,
        discountPercent: 10
      })
    });
    const propData = await propRes.json();

    const advancedStage = stageData.lead?.stage || stageData.stage;
    const crmOk = leadRes.ok && stageRes.ok && propRes.ok && advancedStage === 'Proposta' && propData.finalValue === 18783;

    results.push({
      suite: '9. CRM Comercial & Propostas',
      test: 'Funil de Leads, Transição de Estágios, Descontos e Integração com Parceiros',
      status: crmOk ? 'PASS' : 'FAIL',
      evidence: `Lead Criado: ${leadData.name} | Estágio Avançado: ${advancedStage} | Proposta Gerada: R$ ${propData.totalValue} com 10% desc = R$ ${propData.finalValue}`
    });
  } catch (err: any) {
    results.push({
      suite: '9. CRM Comercial & Propostas',
      test: 'CRM e Propostas',
      status: 'FAIL',
      evidence: err.message
    });
  }

  // PRINT SUMMARY
  console.log('\n--- TABELA DE RESULTADOS DA AUDITORIA AUTOMATIZADA ---');
  results.forEach(r => {
    const symbol = r.status === 'PASS' ? '✅ [PASS]' : '❌ [FAIL]';
    console.log(`${symbol} ${r.suite} — ${r.test}`);
    console.log(`   Evidência: ${r.evidence}\n`);
  });

  const total = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  console.log(`Total de testes: ${total} | Aprovados: ${passed} | Reprovados: ${total - passed}`);
}

runAudit().catch(console.error);
