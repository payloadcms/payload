import type { Page } from '@playwright/test'
import type { AdminUrlUtil } from 'helpers/adminUrlUtil.js'

export const navigateToDoc = async (page: Page, urlUtil: AdminUrlUtil) => {
  await page.goto(urlUtil.list)
  const regex = new RegExp(`^${urlUtil.list}(?:\\?.*)?$`)
  await page.waitForURL(regex)
  const cellLink = page.locator(`tbody tr:first-child td a`).first()
  const linkURL = await cellLink.getAttribute('href')
  await page.goto(`${urlUtil.serverURL}${linkURL}`)
  await page.waitForURL(`**${linkURL}`)
}
