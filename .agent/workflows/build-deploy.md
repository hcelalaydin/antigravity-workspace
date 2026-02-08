---
description: Production build oluşturma ve deployment
---

# Build & Deploy Workflow

## Adımlar

1. Testleri çalıştır:
```bash
npm run test
```

2. Lint kontrolü:
```bash
npm run lint
```

3. Production build oluştur:
```bash
npm run build
```

4. Build'i test et (opsiyonel):
```bash
npm run preview
```

## Docker ile Deploy

1. Docker image oluştur:
```bash
docker build -t myapp:latest .
```

2. Container'ı çalıştır:
```bash
docker run -p 3000:3000 --env-file .env myapp:latest
```

## Vercel Deploy

1. Vercel CLI ile deploy:
```bash
npx vercel --prod
```
