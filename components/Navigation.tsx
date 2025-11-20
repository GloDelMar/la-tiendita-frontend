'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { logout } from '@/lib/auth';
import { useCaja } from '@/contexts/CajaContext';

const Navigation = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedCaja, setSelectedCaja } = useCaja();
  
  // No mostrar navegación en la página de login
  if (pathname === '/login') {
    return null;
  }

  const handleLogout = () => {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout();
      setSelectedCaja(null);
      router.push('/login');
    }
  };

  const handleChangeCaja = () => {
    setSelectedCaja(null);
    router.push('/');
  };
  
  const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/cajas', label: 'Gestión Cajas', icon: '⚙️' },
    { href: '/ventas', label: 'Ventas', icon: '🛒', requiresCaja: true },
    { href: '/productos', label: 'Productos', icon: '📦', requiresCaja: true },
    { href: '/recibos', label: 'Recibos', icon: '📄', requiresCaja: true },
    { href: '/deudores', label: 'Deudores', icon: '👥', requiresCaja: true },
    { href: '/caja', label: 'Operaciones', icon: '💰', requiresCaja: true },
  ];
  
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <Image 
              src="/cam15_logo.png" 
              alt="CAM15 Logo" 
              width={40} 
              height={40}
              className="object-contain"
            />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900 leading-tight">La Tiendita</span>
              <span className="text-xs text-gray-600">CAM No.15</span>
            </div>
          </Link>

          {selectedCaja && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-semibold text-blue-900">Caja: {selectedCaja.nombre}</span>
              <button
                onClick={handleChangeCaja}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
                title="Cambiar de caja"
              >
                Cambiar
              </button>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const isDisabled = item.requiresCaja && !selectedCaja;
              
              if (isDisabled) {
                return (
                  <div
                    key={item.href}
                    className="px-4 py-2 rounded-md text-sm font-medium text-gray-400 cursor-not-allowed"
                    title="Selecciona una caja primero"
                  >
                    <span className="mr-1">{item.icon}</span>
                    {item.label}
                  </div>
                );
              }
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
            
            <button
              onClick={handleLogout}
              className="ml-4 px-4 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              title="Cerrar Sesión"
            >
              <span className="mr-1">🚪</span>
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
