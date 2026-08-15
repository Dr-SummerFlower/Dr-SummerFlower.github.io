import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import contentPlugin from './vite-plugins/content/index.ts'
import iconifyPlugin from './vite-plugins/iconify/index.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    contentPlugin(),
    iconifyPlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@iconify/react': '@iconify/react/offline',
    },
  },
  build: {
    target: "es2023",
    sourcemap: false,
    minify: true,
    rolldownOptions: {
      output: {
        minify: {
          compress: {
            dropConsole: true,
            dropDebugger: true,
          },
          mangle: true,
        },
      },
    },
  },
  server: {
    port: 5173,
  },
})
