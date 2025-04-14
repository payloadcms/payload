import type { BrowserContext, CDPSession, Page } from '@playwright/test'
import type { PayloadTestSDK } from 'helpers/sdk/index.js'
import type { FormState } from 'payload'

import { expect, test } from '@playwright/test'
import { addBlock } from 'helpers/e2e/addBlock.js'
import { assertElementStaysVisible } from 'helpers/e2e/assertElementStaysVisible.js'
import { assertNetworkRequests } from 'helpers/e2e/assertNetworkRequests.js'
import { assertRequestBody } from 'helpers/e2e/assertRequestBody.js'
import * as path from 'path'
import { fileURLToPath } from 'url'

import type { Config, Post } from './payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
  throttleTest,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { postsSlug } from './collections/Posts/index.js'

const { describe, beforeEach, afterEach } = test

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const title = 'Title'
let context: BrowserContext
let payload: PayloadTestSDK<Config>
let serverURL: string

test.describe('Form State', () => {
  let page: Page
  let postsUrl: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig({ dirname }))
    postsUrl = new AdminUrlUtil(serverURL, postsSlug)

    context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  test.beforeEach(async () => {
    // await throttleTest({ page, context, delay: 'Fast 3G' })
  })

  test('should disable fields during initialization', async () => {
    await page.goto(postsUrl.create, { waitUntil: 'commit' })
    await expect(page.locator('#field-title')).toBeDisabled()
  })

  test('should disable fields while processing', async () => {
    const doc = await createPost()
    await page.goto(postsUrl.edit(doc.id))
    await page.locator('#field-title').fill(title)
    await page.click('#action-save', { delay: 100 })
    await expect(page.locator('#field-title')).toBeDisabled()
  })

  test('should re-enable fields after save', async () => {
    await page.goto(postsUrl.create)
    await page.locator('#field-title').fill(title)
    await saveDocAndAssert(page)
    await expect(page.locator('#field-title')).toBeEnabled()
  })

  test('should only validate on submit via the `event` argument', async () => {
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

  test('should send `lastRenderedPath` only when necessary', async () => {
    await page.goto(postsUrl.create)
    const field = page.locator('#field-title')
    await field.fill('Test')

    // The `array` itself SHOULD have a `lastRenderedPath` because it was rendered on initial load
    await assertRequestBody<{ args: { formState: FormState } }[]>(page, {
      action: async () => await page.locator('#field-array .array-field__add-row').click(),
      url: postsUrl.create,
      expect: (body) =>
        Boolean(
          body?.[0]?.args?.formState?.['array'] &&
            body[0].args.formState['array'].lastRenderedPath === 'array',
        ),
    })

    await page.waitForResponse(
      (response) =>
        response.url() === postsUrl.create &&
        response.status() === 200 &&
        response.headers()['content-type'] === 'text/x-component',
    )

    // The `array` itself SHOULD still have a `lastRenderedPath`
    // The custom text field in the first row SHOULD ALSO have a `lastRenderedPath` bc it was rendered in the first request
    await assertRequestBody<{ args: { formState: FormState } }[]>(page, {
      action: async () => await page.locator('#field-array .array-field__add-row').click(),
      url: postsUrl.create,
      expect: (body) =>
        Boolean(
          body?.[0]?.args?.formState?.['array'] &&
            body[0].args.formState['array'].lastRenderedPath === 'array' &&
            body[0].args.formState['array.0.customTextField']?.lastRenderedPath ===
              'array.0.customTextField',
        ),
    })

    await page.waitForResponse(
      (response) =>
        response.url() === postsUrl.create &&
        response.status() === 200 &&
        response.headers()['content-type'] === 'text/x-component',
    )

    // The `array` itself SHOULD still have a `lastRenderedPath`
    // The custom text field in the first row SHOULD ALSO have a `lastRenderedPath` bc it was rendered in the first request
    // The custom text field in the second row SHOULD ALSO have a `lastRenderedPath` bc it was rendered in the second request
    await assertRequestBody<{ args: { formState: FormState } }[]>(page, {
      action: async () => await page.locator('#field-array .array-field__add-row').click(),
      url: postsUrl.create,
      expect: (body) =>
        Boolean(
          body?.[0]?.args?.formState?.['array'] &&
            body[0].args.formState['array'].lastRenderedPath &&
            body[0].args.formState['array.0.customTextField']?.lastRenderedPath ===
              'array.0.customTextField' &&
            body[0].args.formState['array.1.customTextField']?.lastRenderedPath ===
              'array.1.customTextField',
        ),
    })
  })

  test('new rows should contain default values', async () => {
    await page.goto(postsUrl.create)
    await page.locator('#field-array .array-field__add-row').click()
    await expect(
      page.locator('#field-array #array-row-0 #field-array__0__customTextField'),
    ).toHaveValue('This is a default value')
  })

  describe('Throttled tests', () => {
    let cdpSession: CDPSession

    beforeEach(async () => {
      await page.goto(postsUrl.create)
      const field = page.locator('#field-title')
      await field.fill('Test')

      cdpSession = await throttleTest({
        page,
        context,
        delay: 'Slow 3G',
      })
    })

    afterEach(async () => {
      await cdpSession.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1,
      })

      await cdpSession.detach()
    })

    test('optimistic rows should not disappear between pending network requests', async () => {
      let requestCount = 0

      // increment the response count for form state requests
      page.on('request', (request) => {
        if (request.url() === postsUrl.create && request.method() === 'POST') {
          requestCount++
        }
      })

      // Add the first row and expect an optimistic loading state
      await page.locator('#field-array .array-field__add-row').click()
      await expect(page.locator('#field-array #array-row-0')).toBeVisible()

      // use waitForSelector because the shimmer effect is not always visible
      // eslint-disable-next-line playwright/no-wait-for-selector
      await page.waitForSelector('#field-array #array-row-0 .shimmer-effect')

      // Wait for the first request to be sent
      await page.waitForRequest((request) => request.url() === postsUrl.create)

      // Before the first request comes back, add the second row and expect an optimistic loading state
      await page.locator('#field-array .array-field__add-row').click()
      await expect(page.locator('#field-array #array-row-1')).toBeVisible()

      // use waitForSelector because the shimmer effect is not always visible
      // eslint-disable-next-line playwright/no-wait-for-selector
      await page.waitForSelector('#field-array #array-row-0 .shimmer-effect')

      // At this point there should have been a single request sent for the first row
      expect(requestCount).toBe(1)

      // Wait for the first request to finish
      await page.waitForResponse(
        (response) =>
          response.url() === postsUrl.create &&
          response.status() === 200 &&
          response.headers()['content-type'] === 'text/x-component',
      )

      // block the second request from executing to ensure the form remains in stale state
      await page.route(postsUrl.create, async (route) => {
        if (route.request().method() === 'POST' && route.request().url() === postsUrl.create) {
          await route.abort()
          return
        }
        await route.continue()
      })

      await assertElementStaysVisible(page, '#field-array #array-row-1')
    })

    test('should queue onChange functions', async () => {
      const field = page.locator('#field-title')

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
    })

    test('should not cause nested custom components to disappear when adding a row then editing a field', async () => {
      await assertNetworkRequests(
        page,
        postsUrl.create,
        async () => {
          await page.locator('#field-array .array-field__add-row').click()
          await page.locator('#field-title').fill('Test 2')

          // use `waitForSelector` to ensure the element doesn't appear and then disappear
          // eslint-disable-next-line playwright/no-wait-for-selector
          await page.waitForSelector('#field-array #array-row-0 #field-array__0__customTextField', {
            timeout: TEST_TIMEOUT,
          })

          await expect(
            page.locator('#field-array #array-row-0 #field-array__0__customTextField'),
          ).toBeVisible()

          await expect(page.locator('#field-title')).toHaveValue('Test 2')
        },
        {
          allowedNumberOfRequests: 2,
          timeout: 10000,
        },
      )
    })

    test('should not cause nested custom components to disappear when adding rows back-to-back', async () => {
      // Add two rows quickly
      // Test that the custom text field within the rows do not disappear
      await assertNetworkRequests(
        page,
        postsUrl.create,
        async () => {
          await page.locator('#field-array .array-field__add-row').click()
          await page.locator('#field-array .array-field__add-row').click()

          // use `waitForSelector` to ensure the element doesn't appear and then disappear
          // eslint-disable-next-line playwright/no-wait-for-selector
          await page.waitForSelector('#field-array #array-row-0 #field-array__0__customTextField', {
            timeout: TEST_TIMEOUT,
          })

          // use `waitForSelector` to ensure the element doesn't appear and then disappear
          // eslint-disable-next-line playwright/no-wait-for-selector
          await page.waitForSelector('#field-array #array-row-1 #field-array__1__customTextField', {
            timeout: TEST_TIMEOUT,
          })

          await expect(
            page.locator('#field-array #array-row-0 #field-array__0__customTextField'),
          ).toBeVisible()

          await expect(
            page.locator('#field-array #array-row-1 #field-array__1__customTextField'),
          ).toBeVisible()
        },
        {
          allowedNumberOfRequests: 2,
          timeout: 10000,
        },
      )
    })
  })
})

async function createPost(overrides?: Partial<Post>): Promise<Post> {
  return payload.create({
    collection: 'posts',
    data: {
      title: 'Post Title',
      ...overrides,
    },
  }) as unknown as Promise<Post>
}
