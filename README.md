# 🛍️ La Tiendita - Frontend

Una plataforma de e-commerce moderna y responsive construida con las tecnologías más actuales. Un proyecto full-stack que demuestra habilidades en desarrollo frontend, integración de APIs y mejores prácticas de código.

**[🌐 Ver Demo en Vivo](https://la-tiendita-frontend.vercel.app)**

---

## 📋 Tabla de Contenidos

- [Características Principales](#características-principales)
- [Tech Stack](#tech-stack)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación y Setup](#instalación-y-setup)
- [Scripts Disponibles](#scripts-disponibles)
- [Características Técnicas](#características-técnicas)
- [Cómo Contribuir](#cómo-contribuir)

---

## ✨ Características Principales

- **🎨 Interfaz Moderna y Responsiva** - Diseño adaptable a todos los dispositivos
- **⚡ Rendimiento Optimizado** - Cargas rápidas y experiencia fluida
- **🔍 SEO Optimizado** - Metaetiquetas dinámicas y estructura semántica
- **🛒 Sistema de Carrito Completo** - Gestión de productos y órdenes
- **👤 Autenticación de Usuarios** - Login seguro y gestión de sesiones
- **💳 Integración de Pagos** - Procesamiento seguro de transacciones
- **📱 Mobile-First Design** - Experiencia perfecta en dispositivos móviles
- **🎯 TypeScript** - Tipado fuerte para mayor seguridad y mantenibilidad

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 14+](https://nextjs.org)** - React framework con SSR y SSG
- **[TypeScript](https://www.typescriptlang.org)** - Tipado estático
- **[Tailwind CSS](https://tailwindcss.com)** - Utilidades CSS modernas
- **[React Query](https://tanstack.com/query)** - Gestión de estado y caché
- **[Zustand](https://github.com/pmndrs/zustand)** - State management ligero
- **[Axios](https://axios-http.com)** - Cliente HTTP

### Deployment
- **[Vercel](https://vercel.com)** - Hosting y CI/CD
- **[GitHub](https://github.com)** - Control de versiones

---

## 📁 Estructura del Proyecto

```
la-tiendita-frontend/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Página principal
│   ├── products/            # Catálogo de productos
│   ├── cart/                # Carrito de compras
│   └── checkout/            # Proceso de compra
├── components/              # Componentes reutilizables
│   ├── Header.tsx
│   ├── ProductCard.tsx
│   └── Navigation.tsx
├── hooks/                   # Custom React hooks
├── lib/                     # Utilidades y helpers
├── public/                  # Archivos estáticos
├── styles/                  # Estilos globales
├── types/                   # Definiciones TypeScript
└── utils/                   # Funciones auxiliares
```

---

## 🚀 Instalación y Setup

### Requisitos Previos
- Node.js 18+ 
- npm, yarn, pnpm o bun

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/GloDelMar/la-tiendita-frontend.git
cd la-tiendita-frontend
```

2. **Instalar dependencias**
```bash
npm install
# o
yarn install
# o
pnpm install
# o
bun install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
# Edita .env.local con tus valores
```

4. **Iniciar el servidor de desarrollo**
```bash
npm run dev
# o
yarn dev
# o
pnpm dev
# o
bun dev
```

5. **Abrir en el navegador**
```
http://localhost:3000
```

---

## 📦 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Compila la aplicación para producción |
| `npm run start` | Inicia el servidor de producción |
| `npm run lint` | Ejecuta ESLint |
| `npm run format` | Formatea el código con Prettier |
| `npm run test` | Ejecuta las pruebas unitarias |

---

## ⚙️ Características Técnicas

### Optimizaciones de Rendimiento
- ✅ Image Optimization con Next.js Image
- ✅ Code Splitting automático
- ✅ Lazy Loading de componentes
- ✅ Caching estratégico de datos

### Mejores Prácticas
- ✅ Componentes funcionales con Hooks
- ✅ Separación de responsabilidades
- ✅ DRY (Don't Repeat Yourself)
- ✅ Código limpio y documentado
- ✅ Git workflow profesional

### Seguridad
- ✅ Validación de entrada
- ✅ Protección contra XSS
- ✅ HTTPS en producción
- ✅ Variables de entorno seguras

---

## 🤝 Cómo Contribuir

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

---

## 👨‍💻 Autor

**Gloria del Mar** - [@GloDelMar](https://github.com/GloDelMar)

---

## 📞 Contacto y Redes

- **GitHub**: [@GloDelMar](https://github.com/GloDelMar)
- **Portfolio**: [Tu portfolio aquí]
- **LinkedIn**: [Tu LinkedIn aquí]

---

## ⭐ Si te gustó el proyecto, considera darle una estrella!

**[⬆ Volver al inicio](#-la-tiendita---frontend)**
