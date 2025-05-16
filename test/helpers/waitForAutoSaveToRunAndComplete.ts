import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { wait } from 'payload/shared'
import { POLL_TOPASS_TIMEOUT } from 'playwright.config.js'

export async function waitForAutoSaveToRunAndComplete(
  page: Page,
  expectation: 'error' | 'success' = 'success',
) {
  await expect(async () => {
    await expect(page.locator('.autosave:has-text("Saving...")')).toBeVisible()
  }).toPass({
    timeout: POLL_TOPASS_TIMEOUT,
    intervals: [50],
  })

  await wait(500)

  if (expectation === 'success') {
    await expect(async () => {
      await expect(
        page.locator('.autosave:has-text("Last saved less than a minute ago")'),
      ).toBeVisible()
    }).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  } else {
    await expect(async () => {
      await expect(page.locator('.payload-toast-container .toast-error')).toBeVisible()
    }).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  }
}
