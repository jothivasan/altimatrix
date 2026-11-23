import { homedir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, searchForWorkspaceRoot } from 'vite'

const here = path.dirname(fileURLToPath(import.meta.url))

const API_TARGET = process.env.ALTIMATRIX_API_URL ?? 'http://127.0.0.1:4173'
const API_TOKEN = process.env.ALTIMATRIX_API_TOKEN

export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: { alias: { '@': path.resolve(here, './src') } },
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Same-origin API requests keep the bearer token in the proxy.
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        // Server sent events must not be buffered, or the live stream arrives
        // in one lump when the connection finally closes.
        ws: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (request) => {
            if (API_TOKEN !== undefined) {
              request.setHeader('authorization', `Bearer ${API_TOKEN}`)
            }
          })
        },
      },
    },
    fs: {
      // The isolated linker keeps packages in bun's global store rather than
      // inside the project, so font files resolve to paths outside the root
      // and Vite refuses to serve them. Allowing the store is what makes the
      // shared install work in dev; without it the app renders in fallback
      // fonts and the console fills with denials.
      allow: [
        searchForWorkspaceRoot(here),
        path.join(homedir(), '.bun', 'install', 'cache'),
      ],
    },
  },
})
