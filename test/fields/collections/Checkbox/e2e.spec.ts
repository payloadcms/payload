import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { RESTClient } from '../../../helpers/rest.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { checkboxFieldsSlug } from '../../slugs.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let client: RESTClient
let page: Page
let serverURL: string
let url: AdminUrlUtil

describe('Checkboxes', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ serverURL } = await initPayloadE2ENoConfig({
      dirname,
      // prebuild,
    }))

    url = new AdminUrlUtil(serverURL, checkboxFieldsSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'fieldsTest',
      uploadsDir: path.resolve(dirname, './collections/Upload/uploads'),
    })
    if (client) {
      await client.logout()
    }
    client = new RESTClient(null, { defaultSlug: 'users', serverURL })
    await client.login()
    await ensureCompilationIsDone({ page, serverURL })
  })

  test('should not crash on filtering where checkbox is first field', async () => {
    await page.goto(url.list)

    const filterButton = page.locator('.list-controls__toggle-where')
    await filterButton.click()

    const addButton = page.locator('.where-builder__add-first-filter')
    await addButton.click()

    const operator = page.locator('.condition__operator .rs__control')
    await operator.click()

    const equals = page.locator('.rs__option:has-text("equals")')
    await equals.click()

    const value = page.locator('.condition__value')
    await value.click()

    const trueOption = page.locator('.rs__option:has-text("True")')
    await trueOption.click()

    await wait(1000)

    await expect(page.locator('table > tbody > tr')).toHaveCount(1)
  })
})
