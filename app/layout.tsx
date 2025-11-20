import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import AuthGuard from "@/components/AuthGuard";
import { CajaProvider } from "@/contexts/CajaContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "La Tiendita POS",
  description: "Sistema de Punto de Venta",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthGuard>
          <CajaProvider>
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <main className="container mx-auto px-4 py-8">
                {children}
              </main>
            </div>
          </CajaProvider>
        </AuthGuard>
      </body>
    </html>
  );
}
