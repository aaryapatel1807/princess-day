import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // The film frames are large; keep the build output self-contained.
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
})
