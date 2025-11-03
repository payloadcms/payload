import type { Page, TestInfo } from '@playwright/test'

import AxeBuilder from '@axe-core/playwright'

/**
 * Runs an accessibility scan using Axe and attaches the results to the test
 *
 * @param page - Playwright page object
 * @param testInfo - Playwright test info object
 * @returns Promise<AxeResults> - The scan results including violations
 *
 * @example
 * ```typescript
 * test('should be accessible', async ({ page }, testInfo) => {
 *   await page.goto(url.create)
 *   const results = await runAxeScan(page, testInfo)
 *   expect(results.violations.length).toBe(0)
 * })
 * ```
 */
export async function runAxeScan(page: Page, testInfo: TestInfo) {
  const scanResults = await new AxeBuilder({ page }).analyze()

  await testInfo.attach('accessibility-scan-results', {
    body: JSON.stringify(scanResults, null, 2),
    contentType: 'application/json',
  })

  await testInfo.attach('accessibility-scan-results-violations', {
    body: JSON.stringify(scanResults.violations, null, 2),
    contentType: 'application/json',
  })

  return scanResults
}
