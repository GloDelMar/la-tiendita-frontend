'use client';

import { useEffect, useState } from 'react';
import { cashApi, productsApi, transactionsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { useCaja } from '@/contexts/CajaContext';

export default function Dashboard() {
  const { selectedCaja } = useCaja();
  const [stats, setStats] = useState({
    saldo: 0,
    productos: 0,
    transaccionesHoy: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedCaja) return;

    const loadDashboard = async () => {
      try {
        const [balance, products, daily] = await Promise.all([
          cashApi.getBalance(selectedCaja.id),
          productsApi.getAll(selectedCaja.id),
          transactionsApi.getDailyStats(),
        ]);

        setStats({
          saldo: balance?.saldo ?? 0,
          productos: Array.isArray(products) ? products.length : 0,
          transaccionesHoy: daily?.total_transacciones ?? 0,
        });
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [selectedCaja]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--cafe-dark)] mx-auto"></div>
          <p className="mt-4 text-[var(--ink-soft)]">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-[var(--sand-strong)] bg-[linear-gradient(130deg,var(--beige)_0%,#f3dfc6_34%,#ebc89c_100%)] p-5 shadow-[0_10px_30px_rgba(54,34,24,0.18)] sm:p-8">
        <div className="pointer-events-none absolute -top-14 -right-8 h-48 w-48 rounded-full bg-[radial-gradient(circle,#fff6d9_0%,transparent_65%)]" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-[radial-gradient(circle,#d7b38a_0%,transparent_68%)]" />
        <div className="pointer-events-none absolute top-8 right-1/3 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(232,111,74,0.25)_0%,transparent_70%)]" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-[var(--sand-strong)] bg-white/75 p-2 shadow-sm">
              <Image
                src="/cam15_logo.png"
                alt="Logo de Cafetería CAM 15"
                width={96}
                height={96}
                className="h-20 w-20 object-contain sm:h-24 sm:w-24"
                priority
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">Centro de Atencion Multiple No. 15</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-[var(--ink)] sm:text-4xl">Cafeteria CAM 15</h1>
              <p className="mt-1 text-sm text-[var(--ink-soft)] sm:text-base">Sistema de cobro accesible e inclusivo del Taller de Formacion Laboral</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--cafe-mid)] bg-[rgba(46,30,21,0.92)] px-4 py-3 text-[var(--cream)] shadow-lg">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--sand)]">Caja activa</p>
            <p className="mt-1 text-xl font-bold">{selectedCaja?.nombre || 'CAFETERIA CAM 15'}</p>
            <p className="mt-1 text-xs text-[var(--sand)]">Interfaz optimizada para lectura clara y acciones rapidas</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-[var(--sand-strong)] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">Saldo actual</p>
          <p className="mt-2 text-4xl font-black text-[var(--cafe-dark)]">{formatCurrency(stats.saldo)}</p>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">Resumen de efectivo y movimientos de caja.</p>
        </article>

        <article className="rounded-2xl border border-[var(--sand-strong)] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">Productos activos</p>
          <p className="mt-2 text-4xl font-black text-[var(--cafe-dark)]">{stats.productos}</p>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">Inventario disponible para venta hoy.</p>
        </article>

        <article className="rounded-2xl border border-[var(--sand-strong)] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">Ventas del dia</p>
          <p className="mt-2 text-4xl font-black text-[var(--cafe-dark)]">{stats.transaccionesHoy}</p>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">Tickets generados en la jornada actual.</p>
        </article>
      </section>

      <section className="rounded-3xl border border-[var(--sand-strong)] bg-[linear-gradient(180deg,#fffaf3_0%,#f8eddd_100%)] p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-[var(--ink)] sm:text-2xl">Acciones rapidas</h2>
          <p className="text-xs text-[var(--ink-soft)] sm:text-sm">Botones grandes, alto contraste y navegacion simple</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/ventas" className="rounded-2xl bg-[linear-gradient(120deg,var(--cafe-dark)_0%,var(--cafe-mid)_100%)] p-4 text-center font-bold text-[var(--cream)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cafe-dark)]">☕ Ir a Ventas</Link>
          <Link href="/pedidos" className="rounded-2xl bg-[linear-gradient(120deg,#8c4a2f_0%,var(--accent-coral)_100%)] p-4 text-center font-bold text-[var(--cream)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-coral)]">🧾 Ver Pedidos</Link>
          <Link href="/productos" className="rounded-2xl bg-[linear-gradient(120deg,var(--sand-strong)_0%,var(--accent-honey)_100%)] p-4 text-center font-bold text-[var(--ink)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sand-strong)]">📦 Gestionar Productos</Link>
          <Link href="/caja" className="rounded-2xl bg-[linear-gradient(120deg,var(--accent-leaf)_0%,#2f6f4e_100%)] p-4 text-center font-bold text-[var(--cream)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-leaf)]">💰 Movimientos de Caja</Link>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--sand-strong)] bg-white p-4 text-sm text-[var(--ink-soft)] sm:p-5">
        <p className="font-semibold text-[var(--ink)]">Diseño inclusivo</p>
        <p className="mt-1">Se prioriza legibilidad, contraste alto, botones amplios y lenguaje claro para uso diario del equipo escolar.</p>
      </section>
    </div>
  );
}
