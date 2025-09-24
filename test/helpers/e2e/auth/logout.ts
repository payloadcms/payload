import type { Page } from 'playwright'

import { POLL_TOPASS_TIMEOUT } from 'playwright.config.js'
import { expect } from 'playwright/test'

export const logout = async (page: Page, serverURL: string) => {
  await page.goto(`${serverURL}/admin/logout`)

  await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('/admin/login')

  await expect(page.locator('.login')).toBeVisible()
}
