import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = (env.VITE_API_BASE || '').replace(/\/+$/, '').replace(/\/ask$/i, '')

  // In dev, proxy /api/* → your worker base
  const proxy = target
    ? {
        '/api': {
          target,
          changeOrigin: true,
          // /api/ask → /ask
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    : undefined

  return defineConfig({
    plugins: [react()],
    server: { port: 5173, proxy }
  })
}
