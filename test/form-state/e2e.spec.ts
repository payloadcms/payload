import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { trackNetworkRequests } from 'helpers/e2e/trackNetworkRequests.js'
import * as path from 'path'
import { fileURLToPath } from 'url'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
  throttleTest,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const title = 'Title'
let context: BrowserContext

test.describe('Form State', () => {
  let page: Page
  let postsUrl: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { payload, serverURL } = await initPayloadE2ENoConfig({ dirname })
    postsUrl = new AdminUrlUtil(serverURL, 'posts')

    context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  test('collection — should re-enable fields after save', async () => {
    await page.goto(postsUrl.create)
    await page.locator('#field-title').fill(title)
    await saveDocAndAssert(page)
    await expect(page.locator('#field-title')).toBeEnabled()
  })

  test('should thread proper event argument to validation functions', async () => {
    await page.goto(postsUrl.create)
    await page.locator('#field-title').fill(title)
    await page.locator('#field-validateUsingEvent').fill('Not allowed')
    await saveDocAndAssert(page, '#action-save', 'error')
  })

  test('should debounce onChange events', async () => {
    await page.goto(postsUrl.create)
    const field = page.locator('#field-title')

    await trackNetworkRequests(
      page,
      postsUrl.create,
      async () => {
        await field.pressSequentially('Some text to type', { delay: 50 }) // Ensure this is faster than the debounce rate
      },
      {
        allowedNumberOfRequests: 1,
      },
    )
  })

  test('should queue onChange functions', async () => {
    // try and write a failing test
    // Need to type into a _slower_ than the debounce rate
    // Monitor network requests to see if the request is debounced
    // Only a subset of requests should be made, depending on the speed of the response vs the speed of the typing

    // only throttle test after initial load to avoid timeouts
    const cdpSession = await throttleTest({
      page,
      context,
      delay: 'Fast 4G',
    })

    // Tests here

    await cdpSession.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    })

    await cdpSession.detach()
  })
})
