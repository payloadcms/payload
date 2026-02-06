import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../__helpers/shared/sdk/index.js'
import type { Config } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
  waitForFormReady,
} from '../../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { checkFocusIndicators } from '../../../__helpers/e2e/checkFocusIndicators.js'
import { runAxeScan } from '../../../__helpers/e2e/runAxeScan.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { RESTClient } from '../../../__helpers/shared/rest.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { selectFieldsSlug } from '../../slugs.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let client: RESTClient
let page: Page
let serverURL: string
let url: AdminUrlUtil

describe('Select', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))

    url = new AdminUrlUtil(serverURL, selectFieldsSlug)

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

  test('should use i18n option labels', async () => {
    await page.goto(url.create)
    await waitForFormReady(page)

    const field = page.locator('#field-selectI18n')
    await field.click({ delay: 100 })
    const options = page.locator('.rs__option')
    // Select an option
    await options.locator('text=One').click()

    await saveDocAndAssert(page)
    await expect(field.locator('.rs__value-container')).toContainText('One')
  })

  test('should show custom JSX option label in edit', async () => {
    await page.goto(url.create)

    const svgLocator = page.locator('#field-selectWithJsxLabelOption svg#payload-logo')

    await expect(svgLocator).toBeVisible()
  })

  test('should show custom JSX option label in list', async () => {
    await page.goto(url.list)

    const columnsButton = page.locator('button:has-text("Columns")')

    await columnsButton.click()

    await page.locator('text=Select with JSX label option').click()

    await expect(page.locator('.cell-selectWithJsxLabelOption svg#payload-logo')).toBeVisible()
  })

  test('should reduce options', async () => {
    await page.goto(url.create)
    await waitForFormReady(page)

    const field = page.locator('#field-selectWithFilteredOptions')
    await field.click({ delay: 100 })
    const options = page.locator('.rs__option')
    await expect(options.locator('text=One')).toBeVisible()

    // click the field again to close the options
    await field.click({ delay: 100 })

    await page.locator('#field-disallowOption1').click()
    await field.click({ delay: 100 })
    await expect(options.locator('text=One')).toBeHidden()
  })

  test('should retain search when reducing options', async () => {
    await page.goto(url.create)
    await waitForFormReady(page)
    const field = page.locator('#field-selectWithFilteredOptions')
    await field.click({ delay: 100 })
    const options = page.locator('.rs__option')
    await expect(options.locator('text=One')).toBeVisible()
    await expect(options.locator('text=Two')).toBeVisible()
    await field.locator('input').fill('On')
    await expect(options.locator('text=One')).toBeVisible()
    await expect(options.locator('text=Two')).toBeHidden()
  })

  describe('A11y', () => {
    test.fixme('Create view should have no accessibility violations', async ({}, testInfo) => {
      await page.goto(url.create)
      await page.locator('#field-select').waitFor()

      const scanResults = await runAxeScan({
        page,
        testInfo,
        include: ['.collection-edit__main'],
        exclude: ['.field-description'], // known issue - reported elsewhere @todo: remove this once fixed - see report https://github.com/payloadcms/payload/discussions/14489
      })

      expect(scanResults.violations.length).toBe(0)
    })

    test.fixme('Edit view should have no accessibility violations', async ({}, testInfo) => {
      await page.goto(url.list)
      const firstItem = page.locator('.cell-id a').nth(0)
      await firstItem.click()

      await page.locator('#field-select').waitFor()

      const scanResults = await runAxeScan({
        page,
        testInfo,
        include: ['.collection-edit__main'],
        exclude: ['.field-description'], // known issue - reported elsewhere @todo: remove this once fixed - see report https://github.com/payloadcms/payload/discussions/14489
      })

      expect(scanResults.violations.length).toBe(0)
    })

    test.fixme('Select fields have focus indicators', async ({}, testInfo) => {
      await page.goto(url.create)
      await page.locator('#field-select').waitFor()

      const scanResults = await checkFocusIndicators({
        page,
        testInfo,
        selector: '.collection-edit__main',
      })

      expect(scanResults.totalFocusableElements).toBeGreaterThan(0)
      expect(scanResults.elementsWithoutIndicators).toBe(0)
    })
  })
})
