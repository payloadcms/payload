import type { Page } from 'playwright'

import { exactText } from 'helpers.js'
import { POLL_TOPASS_TIMEOUT } from 'playwright.config.js'
import { expect } from 'playwright/test'

export const selectLivePreviewZoom = async (page: Page, zoomLabel: string) => {
  const zoomSelector = page.locator('.live-preview-toolbar-controls__zoom button.popup-button')

  await expect(() => expect(zoomSelector).toBeTruthy()).toPass({
    timeout: POLL_TOPASS_TIMEOUT,
  })

  await zoomSelector.first().click()

  const zoomOption = page.locator(
    '.live-preview-toolbar-controls__zoom button.popup-button-list__button',
    {
      hasText: exactText(zoomLabel),
    },
  )

  expect(zoomOption).toBeTruthy()
  await zoomOption.click()

  await expect(zoomSelector).toContainText(zoomLabel)

  const option = page.locator(
    '.live-preview-toolbar-controls__zoom button.popup-button-list__button--selected',
  )

  await expect(option).toHaveText(zoomLabel)
}
