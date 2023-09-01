import type { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  // Look for test files in the "test" directory, relative to this configuration file
  testDir: 'test',
  testMatch: '*e2e.spec.ts',
  timeout: 180000, // 3 minutes
  use: {
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  workers: 999,
}
export default config
