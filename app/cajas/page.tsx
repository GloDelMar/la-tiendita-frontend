'use client';

import { useEffect, useState } from 'react';
import { cajasApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface Caja {
  id: number;
  nombre: string;
  descripcion?: string;
  activa: boolean;
  saldo_inicial: number;
}

export default function CajasPage() {
  const [caja, setCaja] = useState<Caja | null>(null);
  const [saldoActual, setSaldoActual] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', saldo_inicial: 0 });

  useEffect(() => {
    loadCaja();
  }, []);

  async function loadCaja() {
    try {
      setLoading(true);
      const current = await cajasApi.getCurrent();
      setCaja(current);
      setFormData({
        nombre: current.nombre,
        descripcion: current.descripcion || '',
        saldo_inicial: current.saldo_inicial || 0,
      });

      const saldo = await cajasApi.getSaldo(current.id);
      setSaldoActual(saldo.saldo || 0);
    } catch (error) {
      console.error('Error loading single caja:', error);
      alert('Error al cargar la configuracion de caja');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!caja) return;

    try {
      setSaving(true);
      const updated = await cajasApi.update(caja.id, {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        saldo_inicial: formData.saldo_inicial,
      });
      setCaja(updated);
      alert('Configuracion de caja actualizada');
    } catch (error) {
      console.error('Error updating single caja:', error);
      alert('No se pudo actualizar la caja');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--cafe-dark)] mx-auto"></div>
          <p className="mt-4 text-[var(--ink-soft)]">Cargando caja registradora...</p>
        </div>
      </div>
    );
  }

  if (!caja) {
    return (
      <div className="bg-[var(--cream)] rounded-xl p-6 shadow-sm border border-[var(--sand-strong)]/40">
        <h1 className="text-2xl font-bold text-[var(--ink)]">Caja no disponible</h1>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-[var(--cream)] rounded-xl p-6 shadow-sm border border-[var(--sand-strong)]/40">
        <h1 className="text-3xl font-black text-[var(--ink)]">Caja única del sistema</h1>
        <p className="text-[var(--ink-soft)] mt-1">Esta instalación opera con una sola caja para la Cafetería CAM 15.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[var(--cream)] rounded-xl p-5 shadow-sm border border-[var(--sand-strong)]/40">
          <p className="text-sm text-[var(--ink-soft)]">Saldo actual</p>
          <p className="text-3xl font-bold text-[var(--accent-leaf)] mt-2">{formatCurrency(saldoActual)}</p>
        </div>
        <div className="bg-[var(--cream)] rounded-xl p-5 shadow-sm border border-[var(--sand-strong)]/40">
          <p className="text-sm text-[var(--ink-soft)]">Saldo inicial</p>
          <p className="text-3xl font-bold text-[var(--cafe-dark)] mt-2">{formatCurrency(caja.saldo_inicial || 0)}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-[var(--cream)] rounded-xl p-6 shadow-sm border border-[var(--sand-strong)]/40 space-y-4">
        <h2 className="text-xl font-bold text-[var(--ink)]">Configuración</h2>

        <div>
          <label className="block text-sm font-medium text-[var(--ink-soft)] mb-1">Nombre</label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            className="w-full px-4 py-2 border border-[var(--sand-strong)] rounded-lg focus:ring-2 focus:ring-[var(--cafe-dark)]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--ink-soft)] mb-1">Descripción</label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            className="w-full px-4 py-2 border border-[var(--sand-strong)] rounded-lg focus:ring-2 focus:ring-[var(--cafe-dark)]"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--ink-soft)] mb-1">Saldo inicial</label>
          <input
            type="number"
            step="0.01"
            value={formData.saldo_inicial}
            onChange={(e) => setFormData({ ...formData, saldo_inicial: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-[var(--sand-strong)] rounded-lg focus:ring-2 focus:ring-[var(--cafe-dark)]"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[linear-gradient(120deg,var(--cafe-dark)_0%,var(--cafe-mid)_100%)] hover:brightness-110 text-[var(--cream)] py-2.5 rounded-lg font-semibold disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
