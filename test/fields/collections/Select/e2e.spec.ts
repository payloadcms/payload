import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../__helpers/shared/sdk/index.js'
import type { Config } from '../../payload-types.js'

import { checkFocusIndicators } from '../../../__helpers/e2e/checkFocusIndicators.js'
import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
  waitForFormReady,
} from '../../../__helpers/e2e/helpers.js'
import { runAxeScan } from '../../../__helpers/e2e/runAxeScan.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { reInitializeDB } from '../../../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
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

  test('should allow reordering hasMany select values with drag and drop', async () => {
    await page.goto(url.create)
    await waitForFormReady(page)

    const field = page.locator('#field-selectHasMany')

    // Select multiple options in order: one, two, three
    await field.click({ delay: 100 })
    await page.locator('.rs__option:has-text("Value One")').click()

    await field.click({ delay: 100 })
    await page.locator('.rs__option:has-text("Value Two")').click()

    await field.click({ delay: 100 })
    await page.locator('.rs__option:has-text("Value Three")').click()

    // Verify initial order
    const valueContainer = field.locator('.rs__value-container')
    const pills = valueContainer.locator('.rs__multi-value')
    await expect(pills).toHaveCount(3)
    await expect(pills.nth(0)).toContainText('Value One')
    await expect(pills.nth(1)).toContainText('Value Two')
    await expect(pills.nth(2)).toContainText('Value Three')

    // Get bounding boxes for drag operation
    const firstPill = pills.nth(0)
    const thirdPill = pills.nth(2)

    const firstBox = (await firstPill.boundingBox())!
    const thirdBox = (await thirdPill.boundingBox())!

    // Drag first pill to the position of the third pill
    await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(thirdBox.x + thirdBox.width / 2, thirdBox.y + thirdBox.height / 2, {
      steps: 10,
    })
    await page.mouse.up()

    // Verify the order changed - first item should now be last
    const updatedPills = valueContainer.locator('.rs__multi-value')
    await expect(updatedPills.nth(0)).toContainText('Value Two')
    await expect(updatedPills.nth(1)).toContainText('Value Three')
    await expect(updatedPills.nth(2)).toContainText('Value One')

    // Save and verify the order is persisted
    await saveDocAndAssert(page)

    const currentUrl = page.url()
    const id = currentUrl.split('/').pop()!

    // Reload the page to verify order persists
    await page.goto(url.edit(id))
    await waitForFormReady(page)

    const reloadedPills = page.locator('#field-selectHasMany .rs__value-container .rs__multi-value')
    await expect(reloadedPills.nth(0)).toContainText('Value Two')
    await expect(reloadedPills.nth(1)).toContainText('Value Three')
    await expect(reloadedPills.nth(2)).toContainText('Value One')
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
