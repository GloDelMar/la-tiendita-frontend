'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { productsApi, transactionsApi, debtorsApi, documentsApi, resolveImageUrl, resolveProductImageUrl } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { generateReceiptBlob } from '@/lib/receiptGenerator';
import { useCaja } from '@/contexts/CajaContext';

interface Product {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  category: 'bebidas' | 'alimentos' | 'postres';
  option_groups?: ProductOptionGroup[];
  image_url?: string;
  caja_id?: number;
}

interface ProductOptionGroup {
  key: string;
  label: string;
  selection_type: 'single' | 'multiple';
  choices: string[];
}

interface SelectedOption {
  group_key: string;
  group_label: string;
  values: string[];
}

interface CartItem {
  product: Product;
  quantity: number;
  selectedOptions: SelectedOption[];
}

const OPTION_IMAGE_MAP: Record<string, string> = {
  jitomate: '/jitomate.png',
  lechuga: '/lechuga.png',
  echuga: '/lechuga.png',
  cebolla: '/cebolla.png',
  chile: '/chile.png',
  mayonesa: '/mayonesa.png',
  crema: '/crema.png',
  frio: '/frio.png',
  fria: '/frio.png',
  caliente: '/caliente.png',
  sinazucar: '/sin-azucar.png',
};

const normalizeOptionKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const getOptionImage = (choice: string) => OPTION_IMAGE_MAP[normalizeOptionKey(choice)] || null;

