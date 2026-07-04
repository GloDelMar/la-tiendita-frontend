'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { documentsApi, transactionsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  downloadConsolidatedReceipt,
  downloadReceipt,
  generateConsolidatedReceiptBlob,
  generateReceiptBlob,
} from '@/lib/receiptGenerator';
import { useCaja } from '@/contexts/CajaContext';

const maestrosConCredito = [
  { nombre: 'Maestra Daniela', grupo: '3° de secundaria' },
  { nombre: 'Maestro Omar', grupo: '1° de secundaria' },
  { nombre: 'Maestro Jorge', grupo: '3° de primaria' },
  { nombre: 'Maestro Ramón', grupo: '4° de primaria' },
  { nombre: 'Maestro Juan Ramón', grupo: '6° de primaria' },
  { nombre: 'Maestra Daniela C.', grupo: '2° de primaria' },
  { nombre: 'Maestra Blanca', grupo: '1° de primaria' },
  { nombre: 'Maestra Rocío', grupo: 'Preescolar' },
  { nombre: 'Maestra Gloriela', grupo: 'Taller Laboral' },
];

export default function RecibosPage() {
  const router = useRouter();
  const { selectedCaja } = useCaja();
  const [viewMode, setViewMode] = useState<'maestros' | 'todas'>('maestros');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [teacherSummary, setTeacherSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOnlyUnpaid, setShowOnlyUnpaid] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!selectedCaja) {
      router.push('/');
      return;
    }
  }, [selectedCaja]);

  useEffect(() => {
    if (viewMode === 'todas') {
      loadAllTransactions();
    }
  }, [viewMode, selectedCaja]);

  async function loadAllTransactions() {
    if (!selectedCaja) return;

    setLoading(true);
    try {
      const filters: any = { caja_id: selectedCaja.id, limit: 100 };
      if (showOnlyUnpaid) {
        filters.pagado = 'NO';
      }
      const transactionsList = await transactionsApi.getAll(filters);
      setTransactions(transactionsList);
      setSelectedTransactions(new Set());
    } catch (error) {
      console.error('Error loading all transactions:', error);
      alert('Error al cargar transacciones');
    } finally {
      setLoading(false);
    }
  }

  async function loadTeacherData() {
    if (!selectedTeacher || !selectedCaja) return;

    setLoading(true);
    try {
      const [summary, transactionsList] = await Promise.all([
        transactionsApi.getTeacherSummary(selectedTeacher, selectedCaja.id),
        transactionsApi.getByTeacher(selectedTeacher, { only_unpaid: showOnlyUnpaid, caja_id: selectedCaja.id }),
      ]);

      setTeacherSummary(summary);
      setTransactions(transactionsList);
      setSelectedTransactions(new Set()); // Reset selection when loading new data
    } catch (error) {
      console.error('Error loading teacher data:', error);
      alert('Error al cargar datos del maestro');
    } finally {
      setLoading(false);
    }
  }

  function toggleTransactionSelection(transactionId: number) {
    const newSelection = new Set(selectedTransactions);
    if (newSelection.has(transactionId)) {
      newSelection.delete(transactionId);
    } else {
      newSelection.add(transactionId);
    }
    setSelectedTransactions(newSelection);
  }

  function toggleSelectAll() {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t.id)));
    }
  }

  async function handleGenerateConsolidatedReceipt() {
    if (!teacherSummary) return;

    // Filter only selected transactions
    const selectedTxs = transactions.filter(t => selectedTransactions.has(t.id));
    
    if (selectedTxs.length === 0) {
      alert('Por favor, selecciona al menos un ticket para generar el recibo consolidado');
      return;
    }

    const receiptTransactions = selectedTxs.map((t) => ({
      id: t.id,
      fecha: t.fecha,
      cliente: t.cliente,
      grupo: t.grupo,
      productos: t.productos,
      total: t.total,
      pago: t.pago,
      cambio: t.cambio,
      pagado: t.pagado,
    }));

    try {
      const consolidatedBlob = generateConsolidatedReceiptBlob(
        teacherSummary.teacher_name,
        teacherSummary.grupo,
        receiptTransactions
      );
      await documentsApi.upload({
        file: consolidatedBlob,
        filename: `recibo_consolidado_${teacherSummary.teacher_name.replace(/\s+/g, '_')}.pdf`,
        category: 'tickets',
        reference_type: 'teacher',
        reference_id: teacherSummary.teacher_name,
      });

      downloadConsolidatedReceipt(teacherSummary.teacher_name, teacherSummary.grupo, receiptTransactions);
    } catch (uploadError) {
      console.error('No se pudo subir el recibo consolidado al bucket:', uploadError);
      alert('No se pudo enviar el recibo consolidado al servidor.');
    }
  }

  async function handleGenerateIndividualReceipt(transaction: any) {
    const receiptData = {
      id: transaction.id,
      fecha: transaction.fecha,
      cliente: transaction.cliente,
      grupo: transaction.grupo,
      productos: transaction.productos,
      total: transaction.total,
      pago: transaction.pago,
      cambio: transaction.cambio,
      pagado: transaction.pagado,
    };

    try {
      const receiptBlob = generateReceiptBlob(receiptData);
      await documentsApi.upload({
        file: receiptBlob,
        filename: `ticket_${transaction.id}.pdf`,
        category: 'tickets',
        reference_type: 'transaction',
        reference_id: String(transaction.id),
      });

      downloadReceipt(receiptData);
    } catch (uploadError) {
      console.error('No se pudo subir el ticket al bucket:', uploadError);
      alert(`No se pudo enviar el ticket #${transaction.id}.`);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-black text-[var(--ink)] mb-8">📄 Gestión de Recibos</h1>

      {/* Selector de modo de visualización */}
      <div className="bg-[var(--cream)] rounded-2xl shadow-md p-6 mb-6 border border-[var(--sand-strong)]/40">
        <h2 className="text-xl font-bold mb-4 text-[var(--ink)]">Tipo de Consulta</h2>
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => {
              setViewMode('maestros');
              setTransactions([]);
              setTeacherSummary(null);
            }}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              viewMode === 'maestros'
                ? 'bg-[var(--cafe-dark)] text-[var(--cream)]'
                : 'bg-[var(--beige)] text-[var(--ink)] hover:bg-[var(--sand)]/50'
            }`}
          >
            👨‍🏫 Por Maestro
          </button>
          <button
            onClick={() => {
              setViewMode('todas');
              setSelectedTeacher('');
              setTeacherSummary(null);
              loadAllTransactions();
            }}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              viewMode === 'todas'
                ? 'bg-[var(--cafe-dark)] text-[var(--cream)]'
                : 'bg-[var(--beige)] text-[var(--ink)] hover:bg-[var(--sand)]/50'
            }`}
          >
            📋 Todas las Transacciones
          </button>
        </div>

        {viewMode === 'maestros' && (
          <>
            <h3 className="text-lg font-semibold mb-3 text-[var(--ink)]">Seleccionar Maestro</h3>
            <div className="flex gap-4">
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-[var(--sand-strong)] rounded-lg focus:ring-2 focus:ring-[var(--cafe-dark)] bg-[var(--cream)]"
              >
                <option value="">Seleccionar maestro...</option>
                {maestrosConCredito.map((maestro, idx) => (
                  <option key={idx} value={maestro.nombre}>
                    {maestro.nombre} - {maestro.grupo}
                  </option>
                ))}
              </select>
              <button
                onClick={loadTeacherData}
                disabled={!selectedTeacher || loading}
                className="px-6 py-3 bg-[linear-gradient(120deg,var(--cafe-dark)_0%,var(--cafe-mid)_100%)] hover:brightness-110 text-[var(--cream)] font-bold rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Cargando...' : 'Cargar Datos'}
              </button>
            </div>

            {selectedTeacher && (
              <div className="mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyUnpaid}
                    onChange={(e) => setShowOnlyUnpaid(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className="text-sm text-[var(--ink-soft)]">Mostrar solo pendientes de pago</span>
                </label>
              </div>
            )}
          </>
        )}

        {viewMode === 'todas' && (
          <div className="mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyUnpaid}
                onChange={(e) => {
                  setShowOnlyUnpaid(e.target.checked);
                  loadAllTransactions();
                }}
                className="w-5 h-5"
              />
              <span className="text-sm text-[var(--ink-soft)]">Mostrar solo pendientes de pago</span>
            </label>
          </div>
        )}
      </div>

      {/* Resumen del maestro */}
      {teacherSummary && (
        <div className="bg-[linear-gradient(135deg,#f8eddd_0%,#f4dcc0_100%)] rounded-2xl shadow-md p-6 mb-6 border-2 border-[var(--sand-strong)]/60">
          <h2 className="text-2xl font-bold mb-4 text-[var(--ink)]">{teacherSummary.teacher_name}</h2>
          <p className="text-[var(--ink-soft)] mb-4">{teacherSummary.grupo}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[var(--cream)] rounded-xl p-4 border border-[var(--sand-strong)]/40">
              <p className="text-sm text-[var(--ink-soft)]">Total Transacciones</p>
              <p className="text-2xl font-bold text-[var(--cafe-dark)]">{teacherSummary.total_transactions}</p>
            </div>
            <div className="bg-[var(--cream)] rounded-xl p-4 border border-[var(--sand-strong)]/40">
              <p className="text-sm text-[var(--ink-soft)]">Monto Total</p>
              <p className="text-2xl font-bold text-[var(--cafe-dark)]">{formatCurrency(teacherSummary.total_amount)}</p>
            </div>
            <div className="bg-[var(--cream)] rounded-xl p-4 border border-[var(--sand-strong)]/40">
              <p className="text-sm text-[var(--ink-soft)]">Total Pagado</p>
              <p className="text-2xl font-bold text-[var(--accent-leaf)]">{formatCurrency(teacherSummary.total_paid)}</p>
            </div>
            <div className="bg-[var(--cream)] rounded-xl p-4 border border-[var(--sand-strong)]/40">
              <p className="text-sm text-[var(--ink-soft)]">Total Pendiente</p>
              <p className="text-2xl font-bold text-[var(--accent-coral)]">{formatCurrency(teacherSummary.total_pending)}</p>
            </div>
          </div>

          {transactions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-[var(--cream)]/70 rounded-lg p-3 border border-[var(--sand-strong)]/30">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.size === transactions.length && transactions.length > 0}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded"
                  />
                  <span className="font-semibold text-[var(--ink)]">
                    Seleccionar todos ({selectedTransactions.size} de {transactions.length} tickets seleccionados)
                  </span>
                </label>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleGenerateConsolidatedReceipt()}
                  disabled={selectedTransactions.size === 0}
                  className="flex-1 bg-[linear-gradient(120deg,var(--cafe-dark)_0%,var(--cafe-mid)_100%)] hover:brightness-110 text-[var(--cream)] px-6 py-3 rounded-lg font-bold disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  📥 Descargar Recibo Consolidado ({selectedTransactions.size} tickets)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista de transacciones */}
      {transactions.length > 0 && (
        <div className="bg-[var(--cream)] rounded-2xl shadow-md p-6 border border-[var(--sand-strong)]/40">
          <h2 className="text-xl font-bold mb-4 text-[var(--ink)]">Transacciones Individuales</h2>
          <p className="text-sm text-[var(--ink-soft)] mb-4">
            💡 <strong>Tip:</strong> Selecciona los tickets que deseas incluir en el recibo consolidado
          </p>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`border-2 rounded-lg p-4 transition-all ${
                  selectedTransactions.has(transaction.id)
                    ? 'border-[var(--cafe-dark)] bg-[var(--beige)]/60'
                    : 'border-[var(--sand-strong)]/40 hover:border-[var(--cafe-mid)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.has(transaction.id)}
                    onChange={() => toggleTransactionSelection(transaction.id)}
                    className="w-5 h-5 mt-1 cursor-pointer"
                  />
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-lg text-[var(--ink)]">Ticket #{transaction.id}</p>
                        <p className="text-sm text-[var(--ink-soft)]">
                          {new Date(transaction.fecha).toLocaleString('es-MX')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[var(--cafe-dark)]">
                          {formatCurrency(transaction.total)}
                        </p>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                            transaction.pagado === 'SI'
                              ? 'bg-[rgba(63,143,98,0.16)] text-[var(--accent-leaf)]'
                              : 'bg-[rgba(232,111,74,0.15)] text-[var(--cafe-dark)]'
                          }`}
                        >
                          {transaction.pagado === 'SI' ? '✓ Pagado' : '✗ Pendiente'}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm font-semibold text-[var(--ink-soft)] mb-1">Productos:</p>
                      <ul className="text-sm text-[var(--ink-soft)] ml-4">
                        {transaction.productos.map((producto: any, idx: number) => (
                          <li key={idx}>
                            {producto.cantidad}x {producto.nombre} - {formatCurrency(producto.subtotal)}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGenerateIndividualReceipt(transaction)}
                        className="flex-1 bg-[linear-gradient(120deg,var(--cafe-dark)_0%,var(--cafe-mid)_100%)] hover:brightness-110 text-[var(--cream)] px-4 py-2 rounded-lg text-sm font-bold"
                      >
                        📥 Descargar Ticket
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTeacher && !loading && transactions.length === 0 && teacherSummary && (
        <div className="bg-[var(--beige)] rounded-xl p-12 text-center border border-[var(--sand-strong)]/40">
          <div className="text-6xl mb-4">📄</div>
          <p className="text-xl text-[var(--ink-soft)]">No hay transacciones para este maestro</p>
        </div>
      )}
    </div>
  );
}
