---
name: Auth & Security
description: Kimlik doğrulama, yetkilendirme ve güvenlik implementasyonu
---

# Auth & Security Skill

## JWT Authentication

### Paketler
```bash
npm install jsonwebtoken bcrypt cookie-parser
npm install -D @types/jsonwebtoken @types/bcrypt @types/cookie-parser
```

### Token Yönetimi
```typescript
// src/lib/jwt.ts
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export const generateTokens = (userId: string) => ({
  accessToken: jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: '15m' }),
  refreshToken: jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: '7d' })
});

export const verifyAccessToken = (token: string) => 
  jwt.verify(token, ACCESS_SECRET) as { userId: string };

export const verifyRefreshToken = (token: string) => 
  jwt.verify(token, REFRESH_SECRET) as { userId: string };
```

### Password Hashing
```typescript
// src/lib/password.ts
import bcrypt from 'bcrypt';

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) => 
  bcrypt.compare(password, hash);
```

## Auth Middleware
```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/lib/jwt';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (...roles: string[]) => 
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
```

## Güvenlik Best Practices

### 1. Input Validation (Zod)
```typescript
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
});
```

### 2. Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';
app.use('/api/auth/', rateLimit({ windowMs: 15*60*1000, max: 10 }));
```

### 3. Security Headers (Helmet)
```typescript
import helmet from 'helmet';
app.use(helmet());
```

### 4. CORS
```typescript
import cors from 'cors';
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
```

### 5. XSS/SQL Injection
- Zod ile input validation
- Prisma ile parameterized queries
- DOMPurify ile HTML sanitization

### 6. HTTPS
- Production'da HTTPS zorunlu
- Secure cookies
- HSTS header

## Environment Variables
```env
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=http://localhost:3000
```
