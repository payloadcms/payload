import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { Config } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
} from '../../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { reInitializeDB } from '../../../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../../../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let page: Page
let serverURL: string
// If we want to make this run in parallel: test.describe.configure({ mode: 'parallel' })

describe('Rich Text', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
    }))

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })
  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'lexicalTest',
      uploadsDir: [path.resolve(dirname, './collections/Upload/uploads')],
    })

    await ensureCompilationIsDone({ page, serverURL })
  })

  describe('cell', () => {
    test('ensure cells are smaller than 300px in height', async () => {
      const url: AdminUrlUtil = new AdminUrlUtil(serverURL, 'rich-text-fields')
      await page.goto(url.list) // Navigate to rich-text list view

      const table = page.locator('.table-wrap .table')
      await expect(table).toBeVisible()

      const lexicalCell = table.locator('.cell-lexicalCustomFields').first()
      await expect(lexicalCell).toBeVisible()

      const lexicalHtmlCell = table.locator('.cell-lexicalCustomFields_html').first()
      await expect(lexicalHtmlCell).toBeVisible()

      const entireRow = table.locator('.row-1').first()

      // Make sure each of the 3 above are no larger than 300px in height:
      await expect
        .poll(async () => (await lexicalCell.boundingBox())?.height, {
          timeout: POLL_TOPASS_TIMEOUT,
        })
        .toBeLessThanOrEqual(300)

      await expect
        .poll(async () => (await lexicalHtmlCell.boundingBox())?.height, {
          timeout: POLL_TOPASS_TIMEOUT,
        })
        .toBeLessThanOrEqual(300)

      await expect
        .poll(async () => (await entireRow.boundingBox())?.height, { timeout: POLL_TOPASS_TIMEOUT })
        .toBeLessThanOrEqual(300)
    })
  })
})
