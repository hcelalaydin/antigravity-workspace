---
name: Project Scaffolder
description: Yeni fullstack projeler oluşturmak için şablonlar ve konfigürasyonlar
---

# Project Scaffolder Skill

Bu skill, yeni fullstack projeler oluşturmak için kullanılır.

## Desteklenen Proje Tipleri

### 1. Frontend (Vite + React + TypeScript)
```bash
npx -y create-vite@latest ./ --template react-ts
npm install
```

### 2. Frontend (Next.js + TypeScript)
```bash
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### 3. Backend (Node.js + Express + TypeScript)
```bash
npm init -y
npm install express cors dotenv
npm install -D typescript @types/node @types/express @types/cors ts-node nodemon
npx tsc --init
```

### 4. Fullstack Monorepo Yapısı
```
project-root/
├── apps/
│   ├── web/          # Frontend uygulaması
│   └── api/          # Backend API
├── packages/
│   ├── ui/           # Paylaşılan UI bileşenleri
│   ├── db/           # Veritabanı şemaları
│   └── shared/       # Paylaşılan tipler ve yardımcılar
├── package.json      # Root package.json (workspaces)
└── turbo.json        # Turborepo konfigürasyonu (opsiyonel)
```

## Standart Dosya Yapısı

### Frontend Yapısı
```
src/
├── components/       # React bileşenleri
│   ├── ui/          # Temel UI bileşenleri
│   └── features/    # Özellik bazlı bileşenler
├── hooks/           # Custom React hooks
├── lib/             # Yardımcı fonksiyonlar
├── services/        # API servis katmanı
├── stores/          # State yönetimi (Zustand/Redux)
├── types/           # TypeScript tipleri
├── styles/          # Global stiller
└── pages/ veya app/ # Sayfa/Route bileşenleri
```

### Backend Yapısı
```
src/
├── controllers/     # Route handler'ları
├── services/        # İş mantığı
├── models/          # Veritabanı modelleri
├── middleware/      # Express middleware
├── routes/          # Route tanımları
├── utils/           # Yardımcı fonksiyonlar
├── types/           # TypeScript tipleri
├── config/          # Konfigürasyon dosyaları
└── index.ts         # Giriş noktası
```

## Önerilen Paketler

### Frontend
- **State**: `zustand` veya `@tanstack/react-query`
- **Forms**: `react-hook-form` + `zod`
- **Routing**: `react-router-dom` veya Next.js App Router
- **HTTP**: `axios` veya `ky`
- **UI**: `lucide-react` (ikonlar)

### Backend
- **Framework**: `express` veya `fastify`
- **Validation**: `zod`
- **ORM**: `prisma` veya `drizzle-orm`
- **Auth**: `jsonwebtoken` + `bcrypt`
- **Logging**: `pino` veya `winston`

## Konfigürasyon Dosyaları

### tsconfig.json (Frontend)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

### tsconfig.json (Backend)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Kullanım

1. Kullanıcıya proje tipini sor (Frontend/Backend/Fullstack)
2. Tercih edilen framework'leri belirle
3. Uygun şablonu kullanarak projeyi oluştur
4. Gerekli paketleri yükle
5. Temel dosya yapısını oluştur
