'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { logout } from '@/lib/auth';
import { useCaja } from '@/contexts/CajaContext';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { selectedCaja } = useCaja();
  
  // No mostrar navegación en la página de login
  if (pathname === '/login') {
    return null;
  }

  const handleLogout = () => {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout();
      router.push('/login');
    }
    setIsMenuOpen(false);
  };
  
  const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/ventas', label: 'Ventas', icon: '🛒' },
    { href: '/pedidos', label: 'Pedidos', icon: '🧾' },
    { href: '/productos', label: 'Productos', icon: '📦' },
    { href: '/recibos', label: 'Recibos', icon: '📄' },
    { href: '/deudores', label: 'Deudores', icon: '👥' },
    { href: '/caja', label: 'Operaciones', icon: '💰' },
  ];
  
  return (
    <nav className="sticky top-0 z-50 border-b border-[rgba(116,69,40,0.3)] bg-[linear-gradient(90deg,#f6e4cf_0%,#f5d8b7_40%,#eac6a1_100%)] shadow-[0_6px_20px_rgba(46,24,13,0.18)]">
      <div className="container mx-auto px-3 sm:px-4 relative">
        <div className="pointer-events-none absolute left-6 top-1 h-2 w-2 rounded-full bg-[var(--accent-coral)]" />
        <div className="pointer-events-none absolute left-12 top-1 h-2 w-2 rounded-full bg-[var(--accent-honey)]" />
        <div className="pointer-events-none absolute left-18 top-1 h-2 w-2 rounded-full bg-[var(--accent-sky)]" />
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Image 
              src="/cam15_logo.png" 
              alt="CAM15 Logo" 
              width={32} 
              height={32}
              className="object-contain sm:w-10 sm:h-10"
            />
            <div className="flex flex-col">
              <span className="text-sm sm:text-lg font-black text-[var(--ink)] leading-tight">Cafetería CAM 15</span>
              <span className="text-[10px] sm:text-xs font-medium text-[var(--ink-soft)]">Espacio inclusivo escolar</span>
            </div>
          </Link>

          {/* Caja actual - visible en mobile */}
          {selectedCaja && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[rgba(74,43,27,0.9)] rounded-xl border border-[var(--sand-strong)]">
              <span className="text-xs sm:text-sm font-semibold text-[var(--cream)]">Caja: {selectedCaja.nombre}</span>
            </div>
          )}
          
          {/* Desktop menu */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--cafe-dark)] text-[var(--cream)]'
                      : 'text-[var(--ink)] hover:bg-[rgba(255,255,255,0.5)]'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
            
            <button
              onClick={handleLogout}
              className="ml-2 px-3 py-2 rounded-md text-sm font-medium text-[var(--cafe-dark)] hover:bg-[rgba(232,111,74,0.2)] transition-colors"
              title="Cerrar Sesión"
            >
              <span className="mr-1">🚪</span>
              Salir
            </button>
          </div>

          {/* Hamburger button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-md text-[var(--ink)] hover:bg-[rgba(255,255,255,0.5)] focus:outline-none focus:ring-2 focus:ring-[var(--cafe-dark)]"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-3 border-t border-[rgba(116,69,40,0.25)]">
            {/* Caja actual en mobile */}
            {selectedCaja && (
              <div className="flex items-center justify-between gap-2 px-3 py-2 mb-2 bg-[rgba(74,43,27,0.9)] rounded-lg border border-[var(--sand-strong)]">
                <span className="text-xs font-semibold text-[var(--cream)]">Caja: {selectedCaja.nombre}</span>
              </div>
            )}

            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--cafe-dark)] text-[var(--cream)]'
                        : 'text-[var(--ink)] hover:bg-[rgba(255,255,255,0.5)]'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
              
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-[var(--cafe-dark)] hover:bg-[rgba(232,111,74,0.2)] transition-colors"
              >
                <span className="mr-2">🚪</span>
                Salir
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
