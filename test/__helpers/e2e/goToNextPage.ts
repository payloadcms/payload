import type { Locator, Page } from '@playwright/test'

import { POLL_TOPASS_TIMEOUT } from 'playwright.config.js'

export const goToNextPage = async (
  page: Page,
  options: {
    affectsURL?: boolean // if false, won't wait for URL change (useful for when pagination doesn't affect URL)
    /**
     * Scope the pagination to a specific selector. If not provided, will search the whole page for the controls.
     */
    scope?: Locator
    // defaults to 2, assuming you're on page 1
    targetPage?: number
  } = { targetPage: 2, affectsURL: true },
) => {
  const pageControls = (options.scope || page).locator('.paginator')
  const nextButton = pageControls.locator('button').nth(1)
  await nextButton.waitFor({ state: 'visible' })
  await nextButton.click({ delay: 100 })

  if (options.affectsURL) {
    const regex = new RegExp(`page=${options.targetPage}(?:&|$)`)
    await page.waitForURL(regex, { timeout: POLL_TOPASS_TIMEOUT })
  }
}

export const goToPreviousPage = async (
  page: Page,
  options: {
    affectsURL?: boolean // if false, won't wait for URL change (useful for when pagination doesn't affect URL)
    /**
     * Scope the pagination to a specific selector. If not provided, will search the whole page for the controls.
     * This is useful when multiple pagination controls are displayed on the same page (e.g. group-by)
     */
    scope?: Locator
    // defaults to 1, assuming you're on page 2
    targetPage?: number
  } = {
    targetPage: 1,
    affectsURL: true,
  },
) => {
  const pageControls = (options.scope || page).locator('.paginator')
  const prevButton = pageControls.locator('button').nth(0)
  await prevButton.waitFor({ state: 'visible' })
  await prevButton.click({ delay: 100 })

  if (options.affectsURL) {
    const regex = new RegExp(`page=${options.targetPage}(?:&|$)`)
    await page.waitForURL(regex, { timeout: POLL_TOPASS_TIMEOUT })
  }
}
