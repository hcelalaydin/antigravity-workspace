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

## 🐳 Docker ile Çalıştırma

### Hızlı Başlangıç (Docker Compose - Önerilen)

```bash
# Projeyi klonla
git clone https://github.com/YOUR_USERNAME/dreamweaver.git
cd dreamweaver

# Docker Compose ile başlat (tek komut!)
docker-compose up -d

# Logları izle
docker-compose logs -f
```

Uygulama http://localhost:3000 adresinde çalışacak.

### Özelleştirme

`.env` dosyası oluşturup ayarları değiştirebilirsiniz:

```bash
# .env dosyası oluştur
cat > .env << EOF
PORT=3000
JWT_SECRET=super-guclu-gizli-key-buraya
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=guclu-sifre-123
EOF

# Yeniden başlat
docker-compose up -d
```

### Manuel Docker Kullanımı

```bash
# 1. Image oluştur
docker build -t dreamweaver .

# 2. Container başlat
docker run -d \
  --name dreamweaver-app \
  -p 3000:3000 \
  -e JWT_SECRET=your-secret-key \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=admin123 \
  -v dreamweaver-db:/app/prisma/data \
  -v dreamweaver-cards:/app/public/cards \
  dreamweaver

# Container durumu
docker ps

# Logları görüntüle
docker logs -f dreamweaver-app

# Container'ı durdur
docker stop dreamweaver-app

# Container'ı kaldır
docker rm dreamweaver-app
```

### Docker Compose Komutları

| Komut | Açıklama |
|-------|----------|
| `docker-compose up -d` | Arka planda başlat |
| `docker-compose down` | Durdur ve kaldır |
| `docker-compose logs -f` | Canlı logları izle |
| `docker-compose restart` | Yeniden başlat |
| `docker-compose pull && docker-compose up -d` | Güncelle |

### Volume Yönetimi

Veritabanı ve yüklenen görseller Docker volume'larında saklanır:
- `dreamweaver-db` - SQLite veritabanı
- `dreamweaver-cards` - Yüklenen kart görselleri

```bash
# Volume'ları listele
docker volume ls | grep dreamweaver

# Volume'ları yedekle
docker run --rm -v dreamweaver-db:/data -v $(pwd):/backup alpine tar czf /backup/db-backup.tar.gz /data

# Tüm verileri sil (DİKKAT!)
docker-compose down -v
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
