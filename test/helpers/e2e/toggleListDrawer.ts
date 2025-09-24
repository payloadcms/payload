import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

/**
 * Closes the list drawer by clicking the close button in the header.
 */
export const closeListDrawer = async ({
  page,
  drawerSelector = '[id^=list-drawer_1_]',
}: {
  drawerSelector?: string
  page: Page
}): Promise<any> => {
  await page.locator('[id^=list-drawer_1_] .list-drawer__header .close-modal-button').click()
  await expect(page.locator(drawerSelector)).not.toBeVisible()
}