export default function VentasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedCaja } = useCaja();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cliente, setCliente] = useState('');
  const [grupo, setGrupo] = useState('');
  const [isCredit, setIsCredit] = useState(false);
  const [payment, setPayment] = useState('');
  const [selectedCoins, setSelectedCoins] = useState<Array<{denom: number, count: number}>>([]);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOptionsMap, setSelectedOptionsMap] = useState<Record<string, string[]>>({});
  const [changeSuggestionIndex, setChangeSuggestionIndex] = useState(0);
  const [showCustomClientInput, setShowCustomClientInput] = useState(false);
  const [showChangeSuggestionModal, setShowChangeSuggestionModal] = useState(false);
  const [changeSuggestions, setChangeSuggestions] = useState<Array<{ [key: number]: number }>>([]);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'todas' | 'bebidas' | 'alimentos' | 'postres'>('todas');

  // Denominaciones de monedas y billetes
  const DENOMINACIONES = [
    { valor: 200, tipo: 'billete', imagen: '/monedas/200.png', alt: '💵' },
    { valor: 100, tipo: 'billete', imagen: '/monedas/100.png', alt: '💵' },
    { valor: 50, tipo: 'billete', imagen: '/monedas/50.png', alt: '💵' },
    { valor: 20, tipo: 'billete', imagen: '/monedas/20pesos.png', alt: '💵' },
    { valor: 10, tipo: 'moneda', imagen: '/monedas/10.png', alt: '🪙' },
    { valor: 5, tipo: 'moneda', imagen: '/monedas/5.png', alt: '🪙' },
    { valor: 2, tipo: 'moneda', imagen: '/monedas/2.png', alt: '🪙' },
    { valor: 1, tipo: 'moneda', imagen: '/monedas/1.png', alt: '🪙' },
    { valor: 0.5, tipo: 'moneda', imagen: '/monedas/50centavos.png', alt: '🪙' },
  ];

  // Lista de maestros con acceso a crédito
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
    { nombre: 'Maestro Emmanuel', grupo: 'Educación Física' },
    { nombre: 'Maestra Gaby', grupo: 'Directora' },
    { nombre: 'Maestra Carito', grupo: 'Cocina' },
  ];

  // Helper para obtener el nombre correcto de la imagen de moneda
  const getMonedaImage = (valor: number): string => {
    if (valor === 0.5) return '/monedas/50centavos.png';
    if (valor === 20) return '/monedas/20pesos.png';
    return `/monedas/${valor}.png`;
  };

  useEffect(() => {
    // Redirigir al dashboard si no hay caja seleccionada
    if (!selectedCaja) {
      router.push('/');
      return;
    }
    
    loadProducts();
    
    // Cargar carrito desde localStorage si existe
    const savedCart = localStorage.getItem('ventas_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        const normalizedCart = Array.isArray(parsedCart)
          ? parsedCart.map((item) => ({
              ...item,
              selectedOptions: Array.isArray(item.selectedOptions) ? item.selectedOptions : [],
            }))
          : [];
        setCart(normalizedCart);
      } catch (e) {
        console.error('Error loading cart from localStorage:', e);
      }
    }
    
    // Recibir monedas seleccionadas desde URL
    const pagoFromUrl = searchParams.get('pago');
    const monedasFromUrl = searchParams.get('monedas');
    
    if (pagoFromUrl && monedasFromUrl) {
      setPayment(pagoFromUrl);
      try {
        const monedas = JSON.parse(decodeURIComponent(monedasFromUrl));
        setSelectedCoins(monedas);
      } catch (e) {
        console.error('Error parsing monedas:', e);
      }
    }
  }, [searchParams, selectedCaja, router]);

  // Guardar carrito en localStorage cada vez que cambie
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('ventas_cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('ventas_cart');
    }
  }, [cart]);

  async function loadProducts() {
    if (!selectedCaja) return;
    
    console.log('[VENTAS] 🔄 Iniciando carga de productos...');
    const startTime = performance.now();
    
    try {
      console.log('[VENTAS] 📡 Llamando a productsApi.getAll()...');
      const data = await productsApi.getAll(selectedCaja.id);
      
      const endTime = performance.now();
      const loadTime = (endTime - startTime).toFixed(2);
      
      console.log('[VENTAS] ✅ Productos cargados exitosamente');
      console.log(`[VENTAS] 📊 Total de productos: ${data.length}`);
      console.log(`[VENTAS] ⏱️ Tiempo de carga: ${loadTime}ms`);
      console.log('[VENTAS] 📦 Datos recibidos:', data);
      
      if (data.length > 0) {
        console.log('[VENTAS] 🔍 Estructura del primer producto:', data[0]);
        console.log('[VENTAS] 🔍 Keys del primer producto:', Object.keys(data[0]));
      }
      
      // Mapear los datos de la API (name, price) a la interfaz esperada (nombre, precio, stock)
      const mappedProducts = data.map((p: any) => ({
        id: p.id,
        nombre: p.name,
        precio: p.price,
        stock: p.stock || 999, // Stock por defecto si no existe
        category: p.category || 'alimentos',
        option_groups: p.option_groups || [],
        image_url: p.image_url,
        caja_id: p.caja_id
      }));
      
      console.log('[VENTAS] 🔄 Productos mapeados:', mappedProducts);
      setProducts(mappedProducts);
      console.log('[VENTAS] ✔️ setProducts ejecutado con', mappedProducts.length, 'productos');
    } catch (error) {
      const endTime = performance.now();
      const loadTime = (endTime - startTime).toFixed(2);
      
      console.error('[VENTAS] ❌ Error al cargar productos');
      console.error(`[VENTAS] ⏱️ Tiempo hasta error: ${loadTime}ms`);
      console.error('[VENTAS] 🐛 Detalles del error:', error);
    } finally {
      console.log('[VENTAS] 🏁 Finalizando loadProducts - setLoading(false)');
      setLoading(false);
    }
  }

  const openQuantityModal = (product: Product) => {
    setSelectedProduct(product);
    const existingItem = cart.find(item => item.product.id === product.id);
    const initialOptions: Record<string, string[]> = {};

    (product.option_groups || []).forEach((group) => {
      const existingValues = existingItem?.selectedOptions.find((option) => option.group_key === group.key)?.values;
      if (existingValues && existingValues.length > 0) {
        initialOptions[group.key] = existingValues;
        return;
      }
      if (group.selection_type === 'single' && group.choices.length > 0) {
        initialOptions[group.key] = [group.choices[0]];
        return;
      }
      initialOptions[group.key] = [];
    });

    setSelectedOptionsMap(initialOptions);
    setShowQuantityModal(true);
  };

  const toggleModalOption = (group: ProductOptionGroup, optionValue: string) => {
    setSelectedOptionsMap((prev) => {
      const currentValues = prev[group.key] || [];
      if (group.selection_type === 'single') {
        return { ...prev, [group.key]: [optionValue] };
      }

      if (currentValues.includes(optionValue)) {
        return { ...prev, [group.key]: currentValues.filter((value) => value !== optionValue) };
      }

      return { ...prev, [group.key]: [...currentValues, optionValue] };
    });
  };

  const buildSelectedOptions = (product: Product): SelectedOption[] => {
    return (product.option_groups || [])
      .map((group) => ({
        group_key: group.key,
        group_label: group.label,
        values: selectedOptionsMap[group.key] || [],
      }))
      .filter((selection) => selection.values.length > 0);
  };

  const buildOptionSignature = (selectedOptions: SelectedOption[]): string => {
    return selectedOptions
      .map((option) => `${option.group_key}:${[...option.values].sort().join('|')}`)
      .sort()
      .join('||');
  };

  const confirmQuantity = () => {
    if (!selectedProduct) {
      setShowQuantityModal(false);
      return;
    }

    const selectedOptions = buildSelectedOptions(selectedProduct);
    const optionSignature = buildOptionSignature(selectedOptions);

    const existing = cart.find(
      (item) =>
        item.product.id === selectedProduct.id &&
        buildOptionSignature(item.selectedOptions) === optionSignature
    );

    if (existing) {
      setCart(cart.map(item =>
        item.product.id === selectedProduct.id && buildOptionSignature(item.selectedOptions) === optionSignature
          ? { ...item, quantity: Math.min(item.quantity + 1, selectedProduct.stock) }
          : item
      ));
    } else {
      setCart([
        ...cart,
        {
          product: selectedProduct,
          quantity: Math.min(1, selectedProduct.stock),
          selectedOptions,
        },
      ]);
    }

    setShowQuantityModal(false);
    setSelectedProduct(null);
    setSelectedOptionsMap({});
  };

  const updateQuantity = (cartIndex: number, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(cartIndex);
      return;
    }
    setCart(cart.map((item, index) =>
      index === cartIndex
        ? { ...item, quantity: Math.min(newQuantity, item.product.stock) }
        : item
    ));
  };

  const removeFromCart = (cartIndex: number) => {
    setCart(cart.filter((_, index) => index !== cartIndex));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.precio * item.quantity), 0);
  };

  const calculateChange = () => {
    const paymentAmount = parseFloat(payment) || 0;
    return paymentAmount - calculateTotal();
  };

  // Función para calcular sugerencias de cambio
  const getChangeSuggestions = (changeAmount: number) => {
    if (changeAmount <= 0) return [];

    const denominations = [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5];
    const suggestions: Array<{ denom: number; count: number }[]> = [];

    // Sugerencia 1: Óptima (menos billetes/monedas)
    let remaining = changeAmount;
    const optimal: { denom: number; count: number }[] = [];
    for (const denom of denominations) {
      const count = Math.floor(remaining / denom);
      if (count > 0) {
        optimal.push({ denom, count });
        remaining = Math.round((remaining - denom * count) * 100) / 100;
      }
    }
    suggestions.push(optimal);

    // Sugerencia 2: Alternativa con billetes más pequeños
    if (changeAmount >= 20) {
      remaining = changeAmount;
      const alternative: { denom: number; count: number }[] = [];
      const altDenoms = [100, 50, 20, 10, 5, 2, 1, 0.5];
      for (const denom of altDenoms) {
        const count = Math.floor(remaining / denom);
        if (count > 0) {
          alternative.push({ denom, count });
          remaining = Math.round((remaining - denom * count) * 100) / 100;
        }
      }
      if (JSON.stringify(alternative) !== JSON.stringify(optimal)) {
        suggestions.push(alternative);
      }
    }

    // Sugerencia 3: Solo billetes de 20 y monedas pequeñas
    if (changeAmount >= 10 && changeAmount <= 200) {
      remaining = changeAmount;
      const smallBills: { denom: number; count: number }[] = [];
      const smallDenoms = [50, 20, 10, 5, 2, 1, 0.5];
      for (const denom of smallDenoms) {
        const count = Math.floor(remaining / denom);
        if (count > 0) {
          smallBills.push({ denom, count });
          remaining = Math.round((remaining - denom * count) * 100) / 100;
        }
      }
      if (JSON.stringify(smallBills) !== JSON.stringify(optimal)) {
        suggestions.push(smallBills);
      }
    }

    return suggestions;
  };

  const getNextChangeSuggestion = () => {
    const change = calculateChange();
    const suggestions = getChangeSuggestions(change);
    setChangeSuggestionIndex((prev) => (prev + 1) % suggestions.length);
  };

  const renderChangeSuggestion = () => {
    const change = calculateChange();
    if (change <= 0) return null;

    const suggestions = getChangeSuggestions(change);
    if (suggestions.length === 0) return null;

    const currentSuggestion = suggestions[changeSuggestionIndex] || suggestions[0];

    return (
      <div className="bg-purple-100 p-4 rounded-xl border-2 border-purple-300">
        <div className="flex justify-between items-center mb-3">
          <span className="text-base text-purple-900 font-semibold">💡 Sugerencia para dar el cambio:</span>
          <span className="font-bold text-2xl text-purple-600">
            {formatCurrency(change)}
          </span>
        </div>

        <div className="mt-3 space-y-2">
          {currentSuggestion.map((item, idx) => (
            <div key={idx} className="flex flex-wrap gap-1 bg-white p-2 rounded-lg">
              {Array.from({ length: item.count }).map((_, i) => (
                <div key={i} className="relative">
                  <img
                    src={getMonedaImage(item.denom)}
                    alt={`${item.denom}`}
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
        
        {suggestions.length > 1 && (
          <button
            onClick={getNextChangeSuggestion}
            className="w-full mt-3 text-sm bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
          >
            🔄 Ver otra sugerencia ({changeSuggestionIndex + 1}/{suggestions.length})
          </button>
        )}
      </div>
    );
  };

  const abrirSelectorMonedas = () => {
    const total = calculateTotal();
    router.push(`/monedas?total=${total}&modo=pago`);
  };

  // Función para generar sugerencias de cambio
  const generarSugerenciasCambio = (monto: number) => {
    if (monto <= 0) {
      setChangeSuggestions([]);
      return;
    }
    
    const sugerencias: Array<{ [key: number]: number }> = [];
    
    // Generar 15 sugerencias diferentes
    for (let intento = 0; intento < 15; intento++) {
      const resultado: { [key: number]: number } = {};
      let restante = Math.round(monto * 100) / 100;
      
      // Crear lista de denominaciones y mezclarlas aleatoriamente
      const denomsDisponibles = [...DENOMINACIONES].sort(() => Math.random() - 0.5);
      
      for (const denom of denomsDisponibles) {
        if (restante >= denom.valor) {
          const maxCantidad = Math.floor(restante / denom.valor);
          // Variar la estrategia: a veces usar máximo, a veces aleatorio
          const cantidad = Math.random() > 0.5 ? maxCantidad : Math.max(1, Math.floor(Math.random() * maxCantidad) + 1);
          
          if (cantidad > 0) {
            resultado[denom.valor] = cantidad;
            restante = Math.round((restante - (cantidad * denom.valor)) * 100) / 100;
          }
        }
      }
      
      // Si aún queda resto, completar con la denominación más pequeña
      if (restante > 0) {
        const denominacionMinima = 0.5;
        const cantidadFaltante = Math.ceil(restante / denominacionMinima);
        resultado[denominacionMinima] = (resultado[denominacionMinima] || 0) + cantidadFaltante;
      }
      
      sugerencias.push(resultado);
    }
    
    // Ordenar sugerencias por cantidad total de elementos (menor a mayor)
    sugerencias.sort((a, b) => {
      const totalA = Object.values(a).reduce((sum, val) => sum + val, 0);
      const totalB = Object.values(b).reduce((sum, val) => sum + val, 0);
      return totalA - totalB;
    });
    
    setChangeSuggestions(sugerencias);
    setCurrentSuggestionIndex(0);
  };

  async function handleCompleteSale() {
    console.log('[VENTAS] 🚀 handleCompleteSale iniciado');
    
    // Prevenir múltiples ejecuciones
    if (isProcessing) {
      console.log('[VENTAS] ⏳ Ya se está procesando una venta');
      return;
    }

    console.log('[VENTAS] - cart.length:', cart.length);
    console.log('[VENTAS] - isCredit:', isCredit);
    console.log('[VENTAS] - payment:', payment);
    console.log('[VENTAS] - cliente:', cliente);
    console.log('[VENTAS] - grupo:', grupo);
    
    if (cart.length === 0) {
      console.log('[VENTAS] ❌ Carrito vacío');
      return;
    }

    if (isCredit && !cliente) {
      console.log('[VENTAS] ❌ Falta seleccionar cliente para crédito');
      alert('Por favor selecciona un cliente para la venta a crédito');
      return;
    }

    if (!isCredit && !payment) {
      console.log('[VENTAS] ❌ Falta el monto del pago');
      alert('Por favor ingresa el monto del pago');
      return;
    }

    // Activar estado de procesamiento
    setIsProcessing(true);

    const total = calculateTotal();
    const paymentAmount = isCredit ? 0 : parseFloat(payment);
    const change = isCredit ? 0 : paymentAmount - total;
    
    console.log('[VENTAS] 💰 Valores calculados:');
    console.log('[VENTAS] - total:', total);
    console.log('[VENTAS] - paymentAmount:', paymentAmount);
    console.log('[VENTAS] - change:', change);
    
    const productosArray = cart.map(item => ({
      nombre: item.product.nombre,
      cantidad: item.quantity,
      precio_unitario: item.product.precio,
      subtotal: item.product.precio * item.quantity,
      opciones: item.selectedOptions,
    }));

    console.log('[VENTAS] 📦 Productos:', productosArray);

    try {
      console.log('[VENTAS] 📡 Llamando a API...');
      const transaction = await transactionsApi.create({
        productos: productosArray,
        total,
        cliente: cliente || 'Cliente general',
        grupo: grupo || 'General',
        pagado: isCredit ? 'NO' : 'SI',
        pago: paymentAmount,
        cambio: change,
        caja_id: selectedCaja?.id,
      });

      console.log('[VENTAS] ✅ Transacción creada:', transaction);

      // Generar y descargar recibo automáticamente
      const receiptData = {
        id: transaction.id,
        fecha: transaction.fecha || new Date().toISOString(),
        cliente: cliente || 'Cliente general',
        grupo: grupo || 'General',
        productos: productosArray,
        total,
        pago: paymentAmount,
        cambio: change,
        pagado: isCredit ? 'NO' : 'SI',
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
      } catch (uploadError) {
        console.error('[VENTAS] ⚠️ No se pudo subir el ticket al bucket:', uploadError);
      }

      setCart([]);
      setCliente('');
      setGrupo('');
      setPayment('');
      setIsCredit(false);
      setShowCustomClientInput(false);
      setSelectedCoins([]);
      localStorage.removeItem('ventas_cart'); // Limpiar carrito del localStorage
      loadProducts();
      
      console.log('[VENTAS] 🎉 Venta completada exitosamente');
      
      // Desactivar estado de procesamiento después del éxito
      setIsProcessing(false);
    } catch (error) {
      console.error('[VENTAS] ❌ Error completing sale:', error);
      alert('Error al completar la venta');
      
      // Desactivar estado de procesamiento en caso de error
      setIsProcessing(false);
    }
  }

  const filteredProducts = products.filter(p =>
    p?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categorySections: Array<{ key: 'bebidas' | 'alimentos' | 'postres'; title: string; icon: string }> = [
    { key: 'bebidas', title: 'Bebidas', icon: '🥤' },
    { key: 'alimentos', title: 'Alimentos', icon: '🍽️' },
    { key: 'postres', title: 'Postres', icon: '🧁' },
  ];

  const groupedProducts = categorySections
    .filter((section) => activeCategoryFilter === 'todas' || section.key === activeCategoryFilter)
    .map((section) => ({
      ...section,
      items: filteredProducts
        .filter((product) => product.category === section.key)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })),
    }));
  
  console.log('[VENTAS] 🔎 Estado actual:');
  console.log(`[VENTAS] - products.length: ${products.length}`);
  console.log(`[VENTAS] - filteredProducts.length: ${filteredProducts.length}`);
  console.log(`[VENTAS] - searchTerm: "${searchTerm}"`);
  console.log(`[VENTAS] - loading: ${loading}`);
  if (products.length > 0) {
    console.log('[VENTAS] - Primer producto:', products[0]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--cafe-dark)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_20%,rgba(242,182,70,0.16)_0,transparent_24%),radial-gradient(circle_at_88%_12%,rgba(232,111,74,0.16)_0,transparent_22%),linear-gradient(140deg,#f8efe2_0%,#f2ddc2_100%)] p-2 sm:p-4 rounded-2xl border border-[var(--sand-strong)]/30">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Productos */}
        <div className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-[var(--ink)] flex items-center gap-2">
              🛒 <span>Nueva Venta</span>
            </h1>
            <div className="bg-[var(--beige)] px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg w-full sm:w-auto text-center lg:hidden border border-[var(--sand-strong)]/40">
              <span className="text-xs font-semibold text-[var(--ink)]">Caja: {selectedCaja?.nombre}</span>
            </div>
          </div>

          {/* Búsqueda */}
          <input
            type="text"
            placeholder="🔍 Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-[var(--sand-strong)] rounded-lg sm:rounded-xl mb-3 sm:mb-4 focus:ring-2 focus:ring-[var(--cafe-dark)] focus:border-[var(--cafe-dark)] bg-[var(--cream)]"
          />

          {/* Filtros rápidos por categoría */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: 'todas', label: 'Todas', icon: '🧾' },
              { key: 'bebidas', label: 'Bebidas', icon: '🥤' },
              { key: 'alimentos', label: 'Alimentos', icon: '🍽️' },
              { key: 'postres', label: 'Postres', icon: '🧁' },
            ].map((filter) => {
              const isActive = activeCategoryFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  onClick={() => setActiveCategoryFilter(filter.key as 'todas' | 'bebidas' | 'alimentos' | 'postres')}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition-all ${
                    isActive
                      ? 'bg-[var(--cafe-dark)] text-[var(--cream)] border-[var(--cafe-dark)] shadow-md'
                      : 'bg-[var(--cream)] text-[var(--ink-soft)] border-[var(--sand-strong)] hover:border-[var(--cafe-mid)] hover:text-[var(--ink)]'
                  }`}
                >
                  {filter.icon} {filter.label}
                </button>
              );
            })}
          </div>

          {/* Secciones de productos por categoría */}
          <div className="space-y-5">
            {groupedProducts.map((section) => (
              <section
                key={section.key}
                className={`rounded-2xl border p-3 sm:p-4 ${
                  section.key === 'bebidas'
                    ? 'bg-[linear-gradient(140deg,rgba(126,201,224,0.18)_0%,rgba(255,255,255,0.55)_100%)] border-[rgba(126,201,224,0.6)]'
                    : section.key === 'postres'
                    ? 'bg-[linear-gradient(140deg,rgba(242,182,70,0.22)_0%,rgba(255,255,255,0.55)_100%)] border-[rgba(242,182,70,0.6)]'
                    : 'bg-[linear-gradient(140deg,rgba(150,196,120,0.2)_0%,rgba(255,255,255,0.55)_100%)] border-[rgba(150,196,120,0.65)]'
                }`}
              >
                <h2 className="text-base sm:text-lg font-black text-[var(--ink)] mb-2 sm:mb-3 flex items-center gap-2">
                  <span className="text-lg">{section.icon}</span>
                  <span>{section.title}</span>
                  <span className="text-xs font-semibold bg-[var(--cream)] border border-[var(--sand-strong)]/50 text-[var(--ink-soft)] px-2 py-0.5 rounded-full">
                    {section.items.length} productos
                  </span>
                </h2>
                {section.items.length === 0 ? (
                  <div className="bg-[var(--cream)] border border-dashed border-[var(--sand-strong)] rounded-xl px-4 py-3 text-sm text-[var(--ink-soft)]">
                    No hay productos en esta sección.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                    {section.items.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => openQuantityModal(product)}
                        className="bg-[var(--cream)] rounded-lg sm:rounded-xl shadow-md p-2 sm:p-3 cursor-pointer hover:shadow-xl hover:scale-105 transition-all border border-[var(--sand-strong)]/30 hover:border-[var(--cafe-mid)]"
                      >
                        <div className="aspect-square bg-gradient-to-br from-[#f7ead7] to-[#f2dcbc] rounded-md sm:rounded-lg mb-1.5 sm:mb-2 flex items-center justify-center overflow-hidden">
                          {product.image_url ? (
                            <img
                              src={resolveProductImageUrl(product.id, product.image_url)}
                              alt={product.nombre}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const fallback = resolveImageUrl(product.image_url);
                                if (fallback && e.currentTarget.src !== fallback) {
                                  e.currentTarget.src = fallback;
                                  return;
                                }
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-2xl sm:text-4xl">📦</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-[var(--ink)] mb-0.5 sm:mb-1 text-xs sm:text-sm leading-tight line-clamp-2">{product.nombre}</h3>
                        <p className="text-sm sm:text-lg font-bold text-[var(--cafe-dark)] mb-0.5">{formatCurrency(product.precio)}</p>
                        <p className="text-[10px] sm:text-xs text-[var(--ink-soft)] bg-[var(--beige)] px-1.5 sm:px-2 py-0.5 rounded-full inline-block border border-[var(--sand-strong)]/30">
                          Stock: {product.stock}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>

        {/* Carrito */}
        <div className="lg:sticky lg:top-20 lg:h-fit">
          <div className="bg-[var(--cream)] rounded-lg sm:rounded-xl shadow-xl p-3 sm:p-4 border border-[var(--sand-strong)]/40">
            <h2 className="text-base sm:text-xl font-bold mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
              🛍️ <span>Carrito</span>
            </h2>

            {cart.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <div className="text-3xl sm:text-5xl mb-2">🛒</div>
                <p className="text-[var(--ink-soft)] text-sm sm:text-base">Carrito vacío</p>
              </div>
            ) : (
              <div className="max-h-[250px] sm:max-h-[300px] lg:max-h-[350px] overflow-y-auto space-y-2 mb-3 sm:mb-4 pr-1">
                {cart.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gradient-to-r from-[#f9eddc] to-[#f3ddbf] rounded-lg border border-[var(--sand-strong)]/40">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs sm:text-sm truncate">{item.product.nombre}</p>
                      {item.selectedOptions.length > 0 && (
                        <p className="text-[10px] sm:text-xs text-[var(--ink-soft)] leading-tight mt-0.5">
                          {item.selectedOptions.map((option) => `${option.group_label}: ${option.values.join(', ')}`).join(' | ')}
                        </p>
                      )}
                      <p className="text-sm sm:text-base text-[var(--cafe-dark)] font-semibold">{formatCurrency(item.product.precio)}</p>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <button
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 bg-red-500 hover:bg-red-600 text-white rounded-md text-base sm:text-lg font-bold flex items-center justify-center"
                      >
                        −
                      </button>
                      <div className="w-10 sm:w-12 text-center font-bold text-base sm:text-xl bg-[var(--cream)] rounded-md py-1 border border-[var(--sand-strong)]">
                        {item.quantity}
                      </div>
                      <button
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 bg-green-500 hover:bg-green-600 text-white rounded-md text-base sm:text-lg font-bold flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-xl sm:text-2xl md:text-3xl hover:scale-125 transition-transform"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t-2 border-[var(--sand-strong)]/50 pt-3 mb-3">
              <div className="flex justify-between items-center bg-gradient-to-r from-[var(--beige)] to-[#f4dcc0] p-2 sm:p-3 rounded-lg mb-3 border border-[var(--sand-strong)]/40">
                <span className="text-sm sm:text-base font-bold">Total:</span>
                <span className="text-xl sm:text-2xl font-bold text-[var(--cafe-dark)]">{formatCurrency(calculateTotal())}</span>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {/* Selector de Cliente */}
                {showCustomClientInput ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="👤 Nombre del cliente"
                      value={cliente}
                      onChange={(e) => setCliente(e.target.value)}
                      className="w-full px-3 py-2 text-sm border-2 border-[var(--sand-strong)] rounded-lg focus:ring-2 focus:ring-[var(--cafe-dark)] focus:border-[var(--cafe-dark)]"
                    />
                    <input
                      type="text"
                      placeholder="👥 Grupo (opcional)"
                      value={grupo}
                      onChange={(e) => setGrupo(e.target.value)}
                      className="w-full px-3 py-2 text-sm border-2 border-[var(--sand-strong)] rounded-lg focus:ring-2 focus:ring-[var(--cafe-dark)] focus:border-[var(--cafe-dark)]"
                    />
                    <button
                      onClick={() => {
                        setShowCustomClientInput(false);
                        setCliente('');
                        setGrupo('');
                      }}
                      className="text-xs sm:text-sm text-[var(--cafe-dark)] hover:text-[var(--cafe-mid)]"
                    >
                      ← Volver a lista de maestros
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={cliente ? `${cliente}|${grupo}` : ''}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setShowCustomClientInput(true);
                          setCliente('');
                          setGrupo('');
                        } else if (e.target.value) {
                          const [nombre, grupoVal] = e.target.value.split('|');
                          setCliente(nombre);
                          setGrupo(grupoVal);
                        } else {
                          setCliente('');
                          setGrupo('');
                        }
                      }}
                      className="w-full px-3 py-2 text-sm border-2 border-[var(--sand-strong)] rounded-lg focus:ring-2 focus:ring-[var(--cafe-dark)] focus:border-[var(--cafe-dark)] bg-[var(--cream)]"
                    >
                      <option value="">👤 Seleccionar maestro (opcional)</option>
                      {maestrosConCredito.map((maestro, idx) => (
                        <option key={idx} value={`${maestro.nombre}|${maestro.grupo}`}>
                          {maestro.nombre} - {maestro.grupo}
                        </option>
                      ))}
                      <option value="custom">✏️ Otro cliente...</option>
                    </select>
                    {cliente && (
                      <div className="bg-[var(--beige)] px-2 sm:px-3 py-1.5 sm:py-2 rounded-md border border-[var(--sand-strong)]/40">
                        <p className="text-xs sm:text-sm text-[var(--ink)]">
                          <strong>{cliente}</strong> - {grupo}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <label className="flex items-center gap-2 sm:gap-3 cursor-pointer bg-yellow-100 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border-2 border-yellow-300">
                  <input
                    type="checkbox"
                    checked={isCredit}
                    onChange={(e) => setIsCredit(e.target.checked)}
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7"
                  />
                  <span className="font-bold text-sm sm:text-base md:text-lg">📝 Venta a crédito</span>
                </label>

                {!isCredit && (
                  <>
                    <button
                      onClick={abrirSelectorMonedas}
                      className="w-full bg-[linear-gradient(120deg,var(--accent-leaf)_0%,var(--accent-sky)_100%)] hover:brightness-110 text-[var(--cream)] px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base md:text-xl font-bold flex items-center justify-center gap-2 sm:gap-3 shadow-lg hover:shadow-xl transition-all"
                    >
                      💰 <span>¿Con cuánto pagas?</span>
                    </button>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="💵 O escribe el monto..."
                        value={payment}
                        onChange={(e) => {
                          setPayment(e.target.value);
                          setSelectedCoins([]); // Limpiar monedas si escribe manualmente
                        setChangeSuggestionIndex(0); // Reset suggestion index on payment change
                      }}
                      className="flex-1 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base md:text-lg border-2 border-[var(--sand-strong)] rounded-lg sm:rounded-xl focus:ring-2 sm:focus:ring-4 focus:ring-[var(--cafe-dark)] focus:border-[var(--cafe-dark)]"
                    />
                    {parseFloat(payment) > calculateTotal() && (
                      <button
                        onClick={() => {
                          const cambio = parseFloat(payment) - calculateTotal();
                          generarSugerenciasCambio(cambio);
                          setShowChangeSuggestionModal(true);
                        }}
                        className="bg-[linear-gradient(120deg,var(--sand-strong)_0%,var(--accent-honey)_100%)] hover:brightness-105 text-[var(--ink)] px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-bold shadow-lg hover:shadow-xl transition-all text-lg sm:text-xl md:text-2xl"
                        title="Ver sugerencias de cambio"
                      >
                        💡
                      </button>
                    )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || isProcessing}
              className={`w-full py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg shadow-lg transition-all ${
                cart.length === 0 || isProcessing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[linear-gradient(120deg,var(--cafe-dark)_0%,var(--cafe-mid)_100%)] hover:brightness-110 text-[var(--cream)] hover:scale-105'
              }`}
            >
              {isProcessing ? '⏳ Procesando...' : '✅ Completar Venta'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de especificaciones del pedido */}
      {showQuantityModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-sm w-full p-3 my-2 max-h-[98vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900">Personalizar pedido</h2>
              <button
                onClick={() => {
                  setShowQuantityModal(false);
                  setSelectedProduct(null);
                  setSelectedOptionsMap({});
                }}
                className="text-2xl hover:scale-110 transition-transform"
              >
                ✖️
              </button>
            </div>

            <div className="bg-[var(--beige)] rounded-lg p-2 mb-2 border border-[var(--sand-strong)]/40">
              <p className="text-base font-bold text-[var(--ink)]">{selectedProduct.nombre}</p>
              <p className="text-lg font-bold text-[var(--cafe-dark)]">{formatCurrency(selectedProduct.precio)}</p>
              <p className="text-xs text-[var(--ink-soft)]">Stock: {selectedProduct.stock}</p>
            </div>

            {(selectedProduct.option_groups || []).length > 0 && (
              <div className="mb-3 space-y-2">
                <p className="text-sm font-semibold text-[var(--ink)]">Especificaciones del pedido</p>
                {(selectedProduct.option_groups || []).map((group) => (
                  <div key={group.key} className="rounded-lg border border-[var(--sand-strong)]/40 bg-[var(--beige)] p-2">
                    <p className="text-xs font-semibold text-[var(--ink-soft)] mb-1">
                      {group.label} {group.selection_type === 'single' ? '(elige una)' : '(elige las que apliquen)'}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {group.choices.map((choice) => {
                        const selectedValues = selectedOptionsMap[group.key] || [];
                        const isSelected = selectedValues.includes(choice);
                        const choiceImage = getOptionImage(choice);
                        return (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => toggleModalOption(group, choice)}
                            className={`rounded-xl border transition overflow-hidden ${
                              isSelected
                                ? 'border-[var(--cafe-dark)] ring-2 ring-[var(--cafe-dark)] bg-[var(--cream)]'
                                : 'border-[var(--sand-strong)] bg-[var(--cream)] hover:border-[var(--cafe-mid)]'
                            }`}
                          >
                            {choiceImage ? (
                              <div className="p-2 flex flex-col items-center gap-1">
                                <img
                                  src={choiceImage}
                                  alt={choice}
                                  className="w-12 h-12 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <span className="text-[11px] leading-tight font-semibold text-[var(--ink)] text-center">
                                  {choice}
                                </span>
                              </div>
                            ) : (
                              <span
                                className={`block px-2 py-3 text-xs font-semibold ${
                                  isSelected ? 'text-[var(--cafe-dark)]' : 'text-[var(--ink)]'
                                }`}
                              >
                                {choice}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(selectedProduct.option_groups || []).length === 0 && (
              <div className="mb-3 p-2 rounded-lg border border-[var(--sand-strong)]/40 bg-[var(--beige)] text-sm text-[var(--ink-soft)]">
                Este producto no requiere especificaciones.
              </div>
            )}

            <button
              onClick={confirmQuantity}
              className="w-full mt-2 py-2 rounded-lg font-bold text-base shadow-lg transition-all bg-[linear-gradient(120deg,var(--cafe-dark)_0%,var(--cafe-mid)_100%)] hover:brightness-110 text-[var(--cream)] hover:scale-105"
            >
              ✅ Agregar 1 a la comanda
            </button>
          </div>
        </div>
      )}

      {/* Modal de sugerencias de cambio */}
      {showChangeSuggestionModal && changeSuggestions.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full p-3 sm:p-4 md:p-6 my-4 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900">💡 Sugerencias de Cambio</h2>
              <button
                onClick={() => setShowChangeSuggestionModal(false)}
                className="text-2xl sm:text-3xl hover:scale-110 transition-transform"
              >
                ✖️
              </button>
            </div>

            <div className="bg-[var(--beige)] rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 mb-3 sm:mb-4 border border-[var(--sand-strong)]/40">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm md:text-base font-semibold text-[var(--ink)]">Cambio a entregar:</span>
                <span className="text-lg sm:text-2xl md:text-3xl font-bold text-[var(--cafe-dark)]">
                  {formatCurrency(parseFloat(payment) - calculateTotal())}
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border-2 sm:border-3 md:border-4 border-yellow-400">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-yellow-900">
                  Opción {currentSuggestionIndex + 1} de {changeSuggestions.length}
                </h3>
              </div>

              <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 items-center justify-center mb-3 sm:mb-4 bg-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl min-h-[80px] sm:min-h-[100px]">
                {Object.entries(changeSuggestions[currentSuggestionIndex]).map(([valor, cantidad]) => {
                  if (cantidad === 0) return null;
                  return Array.from({ length: cantidad }).map((_, i) => (
                    <img
                      key={`${valor}-${i}`}
                      src={getMonedaImage(parseFloat(valor))}
                      alt={formatCurrency(parseFloat(valor))}
                      className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ));
                })}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setCurrentSuggestionIndex((prev) => 
                      prev > 0 ? prev - 1 : changeSuggestions.length - 1
                    );
                  }}
                  className="bg-[linear-gradient(120deg,var(--sand-strong)_0%,var(--accent-honey)_100%)] hover:brightness-105 text-[var(--ink)] px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base md:text-lg font-bold transition"
                >
                  ⬅️ Anterior
                </button>
                <button
                  onClick={() => {
                    setCurrentSuggestionIndex((prev) => 
                      (prev + 1) % changeSuggestions.length
                    );
                  }}
                  className="bg-[linear-gradient(120deg,var(--sand-strong)_0%,var(--accent-honey)_100%)] hover:brightness-105 text-[var(--ink)] px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base md:text-lg font-bold transition"
                >
                  Siguiente ➡️
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowChangeSuggestionModal(false)}
              className="w-full mt-3 sm:mt-4 md:mt-6 bg-[linear-gradient(120deg,var(--cafe-dark)_0%,var(--cafe-mid)_100%)] hover:brightness-110 text-[var(--cream)] px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl text-sm sm:text-base md:text-lg font-bold transition"
            >
              ✅ Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
