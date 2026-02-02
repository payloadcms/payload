import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { checkFocusIndicators } from 'helpers/e2e/checkFocusIndicators.js'
import { addListFilter } from 'helpers/e2e/filters/index.js'
import { runAxeScan } from 'helpers/e2e/runAxeScan.js'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../__helpers/shared/sdk/index.js'
import type { Config } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { assertToastErrors } from '../../../__helpers/shared/assertToastErrors.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { RESTClient } from '../../../__helpers/shared/rest.js'
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
    client = new RESTClient({ defaultSlug: 'users', serverURL })
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

    await addListFilter({
      page,
      fieldLabel: 'Number',
      operatorLabel: 'is greater than or equal to',
      value: '3',
    })

    await wait(300)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(2)
  })

  test('should filter Number field hasMany: false in the collection view - in', async () => {
    await page.goto(url.list)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(3)

    await addListFilter({
      page,
      fieldLabel: 'Number',
      operatorLabel: 'is in',
      value: '2',
    })

    await wait(300)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(1)
  })

  test('should filter Number field hasMany: false in the collection view - is not in', async () => {
    await page.goto(url.list)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(3)

    await addListFilter({
      page,
      fieldLabel: 'Number',
      operatorLabel: 'is not in',
      value: '2',
    })

    await wait(300)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(2)
  })

  test('should filter Number field hasMany: true in the collection view - in', async () => {
    await page.goto(url.list)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(3)

    await addListFilter({
      page,
      fieldLabel: 'Has Many',
      operatorLabel: 'is in',
      value: '5',
    })

    await wait(300)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(1)
  })

  test('should filter Number field hasMany: true in the collection view - is not in', async () => {
    await page.goto(url.list)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(3)

    await addListFilter({
      page,
      fieldLabel: 'Has Many',
      operatorLabel: 'is not in',
      value: '6',
    })

    await wait(300)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(3)
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
  })

  test('should fail min rows validation when rows are present', async () => {
    const input = 5
    await page.goto(url.create)
    await page.locator('.field-withMinRows').click()
    await page.keyboard.type(String(input))
    await page.keyboard.press('Enter')
    await page.click('#action-save', { delay: 100 })
    await assertToastErrors({
      page,
      errors: ['With Min Rows'],
    })
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

  describe('A11y', () => {
    // This test should pass once select element issues are resolved @todo: re-enable this test
    test.fixme('Edit view should have no accessibility violations', async ({}, testInfo) => {
      await page.goto(url.create)
      await page.locator('#field-number').waitFor()

      const scanResults = await runAxeScan({
        page,
        testInfo,
        include: ['.document-fields__main'],
        exclude: ['.field-description'], // known issue - reported elsewhere @todo: remove this once fixed - see report https://github.com/payloadcms/payload/discussions/14489
      })

      expect(scanResults.violations.length).toBe(0)
    })

    // Equally, test is caught up on select issues @todo: re-enable this test when possible
    test.fixme('Number inputs have focus indicators', async ({}, testInfo) => {
      await page.goto(url.create)
      await page.locator('#field-number').waitFor()

      const scanResults = await checkFocusIndicators({
        page,
        testInfo,
        selector: '.document-fields__main',
      })

      expect(scanResults.totalFocusableElements).toBeGreaterThan(0)
      expect(scanResults.elementsWithoutIndicators).toBe(0)
    })
  })
})
