import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { checkFocusIndicators } from 'helpers/e2e/checkFocusIndicators.js'
import { runAxeScan } from 'helpers/e2e/runAxeScan.js'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'
import type { Config } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { RESTClient } from '../../../helpers/rest.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { pointFieldsSlug } from '../../slugs.js'

test.describe.configure({ mode: 'serial' })

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
let filledGroupPoint
let emptyGroupPoint
describe('Point', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))
    url = new AdminUrlUtil(serverURL, pointFieldsSlug)

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

    filledGroupPoint = await payload.create({
      collection: pointFieldsSlug,
      data: {
        group: { point: [4, 2] },
        localized: [4, 2],
        point: [5, 5],
      },
    })
    emptyGroupPoint = await payload.create({
      collection: pointFieldsSlug,
      data: {
        group: {},
        localized: [3, -2],
        point: [5, 5],
      },
    })
  })

  test('should save point', async () => {
    await page.goto(url.create)
    const longField = page.locator('#field-longitude-point')
    await longField.fill('9')

    const latField = page.locator('#field-latitude-point')
    await latField.fill('-2')

    const localizedLongField = page.locator('#field-longitude-localized')
    await localizedLongField.fill('1')

    const localizedLatField = page.locator('#field-latitude-localized')
    await localizedLatField.fill('-1')

    const groupLongitude = page.locator('#field-longitude-group__point')
    await groupLongitude.fill('3')

    const groupLatField = page.locator('#field-latitude-group__point')
    await groupLatField.fill('-8')

    await saveDocAndAssert(page)
    await expect(longField).toHaveAttribute('value', '9')
    await expect(latField).toHaveAttribute('value', '-2')
    await expect(localizedLongField).toHaveAttribute('value', '1')
    await expect(localizedLatField).toHaveAttribute('value', '-1')
    await expect(groupLongitude).toHaveAttribute('value', '3')
    await expect(groupLatField).toHaveAttribute('value', '-8')
  })

  test('should update point', async () => {
    await page.goto(url.edit(emptyGroupPoint.id))
    const longField = page.locator('#field-longitude-point')
    await longField.fill('9')

    const latField = page.locator('#field-latitude-point')
    await latField.fill('-2')

    const localizedLongField = page.locator('#field-longitude-localized')
    await localizedLongField.fill('2')

    const localizedLatField = page.locator('#field-latitude-localized')
    await localizedLatField.fill('-2')

    const groupLongitude = page.locator('#field-longitude-group__point')
    await groupLongitude.fill('3')

    const groupLatField = page.locator('#field-latitude-group__point')
    await groupLatField.fill('-8')

    await saveDocAndAssert(page)

    await expect(longField).toHaveAttribute('value', '9')
    await expect(latField).toHaveAttribute('value', '-2')
    await expect(localizedLongField).toHaveAttribute('value', '2')
    await expect(localizedLatField).toHaveAttribute('value', '-2')
    await expect(groupLongitude).toHaveAttribute('value', '3')
    await expect(groupLatField).toHaveAttribute('value', '-8')
  })

  test('should be able to clear a value point', async () => {
    await page.goto(url.edit(filledGroupPoint.id))

    const groupLongitude = page.locator('#field-longitude-group__point')
    await groupLongitude.fill('')

    const groupLatField = page.locator('#field-latitude-group__point')
    await groupLatField.fill('')

    await saveDocAndAssert(page)

    await expect(groupLongitude).toHaveAttribute('value', '')
    await expect(groupLatField).toHaveAttribute('value', '')
  })

  describe('A11y', () => {
    test.fixme('Edit view should have no accessibility violations', async ({}, testInfo) => {
      await page.goto(url.create)
      await page.locator('#field-longitude-point').waitFor()

      const scanResults = await runAxeScan({
        page,
        testInfo,
        include: ['.document-fields__main'],
      })

      expect(scanResults.violations.length).toBe(0)
    })

    test('Point inputs have focus indicators', async ({}, testInfo) => {
      await page.goto(url.create)
      await page.locator('#field-longitude-point').waitFor()

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
