---
name: Database Architect
description: Veritabanı şeması tasarımı, Prisma ORM kullanımı ve migration yönetimi
---

# Database Architect Skill

Bu skill, veritabanı tasarımı ve yönetimi için kullanılır. Prisma ORM önerilir.

## Prisma Kurulumu

```bash
npm install prisma @prisma/client
npx prisma init
```

## Prisma Schema Yapısı

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"  // veya mysql, sqlite, mongodb
  url      = env("DATABASE_URL")
}

// ---- MODELLER ----

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String
  role          Role      @default(USER)
  avatar        String?
  emailVerified Boolean   @default(false)
  
  // İlişkiler
  posts         Post[]
  comments      Comment[]
  sessions      Session[]
  
  // Zaman damgaları
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime? // Soft delete

  @@index([email])
  @@map("users")
}

model Post {
  id          String    @id @default(cuid())
  title       String
  slug        String    @unique
  content     String    @db.Text
  excerpt     String?
  published   Boolean   @default(false)
  publishedAt DateTime?
  
  // İlişkiler
  author      User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId    String
  category    Category  @relation(fields: [categoryId], references: [id])
  categoryId  String
  tags        Tag[]
  comments    Comment[]
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([authorId])
  @@index([categoryId])
  @@index([slug])
  @@map("posts")
}

model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  posts       Post[]
  
  @@map("categories")
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  slug  String @unique
  posts Post[]
  
  @@map("tags")
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId  String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId    String
  
  // Self-referencing (yanıtlar için)
  parent    Comment? @relation("CommentReplies", fields: [parentId], references: [id])
  parentId  String?
  replies   Comment[] @relation("CommentReplies")
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([authorId])
  @@index([postId])
  @@map("comments")
}

model Session {
  id           String   @id @default(cuid())
  token        String   @unique
  expiresAt    DateTime
  userAgent    String?
  ipAddress    String?
  
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId       String
  
  createdAt    DateTime @default(now())

  @@index([userId])
  @@index([token])
  @@map("sessions")
}

// ---- ENUM'LAR ----

enum Role {
  USER
  ADMIN
  MODERATOR
}
```

## Prisma Komutları

```bash
# Migration oluştur ve uygula (development)
npx prisma migrate dev --name init

# Production'da migration uygula
npx prisma migrate deploy

# Prisma Client'ı güncelle
npx prisma generate

# Veritabanını şemaya göre sıfırla (DİKKAT: Veri silinir!)
npx prisma migrate reset

# Prisma Studio aç (GUI)
npx prisma studio

# Veritabanından şema çek (mevcut DB için)
npx prisma db pull

# Şemayı veritabanına push et (migration olmadan)
npx prisma db push
```

## Prisma Client Kullanımı

### Singleton Pattern
```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### CRUD Örnekleri
```typescript
// CREATE
const user = await prisma.user.create({
  data: {
    email: 'john@example.com',
    name: 'John Doe',
    password: hashedPassword,
    posts: {
      create: {
        title: 'İlk Post',
        content: 'İçerik...'
      }
    }
  },
  include: { posts: true }
});

// READ (Tek kayıt)
const user = await prisma.user.findUnique({
  where: { id: '...' },
  include: { posts: { take: 5 } }
});

// READ (Liste + Filtreleme + Pagination)
const posts = await prisma.post.findMany({
  where: {
    published: true,
    author: { role: 'ADMIN' },
    OR: [
      { title: { contains: 'search', mode: 'insensitive' } },
      { content: { contains: 'search', mode: 'insensitive' } }
    ]
  },
  orderBy: { createdAt: 'desc' },
  skip: 0,
  take: 10,
  include: {
    author: { select: { id: true, name: true, avatar: true } },
    _count: { select: { comments: true } }
  }
});

// UPDATE
const user = await prisma.user.update({
  where: { id: '...' },
  data: { name: 'New Name' }
});

// UPSERT (varsa güncelle, yoksa oluştur)
const user = await prisma.user.upsert({
  where: { email: 'john@example.com' },
  update: { name: 'Updated Name' },
  create: { email: 'john@example.com', name: 'John' }
});

// DELETE
await prisma.user.delete({ where: { id: '...' } });

// Soft Delete
await prisma.user.update({
  where: { id: '...' },
  data: { deletedAt: new Date() }
});
```

### Transaction
```typescript
// Sequential Transaction
const [user, post] = await prisma.$transaction([
  prisma.user.create({ data: userData }),
  prisma.post.create({ data: postData })
]);

// Interactive Transaction
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUnique({ where: { id } });
  if (!user) throw new Error('User not found');
  
  const order = await tx.order.create({ data: { userId: user.id } });
  await tx.user.update({
    where: { id },
    data: { orderCount: { increment: 1 } }
  });
  
  return order;
});
```

## İlişki Tipleri

### One-to-One
```prisma
model User {
  id      String   @id
  profile Profile?
}

model Profile {
  id     String @id
  user   User   @relation(fields: [userId], references: [id])
  userId String @unique
}
```

### One-to-Many
```prisma
model User {
  id    String @id
  posts Post[]
}

model Post {
  id       String @id
  author   User   @relation(fields: [authorId], references: [id])
  authorId String
}
```

### Many-to-Many (Implicit)
```prisma
model Post {
  id   String @id
  tags Tag[]
}

model Tag {
  id    String @id
  posts Post[]
}
```

### Many-to-Many (Explicit - Ek alanlar için)
```prisma
model Post {
  id            String         @id
  postTags      PostTag[]
}

model Tag {
  id            String         @id
  postTags      PostTag[]
}

model PostTag {
  post      Post     @relation(fields: [postId], references: [id])
  postId    String
  tag       Tag      @relation(fields: [tagId], references: [id])
  tagId     String
  createdAt DateTime @default(now())
  createdBy String?
  
  @@id([postId, tagId])
}
```

## Performans İpuçları

1. **Index ekle**: Sık sorgulanan alanlara `@@index` ekle
2. **Select kullan**: Gereksiz alanları çekme
3. **Include yerine Select**: İlişkilerde sadece gerekli alanları al
4. **Pagination**: Büyük listeler için `skip`/`take` kullan
5. **Raw query**: Karmaşık sorgular için `$queryRaw` kullan

```typescript
// Raw Query örneği
const result = await prisma.$queryRaw`
  SELECT u.id, u.name, COUNT(p.id) as post_count
  FROM users u
  LEFT JOIN posts p ON p.author_id = u.id
  GROUP BY u.id
  HAVING COUNT(p.id) > ${minPosts}
`;
```

## Seeding

```typescript
// prisma/seed.ts
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/utils/crypto';

async function main() {
  // Admin kullanıcı
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: await hashPassword('Admin123!'),
      role: 'ADMIN',
      emailVerified: true
    }
  });

  // Kategoriler
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'technology' },
      update: {},
      create: { name: 'Technology', slug: 'technology' }
    }),
    prisma.category.upsert({
      where: { slug: 'lifestyle' },
      update: {},
      create: { name: 'Lifestyle', slug: 'lifestyle' }
    })
  ]);

  console.log({ admin, categories });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

```json
// package.json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

```bash
npx prisma db seed
```
