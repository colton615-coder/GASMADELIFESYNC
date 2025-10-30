import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // FIX: Cast `process` to `any` to resolve a TypeScript type definition conflict for `process.cwd()`.
  const env = loadEnv(mode, (process as any).cwd(), '')
  return {
    plugins: [react(), visualizer({ filename: 'bundle-report.html', open: true })],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Expose environment variables to the client
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    }
  }
})
