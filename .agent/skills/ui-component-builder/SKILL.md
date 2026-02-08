---
name: UI Component Builder
description: Modern, premium UI bileşenleri ve tasarım sistemi oluşturma
---

# UI Component Builder Skill

Bu skill, modern ve premium görünümlü UI bileşenleri oluşturmak için kullanılır.

## Tasarım Prensipleri

### 1. Renk Paleti (Dark Theme)
```css
:root {
  --bg-primary: hsl(222, 47%, 11%);
  --bg-secondary: hsl(217, 33%, 17%);
  --bg-tertiary: hsl(215, 25%, 27%);
  --text-primary: hsl(210, 40%, 98%);
  --text-secondary: hsl(215, 20%, 65%);
  --accent-primary: hsl(217, 91%, 60%);
  --accent-secondary: hsl(271, 91%, 65%);
  --gradient-primary: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  --border-subtle: hsla(215, 20%, 65%, 0.1);
  --shadow-glow: 0 0 20px hsla(217, 91%, 60%, 0.3);
  --radius-md: 0.5rem;
  --transition-fast: 150ms ease;
}
```

### 2. Typography
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
body { font-family: 'Inter', sans-serif; }
```

## Temel Bileşenler

### Button
- Variants: primary, secondary, outline, ghost, danger
- Sizes: sm, md, lg
- States: loading, disabled

### Card
- Variants: default, elevated, glass
- Glassmorphism efekti

### Input
- Label, error, hint desteği
- Icon sol/sağ konumlandırma

### Modal
- Portal tabanlı
- ESC ile kapatma
- Backdrop blur efekti

## Animasyonlar
- fadeIn, slideUp, slideDown
- scale, pulse
- shimmer (skeleton loading)

## İpuçları
1. CSS değişkenlerini kullan
2. Erişilebilirlik için focus states
3. Mobil öncelikli tasarla
4. Transform/opacity animasyonları kullan
