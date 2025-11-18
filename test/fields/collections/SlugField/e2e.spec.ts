import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'
import type { Config } from '../../payload-types.js'

import {
  changeLocale,
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { RESTClient } from '../../../helpers/rest.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { slugFieldsSlug } from '../../slugs.js'
import { slugFieldDoc } from './shared.js'

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

describe('SlugField', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))
    url = new AdminUrlUtil(serverURL, slugFieldsSlug)

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

  test('should generate slug for title field', async () => {
    await page.goto(url.create)
    await page.locator('#field-title').fill('Test title')

    await saveDocAndAssert(page)

    await expect(page.locator('#field-slug')).toHaveValue('test-title')
  })

  test('custom values should be kept', async () => {
    await page.goto(url.create)
    await page.locator('#field-title').fill('Test title with custom slug')

    await saveDocAndAssert(page)

    const slugField = page.locator('#field-slug')
    await expect(slugField).toHaveValue('test-title-with-custom-slug')
    await expect(slugField).toBeDisabled()

    const unlockButton = page.locator('#field-generateSlug + div .lock-button')
    await unlockButton.click()
    await expect(slugField).toBeEnabled()

    await slugField.fill('custom-slug-value')

    await saveDocAndAssert(page)

    await expect(slugField).toHaveValue('custom-slug-value')
  })

  describe('localized slugs', () => {
    test('should generate slug for localized fields', async () => {
      await page.goto(url.create)
      await page.locator('#field-title').fill('Test normal title in default locale')
      await page.locator('#field-localizedTitle').fill('Test title in english')

      await saveDocAndAssert(page)

      await expect(page.locator('#field-slug')).toHaveValue('test-normal-title-in-default-locale')
      await expect(page.locator('#field-localizedSlug')).toHaveValue('test-title-in-english')

      await changeLocale(page, 'es')

      await expect(page.locator('#field-localizedTitle')).toBeEmpty()
      await page.locator('#field-localizedTitle').fill('Title in spanish')

      await saveDocAndAssert(page)

      await expect(page.locator('#field-localizedSlug')).toHaveValue('title-in-spanish')
    })
  })
})
