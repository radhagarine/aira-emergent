import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    poolOptions: {
      threads: {
        singleThread: true
      },
      isolate: true
    },
    coverage: {
      enabled: false // Disable coverage during debugging
    },
    maxConcurrency: 1,
    isolate: true,
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['./tests/**/*.test.ts', './tests/**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
  define: {
    'process.env.NODE_ENV': '"development"',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/tests': path.resolve(__dirname, './tests'),
    },
  },
})
