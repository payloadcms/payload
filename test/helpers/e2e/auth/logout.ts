import type { Page } from 'playwright'

import { getRoutes } from 'helpers.js'
import { formatAdminURL } from 'payload/shared'
import { POLL_TOPASS_TIMEOUT } from 'playwright.config.js'
import { expect } from 'playwright/test'

import { openNav } from '../toggleNav.js'

export const logout = async (page: Page, serverURL: string) => {
  const {
    routes: { admin: adminRoute },
  } = getRoutes({})
  await page.goto(formatAdminURL({ adminRoute, path: '/logout', serverURL }))

  await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('/admin/login')

  await expect(page.locator('.login')).toBeVisible()
}

export const logoutViaNav = async (page: Page) => {
  const { nav } = await openNav(page)
  const logoutAnchor = nav.locator('a[title="Log out"]')
  await expect(logoutAnchor).toBeVisible()
  await logoutAnchor.click()

  await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('/admin/login')

  await expect(page.locator('.login')).toBeVisible()
}
