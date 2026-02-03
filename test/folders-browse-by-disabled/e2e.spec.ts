import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { reInitializeDB } from 'helpers/reInitializeDB.js'
import * as path from 'path'
import { formatAdminURL } from 'payload/shared'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, getRoutes, initPageConsoleErrorCatch } from '../helpers.js'
import { initPayloadE2ENoConfig } from '@tools/test-utils/e2e'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Browse By Folders Disabled', () => {
  let page: Page
  let serverURL: string
  let adminRoute: string

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { serverURL: serverFromInit } = await initPayloadE2ENoConfig({ dirname })
    serverURL = serverFromInit

    const {
      routes: { admin: adminRouteFromConfig },
    } = getRoutes({})
    adminRoute = adminRouteFromConfig

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  test.beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'BrowseByFoldersDisabledTest',
    })
  })

  test('should not show the browse-by-folder button in the nav', async () => {
    await page.goto(formatAdminURL({ adminRoute, path: '', serverURL }))
    await page.locator('#nav-toggler button.nav-toggler').click()
    await expect(page.locator('#nav-toggler button.nav-toggler--is-open')).toBeVisible()
    await expect(page.locator('.browse-by-folder-button')).toBeHidden()
  })
})
