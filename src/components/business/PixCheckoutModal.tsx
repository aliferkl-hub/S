import React, { useState, useEffect } from 'react';
import { PlanDefinition, PixCharge, Subscription, User } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { 
  QrCode, 
  Copy, 
  Check, 
  Clock, 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ExternalLink,
  Zap
} from 'lucide-react';

interface PixCheckoutModalProps {
  plan: PlanDefinition;
  currentUser: User | null;
  onClose: () => void;
  onSuccess: (sub: Subscription) => void;
}

export const PixCheckoutModal: React.FC<PixCheckoutModalProps> = ({
  plan,
  currentUser,
  onClose,
  onSuccess
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [customerCpfCnpj, setCustomerCpfCnpj] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [pixCharge, setPixCharge] = useState<PixCharge | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [copied, setCopied] = useState(false);
  const [isHomologating, setIsHomologating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

  // Real-time verification polling while payment is PENDING
  useEffect(() => {
    if (!pixCharge || pixCharge.status === 'CONFIRMED') return;

    const interval = setInterval(async () => {
      try {
        const updated = await api.getPixCharge(pixCharge.id);
        if (updated.status === 'CONFIRMED') {
          setPixCharge(updated);
          if (subscription) {
            onSuccess({ ...subscription, status: 'ACTIVE' });
          }
        }
      } catch (err) {
        // silent polling error
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [pixCharge, subscription, onSuccess]);

  const handleGeneratePix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail.trim() || !customerName.trim()) {
      setErrorMsg('Preencha seu nome e email para a geração do Pix.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const res = await api.checkoutSubscription({
        planTier: plan.tier,
        billingCycle,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerCpfOrCnpj: customerCpfCnpj.trim() || undefined,
        companyName: companyName.trim() || undefined
      });

      setPixCharge(res.pixCharge);
      setSubscription(res.subscription);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao gerar cobrança Pix.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = () => {
    if (!pixCharge?.copyPasteCode) return;
    navigator.clipboard.writeText(pixCharge.copyPasteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSimulateWebhook = async () => {
    if (!pixCharge) return;
    setIsHomologating(true);
    try {
      const res = await api.simulatePixWebhook(pixCharge.id);
      setPixCharge(res.charge);
      if (res.subscription) {
        setSubscription(res.subscription);
        onSuccess(res.subscription);
      }
    } catch (err: any) {
      alert(err.message || 'Erro na homologação Pix.');
    } finally {
      setIsHomologating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-[#07070d] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-[#07070d] border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-md">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-cinzel font-bold text-white tracking-wide">
                  Pagamento Pix Oficial · {plan.name}
                </h3>
              </div>
              <p className="text-xs text-slate-300">
                Recebimento exclusivo na chave celular do Master Owner: 11973479473
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg glass-obsidian transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {!pixCharge ? (
            /* STEP 1: Plan Config & Customer Data */
            <form onSubmit={handleGeneratePix} className="space-y-4">
              {/* Billing Cycle Picker */}
              <div className="p-1 glass-obsidian rounded-xl border border-purple-900/30 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    billingCycle === 'monthly'
                      ? 'bg-purple-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Mensal · {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.monthlyPrice)}/mês
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    billingCycle === 'annual'
                      ? 'bg-amber-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Anual (Econômico) · {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.annualPrice)}/ano
                </button>
              </div>

              {/* Plan Highlights */}
              <div className="p-4 bg-[#050508] rounded-xl border border-purple-900/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{plan.tier}</span>
                  <span className="text-emerald-400 font-mono-numbers">Período de Teste: {plan.trialDays} dias</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-light">{plan.description}</p>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-purple-900/20 text-[11px] text-slate-400">
                  <span>✓ {plan.limits.monthlyMissions} Missões/mês</span>
                  <span>·</span>
                  <span>✓ Até {plan.limits.maxAgents} Agentes</span>
                  <span>·</span>
                  <span>✓ {plan.limits.maxKnowledgeDocs} Docs Base</span>
                </div>
              </div>

              {/* Customer Fields */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                      Nome do Responsável
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Albuquerque"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-[#050508] border border-purple-900/40 text-xs px-3.5 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                      Email Corporativo
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="carlos@empresa.com.br"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-[#050508] border border-purple-900/40 text-xs px-3.5 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                      Razão Social / Nome da Empresa
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Albuquerque Tech S.A."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-[#050508] border border-purple-900/40 text-xs px-3.5 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                      CNPJ ou CPF (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="00.000.000/0001-00"
                      value={customerCpfCnpj}
                      onChange={(e) => setCustomerCpfCnpj(e.target.value)}
                      className="w-full bg-[#050508] border border-purple-900/40 text-xs px-3.5 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-950/40 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isGenerating ? 'Gerando Código Pix EMV...' : `Gerar Cobrança Pix (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)})`}</span>
              </button>
            </form>
          ) : (
            /* STEP 2: Live Pix Payment Display */
            <div className="space-y-5 animate-fade-in">
              {pixCharge.status === 'CONFIRMED' ? (
                /* Payment Success View */
                <div className="p-6 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-semibold text-white">Pagamento Pix Confirmado com Sucesso!</h4>
                  <p className="text-xs text-emerald-200 leading-relaxed font-light">
                    A assinatura do plano <strong>{plan.name}</strong> foi ativada. Suas cotas de agentes e missões autônomas foram liberadas no observatório.
                  </p>
                  <div className="pt-3">
                    <button
                      onClick={onClose}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-md"
                    >
                      Acessar Painel Liberado
                    </button>
                  </div>
                </div>
              ) : (
                /* Pending Payment Instructions with QR Code & Copy-Paste */
                <>
                  <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-[#050508] rounded-xl border border-purple-900/30">
                    {/* QR Code SVG */}
                    {pixCharge.qrCodeSvg && (
                      <div 
                        className="w-44 h-44 bg-white p-2 rounded-xl flex items-center justify-center shadow-md shrink-0"
                        dangerouslySetInnerHTML={{ __html: pixCharge.qrCodeSvg }}
                      />
                    )}

                    <div className="space-y-2 text-xs flex-1">
                      <div className="flex items-center gap-2 text-amber-400 font-mono-numbers">
                        <Clock className="w-4 h-4 animate-pulse" />
                        <span>Aguardando liquidação bancária Pix</span>
                      </div>

                      <div className="text-xl font-bold font-mono-numbers text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pixCharge.amount)}
                      </div>

                      <div className="space-y-1 text-slate-300 font-light text-[11px]">
                        <p><strong>Destinatário:</strong> {pixCharge.recipientName} (Master Owner)</p>
                        <p><strong>Chave Celular Pix:</strong> <span className="font-mono-numbers text-amber-300 font-semibold">{pixCharge.pixKey}</span></p>
                        <p><strong>Identificador do Pedido (TxID):</strong> <span className="font-mono-numbers text-slate-400">{pixCharge.txId}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Pix Copia e Cola field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="uppercase tracking-wider text-slate-400">Código Pix Copia e Cola</span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Código Copiado!' : 'Copiar Código Pix'}</span>
                      </button>
                    </div>

                    <div className="p-3 bg-[#050508] rounded-xl border border-purple-900/30 font-mono-numbers text-[11px] text-slate-300 break-all select-all max-h-24 overflow-y-auto">
                      {pixCharge.copyPasteCode}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="p-3.5 glass-obsidian rounded-xl border border-purple-900/20 text-xs text-slate-400 space-y-1 font-light">
                    <p>1. Abra o aplicativo do seu banco ou internet banking.</p>
                    <p>2. Selecione a opção <strong>Pix Copia e Cola</strong> ou aponte a câmera para o <strong>QR Code</strong> acima.</p>
                    <p>3. Confira o valor exato de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pixCharge.amount)}</strong> e o destinatário <strong>Alifer Madeiro</strong>.</p>
                    <p>4. Assim que confirmado pelo Banco Central, o sistema desbloqueará sua conta automaticamente.</p>
                  </div>

                  {/* Homologation Webhook Trigger (Master & Sandbox Testing) */}
                  <div className="pt-2 border-t border-purple-900/20 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono-numbers">
                      Sandbox de Homologação / Teste Webhook:
                    </span>
                    <button
                      type="button"
                      onClick={handleSimulateWebhook}
                      disabled={isHomologating}
                      className="px-3 py-1.5 glass-obsidian hover:border-emerald-500/40 text-[11px] text-emerald-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Zap className="w-3 h-3 text-emerald-400" />
                      <span>{isHomologating ? 'Validando Webhook...' : 'Simular Confirmação Webhook'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
