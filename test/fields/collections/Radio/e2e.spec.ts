import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { checkFocusIndicators } from '__helpers/e2e/checkFocusIndicators.js'
import { runAxeScan } from '__helpers/e2e/runAxeScan.js'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../__helpers/shared/sdk/index.js'
import type { Config } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
} from '../../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { RESTClient } from '../../../__helpers/shared/rest.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { radioFieldsSlug } from '../../slugs.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let client: RESTClient
let page: Page
let serverURL: string
let url: AdminUrlUtil

describe('Radio', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))

    url = new AdminUrlUtil(serverURL, radioFieldsSlug)

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

  test('should show i18n label in list', async () => {
    await page.goto(url.list)
    await expect(page.locator('.cell-radio')).toHaveText('Value One')
  })

  test('should show i18n label while editing', async () => {
    await page.goto(url.create)
    await expect(page.locator('label[for="field-radio"]')).toHaveText('Radio en')
  })

  test('should show i18n radio labels', async () => {
    await page.goto(url.create)
    await expect(page.locator('label[for="field-radio-one"] .radio-input__label')).toHaveText(
      'Value One',
    )
  })

  test('should show custom JSX label in list', async () => {
    await page.goto(url.list)
    await expect(page.locator('.cell-radioWithJsxLabelOption svg#payload-logo')).toBeVisible()
  })

  test('should show custom JSX label while editing', async () => {
    await page.goto(url.create)
    await expect(
      page.locator('label[for="field-radioWithJsxLabelOption-three"] svg#payload-logo'),
    ).toBeVisible()
  })

  describe('A11y', () => {
    test('Edit view should have no accessibility violations', async ({}, testInfo) => {
      await page.goto(url.create)
      await page.locator('#field-radio').waitFor()

      const scanResults = await runAxeScan({
        include: ['.document-fields__main'],
        page,
        testInfo,
      })

      // On this page there's a known custom label without a clear name, expect 1 violation
      expect(scanResults.violations.length).toBe(1)
    })

    test('Radio inputs have focus indicators', async ({}, testInfo) => {
      await page.goto(url.create)
      await page.locator('#field-radio').waitFor()

      const scanResults = await checkFocusIndicators({
        page,
        selector: '.document-fields__main',
        testInfo,
      })

      expect(scanResults.totalFocusableElements).toBeGreaterThan(0)
      expect(scanResults.elementsWithoutIndicators).toBe(0)
    })
  })
})
