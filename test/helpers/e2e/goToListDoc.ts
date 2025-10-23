import type { Page } from '@playwright/test'

import type { AdminUrlUtil } from '../../helpers/adminUrlUtil.js'

import { getRowByCellValueAndAssert } from './getRowByCellValueAndAssert.js'

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
  const row = await getRowByCellValueAndAssert({ page, textToMatch, cellClass })
  const cellLink = row.locator(`td a`).first()
  const linkURL = await cellLink.getAttribute('href')
  await page.goto(`${urlUtil.serverURL}${linkURL}`)
  await page.waitForLoadState('networkidle')
}
