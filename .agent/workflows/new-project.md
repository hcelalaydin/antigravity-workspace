---
description: Yeni proje oluşturma adımları
---

# New Project Workflow

// turbo-all

## 1. Frontend (Vite + React + TypeScript)

```bash
npx -y create-vite@latest ./ --template react-ts
npm install
```

## 2. Backend (Express + TypeScript)

```bash
npm init -y
npm install express cors dotenv
npm install -D typescript @types/node @types/express @types/cors ts-node nodemon
npx tsc --init
```

## 3. Veritabanı (Prisma)

```bash
npm install prisma @prisma/client
npx prisma init
```

## 4. Ek Paketler

### Frontend:
```bash
npm install zustand @tanstack/react-query axios react-router-dom
npm install -D vitest @testing-library/react
```

### Backend:
```bash
npm install zod jsonwebtoken bcrypt helmet
npm install -D @types/jsonwebtoken @types/bcrypt
```

## 5. Klasör Yapısı Oluştur

Frontend:
- src/components/ui/
- src/hooks/
- src/lib/
- src/stores/
- src/types/

Backend:
- src/controllers/
- src/services/
- src/routes/
- src/middleware/
- src/types/
