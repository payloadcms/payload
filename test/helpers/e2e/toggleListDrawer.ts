import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

export const closeListDrawer = async ({
  page,
  drawerSelector = '[id^=list-drawer_1_]',
}: {
  drawerSelector?: string
  page: Page
}): Promise<any> => {
  await page.locator('[id^=list-drawer_1_] .list-drawer__header-close').click()
  await expect(page.locator(drawerSelector)).not.toBeVisible()
}
