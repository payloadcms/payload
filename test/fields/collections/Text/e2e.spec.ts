import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'
import type { Config } from '../../payload-types.js'

import {
  ensureAutoLoginAndCompilationIsDone,
  exactText,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { RESTClient } from '../../../helpers/rest.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { textFieldsSlug } from '../../slugs.js'
import { textDoc } from './shared.js'

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

describe('Text', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig({
      dirname,
      // prebuild,
    }))
    url = new AdminUrlUtil(serverURL, textFieldsSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await reInitializeDB({
      serverURL,
      snapshotKey: 'fieldsTextTest',
      uploadsDir: path.resolve(dirname, './collections/Upload/uploads'),
    })
    await ensureAutoLoginAndCompilationIsDone({ page, serverURL })
  })
  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'fieldsTextTest',
      uploadsDir: path.resolve(dirname, './collections/Upload/uploads'),
    })

    if (client) {
      await client.logout()
    }
    client = new RESTClient(null, { defaultSlug: 'users', serverURL })
    await client.login()

    await ensureAutoLoginAndCompilationIsDone({ page, serverURL })
  })

  test('should display field in list view', async () => {
    await page.goto(url.list)
    const textCell = page.locator('.row-1 .cell-text')
    await expect(textCell).toHaveText(textDoc.text)
  })

  test('should hide field in column selector when admin.disableListColumn', async () => {
    await page.goto(url.list)
    await page.locator('.list-controls__toggle-columns').click()

    await expect(page.locator('.column-selector')).toBeVisible()

    // Check if "Disable List Column Text" is not present in the column options
    await expect(
      page.locator(`.column-selector .column-selector__column`, {
        hasText: exactText('Disable List Column Text'),
      }),
    ).toBeHidden()
  })

  test('should show field in filter when admin.disableListColumn is true', async () => {
    await page.goto(url.list)
    await page.locator('.list-controls__toggle-where').click()
    await page.locator('.where-builder__add-first-filter').click()

    const initialField = page.locator('.condition__field')
    await initialField.click()

    await expect(
      initialField.locator(`.rs__menu-list:has-text("Disable List Column Text")`),
    ).toBeVisible()
  })

  test('should display field in list view column selector if admin.disableListColumn is false and admin.disableListFilter is true', async () => {
    await page.goto(url.list)
    await page.locator('.list-controls__toggle-columns').click()

    await expect(page.locator('.column-selector')).toBeVisible()

    // Check if "Disable List Filter Text" is present in the column options
    await expect(
      page.locator(`.column-selector .column-selector__column`, {
        hasText: exactText('Disable List Filter Text'),
      }),
    ).toBeVisible()
  })

  test('should hide field in filter when admin.disableListFilter is true', async () => {
    await page.goto(url.list)
    await page.locator('.list-controls__toggle-where').click()
    await page.locator('.where-builder__add-first-filter').click()

    const initialField = page.locator('.condition__field')
    await initialField.click()

    await expect(
      initialField.locator(`.rs__option :has-text("Disable List Filter Text")`),
    ).toBeHidden()
  })

  test('should display i18n label in cells when missing field data', async () => {
    await page.goto(url.list)
    const textCell = page.locator('.row-1 .cell-i18nText')
    await expect(textCell).toHaveText('<No Text en>')
  })

  test('should show i18n label', async () => {
    await page.goto(url.create)

    await expect(page.locator('label[for="field-i18nText"]')).toHaveText('Text en')
  })

  test('should show i18n placeholder', async () => {
    await page.goto(url.create)
    await expect(page.locator('#field-i18nText')).toHaveAttribute('placeholder', 'en placeholder')
  })

  test('should show i18n descriptions', async () => {
    await page.goto(url.create)
    const description = page.locator('.field-description-i18nText')
    await expect(description).toHaveText('en description')
  })

  test('should render custom label', async () => {
    await page.goto(url.create)
    const label = page.locator('label.custom-label[for="field-customLabel"]')
    await expect(label).toHaveText('#label')
  })

  test('should render custom error', async () => {
    await page.goto(url.create)
    const input = page.locator('input[id="field-customError"]')
    await input.fill('ab')
    await expect(input).toHaveValue('ab')
    const error = page.locator('.custom-error:near(input[id="field-customError"])')
    const submit = page.locator('button[type="button"][id="action-save"]')
    await submit.click()
    await expect(error).toHaveText('#custom-error')
  })

  test('should render beforeInput and afterInput', async () => {
    await page.goto(url.create)
    const input = page.locator('input[id="field-beforeAndAfterInput"]')

    const prevSibling = await input.evaluateHandle((el) => {
      return el.previousElementSibling
    })
    const prevSiblingText = await page.evaluate((el) => el.textContent, prevSibling)
    expect(prevSiblingText).toEqual('#before-input')

    const nextSibling = await input.evaluateHandle((el) => {
      return el.nextElementSibling
    })
    const nextSiblingText = await page.evaluate((el) => el.textContent, nextSibling)
    expect(nextSiblingText).toEqual('#after-input')
  })

  test('should create hasMany with multiple texts', async () => {
    const input = 'five'
    const furtherInput = 'six'

    await page.goto(url.create)
    const requiredField = page.locator('#field-text')
    const field = page.locator('.field-hasMany')

    await requiredField.fill(String(input))
    await field.click()
    await page.keyboard.type(input)
    await page.keyboard.press('Enter')
    await page.keyboard.type(furtherInput)
    await page.keyboard.press('Enter')
    await saveDocAndAssert(page)
    await expect(field.locator('.rs__value-container')).toContainText(input)
    await expect(field.locator('.rs__value-container')).toContainText(furtherInput)
  })
})
