import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Primary - Deep Purple Dream
                primary: {
                    50: '#f5f3ff',
                    100: '#ede9fe',
                    200: '#ddd6fe',
                    300: '#c4b5fd',
                    400: '#a78bfa',
                    500: '#8b5cf6',
                    600: '#7c3aed',
                    700: '#6d28d9',
                    800: '#5b21b6',
                    900: '#4c1d95',
                    950: '#2e1065',
                },
                // Secondary - Teal Mist
                secondary: {
                    300: '#5eead4',
                    400: '#2dd4bf',
                    500: '#14b8a6',
                    600: '#0d9488',
                },
                // Background - Night Sky
                dream: {
                    bg: '#0a0614',
                    card: '#130d24',
                    surface: '#1a1230',
                    border: 'rgba(139, 92, 246, 0.2)',
                    'border-light': 'rgba(139, 92, 246, 0.35)',
                },
                // Accents
                accent: {
                    gold: '#fbbf24',
                    rose: '#fb7185',
                    success: '#34d399',
                    error: '#f87171',
                    info: '#60a5fa',
                },
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
                display: ['var(--font-cinzel)', 'serif'],
                mono: ['SF Mono', 'Monaco', 'Inconsolata', 'monospace'],
            },
            backgroundImage: {
                'gradient-dream': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'gradient-aurora': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                'gradient-night': 'linear-gradient(180deg, #0a0614 0%, #130d24 100%)',
                'gradient-primary': 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #6d28d9 100%)',
                'gradient-glow': 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
                'gradient-card': 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, transparent 100%)',
            },
            boxShadow: {
                'glow': '0 0 20px rgba(139, 92, 246, 0.3)',
                'glow-lg': '0 0 40px rgba(139, 92, 246, 0.4)',
                'glow-xl': '0 0 60px rgba(139, 92, 246, 0.5)',
                'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                'card': '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(139, 92, 246, 0.1)',
                'card-hover': '0 16px 48px rgba(0, 0, 0, 0.4), 0 0 30px rgba(139, 92, 246, 0.15)',
                'button': '0 4px 15px rgba(124, 58, 237, 0.4)',
                'button-hover': '0 8px 25px rgba(124, 58, 237, 0.5)',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                'scale-in': 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                'float': 'float 3s ease-in-out infinite',
                'float-slow': 'float 6s ease-in-out infinite',
                'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'gradient': 'gradientShift 8s ease infinite',
                'spin-slow': 'spin 3s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.9)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.25)' },
                    '50%': { boxShadow: '0 0 35px rgba(139, 92, 246, 0.45)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '200% 0' },
                    '100%': { backgroundPosition: '-200% 0' },
                },
                gradientShift: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
            },
            backdropBlur: {
                xs: '2px',
            },
            transitionTimingFunction: {
                'bounce-in': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            },
            borderRadius: {
                '2xl': '1rem',
                '3xl': '1.5rem',
            },
        },
    },
    plugins: [],
};

export default config;
