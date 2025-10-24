import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 5000,
    projects: ['packages/*'],
  },
})
