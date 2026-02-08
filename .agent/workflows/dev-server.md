---
description: Geliştirme sunucusunu başlatma
---

# Dev Server Workflow

Projenin geliştirme sunucusunu başlatır.

## Adımlar

1. Proje dizinine git ve bağımlılıkları kontrol et:
```bash
npm install
```

2. Geliştirme sunucusunu başlat:
// turbo
```bash
npm run dev
```

## Notlar

- Frontend (Vite): `http://localhost:5173`
- Backend (Express): `http://localhost:3000`
- Prisma Studio: `npx prisma studio` ile `http://localhost:5555`
