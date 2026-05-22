import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { POLL_TOPASS_TIMEOUT } from '../../playwright.config.js'

const defaultLimits = [10, 25, 50, 100]

/**
 * Sets the per-page limit in the list view.
 * Clicks the per-page button and selects the specified limit from the popup.
 */
export const setPerPageLimit = async ({
  limit,
  page,
  scope,
  waitForURL = true,
}: {
  /** The per-page limit to select */
  limit: number
  /** The Playwright page object */
  page: Page
  /** Scope the selector to a specific element (e.g., a drawer locator) */
  scope?: Page | Locator
  /** Whether to wait for URL to update. Set to false for drawers. Default: true */
  waitForURL?: boolean
}): Promise<void> => {
  const scopeToUse = scope ?? page
  const perPageButton = scopeToUse.locator('.per-page button')

  await perPageButton.waitFor({ state: 'visible' })
  await perPageButton.click({ force: true })

  // Target the option within the popup with exact text match
  const popupOption = scopeToUse.locator('.popup__content .popup-button-list__button', {
    hasText: new RegExp(`^${limit}$`),
  })
  await popupOption.click({ force: true })

  if (waitForURL) {
    await page.waitForURL(new RegExp(`limit=${limit}`), { timeout: POLL_TOPASS_TIMEOUT })
  } else {
    // For drawers or contexts where URL doesn't change, verify button text instead
    await expect(perPageButton).toContainText(String(limit), { timeout: POLL_TOPASS_TIMEOUT })
  }
}

/**
 * Verifies the available per-page limit options in the popup.
 * Opens the popup, checks the options, then closes it.
 */
export const expectPerPageLimits = async ({
  expectedLimits = defaultLimits,
  page,
  scope,
}: {
  /** Array of expected limit values (defaults to [10, 25, 50, 100]) */
  expectedLimits?: number[]
  /** The Playwright page object */
  page: Page
  /** Scope the selector to a specific element (e.g., a drawer locator) */
  scope?: Page | Locator
}): Promise<void> => {
  const scopeToUse = scope ?? page
  const perPageButton = scopeToUse.locator('.per-page button')

  await perPageButton.waitFor({ state: 'visible' })
  await perPageButton.click({ force: true })

  const popupOptions = scopeToUse.locator('.popup__content .popup-button-list__button')

  await expect
    .poll(async () => await popupOptions.count(), { timeout: POLL_TOPASS_TIMEOUT })
    .toBe(expectedLimits.length)

  for (let i = 0; i < expectedLimits.length; i++) {
    await expect(popupOptions.nth(i)).toContainText(String(expectedLimits[i]))
  }

  // Close the popup by pressing Escape
  await page.keyboard.press('Escape')
}
