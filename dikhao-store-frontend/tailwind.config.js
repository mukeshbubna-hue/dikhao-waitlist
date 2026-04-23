export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          purple:        '#6C3CE1',
          navy:          '#1A1A2E',
          gold:          '#E8A838',
          bg:            '#F7F5F2',
          'purple-light':'#EDE8FA',
          'purple-mid':  '#9C7EE8',
        },
        status: {
          green:  '#25D366',
          red:    '#E24B4A',
          amber:  '#E8A838',
        }
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      }
    }
  }
}
