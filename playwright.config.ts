// playwright.config.ts
import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  // Look for test files in the "tests" directory, relative to this configuration file
  testDir: 'test/e2e',
  workers: 999,
  timeout: 600000,
};
export default config;
