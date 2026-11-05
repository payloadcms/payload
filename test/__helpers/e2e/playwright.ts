import type { TestDetails } from '@playwright/test'

import { test as playwrightTest } from '@playwright/test'

type PayloadFramework = 'next' | 'tanstack-start'

type TestBody = Parameters<typeof playwrightTest>[2]

type TestOptions = {
  /**
   * Specify which framework(s) the test should run on.
   * - 'all': Run on all frameworks (default)
   * - 'next': Run only on Next.js
   * - 'tanstack-start': Run only on TanStack Start
   * - 'rsc': Alias for 'all'. RSC is always enabled; retained to mark tests that assert server component rendering.
   */
  framework?: 'all' | 'rsc' | PayloadFramework
} & TestDetails

const currentFramework: PayloadFramework =
  (process.env.PAYLOAD_FRAMEWORK as PayloadFramework) || 'next'

/**
 * Custom `test` wrapper that supports framework-specific test execution.
 *
 * @example
 * // Run only when RSC is enabled
 * test('server component renders props', { framework: 'rsc' }, async ({ page }) => { ... })
 *
 * // Run only on Next.js
 * test('next-specific test', { framework: 'next' }, async ({ page }) => { ... })
 *
 * // Run on all frameworks (default)
 * test('universal test', async ({ page }) => { ... })
 *
 * // Playwright test details like tags are passed through
 * test('tagged test', { tag: '@also-without-cache-components' }, async ({ page }) => { ... })
 */
function testWithOptions(name: string, optionsOrFn: TestBody | TestOptions, fn?: TestBody) {
  const { framework = 'all', ...details }: TestOptions =
    typeof optionsOrFn === 'function' ? {} : optionsOrFn
  const testFn = typeof optionsOrFn === 'function' ? optionsOrFn : fn!

  if (framework !== 'all' && framework !== 'rsc' && framework !== currentFramework) {
    return playwrightTest.skip(name, details, testFn)
  }

  return playwrightTest(name, details, testFn)
}

testWithOptions.skip = playwrightTest.skip
testWithOptions.describe = playwrightTest.describe
testWithOptions.beforeAll = playwrightTest.beforeAll
testWithOptions.afterAll = playwrightTest.afterAll
testWithOptions.beforeEach = playwrightTest.beforeEach
testWithOptions.afterEach = playwrightTest.afterEach
testWithOptions.use = playwrightTest.use
testWithOptions.slow = playwrightTest.slow
testWithOptions.fixme = playwrightTest.fixme
testWithOptions.only = playwrightTest.only
testWithOptions.step = playwrightTest.step
testWithOptions.fail = playwrightTest.fail
testWithOptions.extend = playwrightTest.extend

// Needs to be called `test` for the Playwright VS Code extension to recognize it
export const test = testWithOptions

export { currentFramework }
