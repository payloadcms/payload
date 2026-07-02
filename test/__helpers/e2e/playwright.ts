import { test as playwrightTest } from '@playwright/test'

type PayloadFramework = 'next' | 'tanstack-start'

type TestOptions = {
  /**
   * Specify which framework(s) the test should run on.
   * - 'all': Run on all frameworks (default)
   * - 'next': Run only on Next.js
   * - 'tanstack-start': Run only on TanStack Start
   * - 'rsc': Run only when RSC is enabled. Useful for tests that assert server component rendering.
   */
  framework?: 'all' | 'rsc' | PayloadFramework
}

const currentFramework: PayloadFramework =
  (process.env.PAYLOAD_FRAMEWORK as PayloadFramework) || 'next'

const isRSCEnabled =
  process.env.PAYLOAD_FRAMEWORK_RSC_ENABLED !== undefined
    ? process.env.PAYLOAD_FRAMEWORK_RSC_ENABLED !== 'false'
    : true

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
 */
function testWithOptions(
  name: string,
  optionsOrFn: Parameters<typeof playwrightTest>[1] | TestOptions,
  fn?: Parameters<typeof playwrightTest>[2],
) {
  const options: TestOptions | undefined =
    typeof optionsOrFn === 'object' && !Array.isArray(optionsOrFn) && 'framework' in optionsOrFn
      ? optionsOrFn
      : undefined
  const testFn = options ? fn! : (optionsOrFn as Parameters<typeof playwrightTest>[1])

  const framework = options?.framework ?? 'all'

  if (framework === 'rsc' && !isRSCEnabled) {
    return playwrightTest.skip(name, testFn as Parameters<typeof playwrightTest>[1])
  }

  if (framework !== 'all' && framework !== 'rsc' && framework !== currentFramework) {
    return playwrightTest.skip(name, testFn as Parameters<typeof playwrightTest>[1])
  }

  return playwrightTest(name, testFn as Parameters<typeof playwrightTest>[1])
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

export { currentFramework, isRSCEnabled }
