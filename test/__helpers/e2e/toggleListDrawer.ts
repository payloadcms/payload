import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { POLL_TOPASS_TIMEOUT } from '../../playwright.config.js'

export const openListDrawer = async ({
  page,
  drawer = page.locator('.list-drawer.drawer--is-open'),
  openDrawer,
}: {
  drawer?: Locator
  openDrawer: () => Promise<void>
  page: Page
}): Promise<Locator> => {
  await expect(async () => {
    if (await drawer.isHidden()) {
      await openDrawer()
    }
    await expect(drawer).toBeVisible()
  }).toPass({ timeout: POLL_TOPASS_TIMEOUT })

  await expect(drawer).not.toContainText('Loading')
  await expect(drawer.locator('.drawer__content')).toBeVisible()

  return drawer
}

/**
 * Closes the list drawer by clicking the close button in the header.
 */
export const closeListDrawer = async ({
  drawerSelector = '[id^=list-drawer_1_]',
  page,
}: {
  drawerSelector?: string
  page: Page
}): Promise<void> => {
  await page.locator('[id^=list-drawer_1_] .list-drawer__header .close-modal-button').click()
  await expect(page.locator(drawerSelector)).not.toBeVisible()
}
