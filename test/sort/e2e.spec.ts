import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { RESTClient } from 'helpers/rest.js'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config } from './payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { sortableSlug } from './collections/Sortable/index.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, beforeEach, describe } = test
let url: AdminUrlUtil

let page: Page
let payload!: PayloadTestSDK<Config>
let client: RESTClient
let serverURL: string
let context: BrowserContext

describe('Sort functionality', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    url = new AdminUrlUtil(serverURL, sortableSlug)

    console.log('url', url, testInfo)

    context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)

    client = new RESTClient({ defaultSlug: 'users', serverURL })
    await client.login()

    await ensureCompilationIsDone({ page, serverURL })
  })

  beforeEach(async () => {
    // await throttleTest({
    //   page,
    //   context,
    //   delay: 'Fast 4G',
    // })
  })

  test('Sortable collection', async () => {
    await page.goto(url.list)
    const firstRow = page.locator('tbody .row-1')
    await expect(firstRow).toBeVisible()
  })
})
