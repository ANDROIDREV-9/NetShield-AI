import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'node:path'

// `--mode streamlit` inlines JS/CSS into one index.html so Streamlit can embed it.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), ...(mode === 'streamlit' ? [viteSingleFile()] : [])],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: { outDir: mode === 'streamlit' ? 'dist-streamlit' : 'dist', chunkSizeWarningLimit: 1500 },
}))
