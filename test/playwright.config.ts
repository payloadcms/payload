import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, 'test.env') })
dotenv.config({ path: path.resolve(dirname, '..', '.env') })

const CI = process.env.CI === 'true'
const isTanStack = process.env.PAYLOAD_FRAMEWORK === 'tanstack-start'

let multiplier = CI ? 4 : 1
let smallMultiplier = CI ? 3 : 1

export const TEST_TIMEOUT_LONG = 60000 * multiplier // used as timeOut for the beforeAll
export const TEST_TIMEOUT = 20000 * smallMultiplier
export const EXPECT_TIMEOUT = 6000 * smallMultiplier
export const POLL_TOPASS_TIMEOUT = EXPECT_TIMEOUT * 4 // That way expect.poll() or expect().toPass can retry 4 times. 4x higher than default expect timeout => can retry 4 times if retryable expects are used inside

export default defineConfig({
  // Look for test files in the "test" directory, relative to this configuration file
  testDir: '',
  testMatch: ['*e2e.spec.ts', '*perf.spec.ts'],
  timeout: TEST_TIMEOUT, // 1 minute
  use: {
    screenshot: 'off',
    /**
     * If CI, collect trace only on first retry. First runs do not collect trace to improve performance.
     * Locally, always collect traces since retries are disabled.
     */
    trace: CI ? 'on-first-retry' : 'retain-on-failure',
    video: 'off',
    navigationTimeout: TEST_TIMEOUT / 2,
  },
  expect: {
    timeout: EXPECT_TIMEOUT,
    toHaveScreenshot: {
      // Tolerate a small amount of anti-aliasing noise, not real visual drift.
      maxDiffPixelRatio: 0.01,
    },
  },
  /**
   * Drops the platform/project suffix Playwright normally appends (e.g. `-chromium-darwin`).
   * Visual regression baselines are only ever generated/compared inside the pinned Playwright
   * Docker image (see `pnpm test:visual`), so there is only ever one valid environment
   * for a given snapshot and the suffix would just be dead weight in the path.
   */
  snapshotPathTemplate: '{testDir}/{testFileDir}/__snapshots__/{testFileName}/{arg}{ext}',
  /**
   * Overridable via env var so `run-visual-suites.sh` can give each suite its own subdirectory
   * when looping over multiple suites in one CI job — Playwright clears `outputDir` at the start
   * of every run, so a shared directory would let a later suite's run delete an earlier suite's
   * diff images before the visual-regression job's manifest step ever reads them.
   */
  outputDir: path.resolve(dirname, process.env.PLAYWRIGHT_OUTPUT_DIR ?? 'test-results'),
  workers: 16,
  maxFailures: CI && isTanStack ? 30 : undefined,
  retries: CI ? (isTanStack ? 2 : 5) : undefined,
  /**
   * `PLAYWRIGHT_HTML_REPORT` (a Playwright-native env var that also controls the html reporter's
   * output folder) opts into an interactive HTML report locally — see `pnpm test:visual:preview`.
   */
  reporter: CI
    ? [['list', { printSteps: true }], ['json']]
    : process.env.PLAYWRIGHT_HTML_REPORT
      ? [
          ['list', { printSteps: true }],
          ['html', { open: 'never' }],
        ]
      : [['list', { printSteps: true }]],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
})
