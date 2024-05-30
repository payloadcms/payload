import type { PlaywrightTestConfig } from '@playwright/test'

export const EXPECT_TIMEOUT = 45000
export const POLL_TOPASS_TIMEOUT = EXPECT_TIMEOUT * 4 // That way expect.poll() or expect().toPass can retry 4 times. 4x higher than default expect timeout => can retry 4 times if retryable expects are used inside

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
  expect: {
    timeout: 10000,
  },
  workers: 16,
}
export default config
