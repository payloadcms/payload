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
  interval = 1000,
  page,
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
        const scrollContainer = document.querySelector('.template-default__wrap') ?? document.body
        let previousHeight = scrollContainer.scrollHeight
        let stableChecks = 0

        const checkStability = () => {
          const currentHeight = scrollContainer.scrollHeight
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
