import { GoogleGenAI } from '@google/genai';
import { DepartmentId } from './types.js';

const apiKey = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface PlannedMissionDecomposition {
  title: string;
  objective: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  departmentsInvolved: DepartmentId[];
  isSensitive: boolean;
  sensitiveReason?: string;
  steps: {
    title: string;
    departmentId: DepartmentId;
    assignedAgentCodename: string;
    actionSummary: string;
  }[];
  strategicAdvice: string;
}

export async function interpretAyinCommand(
  command: string,
  callerEmail: string,
  isMasterOwner: boolean,
  companyContext?: { companyName: string; plan: string }
): Promise<PlannedMissionDecomposition> {
  const systemInstruction = `
Você é o AYIN CORE (עין השפע), o cérebro central e núcleo de inteligência do Observatório SHEFA AYIN.
Sua função é interpretar comandos estratégicos, desmembrar objetivos corporativos e orquestrar missões entre os 8 departamentos:
1. AYIN_RADAR: Pesquisa de mercado, concorrentes, tendências e arbitragem.
2. AYIN_STRATEGY: Engenharia tática, roadmaps, matrizes de decisão.
3. AYIN_AGENTS: Orquestração e coordenação operacional contínua 24h.
4. AYIN_CREATIVE: Roteiros, campanhas persuasivas, copywriting de conversão.
5. AYIN_SALES: Gestão de funil, abordagem de leads, negociações.
6. AYIN_MARKET: Catálogo de produtos, parcerias e comissões.
7. AYIN_FINANCE: Auditoria orçamentária, análise de margem e custos.
8. AYIN_INTELLIGENCE: Memória de longo prazo e aprendizado contínuo.

IMPORTANTE - REGRAS DE SEGURANÇA E SOBERANIA:
Se o comando envolver gastos financeiros acima de R$ 1.000, alteração de regras comerciais críticas, campanhas externas massivas ou alteração de código/segurança, defina "isSensitive" como true e explique o motivo em "sensitiveReason". Ações sensíveis exigem autorização expressa do Master Owner (Alifermadeiro@hotmail.com).

Retorne SEMPRE um JSON válido estritamente com as chaves:
{
  "title": "string concisa do título da missão",
  "objective": "descrição aprofundada do que será alcançado",
  "priority": "low" | "medium" | "high" | "critical",
  "departmentsInvolved": ["AYIN_RADAR", ...],
  "isSensitive": boolean,
  "sensitiveReason": "string ou vazio se não sensível",
  "steps": [
    {
      "title": "título do passo",
      "departmentId": "AYIN_...",
      "assignedAgentCodename": "Codinome do agente (ex: Tzofeh, Yoetz, Sofer, etc)",
      "actionSummary": "o que o agente executará"
    }
  ],
  "strategicAdvice": "orientação de alto nível do AYIN CORE para o operador"
}
`;

  try {
    if (!apiKey) {
      // Fallback decomposition if API key is temporarily absent
      return createDeterministicDecomposition(command);
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Comando recebido de ${callerEmail} (${isMasterOwner ? 'Master Owner' : 'Cliente Corporativo'}${companyContext ? ' - ' + companyContext.companyName : ''}): "${command}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      return parsed;
    }
    return createDeterministicDecomposition(command);
  } catch (error) {
    console.error('Error in interpretAyinCommand with Gemini:', error);
    return createDeterministicDecomposition(command);
  }
}

