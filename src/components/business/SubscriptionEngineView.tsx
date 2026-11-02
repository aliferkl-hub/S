import React, { useState } from 'react';
import { PlanDefinition, Subscription, User, PixCharge } from '../../types/index.ts';
import { PixCheckoutModal } from './PixCheckoutModal.tsx';
import { 
  Check, 
  Sparkles, 
  ShieldCheck, 
  QrCode, 
  Zap, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  HelpCircle,
  Users,
  Cpu,
  FileText
} from 'lucide-react';

interface SubscriptionEngineViewProps {
  plans: PlanDefinition[];
  subscriptions: Subscription[];
  currentUser: User | null;
  onRefreshData: () => void;
}

export const SubscriptionEngineView: React.FC<SubscriptionEngineViewProps> = ({
  plans,
  subscriptions,
  currentUser,
  onRefreshData
}) => {
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PlanDefinition | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const isMaster = currentUser?.role === 'MASTER_OWNER';
  const mySubscription = subscriptions.find(s => s.companyId === currentUser?.companyId) || (subscriptions.length > 0 ? subscriptions[0] : null);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 animate-fade-in">
      {/* Header Banner */}
      <div className="p-8 glass-obsidian-gold rounded-2xl border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-cinzel text-amber-300 font-bold tracking-widest">
              TABELA OFICIAL DE PLANOS SAAS
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-cinzel font-bold text-white tracking-wide">
            Planos Comerciais SHEFA AYIN
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed font-light">
            Planos desenhados para cada fase de maturação da sua empresa. Ativação imediata com conciliação automática via Pix oficial (Chave celular: <strong>11973479473</strong>).
          </p>
        </div>

        {/* Cycle Toggle */}
        <div className="p-1 glass-obsidian rounded-xl border border-purple-900/40 flex items-center gap-1 shrink-0">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              billingCycle === 'monthly' ? 'bg-amber-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Faturamento Mensal
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-2.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
              billingCycle === 'annual' ? 'bg-amber-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Plano Anual</span>
            <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-amber-200 font-bold">2 MESES GRÁTIS</span>
          </button>
        </div>
      </div>

      {/* 3 Tier Commercial Cards (Astral R$ 197, Cosmic R$ 497, Infinity R$ 1.497) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isFeatured = plan.tier === 'Cosmic Growth';
          const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
          const isMyCurrent = mySubscription?.planTier === plan.tier && mySubscription.status === 'ACTIVE';

          return (
            <div
              key={plan.id}
              className={`p-6 rounded-2xl flex flex-col justify-between transition-all relative ${
                isFeatured
                  ? 'glass-obsidian-gold border-2 border-amber-400/60 shadow-2xl shadow-amber-950/40 glow-gold scale-[1.02]'
                  : 'glass-obsidian border border-purple-900/30 hover:border-amber-400/30'
              }`}
            >
              {isFeatured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-[10px] font-bold rounded-full uppercase tracking-wider shadow">
                  Mais Popular · Aceleração Comercial
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-mono-numbers text-amber-400 uppercase tracking-widest block mb-0.5">
                    {plan.tier}
                  </span>
                  <h3 className="text-xl font-cinzel font-bold text-white">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-light mt-1">
                    {plan.targetAudience}
                  </p>
                </div>

                {/* Price Display */}
                <div className="p-4 bg-[#07070f] rounded-xl border border-purple-900/30">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-mono-numbers text-amber-300">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(price)}
                    </span>
                    <span className="text-xs text-slate-400">
                      /{billingCycle === 'annual' ? 'ano' : 'mês'}
                    </span>
                  </div>
                  {billingCycle === 'annual' && (
                    <span className="text-[11px] text-amber-400 font-mono-numbers block mt-1">
                      Equivalente a R$ {Math.round(plan.annualPrice / 12)}/mês
                    </span>
                  )}
                </div>

                {/* Core Limits Capsule */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-numbers text-slate-300 pt-1">
                  <div className="p-2 bg-[#050508] rounded-lg border border-purple-900/20">
                    <span className="text-slate-500 block text-[10px]">Usuários:</span>
                    <span className="font-bold text-white">{plan.limits.maxUsers} assentos</span>
                  </div>
                  <div className="p-2 bg-[#050508] rounded-lg border border-purple-900/20">
                    <span className="text-slate-500 block text-[10px]">Agentes:</span>
                    <span className="font-bold text-amber-300">{plan.limits.maxAgents} agentes</span>
                  </div>
                  <div className="p-2 bg-[#050508] rounded-lg border border-purple-900/20">
                    <span className="text-slate-500 block text-[10px]">Tarefas/mês:</span>
                    <span className="font-bold text-white">{plan.limits.monthlyMissions} missões</span>
                  </div>
                  <div className="p-2 bg-[#050508] rounded-lg border border-purple-900/20">
                    <span className="text-slate-500 block text-[10px]">Base Docs:</span>
                    <span className="font-bold text-white">{plan.limits.maxKnowledgeDocs} docs</span>
                  </div>
                </div>

                {/* Feature Bullet List */}
                <div className="space-y-2 pt-2 border-t border-purple-900/20">
                  <span className="text-[11px] font-semibold text-slate-400 block">Recursos inclusos no plano:</span>
                  <ul className="space-y-1.5 text-xs text-slate-300 font-light">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-purple-900/20">
                <button
                  onClick={() => setSelectedPlanForCheckout(plan)}
                  className={`w-full py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow ${
                    isFeatured
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold'
                      : 'bg-purple-900/60 hover:bg-purple-800 text-white border border-purple-700/40'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>{isMyCurrent ? 'Renovar / Alterar Ciclo Pix' : 'Contratar via Pix'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparative Limits Matrix Table */}
      <div className="p-6 glass-obsidian rounded-2xl border border-purple-900/30 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-purple-900/20">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-cinzel font-bold text-white">
              Matriz Comparativa de Recursos & Limites
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-light">
            Transparência absoluta nas cotas de computação
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-purple-900/30 text-slate-400">
                <th className="py-3 px-4 font-semibold">Recurso / Cota</th>
                <th className="py-3 px-4 font-semibold text-center">Astral Starter (R$ 197)</th>
                <th className="py-3 px-4 font-semibold text-center text-amber-300">Cosmic Growth (R$ 497)</th>
                <th className="py-3 px-4 font-semibold text-center text-amber-400">Infinity Enterprise (R$ 1.497)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-900/20 text-slate-300 font-light font-mono-numbers">
              <tr>
                <td className="py-3 px-4 font-sans font-medium text-white flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>Usuários Autorizados</span>
                </td>
                <td className="py-3 px-4 text-center">2 usuários</td>
                <td className="py-3 px-4 text-center font-bold text-white">5 usuários</td>
                <td className="py-3 px-4 text-center font-bold text-amber-300">Até 25 usuários corporativos</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-sans font-medium text-white flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-amber-400" />
                  <span>Agentes Simultâneos 24/7</span>
                </td>
                <td className="py-3 px-4 text-center">3 agentes</td>
                <td className="py-3 px-4 text-center font-bold text-white">8 agentes especializados</td>
                <td className="py-3 px-4 text-center font-bold text-amber-300">11 agentes (Constelação total)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-sans font-medium text-white flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Missões & Tarefas por Mês</span>
                </td>
                <td className="py-3 px-4 text-center">150 missões/mês</td>
                <td className="py-3 px-4 text-center font-bold text-white">600 missões/mês</td>
                <td className="py-3 px-4 text-center font-bold text-amber-300">3.000+ missões de alta demanda</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-sans font-medium text-white flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Base de Conhecimento Privativa</span>
                </td>
                <td className="py-3 px-4 text-center">Até 15 documentos</td>
                <td className="py-3 px-4 text-center font-bold text-white">Até 50 documentos</td>
                <td className="py-3 px-4 text-center font-bold text-amber-300">Até 200 documentos & Manuais</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-sans font-medium text-white">Produtos Emblemáticos Incluídos</td>
                <td className="py-3 px-4 text-center">AYIN CORE</td>
                <td className="py-3 px-4 text-center font-bold text-white">AYIN SALES + CUSTOMER + CORE</td>
                <td className="py-3 px-4 text-center font-bold text-amber-300">SALES + CUSTOMER + FINANCE + CORE</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-sans font-medium text-white">Persona de IA Customizada</td>
                <td className="py-3 px-4 text-center text-slate-500">—</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-bold">Sim (Tom e Instruções)</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-bold">Sim + Fine-tuning dedicado</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-sans font-medium text-white">Conciliação Pix Instantânea</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-bold">Inclusa</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-bold">Inclusa</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-bold">Inclusa com Webhook</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-sans font-medium text-white">Suporte & Gestão de Conta</td>
                <td className="py-3 px-4 text-center">Suporte padrão</td>
                <td className="py-3 px-4 text-center">Suporte prioritário</td>
                <td className="py-3 px-4 text-center text-amber-300 font-bold">Gerente de Conta & Consultoria</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Checkout Modal with Pix */}
      {selectedPlanForCheckout && (
        <PixCheckoutModal
          plan={selectedPlanForCheckout}
          currentUser={currentUser}
          onClose={() => setSelectedPlanForCheckout(null)}
          onSuccess={() => {
            setSelectedPlanForCheckout(null);
            onRefreshData();
          }}
        />
      )}
    </div>
  );
};
