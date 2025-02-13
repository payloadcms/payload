import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { addListFilter } from 'helpers/e2e/addListFilter.js'
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
    client = new RESTClient({ defaultSlug: 'users', serverURL })
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
})
