import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { navigateToDoc } from 'helpers/e2e/navigateToDoc.js'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'
import type { Config } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
  switchTab,
} from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { RESTClient } from '../../../helpers/rest.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { tabsFieldsSlug } from '../../slugs.js'

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

describe('Tabs', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))
    url = new AdminUrlUtil(serverURL, tabsFieldsSlug)

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

  test('should fill and retain a new value within a tab while switching tabs', async () => {
    const textInRowValue = 'hello'
    const numberInRowValue = '23'
    const jsonValue = '{ "foo": "bar"}'

    await page.goto(url.create)

    await switchTab(page, '.tabs-field__tab-button:has-text("Tab with Row")')
    await page.locator('#field-textInRow').fill(textInRowValue)
    await page.locator('#field-numberInRow').fill(numberInRowValue)
    await page.locator('.json-field .inputarea').fill(jsonValue)

    await wait(300)

    await switchTab(page, '.tabs-field__tab-button:has-text("Tab with Array")')
    await switchTab(page, '.tabs-field__tab-button:has-text("Tab with Row")')

    await expect(page.locator('#field-textInRow')).toHaveValue(textInRowValue)
    await expect(page.locator('#field-numberInRow')).toHaveValue(numberInRowValue)
    await expect(page.locator('.json-field .lines-content')).toContainText(jsonValue)
  })

  test('should retain updated values within tabs while switching between tabs', async () => {
    const textInRowValue = 'new value'
    const jsonValue = '{ "new": "value"}'
    await navigateToDoc(page, url)

    // Go to Row tab, update the value
    await switchTab(page, '.tabs-field__tab-button:has-text("Tab with Row")')

    await page.locator('#field-textInRow').fill(textInRowValue)
    await page.locator('.json-field .inputarea').fill(jsonValue)

    await wait(500)

    // Go to Array tab, then back to Row. Make sure new value is still there
    await switchTab(page, '.tabs-field__tab-button:has-text("Tab with Array")')
    await switchTab(page, '.tabs-field__tab-button:has-text("Tab with Row")')

    await expect(page.locator('#field-textInRow')).toHaveValue(textInRowValue)
    await expect(page.locator('.json-field .lines-content')).toContainText(jsonValue)

    // Go to array tab, save the doc
    await switchTab(page, '.tabs-field__tab-button:has-text("Tab with Array")')
    await saveDocAndAssert(page)

    // Go back to row tab, make sure the new value is still present
    await switchTab(page, '.tabs-field__tab-button:has-text("Tab with Row")')
    await expect(page.locator('#field-textInRow')).toHaveValue(textInRowValue)
  })

  test('should render array data within unnamed tabs', async () => {
    await navigateToDoc(page, url)
    await switchTab(page, '.tabs-field__tab-button:has-text("Tab with Array")')
    await expect(page.locator('#field-array__0__text')).toHaveValue("Hello, I'm the first row")
  })

  test('should render array data within named tabs', async () => {
    await navigateToDoc(page, url)
    await switchTab(page, '.tabs-field__tab-button:has-text("Tab with Name")')
    await expect(page.locator('#field-tab__array__0__text')).toHaveValue(
      "Hello, I'm the first row, in a named tab",
    )
  })

  test('should render conditional tab when checkbox is toggled', async () => {
    await navigateToDoc(page, url)

    const conditionalTabSelector = '.tabs-field__tab-button:text-is("Conditional Tab")'
    const button = page.locator(conditionalTabSelector)
    await expect(
      async () => await expect(page.locator(conditionalTabSelector)).toHaveClass(/--hidden/),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    const checkboxSelector = `input#field-conditionalTabVisible`
    await page.locator(checkboxSelector).check()
    await expect(page.locator(checkboxSelector)).toBeChecked()

    await expect(
      async () => await expect(page.locator(conditionalTabSelector)).not.toHaveClass(/--hidden/),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await switchTab(page, conditionalTabSelector)

    await expect(
      page.locator('label[for="field-conditionalTab__conditionalTabField"]'),
    ).toHaveCount(1)
  })

  test('should hide nested conditional tab when checkbox is toggled', async () => {
    await navigateToDoc(page, url)

    // Show the conditional tab
    const conditionalTabSelector = '.tabs-field__tab-button:text-is("Conditional Tab")'
    const checkboxSelector = `input#field-conditionalTabVisible`
    await page.locator(checkboxSelector).check()
    await switchTab(page, conditionalTabSelector)

    // Now assert on the nested conditional tab
    const nestedConditionalTabSelector = '.tabs-field__tab-button:text-is("Nested Conditional Tab")'

    await expect(
      async () =>
        await expect(page.locator(nestedConditionalTabSelector)).not.toHaveClass(/--hidden/),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    const nestedCheckboxSelector = `input#field-conditionalTab__nestedConditionalTabVisible`
    await page.locator(nestedCheckboxSelector).uncheck()

    await expect(
      async () => await expect(page.locator(nestedConditionalTabSelector)).toHaveClass(/--hidden/),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  })

  test('should save preferences for tab order', async () => {
    await page.goto(url.list)

    const firstItem = page.locator('.cell-id a').nth(0)
    const href = await firstItem.getAttribute('href')
    await firstItem.click()

    const regex = new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

    await page.waitForURL(regex)

    await page.locator('.tabs-field__tabs button:nth-child(2)').nth(0).click()

    await page.reload()

    const tab2 = page.locator('.tabs-field__tabs button:nth-child(2)').nth(0)

    await expect(async () => await expect(tab2).toHaveClass(/--active/)).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  })
})
