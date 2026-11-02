import React, { useState } from 'react';
import { 
  EnterpriseService, 
  ServiceContract, 
  FlagshipProduct, 
  User, 
  Company, 
  PixCharge 
} from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  Cpu, 
  TrendingUp, 
  Headphones, 
  FileText, 
  QrCode, 
  ChevronRight,
  Briefcase,
  Layers,
  Check,
  AlertCircle,
  Copy
} from 'lucide-react';

interface EnterpriseServicesViewProps {
  services: EnterpriseService[];
  contracts: ServiceContract[];
  flagshipProducts: FlagshipProduct[];
  currentUser: User | null;
  currentCompany: Company | null;
  onRefreshData: () => void;
  onNavigateToCore?: () => void;
}

export const EnterpriseServicesView: React.FC<EnterpriseServicesViewProps> = ({
  services,
  contracts,
  flagshipProducts,
  currentUser,
  currentCompany,
  onRefreshData,
  onNavigateToCore
}) => {
  const [activeTab, setActiveTab] = useState<'services' | 'products' | 'contracts'>('services');
  const [selectedService, setSelectedService] = useState<EnterpriseService | null>(null);
  const [isHiringOpen, setIsHiringOpen] = useState(false);
  const [scopeNotes, setScopeNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePixModal, setActivePixModal] = useState<PixCharge | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [isSimulatingPix, setIsSimulatingPix] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isMaster = currentUser?.role === 'MASTER_OWNER';

  const handleHireService = async (service: EnterpriseService) => {
    setSelectedService(service);
    setIsHiringOpen(true);
  };

  const handleConfirmHire = async () => {
    if (!selectedService) return;
    setIsSubmitting(true);
    try {
      const res = await api.createServiceContract({
        serviceId: selectedService.id,
        scopeNotes,
        requestedPrice: selectedService.basePrice,
        generatePix: true,
        companyId: currentCompany?.id || currentUser?.companyId || 'global',
        companyName: currentCompany?.name || `${currentUser?.name} Corp`
      });

      setIsHiringOpen(false);
      setScopeNotes('');
      if (res.pixCharge) {
        setActivePixModal(res.pixCharge);
      }
      setSuccessMessage(`Serviço "${selectedService.name}" solicitado com sucesso!`);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao contratar serviço.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPix = () => {
    if (!activePixModal?.copyPasteCode) return;
    navigator.clipboard.writeText(activePixModal.copyPasteCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleSimulatePayment = async () => {
    if (!activePixModal) return;
    setIsSimulatingPix(true);
    try {
      await api.simulatePixWebhook(activePixModal.id);
      setActivePixModal(null);
      setSuccessMessage('Pagamento Pix confirmado! Contrato ativado com sucesso.');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Erro ao simular liquidação.');
    } finally {
      setIsSimulatingPix(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Hero Header */}
      <div className="p-8 glass-obsidian-gold rounded-2xl border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-cinzel text-amber-300">
            <span>MODELO HÍBRIDO</span>
            <span aria-hidden="true">·</span>
            <span>SAAS & SERVIÇOS EMPRESARIAIS</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-cinzel font-bold text-white tracking-wide">
            Soluções & Consultoria de Alta Performance
          </h2>
          <p className="text-sm text-slate-300 font-light leading-relaxed">
            Combine a potência dos 11 agentes autônomos com diagnósticos táticos, implantação assistida por engenheiros, automações sob medida e consultoria estratégica contínua.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="p-1 glass-obsidian rounded-xl border border-purple-900/40 flex items-center gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'services' ? 'bg-amber-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Serviços Empresariais
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'products' ? 'bg-amber-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Produtos AYIN
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'contracts' ? 'bg-amber-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Contratos ({contracts.length})
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* TAB 1: SERVIÇOS EMPRESARIAIS (Diagnóstico, Implantação, Automações, Consultoria) */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => (
              <div 
                key={service.id}
                className="p-6 glass-obsidian rounded-2xl border border-purple-900/30 hover:border-amber-400/40 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-mono-numbers text-amber-400 uppercase tracking-widest block mb-1">
                        {service.code.replace('_', ' ')}
                      </span>
                      <h3 className="text-lg font-cinzel font-bold text-white group-hover:text-amber-200 transition-colors">
                        {service.name}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-slate-400 block">Investimento</span>
                      <span className="text-xl font-bold font-mono-numbers text-amber-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(service.basePrice)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    {service.description}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-purple-900/20">
                    <span className="text-[11px] font-semibold text-slate-400 block">Entregáveis Garantidos:</span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {service.deliverables.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 font-light">
                          <Check className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-purple-900/10">
                    <div className="flex items-center gap-1.5 font-mono-numbers">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Prazo estimado: {service.deliveryTimelineDays} dias</span>
                    </div>
                    <span>·</span>
                    <span className="text-[11px] text-slate-400 truncate" title={service.recommendedFor}>
                      {service.recommendedFor}
                    </span>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-purple-900/20 flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-400 font-light">
                    Chave Pix Master: 11973479473
                  </span>
                  <button
                    onClick={() => handleHireService(service)}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow flex items-center gap-2 shrink-0"
                  >
                    <span>Contratar Serviço</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PRODUTOS FLAGSHIP (AYIN SALES, AYIN CUSTOMER, AYIN FINANCE, AYIN CORE) */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {flagshipProducts.map((prod) => {
            const Icon = prod.code === 'AYIN_SALES' 
              ? TrendingUp 
              : prod.code === 'AYIN_CUSTOMER' 
              ? Headphones 
              : prod.code === 'AYIN_FINANCE' 
              ? Briefcase 
              : Cpu;

            return (
              <div
                key={prod.id}
                className="p-6 glass-obsidian rounded-2xl border border-purple-900/30 hover:border-amber-400/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[11px] font-cinzel text-amber-400 block">
                          {prod.hebrewName}
                        </span>
                        <h3 className="text-xl font-cinzel font-bold text-white tracking-wide">
                          {prod.name}
                        </h3>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block">Avulso Mensal</span>
                      <span className="text-lg font-bold font-mono-numbers text-amber-400">
                        R$ {prod.standalonePriceMonthly}/mês
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-amber-200/90 font-medium">
                    {prod.tagline}
                  </p>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    {prod.description}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-purple-900/20">
                    <span className="text-[11px] font-semibold text-slate-400 block">Capacidades Principais:</span>
                    <ul className="space-y-1.5 text-xs text-slate-300 font-light">
                      {prod.capabilities.map((cap, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-purple-900/10 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="text-[11px] text-slate-500">Agentes dedicados:</span>
                    {prod.associatedAgents.map((ag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-purple-950/50 border border-purple-800/30 rounded text-[10px] text-amber-200">
                        {ag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-purple-900/20 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-light">
                    Incluso em: {prod.includedInPlans.join(', ')}
                  </span>
                  {onNavigateToCore && (
                    <button
                      onClick={onNavigateToCore}
                      className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>Acionar no AYIN CORE</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: CONTRATOS & ORDENS DE SERVIÇO */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-purple-900/20 text-xs text-slate-400">
            <span>Contratos corporativos e implantações de serviços empresariais</span>
            <span className="font-mono-numbers">{contracts.length} Contratos Registrados</span>
          </div>

          {contracts.length === 0 ? (
            <div className="p-12 text-center glass-obsidian rounded-2xl border border-purple-900/20 space-y-3">
              <FileText className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-300 font-medium">Nenhum contrato de serviço registrado até o momento.</p>
              <p className="text-xs text-slate-500">Solicite um Diagnóstico ou Implantação para acelerar sua operação.</p>
              <button
                onClick={() => setActiveTab('services')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Explorar Serviços Empresariais
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {contracts.map((ctr) => (
                <div
                  key={ctr.id}
                  className="p-5 glass-obsidian rounded-xl border border-purple-900/20 hover:border-amber-400/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-white text-sm">{ctr.serviceName}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-slate-300">{ctr.companyName}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        ctr.status === 'DELIVERED' 
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' 
                          : ctr.status === 'IN_PROGRESS' 
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30' 
                          : ctr.status === 'APPROVED'
                          ? 'bg-blue-950/80 text-blue-300 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {ctr.status === 'DELIVERED' ? 'Entregue' : ctr.status === 'IN_PROGRESS' ? 'Em Implantação' : ctr.status === 'APPROVED' ? 'Aprovado' : 'Proposta'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 font-light">
                      {ctr.scopeNotes || 'Escopo contratual padrão de conformidade e aceleração.'}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono-numbers pt-1">
                      <span>Agente: {ctr.assignedAgentCodename || 'Equipe AYIN'}</span>
                      <span>·</span>
                      <span>Criado em: {new Date(ctr.createdAt).toLocaleDateString('pt-BR')}</span>
                      {ctr.deliveredAt && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-400">Entregue em: {new Date(ctr.deliveredAt).toLocaleDateString('pt-BR')}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-purple-900/20">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Valor Acordado</span>
                      <span className="text-base font-bold font-mono-numbers text-amber-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ctr.price)}
                      </span>
                    </div>

                    {isMaster && ctr.status !== 'DELIVERED' && (
                      <button
                        onClick={async () => {
                          const nextStatus = ctr.status === 'PROPOSAL' ? 'APPROVED' : ctr.status === 'APPROVED' ? 'IN_PROGRESS' : 'DELIVERED';
                          await api.updateServiceContractStatus(ctr.id, nextStatus);
                          onRefreshData();
                        }}
                        className="px-3 py-1.5 bg-purple-900/60 hover:bg-purple-800 text-amber-200 border border-purple-700/40 rounded text-xs transition-colors cursor-pointer"
                      >
                        Avançar: {ctr.status === 'PROPOSAL' ? 'Aprovar' : ctr.status === 'APPROVED' ? 'Iniciar Implantação' : 'Concluir Entrega'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Contratação de Serviço */}
      {isHiringOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 glass-obsidian-gold rounded-2xl border border-amber-500/40 space-y-4 animate-scale-up">
            <div className="flex items-start justify-between pb-3 border-b border-amber-500/20">
              <div>
                <span className="text-[10px] uppercase font-mono-numbers text-amber-400">Solicitação de Serviço Empresarial</span>
                <h3 className="text-lg font-cinzel font-bold text-white">{selectedService.name}</h3>
              </div>
              <button onClick={() => setIsHiringOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3 bg-[#0a0a14] rounded-xl border border-purple-900/30 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Valor Base:</span>
                <span className="font-bold text-amber-300 font-mono-numbers">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedService.basePrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Prazo Estimado:</span>
                <span className="text-slate-200">{selectedService.deliveryTimelineDays} dias úteis</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Empresa Contratante:</span>
                <span className="text-slate-200">{currentCompany?.name || currentUser?.name}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Necessidades Específicas ou Observações de Escopo:
              </label>
              <textarea
                value={scopeNotes}
                onChange={(e) => setScopeNotes(e.target.value)}
                placeholder="Ex: Desejamos integrar 3 canais de WhatsApp, unificar a base de 120 manuais em PDF e treinar 8 atendentes."
                rows={3}
                className="w-full p-3 bg-[#07070f] border border-purple-900/30 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="pt-3 border-t border-amber-500/20 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsHiringOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleConfirmHire}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow"
              >
                {isSubmitting ? 'Gerando Contrato...' : 'Confirmar & Gerar Cobrança Pix'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Pix para Serviço */}
      {activePixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md p-6 glass-obsidian-gold rounded-2xl border border-amber-500/40 space-y-4 animate-scale-up text-center">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-2 text-left">
                <QrCode className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-sm font-cinzel font-bold text-white">Pagamento Pix Oficial</h4>
                  <span className="text-[10px] text-slate-400">Banco Central do Brasil · Validação Instantânea</span>
                </div>
              </div>
              <button onClick={() => setActivePixModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200">
              <span className="block font-bold">Valor a Liquidar:</span>
              <span className="text-2xl font-bold font-mono-numbers text-white mt-1 block">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activePixModal.amount)}
              </span>
            </div>

            {/* QR Code SVG */}
            {activePixModal.qrCodeSvg && (
              <div className="p-4 bg-white rounded-xl inline-block shadow-lg mx-auto">
                <div 
                  className="w-48 h-48"
                  dangerouslySetInnerHTML={{ __html: activePixModal.qrCodeSvg }}
                />
              </div>
            )}

            <div className="space-y-2 text-left">
              <label className="text-[11px] text-slate-400 block font-semibold">Código Pix Copia e Cola:</label>
              <div className="flex items-center gap-2 p-2 bg-[#05050a] border border-purple-900/40 rounded-lg text-xs font-mono text-slate-300">
                <input 
                  type="text" 
                  readOnly 
                  value={activePixModal.copyPasteCode} 
                  className="w-full bg-transparent focus:outline-none truncate"
                />
                <button
                  onClick={handleCopyPix}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1"
                >
                  {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block">
                Favorecido: Alifer Madeiro (Master Owner) · Chave Celular: 11973479473
              </span>
            </div>

            <div className="pt-3 border-t border-amber-500/20 flex items-center justify-between gap-2">
              <button
                onClick={() => setActivePixModal(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Fechar
              </button>

              {isMaster && (
                <button
                  disabled={isSimulatingPix}
                  onClick={handleSimulatePayment}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow"
                >
                  {isSimulatingPix ? 'Confirmando...' : 'Homologar Pix (Master Owner)'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
