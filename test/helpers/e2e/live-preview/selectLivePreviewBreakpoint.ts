import type { Page } from 'playwright'

import { POLL_TOPASS_TIMEOUT } from 'playwright.config.js'
import { expect } from 'playwright/test'

export const selectLivePreviewBreakpoint = async (page: Page, breakpointLabel: string) => {
  const breakpointSelector = page.locator(
    '.live-preview-toolbar-controls__breakpoint button.popup-button',
  )

  await expect(() => expect(breakpointSelector).toBeTruthy()).toPass({
    timeout: POLL_TOPASS_TIMEOUT,
  })

  await breakpointSelector.first().click()

  await page
    .locator(`.live-preview-toolbar-controls__breakpoint button.popup-button-list__button`)
    .filter({ hasText: breakpointLabel })
    .click()

  await expect(breakpointSelector).toContainText(breakpointLabel)

  const option = page.locator(
    '.live-preview-toolbar-controls__breakpoint button.popup-button-list__button--selected',
  )

  await expect(option).toHaveText(breakpointLabel)
}
