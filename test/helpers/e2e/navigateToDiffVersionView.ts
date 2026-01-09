import type { Page } from 'playwright'

import { expect } from '@playwright/test'
import { formatAdminURL } from 'payload/shared'

import { goToFirstCell } from './navigateToDoc.js'

export async function navigateToDiffVersionView({
  adminRoute = '/admin',
  serverURL,
  page,
  collectionSlug,
  docID,
  versionID,
}: {
  adminRoute?: string
  collectionSlug: string
  docID: string
  page: Page
  serverURL: string
  /**
   * If not provided, will attempt to navigate to the latest version's diff view
   */
  versionID?: string
}) {
  if (versionID) {
    const versionURL = formatAdminURL({
      adminRoute,
      path: `/collections/${collectionSlug}/${docID}/versions/${versionID}`,
      serverURL,
    })

    await page.goto(versionURL)
  } else {
    const versionList = formatAdminURL({
      adminRoute,
      path: `/collections/${collectionSlug}/${docID}/versions`,
      serverURL,
    })

    await page.goto(versionList)

    await goToFirstCell(page, serverURL)
  }

  await expect(page.locator('.render-field-diffs').first()).toBeVisible()
}
