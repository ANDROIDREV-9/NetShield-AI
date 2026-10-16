const c = (v) => `rgb(var(--${v}) / <alpha-value>)`
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: c('bg'), panel: c('panel'), panel2: c('panel2'), line: c('line'),
        ink: c('ink'), muted: c('muted'), faint: c('faint'),
        cyan: c('cyan'), emerald: c('emerald'), amber: c('amber'), red: c('red'),
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: { DEFAULT: '6px', md: '6px', lg: '8px' },
      boxShadow: { glow: '0 0 0 1px rgb(var(--cyan) / .35), 0 0 14px rgb(var(--cyan) / .12)' },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        slidein: { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: { slidein: 'slidein .18s ease-out' },
    },
  },
  plugins: [],
}
