# 🚀 Dreamweaver - Hızlı Kurulum Rehberi

Bu rehber ile uygulamayı birkaç dakikada sunucunuzda çalıştırabilirsiniz.

## Ön Gereksinimler

- **Node.js** v18+ (LTS önerilir)
- **npm** v9+
- **Git**

## 🔥 Tek Komutla Kurulum (Önerilen)

```bash
# Projeyi klonla ve kurulum script'ini çalıştır
git clone https://github.com/YOUR_USERNAME/dreamweaver.git
cd dreamweaver
bash scripts/setup.sh
```

## 📋 Manuel Kurulum

### 1. Projeyi Klonla
```bash
git clone https://github.com/YOUR_USERNAME/dreamweaver.git
cd dreamweaver
```

### 2. Bağımlılıkları Yükle
```bash
npm install
```

### 3. Environment Dosyasını Yapılandır
```bash
cp .env.example .env
```

`.env` dosyasını düzenle:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET=guclu-bir-secret-key-buraya-yaz
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=guclu-bir-sifre
```

> ⚠️ **ÖNEMLİ**: `JWT_SECRET` ve `ADMIN_PASSWORD` değerlerini production'da mutlaka değiştirin!

### 4. Veritabanını Oluştur
```bash
npx prisma migrate deploy
npx prisma generate
npm run db:seed
```

### 5. Uygulamayı Başlat

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## 🌐 Erişim

- **Uygulama**: http://localhost:3000
- **Admin Paneli**: http://localhost:3000/admin (`.env`'deki bilgilerle giriş yapın)

## 🖼️ Görseller Hakkında

Admin panelinden eklenen kart görselleri `public/cards/` klasörüne kaydedilir ve Git'e dahildir. Yani görseller GitHub'a push edilir.

## 🔧 Yararlı Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Development sunucusu |
| `npm run build` | Production build |
| `npm start` | Production sunucusu |
| `npm run db:migrate` | Migration oluştur |
| `npm run db:studio` | Prisma Studio (DB viewer) |

## 🐳 Docker ile Çalıştırma (Opsiyonel)

```bash
docker build -t dreamweaver .
docker run -p 3000:3000 dreamweaver
```

## ❓ Sorun Giderme

**Port kullanımda hatası:**
```bash
# Farklı port kullan
PORT=3001 npm run dev
```

**Veritabanı hatası:**
```bash
# Veritabanını sıfırla
rm prisma/dev.db
npx prisma migrate deploy
npm run db:seed
```

**Prisma generate hatası:**
```bash
npx prisma generate
```

---

📧 Sorularınız için issue açabilirsiniz.
