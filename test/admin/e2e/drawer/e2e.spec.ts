import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { Config } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
} from '../../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { postsCollectionSlug } from '../../slugs.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

test.describe('Drawer', () => {
  let page: Page
  let context: BrowserContext
  let postsUrl: AdminUrlUtil
  let serverURL: string

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    postsUrl = new AdminUrlUtil(serverURL, postsCollectionSlug)

    context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  test.afterAll(async () => {
    await context.close()
  })

  test('should inset the drawer from the left edge on mobile viewports', async () => {
    await page.setViewportSize({ width: 480, height: 800 })
    await page.goto(postsUrl.create)

    await page.locator('#field-relationship .relationship-add-new__add-button').click()

    const drawerContent = page.locator('.drawer__content:visible')
    await expect(drawerContent).toBeVisible()

    const box = await drawerContent.boundingBox()
    expect(box?.x).toBe(16)

    await page.setViewportSize({ width: 1280, height: 720 })
  })
})
