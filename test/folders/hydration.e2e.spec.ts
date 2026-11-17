import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { formatAdminURL } from 'payload/shared'
import { fileURLToPath } from 'url'

import { openFolderDrawer } from '../__helpers/e2e/folders/openFolderDrawer.js'
import { ensureCompilationIsDone, getRoutes } from '../__helpers/e2e/helpers.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * How long the client chunks are held back. Long enough that a click issued
 * against the server HTML lands before React attaches its handler.
 */
const CHUNK_DELAY = 6000

test.describe('Folders slow hydration', () => {
  let page: Page
  let serverURL: string
  let adminRoute: string

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const initResult = await initPayloadE2ENoConfig({ dirname })
    serverURL = initResult.serverURL

    const {
      routes: { admin: adminRouteFromConfig },
    } = getRoutes({})
    adminRoute = adminRouteFromConfig

    const context = await browser.newContext()
    page = await context.newPage()
    await ensureCompilationIsDone({ page, serverURL })
  })

  /**
   * "Create folder" is a `div` carrying a React `onClick`, and Next.js sends it in
   * the server HTML. A click issued before hydration is therefore lost, and the
   * drawer never opens. Holding back the client chunks reproduces that window,
   * which on CI opens up whenever the build cache misses and the dev server has
   * to compile from cold.
   */
  test('should open the create folder drawer when the client chunks load late', async () => {
    await page.route(/_next\/static\/chunks\/.*\.js(\?.*)?$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, CHUNK_DELAY))
      await route.continue()
    })

    await page.goto(formatAdminURL({ adminRoute, path: '/browse-by-folder', serverURL }), {
      waitUntil: 'commit',
    })

    const createButton = page
      .locator('.list-header__title-and-actions .create-new-doc-in-folder__button')
      .filter({ hasText: 'Create folder' })

    await expect(createButton).toBeVisible()

    const drawer = await openFolderDrawer({
      openDrawer: () => createButton.click(),
      page,
    })

    await expect(drawer.locator('#field-folderType')).toBeVisible()
  })
})
