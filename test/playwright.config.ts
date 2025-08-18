import { defineConfig } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, 'test.env') })

let multiplier = process.env.CI ? 4 : 1
let smallMultiplier = process.env.CI ? 3 : 1

export const TEST_TIMEOUT_LONG = 640000 * multiplier // 8*3 minutes - used as timeOut for the beforeAll
export const TEST_TIMEOUT = 40000 * multiplier
export const EXPECT_TIMEOUT = 6000 * smallMultiplier
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
