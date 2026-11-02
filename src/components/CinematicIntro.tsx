import React, { useState } from 'react';
import { Eye, Sparkles, Shield, Compass, ArrowRight, Volume2, VolumeX } from 'lucide-react';

interface CinematicIntroProps {
  onEnter: () => void;
  masterEmail: string;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onEnter, masterEmail }) => {
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Ethereal ambient audio synthesis using Web Audio API
  const toggleSound = () => {
    if (!soundEnabled) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        
        // Harmonic cosmic drone
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(108, ctx.currentTime); // Deep A
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(216, ctx.currentTime);

        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 3);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();

        setSoundEnabled(true);
      } catch (e) {
        console.error('Audio init error:', e);
      }
    } else {
      setSoundEnabled(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#050508] text-slate-100 overflow-hidden px-6 py-12 selection:bg-purple-900 selection:text-amber-200">
      {/* Background Volumetric Nebulae */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-900/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-amber-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Sound Toggle */}
      <div className="absolute top-8 right-8 z-20">
        <button
          onClick={toggleSound}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 glass-obsidian rounded-full hover:text-amber-300 transition-colors cursor-pointer"
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>{soundEnabled ? 'Áudio Cósmico Ativo' : 'Ativar Ressonância'}</span>
        </button>
      </div>

      {/* Main Celestial Seal */}
      <div className="relative z-10 max-w-3xl flex flex-col items-center text-center">
        {/* Animated Central Eye Emblem */}
        <div className="relative mb-8 group cursor-pointer" onClick={onEnter}>
          <div className="w-24 h-24 rounded-full border border-purple-500/30 flex items-center justify-center glass-obsidian glow-eye relative transition-transform duration-700 group-hover:scale-105">
            {/* Concentric rotating glyph rings */}
            <div className="absolute inset-1 rounded-full border border-amber-400/20 border-dashed animate-spin [animation-duration:24s]" />
            <div className="absolute inset-3 rounded-full border border-purple-400/30 animate-spin [animation-duration:14s] [animation-direction:reverse]" />
            <Eye className="w-10 h-10 text-amber-400 animate-pulse" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-cinzel text-amber-300/80 tracking-widest uppercase">
            עין השפע
          </div>
        </div>

        {/* Brand Typography */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-cinzel font-black tracking-tight text-white mb-3 text-balance">
          SHEFA AYIN
        </h1>
        <p className="text-sm sm:text-base font-cinzel tracking-widest text-amber-300/90 uppercase mb-4">
          LIVING INTELLIGENCE OBSERVATORY · עין השפע
        </p>

        {/* Narrative Description */}
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mb-8 font-light">
          Central autônoma de inteligência corporativa com operação contínua 24/7, núcleo de comando neural AYIN CORE e ambientes herméticos para empresas clientes.
        </p>

        {/* Master Owner Recognition Pill / Info */}
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-10 glass-obsidian px-4 py-2 rounded-full border border-purple-900/30">
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>Soberania Master Owner:</span>
          <span className="font-mono-numbers text-slate-200">{masterEmail}</span>
          <span aria-hidden="true">·</span>
          <span>Acesso Global Habilitado</span>
        </div>

        {/* Primary Entrance Action */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onEnter}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-medium text-sm rounded-xl shadow-lg shadow-purple-900/40 hover:shadow-purple-700/50 transition-all duration-300 group cursor-pointer"
          >
            <span>Iniciar Observatório Tridimensional</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Footer subtle attributes */}
      <div className="absolute bottom-6 text-center text-xs text-slate-500 font-light">
        <span>Arquitetura Modular Multitenant</span>
        <span className="mx-2" aria-hidden="true">·</span>
        <span>Governância Criptográfica</span>
        <span className="mx-2" aria-hidden="true">·</span>
        <span>Conexões Neurais 24/7</span>
      </div>
    </div>
  );
};
