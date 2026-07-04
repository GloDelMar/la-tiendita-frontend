'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { productsApi, resolveImageUrl, resolveProductImageUrl } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useCaja } from '@/contexts/CajaContext';

type ProductCategory = 'bebidas' | 'alimentos' | 'postres';

interface ProductOptionGroup {
  key: string;
  label: string;
  selection_type: 'single' | 'multiple';
  choices: string[];
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: ProductCategory;
  option_groups?: ProductOptionGroup[];
  image_url?: string;
  created_at: string;
  caja_id?: number;
}

const FOOD_INGREDIENT_OPTIONS = ['Jitomate', 'Lechuga', 'Cebolla', 'Chile', 'Mayonesa', 'Crema'];
const DRINK_SWEETNESS_OPTIONS = ['Sin azucar', 'Dulce', 'Muy dulce'];
const DRINK_TEMPERATURE_OPTIONS = ['Fria', 'Caliente'];

export default function ProductsPage() {
  const router = useRouter();
  const { selectedCaja } = useCaja();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', category: 'alimentos' as ProductCategory, caja_id: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedFoodOptions, setSelectedFoodOptions] = useState<string[]>([...FOOD_INGREDIENT_OPTIONS]);
  const [selectedDrinkSweetness, setSelectedDrinkSweetness] = useState<string[]>([...DRINK_SWEETNESS_OPTIONS]);
  const [selectedDrinkTemperatures, setSelectedDrinkTemperatures] = useState<string[]>([...DRINK_TEMPERATURE_OPTIONS]);
  const [drinkFlavorsInput, setDrinkFlavorsInput] = useState('');

  useEffect(() => {
    if (!selectedCaja) {
      router.push('/');
      return;
    }
    loadProducts();
  }, [selectedCaja]);

  async function loadProducts() {
    if (!selectedCaja) return;
    
    try {
      const data = await productsApi.getAll(selectedCaja.id);
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      alert('Por favor completa todos los campos');
      return;
    }

    if (!selectedCaja) {
      alert('Debes seleccionar una caja primero');
      return;
    }

    const parsedFlavors = drinkFlavorsInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const optionGroups: ProductOptionGroup[] = [];

    if (formData.category === 'alimentos' && selectedFoodOptions.length > 0) {
      optionGroups.push({
        key: 'ingredientes',
        label: 'Ingredientes',
        selection_type: 'multiple',
        choices: selectedFoodOptions,
      });
    }

    if (formData.category === 'bebidas') {
      if (selectedDrinkTemperatures.length > 0) {
        optionGroups.push({
          key: 'temperatura',
          label: 'Temperatura',
          selection_type: 'single',
          choices: selectedDrinkTemperatures,
        });
      }

      if (selectedDrinkSweetness.length > 0) {
        optionGroups.push({
          key: 'dulzor',
          label: 'Nivel de azucar',
          selection_type: 'single',
          choices: selectedDrinkSweetness,
        });
      }

      if (parsedFlavors.length > 0) {
        optionGroups.push({
          key: 'sabor',
          label: 'Sabor',
          selection_type: 'single',
          choices: parsedFlavors,
        });
      }
    }

    try {
      const productData: any = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        option_groups: optionGroups,
        caja_id: selectedCaja.id, // Asignar automáticamente la caja seleccionada
      };

      let savedProduct;
      if (editingProduct) {
        savedProduct = await productsApi.update(editingProduct.id, productData);
      } else {
        savedProduct = await productsApi.create(productData);
      }

      // Subir imagen si existe
      if (imageFile && savedProduct.id) {
        await productsApi.uploadImage(savedProduct.id, imageFile);
      }

      setShowModal(false);
      setEditingProduct(null);
      setFormData({ name: '', price: '', category: 'alimentos', caja_id: '' });
      setImageFile(null);
      setSelectedFoodOptions([...FOOD_INGREDIENT_OPTIONS]);
      setSelectedDrinkSweetness([...DRINK_SWEETNESS_OPTIONS]);
      setSelectedDrinkTemperatures([...DRINK_TEMPERATURE_OPTIONS]);
      setDrinkFlavorsInput('');
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error al guardar producto');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      await productsApi.delete(id);
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error al eliminar producto');
    }
  }

  function openEditModal(product: Product) {
    const optionGroups = product.option_groups || [];
    const ingredientes = optionGroups.find((group) => group.key === 'ingredientes')?.choices || [];
    const dulzor = optionGroups.find((group) => group.key === 'dulzor')?.choices || [];
    const temperatura = optionGroups.find((group) => group.key === 'temperatura')?.choices || [];
    const sabores = optionGroups.find((group) => group.key === 'sabor')?.choices || [];

    setEditingProduct(product);
    setFormData({ 
      name: product.name, 
      price: product.price.toString(),
      category: product.category || 'alimentos',
      caja_id: product.caja_id?.toString() || ''
    });
    setSelectedFoodOptions(ingredientes.length > 0 ? ingredientes : [...FOOD_INGREDIENT_OPTIONS]);
    setSelectedDrinkSweetness(dulzor.length > 0 ? dulzor : [...DRINK_SWEETNESS_OPTIONS]);
    setSelectedDrinkTemperatures(temperatura.length > 0 ? temperatura : [...DRINK_TEMPERATURE_OPTIONS]);
    setDrinkFlavorsInput(sabores.join(', '));
    setShowModal(true);
  }

  function openNewModal() {
    setEditingProduct(null);
    setFormData({ name: '', price: '', category: 'alimentos', caja_id: '' });
    setImageFile(null);
    setSelectedFoodOptions([...FOOD_INGREDIENT_OPTIONS]);
    setSelectedDrinkSweetness([...DRINK_SWEETNESS_OPTIONS]);
    setSelectedDrinkTemperatures([...DRINK_TEMPERATURE_OPTIONS]);
    setDrinkFlavorsInput('');
    setShowModal(true);
  }

  function toggleOption(
    value: string,
    selectedValues: string[],
    setter: (values: string[]) => void
  ) {
    if (selectedValues.includes(value)) {
      setter(selectedValues.filter((item) => item !== value));
      return;
    }
    setter([...selectedValues, value]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--cafe-dark)] mx-auto"></div>
          <p className="mt-4 text-[var(--ink-soft)]">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--ink)]">Productos</h1>
          {selectedCaja && (
            <p className="text-sm text-[var(--ink-soft)] mt-1">
              Caja: <span className="font-semibold text-[var(--cafe-dark)]">{selectedCaja.nombre}</span>
            </p>
          )}
        </div>
        <button
          onClick={openNewModal}
          className="bg-[linear-gradient(120deg,var(--cafe-dark)_0%,var(--cafe-mid)_100%)] hover:brightness-110 text-[var(--cream)] px-6 py-2 rounded-xl font-semibold transition"
        >
          + Nuevo Producto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-[var(--cream)] rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow border border-[var(--sand-strong)]/60">
            <div className="h-48 bg-[linear-gradient(135deg,#f4e3cf_0%,#f8efe2_100%)] flex items-center justify-center">
              {product.image_url ? (
                <img
                  src={resolveProductImageUrl(product.id, product.image_url)}
                  alt={product.name}
                  className="h-full w-full object-contain"
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
                <span className="text-6xl">📦</span>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg text-[var(--ink)] mb-2">{product.name}</h3>
              <p className="text-2xl font-bold text-[var(--cafe-dark)] mb-2">{formatCurrency(product.price)}</p>
              <span className="inline-block text-xs font-semibold px-2 py-1 rounded-full bg-[var(--beige)] text-[var(--ink-soft)] border border-[var(--sand-strong)]/40 mb-3">
                {product.category === 'bebidas' ? 'Bebidas' : product.category === 'postres' ? 'Postres' : 'Alimentos'}
              </span>
              {product.option_groups && product.option_groups.length > 0 && (
                <p className="text-xs text-[var(--ink-soft)] mb-3">
                  Especificaciones configuradas: {product.option_groups.length}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(product)}
                  className="flex-1 bg-[var(--sand)]/35 hover:bg-[var(--sand)]/55 text-[var(--ink)] px-4 py-2 rounded-lg transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="flex-1 bg-[rgba(232,111,74,0.15)] hover:bg-[rgba(232,111,74,0.25)] text-[var(--cafe-dark)] px-4 py-2 rounded-lg transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[var(--ink-soft)] text-lg">No hay productos registrados</p>
          <button
            onClick={openNewModal}
            className="mt-4 text-[var(--cafe-dark)] hover:text-[var(--cafe-mid)] font-semibold"
          >
            Crear el primero
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--cream)] rounded-2xl max-w-md w-full p-6 border border-[var(--sand-strong)]">
            <h2 className="text-2xl font-bold mb-4 text-[var(--ink)]">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--ink-soft)] mb-2">
                  Nombre del producto
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-[var(--sand-strong)] rounded-lg focus:ring-2 focus:ring-[var(--cafe-dark)] focus:border-transparent"
                  placeholder="Ej: Coca Cola 600ml"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--ink-soft)] mb-2">
                  Precio
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-[var(--sand-strong)] rounded-lg focus:ring-2 focus:ring-[var(--cafe-dark)] focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--ink-soft)] mb-2">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                  className="w-full px-4 py-2 border border-[var(--sand-strong)] rounded-lg focus:ring-2 focus:ring-[var(--cafe-dark)] focus:border-transparent"
                >
                  <option value="bebidas">Bebidas</option>
                  <option value="alimentos">Alimentos</option>
                  <option value="postres">Postres</option>
                </select>
              </div>

              {formData.category === 'alimentos' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[var(--ink-soft)] mb-2">
                    Ingredientes opcionales para comanda
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {FOOD_INGREDIENT_OPTIONS.map((ingredient) => (
                      <label key={ingredient} className="flex items-center gap-2 text-sm text-[var(--ink)] bg-[var(--beige)] px-2 py-1.5 rounded-lg border border-[var(--sand-strong)]/40">
                        <input
                          type="checkbox"
                          checked={selectedFoodOptions.includes(ingredient)}
                          onChange={() => toggleOption(ingredient, selectedFoodOptions, setSelectedFoodOptions)}
                        />
                        <span>{ingredient}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formData.category === 'bebidas' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[var(--ink-soft)] mb-2">
                      Temperaturas disponibles
                    </label>
                    <div className="flex gap-2">
                      {DRINK_TEMPERATURE_OPTIONS.map((temperature) => (
                        <label key={temperature} className="flex items-center gap-2 text-sm text-[var(--ink)] bg-[var(--beige)] px-3 py-2 rounded-lg border border-[var(--sand-strong)]/40">
                          <input
                            type="checkbox"
                            checked={selectedDrinkTemperatures.includes(temperature)}
                            onChange={() => toggleOption(temperature, selectedDrinkTemperatures, setSelectedDrinkTemperatures)}
                          />
                          <span>{temperature}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[var(--ink-soft)] mb-2">
                      Niveles de azucar disponibles
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DRINK_SWEETNESS_OPTIONS.map((sweetness) => (
                        <label key={sweetness} className="flex items-center gap-2 text-sm text-[var(--ink)] bg-[var(--beige)] px-3 py-2 rounded-lg border border-[var(--sand-strong)]/40">
                          <input
                            type="checkbox"
                            checked={selectedDrinkSweetness.includes(sweetness)}
                            onChange={() => toggleOption(sweetness, selectedDrinkSweetness, setSelectedDrinkSweetness)}
                          />
                          <span>{sweetness}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[var(--ink-soft)] mb-2">
                      Sabores disponibles (separados por coma)
                    </label>
                    <input
                      type="text"
                      value={drinkFlavorsInput}
                      onChange={(e) => setDrinkFlavorsInput(e.target.value)}
                      className="w-full px-4 py-2 border border-[var(--sand-strong)] rounded-lg focus:ring-2 focus:ring-[var(--cafe-dark)] focus:border-transparent"
                      placeholder="Ej: Fresa, Vainilla, Chocolate"
                    />
                  </div>
                </>
              )}

              {formData.category === 'postres' && (
                <div className="mb-4 p-3 rounded-lg border border-[var(--sand-strong)]/40 bg-[var(--beige)] text-sm text-[var(--ink-soft)]">
                  Los postres se registran sin especificaciones adicionales.
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--ink-soft)] mb-2">
                  Caja
                </label>
                <div className="w-full px-4 py-2 border border-[var(--sand-strong)]/40 rounded-lg bg-[var(--beige)] text-[var(--ink-soft)]">
                  {selectedCaja?.nombre || 'Sin caja seleccionada'}
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--ink-soft)] mb-2">
                  Imagen (opcional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-[var(--ink-soft)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--sand)]/40 file:text-[var(--ink)] hover:file:bg-[var(--sand)]/70"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                    setFormData({ name: '', price: '', category: 'alimentos', caja_id: '' });
                    setImageFile(null);
                    setSelectedFoodOptions([...FOOD_INGREDIENT_OPTIONS]);
                    setSelectedDrinkSweetness([...DRINK_SWEETNESS_OPTIONS]);
                    setSelectedDrinkTemperatures([...DRINK_TEMPERATURE_OPTIONS]);
                    setDrinkFlavorsInput('');
                  }}
                  className="flex-1 px-4 py-2 border border-[var(--sand-strong)] rounded-lg hover:bg-[var(--beige)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[linear-gradient(120deg,var(--cafe-dark)_0%,var(--cafe-mid)_100%)] hover:brightness-110 text-[var(--cream)] px-4 py-2 rounded-lg transition"
                >
                  {editingProduct ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
