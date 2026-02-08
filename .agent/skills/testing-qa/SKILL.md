---
name: Testing & QA
description: Unit, integration ve E2E test stratejileri
---

# Testing & QA Skill

## Test Piramiti

1. **Unit Tests** - Hızlı, izole fonksiyon testleri
2. **Integration Tests** - API ve veritabanı testleri
3. **E2E Tests** - Kullanıcı senaryoları

## Kurulum

```bash
# Vitest (Unit/Integration)
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Playwright (E2E)
npm install -D @playwright/test
npx playwright install
```

## Vitest Konfigürasyonu

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: { provider: 'v8', reporter: ['text', 'html'] }
  }
});
```

## Unit Test Örneği

```typescript
// src/utils/__tests__/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency, truncate } from '../format';

describe('formatCurrency', () => {
  it('formats number as currency', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
  });
});
```

## React Component Testi

```typescript
// src/components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('handles click', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

## API Integration Test

```typescript
// src/routes/__tests__/users.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../lib/prisma';

describe('Users API', () => {
  beforeAll(async () => {
    await prisma.user.create({ data: { email: 'test@test.com', name: 'Test' } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
  });

  it('GET /api/users returns users', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});
```

## E2E Test (Playwright)

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'user@test.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });
});
```

## NPM Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  }
}
```

## Best Practices

1. **AAA Pattern**: Arrange, Act, Assert
2. **Isolation**: Her test bağımsız olmalı
3. **Mocking**: Dış bağımlılıkları mock'la
4. **Coverage**: %80+ hedefle
5. **CI Integration**: Her PR'da testler çalışmalı
