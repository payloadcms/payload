import type { Page } from '@playwright/test'

import type { AdminUrlUtil } from '../../helpers/adminUrlUtil.js'

export async function goToListDoc({
  page,
  cellClass,
  textToMatch,
  urlUtil,
}: {
  cellClass: `.cell-${string}`
  page: Page
  textToMatch: string
  urlUtil: AdminUrlUtil
}) {
  await page.goto(urlUtil.list)
  const row = page
    .locator(`.collection-list .table tr`)
    .filter({
      has: page.locator(`${cellClass}`, { hasText: textToMatch }),
    })
    .first()
  const cellLink = row.locator(`td a`).first()
  const linkURL = await cellLink.getAttribute('href')
  await page.goto(`${urlUtil.serverURL}${linkURL}`)
  await page.waitForLoadState('networkidle')
}
