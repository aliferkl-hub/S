import React, { useState } from 'react';
import { Eye, Mic, MicOff, Send, Sparkles, AlertTriangle, ShieldCheck, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { Mission, DepartmentId, User } from '../types/index.ts';
import { api } from '../services/api.ts';

import { livingAudio } from '../services/livingAudio.ts';
import { Volume2, VolumeX } from 'lucide-react';

interface AyinCoreTerminalProps {
  currentUser: User | null;
  missions: Mission[];
  onMissionCreated: (mission: Mission) => void;
  onSelectDepartment: (deptId: DepartmentId) => void;
}

export const AyinCoreTerminal: React.FC<AyinCoreTerminalProps> = ({
  currentUser,
  missions,
  onMissionCreated,
  onSelectDepartment
}) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [strategicAdvice, setStrategicAdvice] = useState<string | null>(null);
  const [latestMission, setLatestMission] = useState<Mission | null>(missions[0] || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSpeakingAdvice, setIsSpeakingAdvice] = useState(false);

  // Voice command support via browser SpeechRecognition API
  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Reconhecimento de voz não suportado neste navegador. Utilize o comando em texto.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        livingAudio.playTone('click');
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPrompt(transcript);
        setIsListening(false);
        livingAudio.playTone('command_sent');
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleSendCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setStrategicAdvice(null);
    livingAudio.playTone('command_sent');

    try {
      const res = await api.sendCommand(prompt);
      setLatestMission(res.mission);
      setStrategicAdvice(res.strategicAdvice);
      onMissionCreated(res.mission);
      livingAudio.playTone('complete');
      if (res.strategicAdvice) {
        livingAudio.speak(res.strategicAdvice);
        setIsSpeakingAdvice(true);
      }
      setPrompt('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao despachar comando mestre.');
      livingAudio.playTone('alert');
    } finally {
      setIsProcessing(false);
    }
  };

  const presets = [
    'Executar varredura de concorrentes e mapear oportunidades de consolidação de mercado',
    'Elaborar campanha B2B para diretores de tecnologia com sequência de 3 abordagens',
    'Auditar receitas recorrentes, custos de infraestrutura e solicitar projeção de expansão',
    'Consolidar aprendizado operacional e identificar falhas de conversão nos leads'
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* AYIN CORE Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass-obsidian rounded-2xl border border-purple-900/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-cinzel font-bold text-white tracking-wide">
              AYIN CORE · Núcleo de Inteligência Soberana
            </h2>
          </div>
          <p className="text-xs text-slate-300">
            Recepção de macro-comandos, decomposição tática por Gemini 3.8 Flash e orquestração contínua dos 8 departamentos.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
          <span>Operador:</span>
          <span className="font-mono-numbers text-slate-200">
            {currentUser ? currentUser.email : 'Sessão Não Autenticada'}
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-amber-400">
            {currentUser?.role === 'MASTER_OWNER' ? 'Master Owner' : 'Operador'}
          </span>
        </div>
      </div>

      {/* Command Input Box */}
      <div className="p-6 glass-obsidian-gold rounded-2xl border border-amber-500/20 shadow-xl space-y-4">
        <form onSubmit={handleSendCommand} className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Digite o objetivo macro ou comando para o AYIN CORE (ex: 'Planejar expansão comercial para Q4 com varredura no radar e geração de scripts de alta conversão')..."
            rows={3}
            className="w-full bg-[#07070d]/90 text-slate-100 placeholder-slate-500 text-sm rounded-xl p-4 pr-24 border border-purple-900/40 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40 transition-all resize-none"
          />

          <div className="absolute bottom-3.5 right-3.5 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleVoice}
              title={isListening ? 'Parar gravação' : 'Comando por voz'}
              className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                isListening 
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse' 
                  : 'bg-purple-950/40 text-purple-300 hover:text-amber-300 border border-purple-800/30'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              type="submit"
              disabled={isProcessing || !prompt.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-40 text-white font-medium text-xs rounded-lg transition-all shadow-md cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Processando...' : 'Despachar'}</span>
            </button>
          </div>
        </form>

        {/* Quick Command Presets */}
        <div className="space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            Diretrizes Rápidas Sugeridas:
          </span>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(preset)}
                className="text-xs text-left px-3 py-1.5 glass-obsidian hover:border-amber-400/30 text-slate-300 hover:text-amber-200 rounded-lg transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-lg text-xs text-rose-300">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Strategic Advice Banner if available */}
      {strategicAdvice && (
        <div className="p-4 glass-obsidian-gold rounded-2xl border border-amber-400/40 flex items-start justify-between gap-4 shadow-xl glow-gold">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wide">
                Parecer Estratégico Soberano do AYIN CORE
              </h4>
              <p className="text-xs text-slate-100 leading-relaxed font-light">
                {strategicAdvice}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (isSpeakingAdvice) {
                livingAudio.stopSpeaking();
                setIsSpeakingAdvice(false);
              } else {
                livingAudio.speak(strategicAdvice);
                setIsSpeakingAdvice(true);
              }
            }}
            title={isSpeakingAdvice ? 'Silenciar voz' : 'Ouvir parecer em voz'}
            className="p-2 rounded-xl glass-obsidian border border-amber-500/30 text-amber-300 hover:text-white shrink-0 cursor-pointer"
          >
            {isSpeakingAdvice ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* Latest Mission Decomposition & Execution Pipeline */}
      {latestMission && (
        <div className="p-6 glass-obsidian rounded-2xl border border-purple-900/30 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-900/20">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono-numbers text-purple-400 uppercase tracking-wider">
                  {latestMission.id}
                </span>
                <span aria-hidden="true">·</span>
                <span className={`text-xs px-2 py-0.5 rounded font-mono-numbers ${
                  latestMission.status === 'completed' ? 'text-emerald-400 bg-emerald-950/40' :
                  latestMission.status === 'awaiting_approval' ? 'text-amber-400 bg-amber-950/40' :
                  'text-purple-300 bg-purple-950/40'
                }`}>
                  {latestMission.status === 'completed' ? 'Concluída' :
                   latestMission.status === 'awaiting_approval' ? 'Aguardando Aprovação' :
                   latestMission.status === 'in_progress' ? 'Em Execução Contínua' : 'Na Fila'}
                </span>
              </div>
              <h3 className="text-base font-semibold text-white">{latestMission.title}</h3>
              <p className="text-xs text-slate-300 mt-1">{latestMission.objective}</p>
            </div>

            {latestMission.isSensitive && (
              <div className="flex items-center gap-2 p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-300 shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="font-semibold block">Ação Sensível Bloqueada</span>
                  <span className="text-[11px] text-amber-400/80">{latestMission.sensitiveReason}</span>
                </div>
              </div>
            )}
          </div>

          {/* Steps Decomposition Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Etapas Alocadas aos Departamentos
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {latestMission.steps.map((step) => (
                <div
                  key={step.id}
                  className="p-4 glass-obsidian rounded-xl border border-purple-900/30 space-y-2 hover:border-purple-600/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-white">{step.title}</span>
                    <button
                      onClick={() => onSelectDepartment(step.departmentId)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{step.departmentId.replace('AYIN_', '')}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  {step.result && (
                    <p className="text-xs text-slate-300 bg-[#050508]/80 p-2.5 rounded-lg border border-purple-900/20 leading-relaxed font-light">
                      {step.result}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3 text-purple-400" />
                    <span>Status: {step.status === 'completed' ? 'Finalizada' : step.status === 'running' ? 'Processando' : 'Aguardando vez'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real Execution Logs Stream */}
          <div className="space-y-3 pt-4 border-t border-purple-900/20">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Fluxo Real de Execução dos Agentes
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {latestMission.executionLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 text-xs p-2.5 rounded-lg bg-[#07070d]/60 border border-purple-900/20"
                >
                  <span className="font-mono-numbers text-[11px] text-slate-500 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                  </span>
                  <span className="text-purple-300 font-medium shrink-0">{log.agentName}:</span>
                  <span className="text-slate-300 leading-relaxed">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
