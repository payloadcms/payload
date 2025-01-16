import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { openListFilters } from 'helpers/e2e/openListFilters.js'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'
import type { Config } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { RESTClient } from '../../../helpers/rest.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { numberDoc } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let client: RESTClient
let page: Page
let serverURL: string
// If we want to make this run in parallel: test.describe.configure({ mode: 'parallel' })
let url: AdminUrlUtil

describe('Number', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))
    url = new AdminUrlUtil(serverURL, 'number-fields')

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

  test('should display field in list view', async () => {
    await page.goto(url.list)
    const textCell = page.locator('.row-1 .cell-number')
    await expect(textCell).toHaveText(String(numberDoc.number))
  })

  test('should filter Number fields in the collection view - greaterThanOrEqual', async () => {
    await page.goto(url.list)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(3)
    await openListFilters(page, {})
    await page.locator('.where-builder__add-first-filter').click()
    const initialField = page.locator('.condition__field')
    const operatorField = page.locator('.condition__operator')
    const valueField = page.locator('.condition__value >> input')
    await initialField.click()
    const initialFieldOptions = initialField.locator('.rs__option')
    await initialFieldOptions.locator('text=number').first().click()
    await expect(initialField.locator('.rs__single-value')).toContainText('Number')
    await operatorField.click()
    const operatorOptions = operatorField.locator('.rs__option')
    await operatorOptions.last().click()
    await expect(operatorField.locator('.rs__single-value')).toContainText(
      'is greater than or equal to',
    )

    // enter value of 3
    await valueField.fill('3')
    await expect(valueField).toHaveValue('3')
    await wait(300)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(2)
  })

  test('should create', async () => {
    const input = 5
    await page.goto(url.create)
    const field = page.locator('#field-number')
    await field.fill(String(input))
    await saveDocAndAssert(page)
    await expect(field).toHaveValue(String(input))
  })

  test('should create hasMany', async () => {
    const input = 5
    await page.goto(url.create)
    const field = page.locator('.field-hasMany')
    await field.click()
    await page.keyboard.type(String(input))
    await page.keyboard.press('Enter')
    await saveDocAndAssert(page)
    await expect(field.locator('.rs__value-container')).toContainText(String(input))
  })

  test('should bypass min rows validation when no rows present and field is not required', async () => {
    await page.goto(url.create)
    await saveDocAndAssert(page)
    expect(true).toBe(true) // the above fn contains the assertion
  })

  test('should fail min rows validation when rows are present', async () => {
    const input = 5
    await page.goto(url.create)
    await page.locator('.field-withMinRows').click()
    await page.keyboard.type(String(input))
    await page.keyboard.press('Enter')
    await page.click('#action-save', { delay: 100 })
    await expect(page.locator('.payload-toast-container')).toContainText(
      'The following field is invalid: withMinRows',
    )
  })

  test('should keep data removed on save if deleted', async () => {
    const input = 1
    await page.goto(url.create)
    const field = page.locator('#field-number')
    await field.fill(String(input))
    await saveDocAndAssert(page)
    await expect(field).toHaveValue(String(input))
    await field.fill('')
    await saveDocAndAssert(page)
    await expect(field).toHaveValue('')
  })
})
