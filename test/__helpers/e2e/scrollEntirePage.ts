import type { Page } from '@playwright/test'

import { waitForPageStability } from './waitForPageStability.js'

/**
 * Scroll to bottom of the page continuously until no new content is loaded.
 * This is needed because we conditionally render fields as they enter the viewport.
 * This will ensure that all fields are rendered and fully loaded before we start testing.
 * Without this step, Playwright's `locator.scrollIntoView()` might not work as expected.
 * @param page - Playwright page object
 * @returns Promise<void>
 */
export const scrollEntirePage = async (page: Page) => {
  let previousHeight = await page.evaluate(() => document.body.scrollHeight)

  while (true) {
    await page.evaluate(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    })

    // Wait for the page to stabilize after scrolling
    await waitForPageStability({ page })

    // Get the new page height after stability check
    const newHeight = await page.evaluate(() => document.body.scrollHeight)

    // Stop if the height hasn't changed, meaning no new content was loaded
    if (newHeight === previousHeight) {
      break
    }

    previousHeight = newHeight
  }
}
