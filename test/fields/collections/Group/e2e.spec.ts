import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { runAxeScan } from 'helpers/e2e/runAxeScan.js'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'
import type { Config } from '../../payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { RESTClient } from '../../../helpers/rest.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { groupFieldsSlug } from '../../slugs.js'
import { namedGroupDoc } from './shared.js'

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

describe('Group', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))
    url = new AdminUrlUtil(serverURL, groupFieldsSlug)

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

  describe('Named', () => {
    test('should display field in list view', async () => {
      await page.goto(url.list)

      const textCell = page.locator('.row-1 .cell-group')

      await expect(textCell).toContainText(JSON.stringify(namedGroupDoc.group?.text), {
        useInnerText: true,
      })
    })
  })

  describe('Unnamed', () => {
    test('should display field in list view', async () => {
      await page.goto(url.list)

      const textCell = page.locator('.row-1 .cell-insideUnnamedGroup')

      await expect(textCell).toContainText(namedGroupDoc?.insideUnnamedGroup ?? '', {
        useInnerText: true,
      })
    })

    test('should display field in list view deeply nested', async () => {
      await page.goto(url.list)

      const textCell = page.locator('.row-1 .cell-deeplyNestedGroup')

      await expect(textCell).toContainText(JSON.stringify(namedGroupDoc.deeplyNestedGroup), {
        useInnerText: true,
      })
    })

    test('should display field visually within nested groups', async () => {
      await page.goto(url.create)

      // Makes sure the fields are rendered
      await page.mouse.wheel(0, 2000)

      const unnamedGroupSelector = `.field-type.group-field #field-insideUnnamedGroup`
      const unnamedGroupField = page.locator(unnamedGroupSelector)

      await expect(unnamedGroupField).toBeVisible()

      // Makes sure the fields are rendered
      await page.mouse.wheel(0, 2000)

      // A bit repetitive but this selector should fail if the group is not nested
      const unnamedNestedGroupSelector = `.field-type.group-field .field-type.group-field .field-type.group-field .field-type.group-field .field-type.group-field #field-deeplyNestedGroup__insideNestedUnnamedGroup`
      const unnamedNestedGroupField = page.locator(unnamedNestedGroupSelector)
      await expect(unnamedNestedGroupField).toBeVisible()
    })

    test('should display with no label when label is undefined', async () => {
      await page.goto(url.create)

      // Makes sure the fields are rendered
      await page.mouse.wheel(0, 2000)

      const nolabelGroupSelector = `.field-type.group-field#field-_index-14 .group-field__header`
      const nolabelGroupField = page.locator(nolabelGroupSelector)

      await expect(nolabelGroupField).toBeHidden()

      // Makes sure the fields are rendered
      await page.mouse.wheel(0, 2000)

      // Children should render even if the group has no label
      const nolabelGroupChildSelector = `.field-type.group-field#field-_index-14 #field-insideGroupWithNoLabel`
      const nolabelGroupChildField = page.locator(nolabelGroupChildSelector)

      await expect(nolabelGroupChildField).toBeVisible()
    })
  })

  describe('A11y', () => {
    test.fixme('Edit view should have no accessibility violations', async ({}, testInfo) => {
      await page.goto(url.create)
      await page.locator('#field-group__text').waitFor()

      const scanResults = await runAxeScan({
        page,
        testInfo,
        include: ['.collection-edit__main'],
      })

      expect(scanResults.violations.length).toBe(0)
    })
  })
})
