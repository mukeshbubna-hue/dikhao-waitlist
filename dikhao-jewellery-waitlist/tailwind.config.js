export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // New jewellery brand palette
        ivory:      '#F4EEE5',
        'warm-white': '#FAF7F2',
        pearl:      '#E8E0D1',
        plum:       '#3D0F1A',
        'plum-dim': '#2A0810',
        'rose-gold':'#C8A28A',
        'rose-gold-dim':'#A68671',
        ink:        '#1A1A1A',
        'ink-soft': '#3D3D3D',
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        body:    ['"Geist"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        'tightest': '-0.045em',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'letter-in': {
          '0%': { opacity: '0', transform: 'translateY(40%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.2, 0.6, 0.2, 1) both',
        'letter-in': 'letter-in 0.65s cubic-bezier(0.2, 0.6, 0.2, 1) both',
      },
    }
  },
  plugins: [],
}
