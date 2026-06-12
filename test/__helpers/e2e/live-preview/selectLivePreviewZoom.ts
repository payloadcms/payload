import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { POLL_TOPASS_TIMEOUT } from '../../../playwright.config.js'
import { exactText } from '../helpers.js'

export const selectLivePreviewZoom = async (page: Page, zoomLabel: string) => {
  const zoomSelector = page.locator(
    '.live-preview-toolbar-controls__zoom .popup__trigger-wrap button',
  )

  await expect(() => expect(zoomSelector).toBeTruthy()).toPass({
    timeout: POLL_TOPASS_TIMEOUT,
  })

  await zoomSelector.first().click()

  const zoomOption = page.locator('.popup__content button.popup-button-list__button', {
    hasText: exactText(zoomLabel),
  })

  expect(zoomOption).toBeTruthy()
  await zoomOption.click()

  // Button displays as "%{number}" so check for the number portion
  const zoomNumber = zoomLabel.replace('%', '')
  await expect(zoomSelector).toContainText(zoomNumber)
}
