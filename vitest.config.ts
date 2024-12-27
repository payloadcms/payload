import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/*/src/**/*.spec.ts'],
    testTimeout: 90000,
  },
})
