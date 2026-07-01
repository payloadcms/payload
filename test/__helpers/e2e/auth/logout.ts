import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { formatAdminURL } from 'payload/shared'

import { POLL_TOPASS_TIMEOUT } from '../../../playwright.config.js'
import { getRoutes } from '../helpers.js'

export const logout = async (page: Page, serverURL: string) => {
  const {
    routes: { admin: adminRoute },
  } = getRoutes({})
  await page.goto(formatAdminURL({ adminRoute, path: '/logout', serverURL }))

  await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('/admin/login')

  await expect(page.locator('.login')).toBeVisible()
}

export const logoutViaNav = async (page: Page) => {
  await page.locator('.user-menu__trigger').click()
  const logoutAnchor = page.locator('a[href$="/logout"]')
  await expect(logoutAnchor).toBeVisible()
  await logoutAnchor.click()

  await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('/admin/login')

  await expect(page.locator('.login')).toBeVisible()
}
