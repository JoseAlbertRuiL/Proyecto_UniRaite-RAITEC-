import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup/index.ts'],
    testTimeout: 15000,
    exclude: ['node_modules', 'dist'],
  },
})
