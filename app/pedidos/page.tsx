'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { transactionsApi } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useCaja } from '@/contexts/CajaContext';

interface ProductInTransaction {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface Transaction {
  id: number;
  cliente: string;
  grupo: string;
  productos: ProductInTransaction[];
  total: number;
  pago: number;
  cambio: number;
  pagado: 'SI' | 'NO';
  caja_id?: number;
  fecha: string;
}

function getDeliveredStorageKey(cajaId: number) {
  return `pedidos_entregados_caja_${cajaId}`;
}

export default function PedidosPage() {
  const router = useRouter();
  const { selectedCaja } = useCaja();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deliveredIds, setDeliveredIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeliveredModal, setShowDeliveredModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const deliveredSet = useMemo(() => new Set(deliveredIds), [deliveredIds]);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const diff = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      if (diff !== 0) return diff;
      return a.id - b.id;
    });
  }, [transactions]);

  const activeOrders = useMemo(
    () => sortedTransactions.filter((t) => !deliveredSet.has(t.id)),
    [sortedTransactions, deliveredSet]
  );

  const deliveredOrders = useMemo(
    () => sortedTransactions.filter((t) => deliveredSet.has(t.id)),
    [sortedTransactions, deliveredSet]
  );

  useEffect(() => {
    if (!selectedCaja) {
      router.push('/');
      return;
    }

    const storageKey = getDeliveredStorageKey(selectedCaja.id);
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setDeliveredIds(parsed.filter((value) => Number.isInteger(value)));
        }
      } catch (storageError) {
        console.error('Error al leer pedidos entregados:', storageError);
      }
    } else {
      setDeliveredIds([]);
    }
  }, [selectedCaja, router]);

  useEffect(() => {
    if (!selectedCaja) return;

    const storageKey = getDeliveredStorageKey(selectedCaja.id);
    localStorage.setItem(storageKey, JSON.stringify(deliveredIds));
  }, [deliveredIds, selectedCaja]);

  useEffect(() => {
    if (!selectedCaja) return;

    const loadTransactions = async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) {
          setIsRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const data = await transactionsApi.getAll({
          caja_id: selectedCaja.id,
          limit: 500,
        });

        setTransactions(data);
      } catch (loadError) {
        console.error('Error loading pedidos:', loadError);
        setError('No se pudieron cargar los pedidos.');
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    };

    loadTransactions();

    const intervalId = window.setInterval(() => {
      loadTransactions(true);
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [selectedCaja, refreshTrigger]);

  const markAsDelivered = (transactionId: number) => {
    setDeliveredIds((prev) => {
      if (prev.includes(transactionId)) return prev;
      return [...prev, transactionId];
    });
  };

  const reactivateOrder = (transactionId: number) => {
    setDeliveredIds((prev) => prev.filter((id) => id !== transactionId));
  };

  if (!selectedCaja) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="rounded-2xl bg-[linear-gradient(120deg,var(--cafe-dark)_0%,var(--cafe-mid)_60%,#a45f3b_100%)] p-6 text-[var(--cream)] shadow-xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Pedidos</h1>
            <p className="text-[rgba(255,249,241,0.9)] mt-1 text-sm md:text-base">
              Cola activa de tickets para la caja: <span className="font-bold">{selectedCaja.nombre}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowDeliveredModal(true)}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 font-semibold transition-colors"
            >
              Ver entregados ({deliveredOrders.length})
            </button>
            <button
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-xl bg-[var(--cream)] text-[var(--cafe-dark)] hover:bg-[#fff2e0] font-bold transition-colors disabled:opacity-60"
            >
              {isRefreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-[var(--cream)] rounded-2xl shadow-md p-12 text-center border border-[var(--sand-strong)]/40">
          <div className="w-12 h-12 border-4 border-[var(--sand)] border-t-[var(--cafe-dark)] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[var(--ink-soft)]">Cargando pedidos...</p>
        </div>
      ) : error ? (
        <div className="bg-[rgba(232,111,74,0.12)] border border-[rgba(232,111,74,0.4)] text-[var(--cafe-dark)] rounded-2xl p-6">
          <p className="font-semibold">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-[var(--cream)] rounded-xl p-4 shadow border border-[var(--sand-strong)]/40">
              <p className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">En cola</p>
              <p className="text-3xl font-extrabold text-[var(--cafe-dark)]">{activeOrders.length}</p>
            </div>
            <div className="bg-[var(--cream)] rounded-xl p-4 shadow border border-[var(--sand-strong)]/40">
              <p className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">Entregados</p>
              <p className="text-3xl font-extrabold text-[var(--accent-leaf)]">{deliveredOrders.length}</p>
            </div>
            <div className="bg-[var(--cream)] rounded-xl p-4 shadow border border-[var(--sand-strong)]/40">
              <p className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">Tickets cargados</p>
              <p className="text-3xl font-extrabold text-[var(--accent-honey)]">{sortedTransactions.length}</p>
            </div>
          </div>

          {activeOrders.length === 0 ? (
            <div className="bg-[var(--cream)] rounded-2xl shadow-md p-12 text-center border border-dashed border-[var(--sand-strong)]">
              <p className="text-2xl">✅</p>
              <h2 className="mt-2 text-xl font-bold text-[var(--ink)]">No hay pedidos pendientes</h2>
              <p className="text-[var(--ink-soft)] mt-1">Cuando entren nuevos tickets aparecerán aquí.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {activeOrders.map((order, index) => (
                <article
                  key={order.id}
                  className="relative bg-[#fff2db] rounded-2xl shadow-lg border border-[var(--sand-strong)] overflow-hidden"
                >
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-100 border border-amber-200"></div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-100 border border-amber-200"></div>

                  <div className="bg-gradient-to-r from-[var(--sand)] to-[var(--accent-honey)] px-5 py-4 border-b-2 border-dashed border-[var(--sand-strong)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black text-[var(--cafe-dark)] uppercase tracking-[0.2em]">Comanda #{index + 1}</p>
                        <h2 className="text-xl font-extrabold text-[var(--ink)] leading-tight mt-1">{order.cliente || 'Cliente'}</h2>
                        <p className="text-sm text-[var(--ink-soft)] mt-1">Ticket #{order.id} • {formatDateTime(order.fecha)}</p>
                      </div>
                      <button
                        onClick={() => markAsDelivered(order.id)}
                        className="px-4 py-2 rounded-xl bg-[var(--accent-leaf)] hover:bg-[#2f6f4e] text-[var(--cream)] font-bold transition-colors whitespace-nowrap shadow-sm"
                      >
                        Entregado
                      </button>
                    </div>
                  </div>

                  <div className="p-5 bg-[repeating-linear-gradient(180deg,#fffbeb_0px,#fffbeb_29px,#fde68a_30px)]">
                    <p className="text-sm font-bold text-orange-900 mb-2 uppercase tracking-wide">Bandeja:</p>
                    <ul className="space-y-2 mb-4">
                      {order.productos.map((item, idx) => (
                        <li key={`${order.id}-${idx}`} className="flex justify-between items-start gap-4 text-sm pb-1 border-b border-amber-200/70 last:border-b-0">
                          <span className="text-gray-800 font-medium">
                            {String(item.cantidad).padStart(2, '0')} x {item.nombre}
                          </span>
                          <span className="font-bold text-gray-900 whitespace-nowrap">
                            {formatCurrency(item.subtotal)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-3 border-t-2 border-dashed border-amber-400 flex justify-between items-center">
                      <span className="text-sm text-gray-700 font-semibold">Total bandeja</span>
                      <span className="text-lg font-extrabold text-emerald-800">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {showDeliveredModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Pedidos entregados</h3>
                <p className="text-sm text-gray-600">Puedes reactivar un pedido si se marcó por error.</p>
              </div>
              <button
                onClick={() => setShowDeliveredModal(false)}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
              >
                Cerrar
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {deliveredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Aun no hay pedidos marcados como entregados.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deliveredOrders.map((order) => (
                    <div
                      key={`delivered-${order.id}`}
                      className="border border-amber-200 bg-amber-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div>
                        <p className="font-bold text-gray-900">Comanda #{order.id} - {order.cliente || 'Cliente'}</p>
                        <p className="text-sm text-gray-600">{formatDateTime(order.fecha)}</p>
                        <p className="text-sm text-gray-700 mt-1">
                          {order.productos.map((p) => `${p.cantidad}x ${p.nombre}`).join(', ')}
                        </p>
                      </div>

                      <button
                        onClick={() => reactivateOrder(order.id)}
                        className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold"
                      >
                        Reactivar pedido
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
