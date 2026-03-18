import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tamkeen (Warm Minimalism) - Light Mode
        tamkeen: {
          primary: '#CC7722',      // Rust/Ochre
          accent: '#556B2F',       // Deep Olive
          background: '#F0EBE3',   // Warm Stone
          surface: '#FFFFFF',      // Pure White for cards
          text: '#2D2416',         // Dark Brown
          textMuted: '#5A4A3A',    // Medium Brown
          hesitation: '#CA8A04',   // Yellow/amber
          mistake: '#B91C1C',      // Red
          forget: '#6B7280',       // Grey
        },
        
        // Tamkeen Dark Mode
        tamkeenDark: {
          primary: '#E89952',      // Lighter Rust for visibility
          accent: '#8FBC8F',       // Lighter Olive
          background: '#0F1A13',   // Dark Greenish-Black
          surface: '#1A2820',      // Dark Green-Gray surface
          text: '#F0EBE3',         // Warm Off-White
          textMuted: '#B8C4B8',    // Greenish-Gray
          hesitation: '#EAB308',   // Brighter yellow for dark
          mistake: '#DC2626',      // Red
          forget: '#9CA3AF',       // Lighter grey for dark
        },
      },
    },
  },
  plugins: [],
}

export default config
