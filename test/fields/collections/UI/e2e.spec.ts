import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
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
import { uiSlug } from '../../slugs.js'

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

    url = new AdminUrlUtil(serverURL, uiSlug)

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

  test('should show custom: client configuration', async () => {
    await page.goto(url.create)

    const uiField = page.locator('#uiCustomClient')

    await expect(uiField).toBeVisible()
    await expect(uiField).toContainText('client-side-configuration')
  })

  test('The entire Form should not re-render when a field changes', async () => {
    await page.goto(url.create)

    const logs: string[] = []

    await page.waitForLoadState()
    // We don't want to save the logs from the initial render
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await page.waitForTimeout(1000)

    page.on('console', (msg) => {
      logs.push(msg.text())
    })

    await page.locator('#field-text').fill('test')

    await expect(() => {
      expect(logs).toHaveLength(0)
    }).toPass({ timeout: 500 })

    await page.locator('#field-uiCustomField').fill('test')

    await expect(() => {
      expect(logs).toContain('UICustomField changed')
      expect(logs).toContain('UICustomField rendered')
      // It should be 3, but I leave a margin of error for contingencies
      // like React strict mode, to make the test less flaky.
      expect(logs.length).toBeLessThanOrEqual(4)
    }).toPass({ timeout: 500 })
  })
})
