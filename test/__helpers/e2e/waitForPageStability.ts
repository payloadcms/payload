import type { Page } from '@playwright/test'

/**
 * Checks if the page is stable by continually polling until the page size remains constant in size and there are no loading shimmers.
 * A page is considered stable if it passes this test multiple times.
 * This will ensure that the page won't unexpectedly change while testing.
 * @param page - Playwright page object
 * @param intervalMs - Polling interval in milliseconds
 * @param stableChecksRequired - Number of stable checks required to consider page stable
 * @returns Promise<void>
 */
export const waitForPageStability = async ({
  page,
  interval = 1000,
  stableChecksRequired = 3,
}: {
  interval?: number
  page: Page
  stableChecksRequired?: number
}) => {
  await page.waitForLoadState('networkidle') // Wait for network to be idle

  await page.waitForFunction(
    async ({ interval, stableChecksRequired }) => {
      return new Promise((resolve) => {
        let previousHeight = document.body.scrollHeight
        let stableChecks = 0

        const checkStability = () => {
          const currentHeight = document.body.scrollHeight
          const loadingShimmers = document.querySelectorAll('.shimmer-effect')
          const pageSizeChanged = currentHeight !== previousHeight

          if (!pageSizeChanged && loadingShimmers.length === 0) {
            stableChecks++ // Increment stability count
          } else {
            stableChecks = 0 // Reset stability count if page changes
          }

          previousHeight = currentHeight

          if (stableChecks >= stableChecksRequired) {
            resolve(true) // Only resolve after multiple stable checks
          } else {
            setTimeout(checkStability, interval) // Poll again
          }
        }

        checkStability()
      })
    },
    { interval, stableChecksRequired },
  )
}
