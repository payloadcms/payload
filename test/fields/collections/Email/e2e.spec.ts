import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { openListFilters } from 'helpers/e2e/openListFilters.js'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'
import type { Config } from '../../payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { RESTClient } from '../../../helpers/rest.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { emailFieldsSlug } from '../../slugs.js'
import { emailDoc } from './shared.js'

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

describe('Email', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))
    url = new AdminUrlUtil(serverURL, emailFieldsSlug)

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
    const emailCell = page.locator('.row-1 .cell-email')
    await expect(emailCell).toHaveText(emailDoc.email)
  })

  test('should have autocomplete', async () => {
    await page.goto(url.create)
    const autoCompleteEmail = page.locator('#field-emailWithAutocomplete')
    await expect(autoCompleteEmail).toHaveAttribute('autocomplete')
  })

  test('should show i18n label', async () => {
    await page.goto(url.create)

    await expect(page.locator('label[for="field-i18nEmail"]')).toHaveText('Text en')
  })

  test('should show i18n placeholder', async () => {
    await page.goto(url.create)
    await expect(page.locator('#field-i18nEmail')).toHaveAttribute('placeholder', 'en placeholder')
  })

  test('should show i18n descriptions', async () => {
    await page.goto(url.create)
    const description = page.locator('.field-description-i18nEmail')
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

  test('should reset filter conditions when adding additional filters', async () => {
    await page.goto(url.list)

    // open the first filter options
    await openListFilters(page, {})
    await page.locator('.where-builder__add-first-filter').click()

    const firstInitialField = page.locator('.condition__field')
    const firstOperatorField = page.locator('.condition__operator')
    const firstValueField = page.locator('.condition__value >> input')

    await firstInitialField.click()
    const firstInitialFieldOptions = firstInitialField.locator('.rs__option')
    await firstInitialFieldOptions.locator('text=text').first().click()
    await expect(firstInitialField.locator('.rs__single-value')).toContainText('Text')

    await firstOperatorField.click()
    await firstOperatorField.locator('.rs__option').locator('text=equals').click()

    await firstValueField.fill('hello')

    await wait(500)

    await expect(firstValueField).toHaveValue('hello')

    // open the second filter options
    await page.locator('.condition__actions-add').click()

    const secondLi = page.locator('.where-builder__and-filters li:nth-child(2)')

    await expect(secondLi).toBeVisible()

    const secondInitialField = secondLi.locator('.condition__field')
    const secondOperatorField = secondLi.locator('.condition__operator >> input')
    const secondValueField = secondLi.locator('.condition__value >> input')

    await expect(secondInitialField.locator('.rs__single-value')).toContainText('Email')
    await expect(secondOperatorField).toHaveValue('')
    await expect(secondValueField).toHaveValue('')
  })

  test('should not re-render page upon typing in a value in the filter value field', async () => {
    await page.goto(url.list)

    // open the first filter options
    await openListFilters(page, {})
    await page.locator('.where-builder__add-first-filter').click()

    const firstInitialField = page.locator('.condition__field')
    const firstOperatorField = page.locator('.condition__operator')
    const firstValueField = page.locator('.condition__value >> input')

    await firstInitialField.click()
    const firstInitialFieldOptions = firstInitialField.locator('.rs__option')
    await firstInitialFieldOptions.locator('text=text').first().click()
    await expect(firstInitialField.locator('.rs__single-value')).toContainText('Text')

    await firstOperatorField.click()
    await firstOperatorField.locator('.rs__option').locator('text=equals').click()

    // Type into the input field instead of filling it
    await firstValueField.click()
    await firstValueField.type('hello', { delay: 100 }) // Add a delay to simulate typing speed

    // Wait for a short period to see if the input loses focus
    await page.waitForTimeout(500)

    // Check if the input still has the correct value
    await expect(firstValueField).toHaveValue('hello')
  })

  test('should still show second filter if two filters exist and first filter is removed', async () => {
    await page.goto(url.list)

    // open the first filter options
    await openListFilters(page, {})
    await page.locator('.where-builder__add-first-filter').click()

    const firstInitialField = page.locator('.condition__field')
    const firstOperatorField = page.locator('.condition__operator')
    const firstValueField = page.locator('.condition__value >> input')

    await firstInitialField.click()
    const firstInitialFieldOptions = firstInitialField.locator('.rs__option')
    await firstInitialFieldOptions.locator('text=text').first().click()
    await expect(firstInitialField.locator('.rs__single-value')).toContainText('Text')

    await firstOperatorField.click()
    await firstOperatorField.locator('.rs__option').locator('text=equals').click()

    await firstValueField.fill('hello')

    await wait(500)

    await expect(firstValueField).toHaveValue('hello')

    // open the second filter options
    await page.locator('.condition__actions-add').click()

    const secondLi = page.locator('.where-builder__and-filters li:nth-child(2)')

    await expect(secondLi).toBeVisible()

    const secondInitialField = secondLi.locator('.condition__field')
    const secondOperatorField = secondLi.locator('.condition__operator')
    const secondValueField = secondLi.locator('.condition__value >> input')

    await secondInitialField.click()
    const secondInitialFieldOptions = secondInitialField.locator('.rs__option')
    await secondInitialFieldOptions.locator('text=text').first().click()
    await expect(secondInitialField.locator('.rs__single-value')).toContainText('Text')

    await secondOperatorField.click()
    await secondOperatorField.locator('.rs__option').locator('text=equals').click()

    await secondValueField.fill('world')
    await expect(secondValueField).toHaveValue('world')

    await wait(500)

    const firstLi = page.locator('.where-builder__and-filters li:nth-child(1)')
    const removeButton = firstLi.locator('.condition__actions-remove')

    // remove first filter
    await removeButton.click()

    const filterListItems = page.locator('.where-builder__and-filters li')
    await expect(filterListItems).toHaveCount(1)

    await expect(firstValueField).toHaveValue('world')
  })
})
