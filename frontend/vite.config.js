import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 4000000
      },
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'ExamArchitect',
        short_name: 'ExamArchitect',
        description: 'Predictive GATE CS Exam Analytics & Roadmap Builder',
        theme_color: '#0f111a',
        background_color: '#0f111a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: [
      { find: /^es-toolkit\/compat\/range(\.js)?$/, replacement: path.resolve(__dirname, 'src/utils/compat-range.js') },
      { find: /^es-toolkit\/compat\/get(\.js)?$/, replacement: path.resolve(__dirname, 'src/utils/compat-get.js') },
      { find: /^es-toolkit\/compat\/omit(\.js)?$/, replacement: path.resolve(__dirname, 'src/utils/compat-omit.js') },
      { find: /^es-toolkit\/compat\/maxBy(\.js)?$/, replacement: path.resolve(__dirname, 'src/utils/compat-maxBy.js') },
      { find: /^es-toolkit\/compat\/sumBy(\.js)?$/, replacement: path.resolve(__dirname, 'src/utils/compat-sumBy.js') },
      { find: /^es-toolkit\/compat\/sortBy(\.js)?$/, replacement: path.resolve(__dirname, 'src/utils/compat-sortBy.js') },
      { find: /^es-toolkit\/compat\/throttle(\.js)?$/, replacement: path.resolve(__dirname, 'src/utils/compat-throttle.js') },
      { find: /^es-toolkit\/compat\/minBy(\.js)?$/, replacement: path.resolve(__dirname, 'src/utils/compat-minBy.js') },
      { find: /^es-toolkit\/compat\/last(\.js)?$/, replacement: path.resolve(__dirname, 'src/utils/compat-last.js') },
      { find: /^es-toolkit\/compat\/isPlainObject(\.js)?$/, replacement: path.resolve(__dirname, 'src/utils/compat-isPlainObject.js') },
      { find: /^es-toolkit\/compat\/uniqBy(\.js)?$/, replacement: path.resolve(__dirname, 'src/utils/compat-uniqBy.js') }
    ]
  }
})
