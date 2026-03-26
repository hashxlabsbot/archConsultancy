import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Elysian Talent — Indigo/Violet Primary
                primary: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',  /* Elysian Indigo */
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                    950: '#1e1b4b',
                },
                // Sky Blue Secondary
                secondary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                },
                // Violet Tertiary
                tertiary: {
                    400: '#c084fc',
                    500: '#a855f7',
                    600: '#9333ea',
                    700: '#7e22ce',
                },
                success: {
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    400: '#34d399',
                    500: '#10b981',
                    600: '#059669',
                    700: '#047857',
                },
                warning: {
                    50: '#fffbeb',
                    100: '#fef3c7',
                    400: '#fbbf24',
                    500: '#f59e0b',
                    600: '#d97706',
                    700: '#b45309',
                    900: '#78350f',
                },
                danger: {
                    50: '#fff1f2',
                    100: '#ffe4e6',
                    400: '#f87171',
                    500: '#ef4444',
                    600: '#dc2626',
                    700: '#b91c1c',
                },
                // Elysian surface tiers
                surface: {
                    base: '#f5f6fa',
                    low: '#eff1f5',
                    container: '#e6e8ed',
                    high: '#e0e2e8',
                    highest: '#dadde2',
                    white: '#ffffff',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Manrope', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                '2xl': '1rem',
                '3xl': '1.5rem',
                '4xl': '2rem',
            },
            backdropBlur: {
                xs: '2px',
                sm: '8px',
                md: '16px',
                lg: '24px',
            },
            boxShadow: {
                'card': '0 1px 3px rgba(70, 71, 211, 0.06), 0 8px 24px rgba(70, 71, 211, 0.04)',
                'card-hover': '0 4px 12px rgba(70, 71, 211, 0.1), 0 16px 40px rgba(70, 71, 211, 0.08)',
                'hero': '0 8px 32px rgba(99, 102, 241, 0.3)',
                'indigo': '0 4px 14px rgba(99, 102, 241, 0.35)',
                'sky': '0 4px 14px rgba(14, 165, 233, 0.35)',
                'emerald': '0 4px 14px rgba(16, 185, 129, 0.35)',
                'amber': '0 4px 14px rgba(245, 158, 11, 0.35)',
                'violet': '0 4px 14px rgba(139, 92, 246, 0.35)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'float': 'float 4s ease-in-out infinite',
                'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
                'gradient': 'gradientShift 4s ease infinite',
                'spin-slow': 'spinSlow 8s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.4)' },
                    '50%': { boxShadow: '0 0 0 8px rgba(99, 102, 241, 0)' },
                },
                gradientShift: {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                },
                spinSlow: {
                    from: { transform: 'rotate(0deg)' },
                    to: { transform: 'rotate(360deg)' },
                },
            },
        },
    },
    plugins: [],
};
export default config;
