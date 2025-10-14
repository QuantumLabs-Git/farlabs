import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{ts,tsx,mdx}',
    './src/components/**/*.{ts,tsx,mdx}',
    './src/app/**/*.{ts,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7C3AED',
          soft: '#A78BFA',
          accent: '#10B981',
          dark: '#111'
        }
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      boxShadow: {
        neon: '0 0 40px rgba(124, 58, 237, 0.35)'
      },
      backgroundImage: {
        'grid-glow':
          'radial-gradient(circle at center, rgba(124,58,237,0.3) 0, rgba(17,17,17,0.95) 60%), linear-gradient(120deg, rgba(124,58,237,0.15), rgba(16,185,129,0.05))'
      }
    }
  },
  plugins: []
};

export default config;
