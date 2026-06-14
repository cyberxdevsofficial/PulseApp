import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import uploadPlugin from './vite-plugin-upload.js'


export default defineConfig({
  plugins: [
    react(),

    uploadPlugin(),
  ],
  build: {
    outDir: 'dist',
  },
})