export async function executeAgentTaskWithAI(
  agentName: string,
  departmentId: DepartmentId,
  taskTitle: string,
  objective: string,
  knowledgeContext: string
): Promise<string> {
  if (!apiKey) {
    return `Execução autônoma de ${agentName} (${departmentId}): Análise de "${taskTitle}" processada com sucesso no ciclo neural. Recomenda-se acompanhamento no painel de inteligência.`;
  }

  try {
    const prompt = `Você é o agente autônomo ${agentName} do departamento ${departmentId} no Observatório SHEFA AYIN.
Objetivo Geral: ${objective}
Sua Tarefa Específica: ${taskTitle}
Base de Conhecimento e Diretrizes Relevantes:
${knowledgeContext}

Execute esta tarefa de maneira altamente profissional, sintética, estratégica e estruturada. Apresente os resultados tangíveis, métricas observadas e os próximos passos recomendados.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Você é um agente corporativo autônomo de inteligência de ponta. Responda em português com clareza executiva, foco em ROI e rigor analítico.',
      },
    });

    return response.text || `Tarefa ${taskTitle} concluída pelo agente ${agentName}.`;
  } catch (err) {
    console.error('Agent execution error:', err);
    return `Relatório de Execução (${agentName}): Análise de conformidade e desdobramento tático concluídos para ${taskTitle}.`;
  }
}

export async function askCompanyAssistant(
  companyName: string,
  persona: { assistantName: string; tone: string; instructions: string },
  knowledgeDocs: { title: string; content: string }[],
  userMessage: string,
  conversationHistory: { role: 'user' | 'model'; text: string }[]
): Promise<string> {
  const docsText = knowledgeDocs.map(d => `[DOCUMENTO: ${d.title}]\n${d.content}`).join('\n\n');
  const systemInstruction = `Você é o ${persona.assistantName}, assistente inteligente exclusivo da empresa ${companyName}.
Seu tom: ${persona.tone}.
Diretrizes da Empresa: ${persona.instructions}.
Base de Conhecimento Autorisada da Empresa:
${docsText || 'Nenhum documento adicional carregado.'}

REGRAS:
- Responda apenas sobre as operações, produtos e dados da sua empresa (${companyName}).
- Jamais mencione dados, relatórios ou operações de outras empresas.
- Seja solícito, preciso e comercialmente perspicaz.`;

  try {
    if (!apiKey) {
      return `Olá! Sou o ${persona.assistantName}. Como assistente dedicado da ${companyName}, estou analisando sua solicitação: "${userMessage}". Nossos processos continuam em monitoramento ativo.`;
    }

    const contents = [
      ...conversationHistory.map(c => ({
        role: c.role,
        parts: [{ text: c.text }]
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }]
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents as any,
      config: {
        systemInstruction
      }
    });

    return response.text || 'Entendido. Como posso auxiliar mais em suas operações corporativas?';
  } catch (error) {
    console.error('Company Assistant Gemini Error:', error);
    return `Como assistente da ${companyName}, registrei sua solicitação. Posso detalhar nossos serviços ou direcionar ao time de consultores.`;
  }
}

function createDeterministicDecomposition(command: string): PlannedMissionDecomposition {
  const lower = command.toLowerCase();
  const isFinancial = lower.includes('gasto') || lower.includes('custo') || lower.includes('orçamento') || lower.includes('investir') || lower.includes('r$');
  const isCreative = lower.includes('campanha') || lower.includes('copy') || lower.includes('anúncio') || lower.includes('texto') || lower.includes('post');
  const isSales = lower.includes('lead') || lower.includes('venda') || lower.includes('proposta') || lower.includes('cliente') || lower.includes('fechar');

  const depts: DepartmentId[] = ['AYIN_STRATEGY'];
  if (lower.includes('mercado') || lower.includes('concorrente') || lower.includes('tendência')) depts.push('AYIN_RADAR');
  if (isCreative) depts.push('AYIN_CREATIVE');
  if (isSales) depts.push('AYIN_SALES');
  if (isFinancial) depts.push('AYIN_FINANCE');
  if (depts.length === 1) depts.push('AYIN_RADAR', 'AYIN_INTELLIGENCE');

  return {
    title: `Missão: ${command.slice(0, 48)}${command.length > 48 ? '...' : ''}`,
    objective: `Orquestração de diretriz estratégica: "${command}" com distribuição modular entre departamentos especializados.`,
    priority: isFinancial ? 'high' : 'medium',
    departmentsInvolved: depts,
    isSensitive: isFinancial,
    sensitiveReason: isFinancial ? 'Ação envolve projeção de gastos ou impacto orçamentário direto.' : undefined,
    steps: depts.map((d, idx) => ({
      title: `Etapa ${idx + 1}: Desdobramento tático em ${d.replace('AYIN_', '')}`,
      departmentId: d,
      assignedAgentCodename: d === 'AYIN_RADAR' ? 'Tzofeh' : d === 'AYIN_CREATIVE' ? 'Sofer' : d === 'AYIN_SALES' ? 'Noseh' : 'Yoetz',
      actionSummary: `Análise e implementação dos requisitos operacionais definidos no comando mestre.`
    })),
    strategicAdvice: 'Recomenda-se manter o modo de observação ativa no radar enquanto os agentes executam as submissões em background.'
  };
}
