import { defineConfig } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, 'test.env') })

export const TEST_TIMEOUT_LONG = process.env.CI ? 300_000 : 60_000
export const TEST_TIMEOUT = process.env.CI ? 30_000 : 15_000
export const EXPECT_TIMEOUT = 10_000
export const POLL_TOPASS_TIMEOUT = EXPECT_TIMEOUT * 4 // That way expect.poll() or expect().toPass can retry 4 times. 4x higher than default expect timeout => can retry 4 times if retryable expects are used inside

export default defineConfig({
  // Look for test files in the "test" directory, relative to this configuration file
  testDir: '',
  testMatch: '*e2e.spec.ts',
  timeout: TEST_TIMEOUT, // 1 minute
  use: {
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  expect: {
    timeout: EXPECT_TIMEOUT,
  },
  workers: 16,
  maxFailures: process.env.CI ? undefined : undefined,
  retries: process.env.CI ? 5 : undefined,
  reporter: process.env.CI
    ? [['list', { printSteps: true }], ['json']]
    : [['list', { printSteps: true }]],
})
