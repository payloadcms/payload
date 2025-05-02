import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
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
    const jsonField = page.locator('.json-field #field-customJSON')
    await expect(jsonField).toContainText('"default": "value"')

    const originalHeight = (await page.locator('#field-customJSON').boundingBox())?.height || 0
    await page.locator('#set-custom-json').click()
    const newHeight = (await page.locator('#field-customJSON').boundingBox())?.height || 0
    expect(newHeight).toBeGreaterThan(originalHeight)
  })
})
