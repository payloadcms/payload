import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { navigateToDoc } from 'helpers/e2e/navigateToDoc.js'
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
import { customIDSlug, customRowIDSlug, customTabIDSlug } from '../../slugs.js'
import { customRowID, customTabID, nonStandardID } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let client: RESTClient
let page: Page
let serverURL: string
let url: AdminUrlUtil
let customTabIDURL: AdminUrlUtil
let customRowIDURL: AdminUrlUtil

describe('Custom IDs', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))

    url = new AdminUrlUtil(serverURL, customIDSlug)
    customTabIDURL = new AdminUrlUtil(serverURL, customTabIDSlug)
    customRowIDURL = new AdminUrlUtil(serverURL, customRowIDSlug)

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

  test('allow create of non standard ID', async () => {
    await page.goto(url.list)
    await navigateToDoc(page, url)
    await expect(page.locator('#field-id')).toHaveValue(nonStandardID)
    await expect(page.locator('.id-label')).toContainText(nonStandardID)
  })

  test('should use custom ID field nested within unnamed tab', async () => {
    await page.goto(customTabIDURL.edit(customTabID))
    const idField = page.locator('#field-id')
    await expect(idField).toHaveValue(customTabID)
  })

  test('should use custom ID field nested within row', async () => {
    await page.goto(customRowIDURL.edit(customRowID))
    const idField = page.locator('#field-id')
    await expect(idField).toHaveValue(customRowID)
  })
})
