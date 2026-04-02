import type { Page, TestInfo } from '@playwright/test'

import AxeBuilder from '@axe-core/playwright'

type AxeProps = {
  defaultExcludes?: boolean
  exclude?: string[]
  include?: string[]
  page: Page
  screenshotViolations?: boolean
  testInfo: TestInfo
}

/**
 * Runs an accessibility scan using Axe and attaches the results to the test.
 * Optionally screenshots each violating element for visual debugging.
 *
 * @param page - Playwright page object
 * @param testInfo - Playwright test info object
 * @param screenshotViolations - Whether to screenshot each violating element (default: true)
 * @returns Promise<AxeResults> - The scan results including violations
 *
 * @example
 * ```typescript
 * test('should be accessible', async ({ page }, testInfo) => {
 *   await page.goto(url.create)
 *   const results = await runAxeScan({ page, testInfo })
 *   expect(results.violations.length).toBe(0)
 * })
 *
 * // Disable screenshots for faster tests
 * const results = await runAxeScan({ page, testInfo, screenshotViolations: false })
 * ```
 */
export async function runAxeScan({
  page,
  testInfo,
  defaultExcludes = true,
  include,
  exclude,
  screenshotViolations = true,
}: AxeProps) {
  const axeBuilder = new AxeBuilder({ page })

  axeBuilder.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])

  if (defaultExcludes) {
    axeBuilder.exclude('.template-default > .nav')
    axeBuilder.exclude('.app-header')
  }

  if (include) {
    include.forEach((selector) => {
      axeBuilder.include(selector)
    })
  }

  if (exclude) {
    exclude.forEach((selector) => {
      axeBuilder.exclude(selector)
    })
  }

  const scanResults = await axeBuilder.analyze()

  await testInfo.attach('accessibility-scan-results', {
    body: JSON.stringify(scanResults, null, 2),
    contentType: 'application/json',
  })

  await testInfo.attach('accessibility-scan-results-violations', {
    body: JSON.stringify(scanResults.violations, null, 2),
    contentType: 'application/json',
  })

  // Screenshot each violating element
  if (screenshotViolations && scanResults.violations.length > 0) {
    const screenshotPromises: Promise<void>[] = []

    scanResults.violations.forEach((violation, violationIdx) => {
      violation.nodes.forEach((node, nodeIdx) => {
        const selector = node.target.join(' ')

        // Create a promise for each screenshot
        const screenshotPromise = (async () => {
          try {
            const element = page.locator(selector).first()

            // Check if element exists and is visible
            const isVisible = await element.isVisible().catch(() => false)

            if (isVisible) {
              const screenshot = await element.screenshot({ timeout: 5000 })

              // Create a descriptive filename
              const filename = `axe-violation-${violation.id}-${violationIdx + 1}-${nodeIdx + 1}`

              await testInfo.attach(filename, {
                body: screenshot,
                contentType: 'image/png',
              })
            }
          } catch (error) {
            // Silently fail if screenshot cannot be taken
            // This can happen with elements that are off-screen, too small, etc.
            console.warn(
              `Could not screenshot element for ${violation.id} (${selector}):`,
              error instanceof Error ? error.message : error,
            )
          }
        })()

        screenshotPromises.push(screenshotPromise)
      })
    })

    // Wait for all screenshots to complete
    await Promise.all(screenshotPromises)
  }

  return scanResults
}
