# 🛒 La Tiendita POS — Frontend

> Modern web frontend for a real-world point-of-sale system, evolved from a desktop Kivy application into a full-stack web platform.

🌐 **Live Demo:** [https://la-tiendita-frontend.vercel.app/](https://la-tiendita-frontend.vercel.app/)

---

## 🎯 Project Overview

**La Tiendita POS** is a point-of-sale frontend focused on real operational workflows for a school-based store environment.

The project started as a **desktop Kivy application** and later evolved into a web architecture with Next.js.

This repository contains the **frontend application** and integrates with a separate REST backend.

The backend repository also preserves the original desktop Kivy implementation as legacy functional reference.

Practical development path:

**real requirements -> UI architecture -> migration to web -> API integration -> deployment**

---

## 🚀 Why This Project Matters

This is not a tutorial app. It was built around day-to-day operational workflows.

What this demonstrates to recruiters:

- Translating business operations into product workflows
- Migration mindset from legacy desktop software to web
- Clear frontend/backend separation
- API-driven architecture with reusable modules
- Operational UX focused on speed and clarity

### 💡 Evolution of the project

```text
Kivy Desktop Application
          |
          v
   Web Application
          |
          +---------------+
          v               v
       Next.js      FastAPI Backend
      Frontend
```

---

## ✨ Implemented Features (Repository Scope)

### 🔐 Access & Session

- Password-based access screen
- Client-side auth guard for protected routes
- Session persistence with localStorage

### 🏪 Multi-Cashbox Workflow

- Dashboard to select active cash boxes
- Shared selected-cashbox state across modules
- Quick cashbox switching from navigation

### 🛍️ Sales Module

- Product search and quantity selection
- Cart management with local persistence
- Cash and credit sales
- Transaction creation through API
- Automatic PDF ticket generation (download/print)
- Change helper with denomination suggestions
- Dedicated denomination selector screen

### 📦 Product Management

- Product list by selected cashbox
- Create, edit, and delete products
- Product image upload and rendering with fallback URL handling

### 💼 Cashbox Management

- Create and edit cash boxes
- Toggle active/inactive status
- View balance and product count per cashbox

### 💰 Cash Operations

- Register incomes, expenses, and adjustments
- View daily stats and operation history

### 👥 Debtors

- Debtors list with search
- Debt summary metrics
- Partial or full payment registration
- Debtor removal (debt forgiveness flow)

### 📄 Receipts & Collections

- Individual receipt download/print per transaction
- Transactions query by teacher or all transactions
- Unpaid-only filtering
- Multi-ticket selection and consolidated receipt PDF generation

---

## 🧩 Frontend Architecture

The frontend is structured with separation between routes, shared state, API services, and utility modules.

```text
Next.js Application
|
+-- App Router pages
+-- Reusable components
+-- Context state
+-- API service layer
+-- Utilities (formatting, PDF generation)
```

### Frontend responsibilities in this repo

- Route-based POS interfaces
- Access control UX and navigation gating
- Client-side workflow state (cashbox, cart, forms)
- REST API consumption through centralized services
- PDF ticket generation and print flows

---

## 🛠️ Tech Stack

### Frontend

- **Next.js 16**
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **jsPDF + jsPDF-AutoTable**

### Backend integration

- REST API integration via fetch-based service modules
- Configurable API base URL through environment variables
- Backend maintained in a separate repository
- Legacy Kivy desktop app preserved there for functional reference

➡️ Backend repository: [https://github.com/GloDelMar/la-tiendita-POS](https://github.com/GloDelMar/la-tiendita-POS)

Notes aligned with backend scope:

- Active backend stack: FastAPI
- Legacy desktop stack (reference only): Kivy
- Supabase is not part of the active backend flow

---

## 📈 Engineering Value

This repository highlights:

- Product thinking over isolated UI demos
- End-to-end operational flow design
- State handling across multiple modules
- Modernization and migration capability
- Integration work between frontend and external APIs

---

## 📂 Project Structure

```text
la-tiendita-frontend/
├── app/                    # Route-based views (App Router)
│   ├── page.tsx            # Dashboard and cashbox selection
│   ├── login/              # Access screen
│   ├── ventas/             # Sales and checkout workflow
│   ├── monedas/            # Denomination selector
│   ├── productos/          # Product management
│   ├── cajas/              # Cashbox administration
│   ├── caja/               # Cash operations
│   ├── deudores/           # Debtors and payments
│   └── recibos/            # Receipts and consolidated receipts
├── components/             # Navigation, auth guard, selectors
├── contexts/               # Shared state providers
├── lib/                    # API, auth, PDF, utility modules
├── public/                 # Static assets
└── next.config.ts          # Next.js configuration
```

---

## 🌐 Deployment

Deployed on **Vercel** and connected to backend REST endpoints.

- Live app: [https://la-tiendita-frontend.vercel.app/](https://la-tiendita-frontend.vercel.app/)
- Frontend repository: [https://github.com/GloDelMar/la-tiendita-frontend](https://github.com/GloDelMar/la-tiendita-frontend)
- Backend repository: [https://github.com/GloDelMar/la-tiendita-POS](https://github.com/GloDelMar/la-tiendita-POS)

---

## 👩‍💻 About the Developer

I am a **Full Stack Developer with a background in Special Education**.

That perspective shapes how I build software: practical workflows, understandable interfaces, and user-centered operational experiences.

---

## 🔎 Skills Demonstrated

### Frontend

- React and Next.js application development
- TypeScript in operational workflows
- Responsive UI with Tailwind CSS
- API-driven screen and component design
- Browser-side PDF generation flows

### Full Stack Integration

- Frontend/backend separation
- REST API consumption patterns
- Transactional UI integration
- Access/auth workflow implementation

### Engineering

- Legacy-to-web migration mindset
- Component-based architecture
- Refactoring and modernization
- Real-world requirements analysis
- User-centered product development

---

## 🚀 Running Locally

### Requirements

- Node.js 18+ (recommended 20+)
- npm

### Installation

```bash
git clone https://github.com/GloDelMar/la-tiendita-frontend.git
cd la-tiendita-frontend
npm install
```

### Environment Variables

```bash
cp .env.example .env
```

Required variables:

- `NEXT_PUBLIC_API_URL` (example: `http://localhost:8000`)
- `NEXT_PUBLIC_AUTH_PASSWORD` (frontend access password)

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📦 Available Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |

---

## ✅ Scope Note

This README describes functionality currently implemented in this frontend repository.

---

## 📄 License

This project is licensed under the MIT License.
