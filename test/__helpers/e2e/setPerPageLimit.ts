import type { Page } from '@playwright/test'

import { POLL_TOPASS_TIMEOUT } from '../../playwright.config.js'
import { hideNextDevTools } from './hideNextDevTools.js'

/**
 * Sets the per-page limit in the list view.
 * Clicks the per-page button and selects the specified limit from the popup.
 */
export const setPerPageLimit = async (
  page: Page,
  limit: number,
  options?: { scope?: Page },
): Promise<void> => {
  // Hide Next.js dev tools to prevent pointer event interception
  await hideNextDevTools(page)

  const scope = options?.scope || page
  const perPageButton = scope.locator('.per-page .per-page__base-button')

  await perPageButton.waitFor({ state: 'visible' })
  await perPageButton.click({ force: true })

  // Target the option within the popup with exact text match
  const popupOption = scope.locator('.popup__content .popup-button-list__button', {
    hasText: new RegExp(`^${limit}$`),
  })
  await popupOption.click({ force: true })

  await page.waitForURL(new RegExp(`limit=${limit}`), { timeout: POLL_TOPASS_TIMEOUT })
}
