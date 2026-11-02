import React, { useState } from 'react';
import { Shield, Key, Eye, Lock, ArrowRight, UserCheck } from 'lucide-react';
import { api } from '../services/api.ts';
import { User } from '../types/index.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.login(email.trim(), password);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (targetEmail: string, pass: string) => {
    setEmail(targetEmail);
    setPassword(pass);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#07070d] border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full glass-obsidian-gold border border-amber-400/40 flex items-center justify-center text-amber-400 glow-eye">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-cinzel font-bold text-white tracking-wide">
            Autenticação Criptográfica
          </h2>
          <p className="text-xs text-slate-400">
            Acesso soberano Master Owner e ambientes isolados de clientes.
          </p>
        </div>

        {/* Quick Credentials Access Selectors */}
        <div className="space-y-2 bg-[#050508] p-3 rounded-xl border border-purple-900/30">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 block">
            Acessos Rápidos Homologados:
          </span>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickFill('Alifermadeiro@hotmail.com', 'ShefaAyin2026!')}
              className="text-left px-3 py-1.5 rounded bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/20 text-xs text-amber-300 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span className="font-semibold">Master Owner</span>
              <span className="font-mono-numbers text-[11px] text-amber-400/80">Alifermadeiro@hotmail.com</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('contato@verticecorp.com.br', 'Empresa@2026')}
              className="text-left px-3 py-1.5 rounded bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/20 text-xs text-purple-300 transition-colors flex items-center justify-between cursor-pointer"
            >
              <span className="font-semibold">Cliente Vértice Tech</span>
              <span className="font-mono-numbers text-[11px] text-purple-400/80">comp_vertice_tech</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
              Email Registrado
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@dominio.com"
              required
              className="w-full bg-[#050508] border border-purple-900/40 text-xs px-3.5 py-2.5 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
              Senha Criptográfica
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full bg-[#050508] border border-purple-900/40 text-xs px-3.5 py-2.5 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300 text-center">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 glass-obsidian text-slate-400 hover:text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl text-xs font-medium transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
            >
              <span>{isLoading ? 'Autenticando...' : 'Entrar no Sistema'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
