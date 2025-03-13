import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { addBlock } from 'helpers/e2e/addBlock.js'
import { assertNetworkRequests } from 'helpers/e2e/assertNetworkRequests.js'
import * as path from 'path'
import React from 'react'
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

  test('should fire a single network request for onChange events when manipulating blocks', async () => {
    await page.goto(postsUrl.create)

    await assertNetworkRequests(
      page,
      postsUrl.create,
      async () => {
        await addBlock({
          page,
          blockLabel: 'Text',
          fieldName: 'blocks',
        })
      },
      {
        allowedNumberOfRequests: 1,
      },
    )
  })

  test('should not throw fields into an infinite rendering loop', async () => {
    await page.goto(postsUrl.create)
    await page.locator('#field-title').fill(title)

    let numberOfRenders = 0

    page.on('console', (msg) => {
      if (msg.type() === 'count' && msg.text().includes('Renders')) {
        numberOfRenders++
      }
    })

    const allowedNumberOfRenders = 25
    const pollInterval = 200
    const maxTime = 5000

    let elapsedTime = 0

    const intervalId = setInterval(() => {
      if (numberOfRenders > allowedNumberOfRenders) {
        clearInterval(intervalId)
        throw new Error(`Render count exceeded the threshold of ${allowedNumberOfRenders}`)
      }

      elapsedTime += pollInterval

      if (elapsedTime >= maxTime) {
        clearInterval(intervalId)
      }
    }, pollInterval)

    await page.waitForTimeout(maxTime)

    expect(numberOfRenders).toBeLessThanOrEqual(allowedNumberOfRenders)
  })

  test('should debounce onChange events', async () => {
    await page.goto(postsUrl.create)
    const field = page.locator('#field-title')

    await assertNetworkRequests(
      page,
      postsUrl.create,
      async () => {
        // Need to type _faster_ than the debounce rate (250ms)
        await field.pressSequentially('Some text to type', { delay: 50 })
      },
      {
        allowedNumberOfRequests: 1,
      },
    )
  })

  test('should queue onChange functions', async () => {
    await page.goto(postsUrl.create)
    const field = page.locator('#field-title')
    await field.fill('Test')

    // only throttle test after initial load to avoid timeouts
    const cdpSession = await throttleTest({
      page,
      context,
      delay: 'Slow 3G',
    })

    await assertNetworkRequests(
      page,
      postsUrl.create,
      async () => {
        await field.fill('')
        // Need to type into a _slower_ than the debounce rate (250ms), but _faster_ than the network request
        await field.pressSequentially('Some text to type', { delay: 275 })
      },
      {
        allowedNumberOfRequests: 2,
        timeout: 10000, // watch network for 10 seconds to allow requests to build up
      },
    )

    await cdpSession.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    })

    await cdpSession.detach()
  })
})
