import type { PlaywrightTestConfig } from '@playwright/test'

import { devices } from '@playwright/test'

const CI = process.env.CI === 'true'

const multiplier = CI ? 4 : 1
const smallMultiplier = CI ? 3 : 1

export const TEST_TIMEOUT_LONG = 320000 * multiplier
export const TEST_TIMEOUT = 20000 * smallMultiplier
export const EXPECT_TIMEOUT = 6000 * smallMultiplier
export const POLL_TOPASS_TIMEOUT = EXPECT_TIMEOUT * 4

/**
 * Base Playwright configuration for Payload E2E tests.
 * Consumers can spread this and override as needed.
 */
export const basePlaywrightConfig: Partial<PlaywrightTestConfig> = {
  testMatch: '*e2e.spec.ts',
  timeout: TEST_TIMEOUT,
  use: {
    screenshot: 'off',
    trace: CI ? 'on-first-retry' : 'retain-on-failure',
    video: 'off',
    navigationTimeout: TEST_TIMEOUT / 2,
  },
  expect: {
    timeout: EXPECT_TIMEOUT,
  },
  workers: 16,
  maxFailures: CI ? undefined : undefined,
  retries: CI ? 5 : undefined,
  reporter: CI ? [['list', { printSteps: true }], ['json']] : [['list', { printSteps: true }]],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
}
