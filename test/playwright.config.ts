import { defineConfig } from '@playwright/test'

export default defineConfig({
  // Look for test files in the "test" directory, relative to this configuration file
  testDir: '',
  testMatch: '*e2e.spec.ts',
  timeout: 240000, // 4 minutes
  use: {
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  expect: {
    timeout: 60000,
  },
  workers: 16,
})
