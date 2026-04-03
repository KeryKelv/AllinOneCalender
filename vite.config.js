import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Simple Vite + React config without Tailwind (using inline styles instead)
export default defineConfig({
  plugins: [
    react(),
  ],
})