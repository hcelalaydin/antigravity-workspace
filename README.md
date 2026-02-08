# DreamWeaver 🎴

> Web tabanlı, çok oyunculu Dixit benzeri kart oyunu

## 🎯 Proje Hakkında

DreamWeaver, 3-8 oyuncunun soyut resimler ve hikaye anlatımı ile yarıştığı, yaratıcılık ve sezgiye dayalı bir kart oyunudur.

## 🚀 Hızlı Başlangıç

```bash
# Bağımlılıkları yükle
npm install

# Veritabanını oluştur
npx prisma migrate dev --name init

# Admin kullanıcısını oluştur
npm run db:seed

# Geliştirme sunucusunu başlat
npm run dev
```

Uygulama http://localhost:3000 adresinde açılacak.

## 📋 Dokümantasyon

- [Product Requirements Document](./docs/PRD.md)

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Animations:** Framer Motion
- **Backend:** Express, Socket.io
- **Database:** SQLite + Prisma

## 📁 Proje Yapısı

```
src/
├── app/          # Next.js App Router
├── components/   # React bileşenleri
├── hooks/        # Custom hooks
├── lib/          # Yardımcı fonksiyonlar
├── server/       # Socket.io sunucusu
├── stores/       # Zustand stores
└── types/        # TypeScript tipleri
```
