'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (login(password)) {
      router.push('/');
      router.refresh();
    } else {
      setError('Contraseña incorrecta');
      setPassword('');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_18%_16%,rgba(242,182,70,0.35)_0,transparent_28%),radial-gradient(circle_at_82%_10%,rgba(232,111,74,0.28)_0,transparent_24%),linear-gradient(135deg,#f8e7d4_0%,#f2d6b7_45%,#ecc39f_100%)] flex items-center justify-center p-4">
      <div className="bg-[var(--cream)] rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full border border-[var(--sand-strong)]/50">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="bg-[linear-gradient(140deg,var(--cafe-dark)_0%,var(--cafe-mid)_55%,#a2603b_100%)] w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
            <span className="text-5xl">🏪</span>
          </div>
          <h1 className="text-3xl font-black text-[var(--ink)] mb-2">Cafetería CAM 15</h1>
          <p className="text-lg text-[var(--ink-soft)] font-medium">
            Espacio escolar alegre e inclusivo
          </p>
          <p className="text-sm text-[var(--ink-soft)]/80 mt-1">
            CAM15 - Nayarit
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-[var(--ink-soft)] mb-2">
              Contraseña de Acceso
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[var(--sand-strong)] rounded-xl focus:ring-4 focus:ring-[var(--cafe-dark)]/20 focus:border-[var(--cafe-dark)] transition-all"
              placeholder="Ingresa la contraseña"
              required
              autoFocus
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-[rgba(232,111,74,0.12)] border-2 border-[rgba(232,111,74,0.35)] text-[var(--cafe-dark)] px-4 py-3 rounded-xl flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[linear-gradient(120deg,var(--cafe-dark)_0%,var(--cafe-mid)_50%,#a2603b_100%)] hover:brightness-110 text-[var(--cream)] font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Ingresando...
              </span>
            ) : (
              '🔓 Ingresar al Sistema'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[var(--sand-strong)]/50 text-center">
          <p className="text-xs text-[var(--ink-soft)]">
            Sistema de Punto de Venta
          </p>
          <p className="text-xs text-[var(--ink-soft)]/70 mt-1">
            Ciclo Escolar 2025-2026
          </p>
        </div>
      </div>
    </div>
  );
}
