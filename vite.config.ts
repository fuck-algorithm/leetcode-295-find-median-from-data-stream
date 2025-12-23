import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 41445,
  },
  base: '/leetcode-295-find-median-from-data-stream/',
})
