import type { Page } from '@playwright/test'
import type { AdminUrlUtil } from 'helpers/adminUrlUtil.js'

import { formatAdminURL, wait } from 'payload/shared'

export const goToFirstCell = async (page: Page, urlUtil: AdminUrlUtil) => {
  const cellLink = page.locator(`tbody tr:first-child td a`).first()
  const linkURL = await cellLink.getAttribute('href')
  let path = linkURL.replace('/admin', '')
  if (!path.startsWith('/')) path = `/${path}`
  await page.goto(formatAdminURL({ adminRoute: '/admin', path, serverURL: urlUtil.serverURL }))
  await wait(50)
}

export const navigateToDoc = async (page: Page, urlUtil: AdminUrlUtil) => {
  await page.goto(urlUtil.list)
  // wait for query params to arrive
  const regex = new RegExp(`^${urlUtil.list}(?:\\?.*)?$`)
  await page.waitForURL(regex)
  await goToFirstCell(page, urlUtil)
}

export const navigateToTrashedDoc = async (page: Page, urlUtil: AdminUrlUtil) => {
  await page.goto(urlUtil.trash)
  // wait for query params to arrive
  const regex = new RegExp(`^${urlUtil.trash}(?:\\?.*)?$`)
  await page.waitForURL(regex)
  await goToFirstCell(page, urlUtil)
}
