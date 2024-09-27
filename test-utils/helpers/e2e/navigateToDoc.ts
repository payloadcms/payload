import type { Page } from '@playwright/test'
import type { AdminUrlUtil } from 'helpers/adminUrlUtil.js'

import { navigateToListCellLink } from './navigateToFirstCellLink.js'

export const navigateToDoc = async (page: Page, urlUtil: AdminUrlUtil) => {
  await page.goto(urlUtil.list)
  await page.waitForURL(urlUtil.list)
  await navigateToListCellLink(page)
}
