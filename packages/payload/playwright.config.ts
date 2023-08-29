import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  // Look for test files in the "test" directory, relative to this configuration file
  testDir: 'test',
  testMatch: '*e2e.spec.ts',
  workers: 999,
  timeout: 180000, // 3 minutes
  use: {
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
};
export default config;
