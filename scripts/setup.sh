#!/bin/bash

# ============================================
# Dreamweaver - Otomatik Kurulum Script'i
# ============================================

set -e

# Renkli çıktı
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════╗"
echo "║     🎮 DREAMWEAVER - KURULUM BAŞLIYOR     ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# Node.js kontrolü
echo -e "${YELLOW}[1/6]${NC} Node.js kontrolü..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js bulunamadı!${NC}"
    echo "Lütfen Node.js v18+ yükleyin: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js v18+ gerekli (mevcut: $(node -v))${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) bulundu${NC}"

# npm kontrolü
echo -e "${YELLOW}[2/6]${NC} npm kontrolü..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm bulunamadı!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v) bulundu${NC}"

# Bağımlılıkları yükle
echo -e "${YELLOW}[3/6]${NC} Bağımlılıklar yükleniyor..."
npm install --legacy-peer-deps

echo -e "${GREEN}✓ Bağımlılıklar yüklendi${NC}"

# .env dosyası kontrolü ve oluşturma
echo -e "${YELLOW}[4/6]${NC} Environment konfigürasyonu..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        
        # Güvenli JWT_SECRET oluştur
        JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
        
        # macOS ve Linux uyumlu sed
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/" .env
        else
            sed -i "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/" .env
        fi
        
        echo -e "${GREEN}✓ .env dosyası oluşturuldu (rastgele JWT_SECRET ile)${NC}"
        echo -e "${YELLOW}  ⚠ Production için ADMIN_PASSWORD değiştirmeyi unutmayın!${NC}"
    else
        echo -e "${RED}✗ .env.example bulunamadı!${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env dosyası mevcut${NC}"
fi

# Veritabanı kurulumu
echo -e "${YELLOW}[5/6]${NC} Veritabanı hazırlanıyor..."
npx prisma generate
npx prisma migrate deploy 2>/dev/null || npx prisma db push

# Seed kontrolü
if [ ! -f prisma/dev.db ] || [ $(stat -f%z prisma/dev.db 2>/dev/null || stat -c%s prisma/dev.db 2>/dev/null) -lt 100000 ]; then
    echo -e "${YELLOW}     Seed verisi ekleniyor...${NC}"
    npm run db:seed 2>/dev/null || true
fi

echo -e "${GREEN}✓ Veritabanı hazır${NC}"

# Build (Production için)
echo -e "${YELLOW}[6/6]${NC} Production build..."
npm run build

echo -e "${GREEN}✓ Build tamamlandı${NC}"

# Tamamlandı
echo ""
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════╗"
echo "║      ✅ KURULUM BAŞARIYLA TAMAMLANDI!     ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "🚀 ${BLUE}Uygulamayı başlatmak için:${NC}"
echo ""
echo -e "   ${GREEN}npm start${NC}        # Production modu"
echo -e "   ${GREEN}npm run dev${NC}      # Development modu"
echo ""
echo -e "🌐 ${BLUE}Erişim adresi:${NC} http://localhost:3000"
echo -e "🔐 ${BLUE}Admin paneli:${NC}  http://localhost:3000/admin"
echo ""
echo -e "${YELLOW}Admin Giriş Bilgileri:${NC}"
echo -e "   Kullanıcı: admin"
echo -e "   Şifre: admin123 (değiştirmeyi unutmayın!)"
echo ""

# Otomatik başlatma seçeneği
read -p "Uygulamayı şimdi başlatmak ister misiniz? (E/h): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ee]$ ]] || [[ -z $REPLY ]]; then
    echo -e "${BLUE}Uygulama başlatılıyor...${NC}"
    npm start
fi
