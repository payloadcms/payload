import type { Page } from '@playwright/test'
import type { PayloadTestSDK } from 'helpers/sdk/index.js'

import { expect, test } from '@playwright/test'
import { openGroupBy } from 'helpers/e2e/toggleGroupBy.js'
import { reInitializeDB } from 'helpers/reInitializeDB.js'
import * as path from 'path'
import { fileURLToPath } from 'url'

import type { Config } from './payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const { beforeEach } = test

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Group By', () => {
  let page: Page
  let url: AdminUrlUtil
  let serverURL: string
  let payload: PayloadTestSDK<Config>

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    url = new AdminUrlUtil(serverURL, 'posts')

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  beforeEach(async () => {
    // await throttleTest({
    //   page,
    //   context,
    //   delay: 'Fast 4G',
    // })

    await reInitializeDB({
      serverURL,
      snapshotKey: 'groupByTests',
    })

    await ensureCompilationIsDone({ page, serverURL })
  })

  test('should display group-by button', async () => {
    await page.goto(url.list)
    await expect(page.locator('#toggle-group-by')).toBeVisible()
  })

  test('should open group-by drawer', async () => {
    await page.goto(url.list)
    await openGroupBy(page, {})
    await expect(page.locator('#list-controls-group-by.rah-static--height-auto')).toBeVisible()
  })

  test('should display field options in group-by drawer', async () => {
    await page.goto(url.list)
    const { filterContainer } = await openGroupBy(page, {})
    const field = filterContainer.locator('#group-by--field-select')
    await field.click()

    await expect(field.locator(`.rs__menu-list:has-text("Title")`)).toBeVisible()
  })
})
