# 🛒 La Tiendita POS — Frontend

> Frontend application for a full-stack point-of-sale system focused on sales, cash operations, product management, debtors, and reporting workflows.

🌐 Live deployment: [https://la-tiendita-frontend.vercel.app/](https://la-tiendita-frontend.vercel.app/)

---

## 🎯 About the project

La Tiendita POS is a business-oriented application that started as a desktop Kivy solution and evolved into a modern web architecture.

This repository contains the **frontend layer**, built to deliver a responsive user experience and integrate with backend services that handle business logic and persistence.

- Modern and responsive interface
- API-driven architecture
- Operational workflows for day-to-day store management
- Deployment-ready structure

---

## 💼 Value for recruiters

This project demonstrates practical skills for real software teams:

- Frontend architecture with **Next.js + TypeScript**
- Integration with REST APIs
- UI development focused on operational workflows
- Feature design based on real business needs
- Migration mindset from legacy desktop systems to web platforms
- Production deployment and environment configuration

---

## ✨ Core features (frontend scope)

### Point of sale flow
- Product browsing and selection
- Cart interaction
- Checkout UI flow
- Sales visualization and history screens

### Product management
- Product listing and detail views
- Product creation/edit forms
- Image upload integration (via backend services)

### Cash and debtor operations
- Interfaces for cash movement workflows
- Debtor and payment tracking screens
- Operational history views

### Reporting
- Report and receipt-related frontend flows
- Data visualization screens for operations

---

## 🏗️ Architecture overview

```text
Frontend (Next.js + TypeScript + Tailwind)
        │
        ▼
Backend API (FastAPI + Python)  → separate repository
        │
        ▼
Data layer and business services
```

---

## 🔗 Related repositories

- **Frontend (this repo):** `GloDelMar/la-tiendita-frontend`
- **Backend:** `GloDelMar/la-tiendita-POS`

> Note: The backend implementation is maintained in a separate repository and powers authentication, business logic, storage, and transactional operations.

---

## 🧰 Tech stack

### Frontend
- Next.js 14+
- TypeScript
- Tailwind CSS
- React Query
- Zustand
- Axios

### Deployment
- Vercel (frontend hosting)
- GitHub (version control)

---

## 📂 Project structure

```text
la-tiendita-frontend/
├── app/                      # Next.js App Router
│   ├── page.tsx              # Main page
│   ├── products/             # Product catalog views
│   ├── cart/                 # Cart flow
│   └── checkout/             # Checkout process
├── components/               # Reusable UI components
├── hooks/                    # Custom React hooks
├── lib/                      # Utilities and helpers
├── public/                   # Static assets
├── styles/                   # Global styles
├── types/                    # TypeScript definitions
└── utils/                    # Helper functions
```

---

## 🚀 Quick start

### Requirements
- Node.js 18+ (recommended: Node.js 20+)
- npm / yarn / pnpm / bun

### Installation

```bash
git clone https://github.com/GloDelMar/la-tiendita-frontend.git
cd la-tiendita-frontend
npm install
```

### Environment variables

```bash
cp .env.example .env.local
```

Then update `.env.local` with your API endpoints and required keys.

### Run in development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📦 Available scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit tests |

---

## 🛠️ Skills demonstrated

- Building responsive and reusable frontend components
- Structuring scalable Next.js applications
- Consuming and managing API data flows
- Implementing business-oriented interfaces
- Working with typed codebases using TypeScript
- Preparing production-ready deployments

---

## 🔍 What this project helped me develop

- Migrating real workflows from legacy desktop to web
- Translating business operations into usable product features
- Coordinating frontend behavior with backend capabilities
- Building software with practical, user-centered impact

---

## 👩‍💻 About me

I’m a developer focused on building functional, useful web products with strong full-stack foundations.

I enjoy projects that combine:

- modern technologies
- solid engineering practices
- real value for users and businesses

---

## 🤝 Contributing

Contributions, suggestions, and feedback are welcome.

1. Fork the repository
2. Create your branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m "Add amazing feature"`)
4. Push to your branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.
