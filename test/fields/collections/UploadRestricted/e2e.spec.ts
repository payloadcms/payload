import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { RESTClient } from '../../../helpers/rest.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { uploadsRestricted } from '../../slugs.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let client: RESTClient
let page: Page
let serverURL: string
// If we want to make this run in parallel: test.describe.configure({ mode: 'parallel' })
let url: AdminUrlUtil

describe('Upload with restrictions', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig({
      dirname,
      // prebuild,
    }))
    url = new AdminUrlUtil(serverURL, uploadsRestricted)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await reInitializeDB({
      serverURL,
      snapshotKey: 'fieldsUploadRestrictedTest',
      uploadsDir: path.resolve(dirname, './collections/Upload/uploads'),
    })
    await ensureCompilationIsDone({ page, serverURL })
  })
  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'fieldsUploadRestrictedTest',
      uploadsDir: path.resolve(dirname, './collections/Upload/uploads'),
    })

    if (client) {
      await client.logout()
    }
    client = new RESTClient(null, { defaultSlug: 'users', serverURL })
    await client.login()

    await ensureCompilationIsDone({ page, serverURL })
  })

  test('allowCreate = true should hide create new button and drag and drop text', async () => {
    await page.goto(url.create)
    const fieldWithoutRestriction = page.locator('#field-uploadWithoutRestriction')
    await expect(fieldWithoutRestriction).toBeVisible()
    await expect(fieldWithoutRestriction.getByRole('button', { name: 'Create New' })).toBeVisible()
    await expect(fieldWithoutRestriction.getByText('or drag and drop a file')).toBeVisible()
    const fieldWithAllowCreateFalse = page.locator('#field-uploadWithAllowCreateFalse')
    await expect(fieldWithAllowCreateFalse).toBeVisible()
    await expect(fieldWithAllowCreateFalse.getByRole('button', { name: 'Create New' })).toBeHidden()
    await expect(fieldWithAllowCreateFalse.getByText('or drag and drop a file')).toBeHidden()
    const fieldMultipleWithAllow = page.locator('#field-uploadMultipleWithAllowCreateFalse')
    await expect(fieldMultipleWithAllow).toBeVisible()
    await expect(fieldMultipleWithAllow.getByRole('button', { name: 'Create New' })).toBeHidden()
    await expect(fieldMultipleWithAllow.getByText('or drag and drop a file')).toBeHidden()
  })

  test("list drawer should show 'Create new Uploads Restricted' button", async () => {})
})
