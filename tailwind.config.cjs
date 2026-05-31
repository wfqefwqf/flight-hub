module.exports = {
  content: ['./index.html', './src/renderer/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        glass: 'rgba(255,255,255,0.08)',
        stroke: 'rgba(255,255,255,0.12)',
        accent: '#7dd3fc'
      },
      boxShadow: {
        glass: '0 20px 60px rgba(15, 23, 42, 0.45)'
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: []
};