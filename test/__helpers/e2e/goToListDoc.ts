import type { Page } from '@playwright/test'

import { formatAdminURL } from 'payload/shared'

import type { AdminUrlUtil } from '../shared/adminUrlUtil.js'

import { getRowByCellValueAndAssert } from './getRowByCellValueAndAssert.js'

export async function goToListDoc({
  page,
  cellClass,
  textToMatch,
  adminRoute = '/admin',
  urlUtil,
}: {
  adminRoute?: `/${string}`
  cellClass: `.cell-${string}`
  page: Page
  textToMatch: string
  urlUtil: AdminUrlUtil
}) {
  await page.goto(urlUtil.list)
  const row = await getRowByCellValueAndAssert({ page, textToMatch, cellClass })
  const cellLink = row.locator(`td a`).first()
  const linkURL = await cellLink.getAttribute('href')

  // Ensure we always have a full URL
  let fullURL: string
  if (!linkURL) {
    fullURL = formatAdminURL({ adminRoute, serverURL: urlUtil.serverURL, path: '' })
  } else if (linkURL.startsWith('http://') || linkURL.startsWith('https://')) {
    // Already absolute
    fullURL = linkURL
  } else {
    // Relative URL - prepend serverURL
    fullURL = `${urlUtil.serverURL}${linkURL}`
  }

  await page.goto(fullURL)
  await page.waitForLoadState('networkidle')
}
