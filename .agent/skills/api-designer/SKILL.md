---
name: API Designer
description: REST ve GraphQL API tasarımı, endpoint oluşturma ve dokümantasyon
---

# API Designer Skill

Bu skill, profesyonel API'ler tasarlamak ve oluşturmak için kullanılır.

## REST API Tasarım İlkeleri

### URL Yapısı
```
GET    /api/v1/users          # Tüm kullanıcıları listele
GET    /api/v1/users/:id      # Tek kullanıcı getir
POST   /api/v1/users          # Yeni kullanıcı oluştur
PUT    /api/v1/users/:id      # Kullanıcıyı güncelle (tam)
PATCH  /api/v1/users/:id      # Kullanıcıyı güncelle (kısmi)
DELETE /api/v1/users/:id      # Kullanıcıyı sil
```

### İlişkili Kaynaklar
```
GET    /api/v1/users/:id/posts           # Kullanıcının postları
POST   /api/v1/users/:id/posts           # Kullanıcıya post ekle
GET    /api/v1/posts/:postId/comments    # Postun yorumları
```

### Query Parameters
```
GET /api/v1/users?page=1&limit=20              # Pagination
GET /api/v1/users?sort=createdAt&order=desc    # Sıralama
GET /api/v1/users?filter[role]=admin           # Filtreleme
GET /api/v1/users?search=john                  # Arama
GET /api/v1/users?fields=id,name,email         # Alan seçimi
```

## Standart Response Formatları

### Başarılı Response
```typescript
// Tek kayıt
{
  "success": true,
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com"
  }
}

// Liste
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Hata Response
```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

## HTTP Status Codes

| Code | Açıklama | Kullanım |
|------|----------|----------|
| 200 | OK | Başarılı GET, PUT, PATCH |
| 201 | Created | Başarılı POST |
| 204 | No Content | Başarılı DELETE |
| 400 | Bad Request | Validation hatası |
| 401 | Unauthorized | Kimlik doğrulama gerekli |
| 403 | Forbidden | Yetki yok |
| 404 | Not Found | Kaynak bulunamadı |
| 409 | Conflict | Çakışma (duplicate) |
| 422 | Unprocessable Entity | İş mantığı hatası |
| 500 | Internal Server Error | Sunucu hatası |

## Express.js API Şablonu

### Route Dosyası
```typescript
// src/routes/users.ts
import { Router } from 'express';
import { UserController } from '@/controllers/user.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { createUserSchema, updateUserSchema } from '@/schemas/user.schema';

const router = Router();
const controller = new UserController();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', authenticate, validate(createUserSchema), controller.create);
router.put('/:id', authenticate, validate(updateUserSchema), controller.update);
router.delete('/:id', authenticate, authorize('admin'), controller.delete);

export default router;
```

### Controller Dosyası
```typescript
// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import { UserService } from '@/services/user.service';
import { ApiResponse } from '@/utils/response';

export class UserController {
  private userService = new UserService();

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20, sort, order, search } = req.query;
      const result = await this.userService.findAll({ page, limit, sort, order, search });
      res.json(ApiResponse.success(result.data, result.pagination));
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.findById(req.params.id);
      if (!user) {
        return res.status(404).json(ApiResponse.error('USER_NOT_FOUND', 'User not found'));
      }
      res.json(ApiResponse.success(user));
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.create(req.body);
      res.status(201).json(ApiResponse.success(user));
    } catch (error) {
      next(error);
    }
  };

  // ... diğer metodlar
}
```

### Service Dosyası
```typescript
// src/services/user.service.ts
import { prisma } from '@/lib/prisma';
import { CreateUserDto, UpdateUserDto } from '@/types/user';
import { hashPassword } from '@/utils/crypto';

export class UserService {
  async findAll(options: QueryOptions) {
    const { page, limit, sort = 'createdAt', order = 'desc', search } = options;
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: order },
        select: { id: true, name: true, email: true, createdAt: true }
      }),
      prisma.user.count({ where })
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserDto) {
    const hashedPassword = await hashPassword(data.password);
    return prisma.user.create({
      data: { ...data, password: hashedPassword }
    });
  }

  // ... diğer metodlar
}
```

## Validation (Zod)

```typescript
// src/schemas/user.schema.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    role: z.enum(['user', 'admin']).default('user')
  })
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().optional()
  })
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
```

## Error Handling Middleware

```typescript
// src/middleware/error.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiResponse } from '@/utils/response';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(
      ApiResponse.error(err.code, err.message)
    );
  }

  if (err instanceof ZodError) {
    return res.status(400).json(
      ApiResponse.error('VALIDATION_ERROR', 'Invalid input', err.errors)
    );
  }

  console.error(err);
  res.status(500).json(
    ApiResponse.error('INTERNAL_ERROR', 'An unexpected error occurred')
  );
};
```

## API Versioning

```typescript
// src/index.ts
import express from 'express';
import v1Routes from './routes/v1';
import v2Routes from './routes/v2';

const app = express();

app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);
```

## Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına maksimum istek
  message: { error: 'Too many requests' }
});

app.use('/api/', limiter);
```
