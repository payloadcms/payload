import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, 'test.env') })

const CI = process.env.CI === 'true'

let multiplier = CI ? 4 : 1
let smallMultiplier = CI ? 3 : 1

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
    screenshot: 'off',
    /**
     * If CI, collect trace only on first retry. First runs do not collect trace to improve performance.
     * Locally, always collect traces since retries are disabled.
     */
    trace: CI ? 'on-first-retry' : 'retain-on-failure',
    video: 'off',
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
})
