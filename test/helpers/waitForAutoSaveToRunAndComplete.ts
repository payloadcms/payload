import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { wait } from 'payload/shared'
import { POLL_TOPASS_TIMEOUT } from 'playwright.config.js'

export async function waitForAutoSaveToRunAndComplete(page: Page) {
  await expect(async () => {
    await expect(page.locator('.autosave:has-text("Saving...")')).toBeVisible()
  }).toPass({
    timeout: POLL_TOPASS_TIMEOUT,
  })

  await wait(500)

  await expect(async () => {
    await expect(
      page.locator('.autosave:has-text("Last saved less than a minute ago")'),
    ).toBeVisible()
  }).toPass({
    timeout: POLL_TOPASS_TIMEOUT,
  })
}
