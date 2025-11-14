import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    proxy: {
      // 代理飞书 API 请求到 Cloudflare Pages Functions (Wrangler)
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true
      },
      // 代理图片请求到 Cloudflare Pages Functions (Wrangler)
      '/image-proxy': {
        target: 'http://localhost:8788',
        changeOrigin: true
      }
    }
  }
})
