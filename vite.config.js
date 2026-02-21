import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Change 'english-5b-trainer' to your GitHub repo name
  base: '/english-5b-trainer/',
})
