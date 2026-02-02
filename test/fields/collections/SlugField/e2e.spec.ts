import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { checkFocusIndicators } from 'helpers/e2e/checkFocusIndicators.js'
import { runAxeScan } from 'helpers/e2e/runAxeScan.js'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/shared/sdk/index.js'
import type { Config } from '../../payload-types.js'

import {
  changeLocale,
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../../../helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/shared/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/shared/clearAndSeed/reInitializeDB.js'
import { RESTClient } from '../../../helpers/shared/rest.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { slugFieldsSlug } from '../../slugs.js'

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

const unlockSlug = async (fieldName: string = 'slug') => {
  const fieldID = `#field-${fieldName}`
  const unlockButton = page.locator(`#field-${fieldName}-lock`)
  await unlockButton.click()
  const slugField = page.locator(fieldID)
  await expect(slugField).toBeEnabled()
}

const regenerateSlug = async (fieldName: string = 'slug') => {
  await unlockSlug(fieldName)
  const generateButton = page.locator(`#field-${fieldName}-generate`)
  await generateButton.click()
}

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

  test('should generate slug for title field on save', async () => {
    await page.goto(url.create)
    await page.locator('#field-title').fill('Test title')

    await saveDocAndAssert(page)

    await expect(page.locator('#field-slug')).toHaveValue('test-title')
  })

  test('should generate slug on demand from client side', async () => {
    await page.goto(url.create)
    await page.locator('#field-title').fill('Test title client side')

    await saveDocAndAssert(page)

    await page.locator('#field-title').fill('This should have regenerated')
    await regenerateSlug('slug')

    await expect(page.locator('#field-slug')).toHaveValue('this-should-have-regenerated')
  })

  test('custom values should be kept', async () => {
    await page.goto(url.create)
    await page.locator('#field-title').fill('Test title with custom slug')

    await saveDocAndAssert(page)

    const slugField = page.locator('#field-slug')
    await expect(slugField).toHaveValue('test-title-with-custom-slug')
    await expect(slugField).toBeDisabled()

    await unlockSlug('slug')

    await slugField.fill('custom-slug-value')

    await saveDocAndAssert(page)

    await expect(slugField).toHaveValue('custom-slug-value')
  })

  test('custom slugify functions are supported', async () => {
    await page.goto(url.create)
    await page.locator('#field-title').fill('Test Custom Slugify')

    await saveDocAndAssert(page)

    await expect(page.locator('#field-customSlugify')).toHaveValue('TEST CUSTOM SLUGIFY')

    // Ensure it can be regenerated from the client-side
    const titleField = page.locator('#field-title')
    await titleField.fill('Another Custom Slugify')

    await regenerateSlug('customSlugify')

    await expect(page.locator('#field-customSlugify')).toHaveValue('ANOTHER CUSTOM SLUGIFY')
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

  describe('A11y', () => {
    test('Edit view should have no accessibility violations', async ({}, testInfo) => {
      await page.goto(url.create)
      await page.locator('#field-title').waitFor()

      const scanResults = await runAxeScan({
        page,
        testInfo,
        include: ['.collection-edit__main'],
        exclude: ['.field-description'], // known issue - reported elsewhere @todo: remove this once fixed - see report https://github.com/payloadcms/payload/discussions/14489
      })

      expect(scanResults.violations.length).toBe(0)
    })

    test('Slug inputs have focus indicators', async ({}, testInfo) => {
      await page.goto(url.create)
      await page.locator('#field-title').waitFor()

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
