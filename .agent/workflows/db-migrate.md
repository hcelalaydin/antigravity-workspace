---
description: Veritabanı migration işlemleri
---

# Database Migration Workflow

## Development Ortamında

1. Schema değişikliği yap (`prisma/schema.prisma`)

2. Migration oluştur ve uygula:
// turbo
```bash
npx prisma migrate dev --name <migration_name>
```

3. Prisma Client'ı güncelle:
// turbo
```bash
npx prisma generate
```

## Production Ortamında

1. Migration'ları uygula:
```bash
npx prisma migrate deploy
```

## Diğer Komutlar

### Veritabanını sıfırla (DİKKAT!):
```bash
npx prisma migrate reset
```

### Seed data ekle:
```bash
npx prisma db seed
```

### Prisma Studio aç:
// turbo
```bash
npx prisma studio
```

### Mevcut DB'den schema çek:
```bash
npx prisma db pull
```
