/** @type {import('tailwindcss').Config} */
// Design system Tailwind — paleta BWT i akcent główny wg specyfikacji UI/UX.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Składniki BWT (Białko/Białko, Węglowodany (Carbs), Tłuszcze (Fats))
        protein: {
          DEFAULT: '#3B82F6',
          50: '#EFF6FF',
          600: '#2563EB',
        },
        carbs: {
          DEFAULT: '#10B981',
          50: '#ECFDF5',
          600: '#059669',
        },
        fats: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          600: '#D97706',
        },
        // Akcent główny — soczysta zieleń / lime
        accent: {
          DEFAULT: '#84CC16',
          dark: '#65A30D',
        },
        // Tło i powierzchnie
        surface: {
          light: '#F8FAFC',
          dark: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      maxWidth: {
        app: '480px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 10px 24px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};