import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
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
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { jsonFieldsSlug } from '../../slugs.js'
import { jsonDoc } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let client: RESTClient
let page: Page
let serverURL: string
let url: AdminUrlUtil

describe('JSON', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))

    url = new AdminUrlUtil(serverURL, jsonFieldsSlug)

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
    const jsonCell = page.locator('.row-1 .cell-json')
    await expect(jsonCell).toHaveText(JSON.stringify(jsonDoc.json))
  })

  test('should truncate long JSON values in list view', async () => {
    // Create a document with very long JSON (>150 chars, should truncate)
    const longJsonData = {
      veryLongProperty:
        'This is a very long string value that will definitely exceed the 100 character universal truth when stringified.',
      anotherProperty: 'Additional data to ensure we exceed the limit',
      nested: { deep: { value: 'More nested data' } },
    }

    const longDoc = await payload.create({
      collection: jsonFieldsSlug,
      data: { json: longJsonData },
    })

    // Create a document with short JSON (<100 chars)
    const shortJsonData = { short: 'value' }

    const shortDoc = await payload.create({
      collection: jsonFieldsSlug,
      data: { json: shortJsonData },
    })

    await page.goto(url.list)

    // Verify long JSON is truncated with ellipsis
    const longJsonCell = page.locator(`tr[data-id="${longDoc.id}"] .cell-json`)

    await expect(async () => {
      const longCellText = await longJsonCell.textContent()
      expect(longCellText).toContain('…')
      expect(longCellText?.length).toBeLessThanOrEqual(101) // 100 chars + ellipsis
    }).toPass()

    // Verify short JSON is displayed fully without truncation
    const shortJsonCell = page.locator(`tr[data-id="${shortDoc.id}"] .cell-json`)

    await expect(shortJsonCell).toHaveText(JSON.stringify(shortJsonData))
    await expect(async () => {
      const shortCellText = await shortJsonCell.textContent()
      expect(shortCellText).not.toContain('…')
    }).toPass()
  })

  test('should not truncate slightly long JSON values (>100 but <=150 chars)', async () => {
    // Create JSON that's between 100-150 chars (should NOT truncate due to 1.5x rule)
    // This string is ~120 characters when stringified
    const slightlyLongJsonData = {
      property1: 'This value is specifically designed to be over one hundred characters',
      property2: 'but under 150 total',
    }

    const stringified = JSON.stringify(slightlyLongJsonData)
    expect(stringified.length).toBeGreaterThan(100)
    expect(stringified.length).toBeLessThanOrEqual(150)

    const doc = await payload.create({
      collection: jsonFieldsSlug,
      data: { json: slightlyLongJsonData },
    })

    await page.goto(url.list)

    // Verify the JSON is displayed fully without truncation
    const jsonCell = page.locator(`tr[data-id="${doc.id}"] .cell-json`)

    await expect(jsonCell).toHaveText(stringified)
    await expect(async () => {
      const cellText = jsonCell
      await expect(cellText).not.toContainText('…')
      await expect(cellText).toHaveText(stringified)
    }).toPass()
  })

  test('should create', async () => {
    const input = '{"foo": "bar"}'
    await page.goto(url.create)
    const jsonCodeEditor = page.locator('.json-field .code-editor').first()
    await expect(() => expect(jsonCodeEditor).toBeVisible()).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
    const jsonFieldInputArea = page.locator('.json-field .inputarea').first()
    await jsonFieldInputArea.fill(input)

    await saveDocAndAssert(page)
    const jsonField = page.locator('.json-field').first()
    await expect(jsonField).toContainText('"foo": "bar"')
  })

  test('should not unflatten json field containing keys with dots', async () => {
    const input = '{"foo.with.periods": "bar"}'

    await page.goto(url.create)
    const jsonCodeEditor = page.locator('.group-field .json-field .code-editor').first()
    await expect(() => expect(jsonCodeEditor).toBeVisible()).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
    const json = page.locator('.group-field .json-field .inputarea')
    await json.fill(input)

    await saveDocAndAssert(page, '.form-submit button')
    await expect(page.locator('.group-field .json-field')).toContainText(
      '"foo.with.periods": "bar"',
    )
  })

  test('should save field with "target" property', async () => {
    const input = '{"target": "foo"}'
    await page.goto(url.create)
    const jsonCodeEditor = page.locator('.json-field .code-editor').first()
    await expect(() => expect(jsonCodeEditor).toBeVisible()).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
    const jsonFieldInputArea = page.locator('.json-field .inputarea').first()
    await jsonFieldInputArea.fill(input)

    await saveDocAndAssert(page)
    const jsonField = page.locator('.json-field').first()
    await expect(jsonField).toContainText('"target": "foo"')
  })

  test('should update', async () => {
    const createdDoc = await payload.create({
      collection: 'json-fields',
      data: {
        customJSON: {
          default: 'value',
        },
      },
    })

    await page.goto(url.edit(createdDoc.id))
    const jsonField = page.locator('.json-field:not(.read-only) #field-customJSON')
    await expect(jsonField).toContainText('"default": "value"')

    const boundingBox = await page
      .locator('.json-field:not(.read-only) #field-customJSON')
      .boundingBox()
    await expect(() => expect(boundingBox).not.toBeNull()).toPass()
    const originalHeight = boundingBox!.height

    // click the button to set custom JSON
    await page.locator('#set-custom-json').click({ delay: 1000 })

    const newBoundingBox = await page
      .locator('.json-field:not(.read-only) #field-customJSON')
      .boundingBox()
    await expect(() => expect(newBoundingBox).not.toBeNull()).toPass()
    const newHeight = newBoundingBox!.height

    await expect(() => {
      expect(newHeight).toBeGreaterThan(originalHeight)
    }).toPass()
  })

  describe('A11y', () => {
    test('Edit view should have no accessibility violations', async ({}, testInfo) => {
      await page.goto(url.create)
      await page.locator('#field-json').waitFor()

      const scanResults = await runAxeScan({
        page,
        testInfo,
        include: ['.document-fields__main'],
      })

      expect(scanResults.violations.length).toBe(0)
    })
  })
})
