import type { BrowserContext, Page, Request, Route } from '@playwright/test'
import type { FormState } from 'payload'

import { expect } from '@playwright/test'
import * as path from 'path'
import { formatAdminURL, wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config, Post } from './payload-types.js'

import { assertElementStaysVisible } from '../__helpers/e2e/assertElementStaysVisible.js'
import { assertNetworkRequests } from '../__helpers/e2e/assertNetworkRequests.js'
import { assertRequestBody } from '../__helpers/e2e/assertRequestBody.js'
import {
  addArrayRow,
  addArrayRowAsync,
  duplicateArrayRow,
  removeArrayRow,
} from '../__helpers/e2e/fields/array/index.js'
import { addBlock } from '../__helpers/e2e/fields/blocks/index.js'
import { saveDocAndAssert, throttleTest, waitForFormReady } from '../__helpers/e2e/helpers.js'
import { currentFramework, test } from '../__helpers/e2e/playwright.js'
import { waitForAutoSaveToRunAndComplete } from '../__helpers/e2e/waitForAutoSaveToRunAndComplete.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { TEST_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { autosavePostsSlug } from './collections/Autosave/index.js'
import { conditionsSlug } from './collections/Conditions/index.js'
import { postsSlug } from './collections/Posts/index.js'

type StaleErrorTestWindow = {
  staleErrorToastObserver?: MutationObserver
  staleErrorToastSeen?: boolean
} & typeof window

const { afterEach, beforeEach, describe } = test

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const title = 'Title'
let context: BrowserContext
let payload: PayloadTestSDK<Config>
let serverURL: string

test.describe('Form State', () => {
  let page: Page
  let postsUrl: AdminUrlUtil
  let autosavePostsUrl: AdminUrlUtil
  let conditionsUrl: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    postsUrl = new AdminUrlUtil(serverURL, postsSlug)
    autosavePostsUrl = new AdminUrlUtil(serverURL, autosavePostsSlug)
    conditionsUrl = new AdminUrlUtil(serverURL, conditionsSlug)

    context = await browser.newContext()
    ;({ page } = await initPage({ context, serverURL }))
  })

  test.beforeEach(async () => {
    // await throttleTest({
    //   page,
    //   context,
    //   delay: 'Slow 4G',
    // })
  })

  test(
    'should disable fields during initialization',
    { framework: 'next' },
    async ({ browser }) => {
      const initializingContext = await browser.newContext({
        javaScriptEnabled: false,
        storageState: await page.context().storageState(),
      })

      try {
        const initializingPage = await initializingContext.newPage()

        await initializingPage.goto(postsUrl.create)
        await expect(initializingPage.locator('#field-title')).toBeDisabled()
      } finally {
        await initializingContext.close()
      }
    },
  )

  test('should render the create form ready to edit', { framework: 'tanstack-start' }, async () => {
    await page.goto(postsUrl.create)
    // No client-init disabled phase: the RSC payload arrives with form state
    // already initialized, so the field is immediately enabled and editable.
    await expect(page.locator('#field-title')).toBeEnabled()
    await page.locator('#field-title').fill(title)
    await expect(page.locator('#field-title')).toHaveValue(title)
  })

  test('should disable fields while processing', async () => {
    const doc = await createPost()
    await page.goto(postsUrl.edit(doc.id))
    await waitForFormReady(page)
    await page.locator('#field-title').fill(title)

    const save = await holdResponse({
      method: 'PATCH',
      page,
      url: `${formatAdminURL({ apiRoute: '/api', path: `/${postsSlug}/${doc.id}`, serverURL })}**`,
    })
    const submission = page.click('#action-save', { delay: 100 })

    try {
      await save.captured
      await expect(page.locator('#field-title')).toBeDisabled()
    } finally {
      await save.cleanup()
      await submission
    }

    await waitForFormReady(page)
  })

  test('should re-enable fields after save', async () => {
    await page.goto(postsUrl.create)
    await waitForFormReady(page)
    await page.locator('#field-title').fill(title)
    await saveDocAndAssert(page)
    await expect(page.locator('#field-title')).toBeEnabled()
  })

  test('should only validate on submit via the `event` argument', async () => {
    await page.goto(postsUrl.create)
    await waitForFormReady(page)
    await page.locator('#field-title').fill(title)
    await page.locator('#field-validateUsingEvent').fill('Not allowed')
    await saveDocAndAssert(page, '#action-save', 'error')
  })

  test('should fire a single network request for onChange events when manipulating blocks', async () => {
    await page.goto(postsUrl.create)
    await waitForFormReady(page)

    await assertNetworkRequests(
      page,
      postsUrl.create,
      async () => {
        await addBlock({
          blockToSelect: 'Text',
          fieldName: 'blocks',
          page,
        })
      },
      {
        allowedNumberOfRequests: 1,
      },
    )
  })

  test('should not throw fields into an infinite rendering loop', async () => {
    await page.goto(postsUrl.create)
    await waitForFormReady(page)

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
    await waitForFormReady(page)
    const field = page.locator('#field-title')
    await expect(field).toBeVisible()

    await assertNetworkRequests(
      page,
      postsUrl.create,
      async () => {
        // Need to type _faster_ than the debounce rate (250ms)
        await field.pressSequentially('Some text to type', { delay: 50 })
      },
      {
        allowedNumberOfRequests: 1,
        minimumNumberOfRequests: 1,
      },
    )
  })

  // Asserts the `lastRenderedPath` form-state optimization by inspecting the form
  // state embedded in Next.js's RSC form-state request body. TanStack Start
  // dispatches form state through the `createServerFn` RPC with a seroval-encoded
  // body, so this Next-transport-specific assertion does not apply. The underlying
  // optimization is framework-agnostic shared form logic exercised by the other
  // form-state tests on both adapters.
  test('should send `lastRenderedPath` only when necessary', { framework: 'next' }, async () => {
    await page.goto(postsUrl.create)
    await waitForFormReady(page)

    const field = page.locator('#field-title')
    await field.fill('Test')

    // The `array` itself SHOULD have a `lastRenderedPath` because it was rendered on initial load
    await assertRequestBody<{ args: { formState: FormState } }[]>(page, {
      action: async () => await addArrayRowAsync(page, 'array'),
      expect: (body) =>
        Boolean(
          body?.[0]?.args?.formState?.['array'] &&
          body[0].args.formState['array'].lastRenderedPath === 'array',
        ),
      url: postsUrl.create,
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
      action: async () => await addArrayRowAsync(page, 'array'),
      expect: (body) =>
        Boolean(
          body?.[0]?.args?.formState?.['array'] &&
          body[0].args.formState['array'].lastRenderedPath === 'array' &&
          body[0].args.formState['array.0.customTextField']?.lastRenderedPath ===
            'array.0.customTextField',
        ),
      url: postsUrl.create,
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
      action: async () => await addArrayRowAsync(page, 'array'),
      expect: (body) =>
        Boolean(
          body?.[0]?.args?.formState?.['array'] &&
          body[0].args.formState['array'].lastRenderedPath &&
          body[0].args.formState['array.0.customTextField']?.lastRenderedPath ===
            'array.0.customTextField' &&
          body[0].args.formState['array.1.customTextField']?.lastRenderedPath ===
            'array.1.customTextField',
        ),
      url: postsUrl.create,
    })
  })

  test('should not render stale values for server components while form state is in flight', async () => {
    await page.goto(postsUrl.create)
    await waitForFormReady(page)

    await addArrayRowAsync(page, 'array')
    await page.locator('#field-array #array-row-0 #field-array__0__customTextField').fill('1')

    await addArrayRowAsync(page, 'array')
    await page.locator('#field-array #array-row-1 #field-array__1__customTextField').fill('2')

    // block the next form state request from firing to ensure the field remains in stale state
    await page.route(postsUrl.create, async (route) => {
      if (route.request().method() === 'POST' && route.request().url() === postsUrl.create) {
        await route.abort()
        return
      }

      await route.continue()
    })

    await removeArrayRow(page, { fieldName: 'array' })

    await expect(
      page.locator('#field-array #array-row-0 #field-array__0__customTextField'),
    ).toHaveValue('2')

    await page.unroute(postsUrl.create)
  })

  test('should update the document title after a burst of input events', async () => {
    const updatedTitle = '[검증용] PR #242 E2E 확인 — 곧 삭제됩니다'

    await page.goto(postsUrl.create)
    await waitForFormReady(page)

    const titleField = page.locator('#field-title')

    await titleField.evaluate((field: HTMLInputElement, value) => {
      const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set

      for (let index = 1; index <= value.length; index++) {
        setValue?.call(field, value.slice(0, index))
        field.dispatchEvent(
          new InputEvent('input', {
            bubbles: true,
            data: value[index - 1],
            inputType: 'insertText',
          }),
        )
      }
    }, updatedTitle)

    await expect(titleField).toHaveValue(updatedTitle)
    await expect(page.locator('.doc-header__title')).toHaveText(updatedTitle)
  })

  // TODO: This test is not very reliable but would be really nice to have
  test.skip('should not lag on slow CPUs', async () => {
    await page.goto(postsUrl.create)
    await waitForFormReady(page)

    await expect(page.locator('#field-title')).toBeEnabled()

    const cdpSession = await context.newCDPSession(page)

    await cdpSession.send('Emulation.setCPUThrottlingRate', { rate: 25 })

    // Start measuring input and render times
    await page.evaluate(() => {
      const inputField = document.querySelector('#field-title') as HTMLInputElement
      const logs: Record<string, { elapsedTime: number }> = {}

      inputField.addEventListener('input', (event) => {
        const startTime = performance.now()

        requestAnimationFrame(() => {
          const endTime = performance.now()
          const elapsedTime = endTime - startTime
          logs[event.target?.value] = { elapsedTime }
        })
      })

      window.getLogs = () => logs
    })

    const text = 'This is a test string to measure input lag.'

    await page.locator('#field-title').pressSequentially(text, { delay: 0 })

    const logs: Record<string, { elapsedTime: number }> = await page.evaluate(() =>
      window.getLogs(),
    )
    console.log('Logs:', logs)

    const lagTimes = Object.values(logs).map((log) => log.elapsedTime || 0)

    console.log('Lag times:', lagTimes)

    const maxInputLag = Math.max(...lagTimes)
    const allowedThreshold = 50

    expect(maxInputLag).toBeLessThanOrEqual(allowedThreshold)

    // Reset CPU throttling
    await cdpSession.send('Emulation.setCPUThrottlingRate', { rate: 1 })
    await cdpSession.detach()
  })

  test('should render computed values after save', async () => {
    await page.goto(postsUrl.create)
    await waitForFormReady(page)

    const titleField = page.locator('#field-title')
    const computedTitleField = page.locator('#field-computedTitle')

    await titleField.fill('Test Title')

    await expect(computedTitleField).toHaveValue('')

    await saveDocAndAssert(page)

    await expect(computedTitleField).toHaveValue('Test Title')

    // Now test array rows, as their merge logic is different

    await page.locator('#field-computedArray #computedArray-row-0').isVisible()

    await removeArrayRow(page, { fieldName: 'computedArray' })

    await page.locator('#field-computedArray #computedArray-row-0').isHidden()

    await saveDocAndAssert(page)

    await expect(page.locator('#field-computedArray #computedArray-row-0')).toBeVisible()

    await expect(
      page.locator('#field-computedArray #computedArray-row-0 #field-computedArray__0__text'),
    ).toHaveValue('This is a computed value.')
  })

  test('should fetch new doc permissions after save', async () => {
    const doc = await createPost({ title: 'Initial Title' })
    await page.goto(postsUrl.edit(doc.id))
    await waitForFormReady(page)

    const titleField = page.locator('#field-title')
    await expect(titleField).toBeEnabled()

    await assertNetworkRequests(
      page,
      formatAdminURL({ apiRoute: '/api', path: `/posts/access/${doc.id}`, serverURL }),
      async () => {
        await titleField.fill('Updated Title')
        await wait(500)
        await page.click('#action-save', { delay: 100 })
      },
      {
        allowedNumberOfRequests: 2,
        minimumNumberOfRequests: 2,
        timeout: 3000,
      },
    )

    await assertNetworkRequests(
      page,
      formatAdminURL({ apiRoute: '/api', path: `/posts/access/${doc.id}`, serverURL }),
      async () => {
        await titleField.fill('Updated Title 2')
        await wait(500)
        await page.click('#action-save', { delay: 100 })
      },
      {
        allowedNumberOfRequests: 2,
        minimumNumberOfRequests: 2,
        timeout: 3000,
      },
    )
  })

  test('autosave - should not fetch new doc permissions on every autosave', async () => {
    const doc = await payload.create({
      collection: autosavePostsSlug,
      data: {
        title: 'ok Initial Title',
      },
      overrideAccess: true,
    })

    await page.goto(autosavePostsUrl.edit(doc.id))
    await waitForFormReady(page)

    const titleField = page.locator('#field-title')
    await expect(titleField).toBeEnabled()

    await assertNetworkRequests(
      page,
      formatAdminURL({
        apiRoute: '/api',
        path: `/${autosavePostsSlug}/access/${doc.id}`,
        serverURL,
      }),
      async () => {
        await titleField.fill('ok Updated Title')
      },
      {
        allowedNumberOfRequests: 0,
        timeout: 3000,
      },
    )

    await assertNetworkRequests(
      page,
      formatAdminURL({
        apiRoute: '/api',
        path: `/${autosavePostsSlug}/access/${doc.id}`,
        serverURL,
      }),
      async () => {
        await titleField.fill('ok Updated Title Again')
      },
      {
        allowedNumberOfRequests: 0,
        timeout: 3000,
      },
    )

    // save manually and ensure the permissions are fetched again
    await assertNetworkRequests(
      page,
      formatAdminURL({
        apiRoute: '/api',
        path: `/${autosavePostsSlug}/access/${doc.id}`,
        serverURL,
      }),
      async () => {
        await page.click('#action-save', { delay: 100 })
      },
      {
        allowedNumberOfRequests: 2,
        minimumNumberOfRequests: 2,
        timeout: 3000,
      },
    )
  })

  test('autosave - should render computed values after autosave', async () => {
    await page.goto(autosavePostsUrl.create)
    await waitForFormReady(page)

    const titleField = page.locator('#field-title')
    const computedTitleField = page.locator('#field-computedTitle')

    await expect(computedTitleField).toBeDisabled()

    await titleField.fill('Test Title')

    await waitForAutoSaveToRunAndComplete(page)

    await expect(computedTitleField).toHaveValue('Test Title')
  })

  describe('stale autosave responses', () => {
    let releaseRoutes = () => {}

    afterEach(async () => {
      releaseRoutes()
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    })

    test('autosave - should discard a stale response and reconcile the latest revision', async () => {
      const doc = await payload.create({
        collection: autosavePostsSlug,
        data: { title: 'Initial revision' },
        draft: true,
      })
      await page.goto(autosavePostsUrl.edit(doc.id))
      await waitForFormReady(page)

      const firstStarted = Promise.withResolvers<void>()
      const releaseFirst = Promise.withResolvers<void>()
      const secondStarted = Promise.withResolvers<void>()
      const releaseSecond = Promise.withResolvers<void>()
      let requestCount = 0

      releaseRoutes = () => {
        releaseFirst.resolve()
        releaseSecond.resolve()
      }

      await page.route(`**/api/${autosavePostsSlug}/**`, async (route) => {
        if (route.request().method() !== 'PATCH') {
          return route.continue()
        }
        requestCount += 1
        if (requestCount === 1) {
          firstStarted.resolve()
          await releaseFirst.promise
        } else if (requestCount === 2) {
          secondStarted.resolve()
          await releaseSecond.promise
        }
        await route.continue()
      })

      const titleField = page.locator('#field-title')
      const computedTitleField = page.locator('#field-computedTitle')
      const documentInfoState = page.locator('#document-info-state')
      const initialDocumentInfoState = await documentInfoState.evaluate(
        (element) => element.outerHTML,
      )

      await expect(computedTitleField).toHaveValue('Initial revision')

      await titleField.fill('First revision')
      await firstStarted.promise

      await titleField.fill('Latest revision')

      releaseFirst.resolve()
      await secondStarted.promise

      await expect(titleField).toHaveValue('Latest revision')
      await expect(computedTitleField).toHaveValue('Initial revision')
      expect(await documentInfoState.evaluate((element) => element.outerHTML)).toBe(
        initialDocumentInfoState,
      )

      releaseSecond.resolve()
      await waitForAutoSaveToRunAndComplete(page)

      await expect(titleField).toHaveValue('Latest revision')
      await expect(computedTitleField).toHaveValue('Latest revision')
      expect(requestCount).toBe(2)

      await page.unrouteAll({ behavior: 'ignoreErrors' })
    })

    test('autosave - should ignore error UI from a stale response', async () => {
      const doc = await payload.create({
        collection: autosavePostsSlug,
        data: { title: 'Initial revision' },
        draft: true,
      })
      await page.goto(autosavePostsUrl.edit(doc.id))
      await waitForFormReady(page)

      const firstStarted = Promise.withResolvers<void>()
      const releaseFirst = Promise.withResolvers<void>()
      const secondStarted = Promise.withResolvers<void>()
      const releaseSecond = Promise.withResolvers<void>()
      let requestCount = 0

      releaseRoutes = () => {
        releaseFirst.resolve()
        releaseSecond.resolve()
      }

      await page.route(`**/api/${autosavePostsSlug}/**`, async (route) => {
        if (route.request().method() !== 'PATCH') {
          return route.continue()
        }

        requestCount += 1

        if (requestCount === 1) {
          firstStarted.resolve()
          await releaseFirst.promise
          return route.fulfill({
            body: JSON.stringify({ message: 'Stale autosave failure' }),
            contentType: 'application/json',
            status: 400,
          })
        }

        secondStarted.resolve()
        await releaseSecond.promise
        await route.continue()
      })

      const titleField = page.locator('#field-title')

      await titleField.fill('First revision')
      await firstStarted.promise
      await titleField.fill('Latest revision')

      await page.evaluate(() => {
        const testWindow = window as StaleErrorTestWindow
        testWindow.staleErrorToastSeen = false
        testWindow.staleErrorToastObserver = new MutationObserver(() => {
          if (document.body.textContent?.includes('Stale autosave failure')) {
            testWindow.staleErrorToastSeen = true
          }
        })
        testWindow.staleErrorToastObserver.observe(document.body, {
          characterData: true,
          childList: true,
          subtree: true,
        })
      })

      releaseFirst.resolve()
      await secondStarted.promise

      await expect
        .poll(() => page.evaluate(() => (window as StaleErrorTestWindow).staleErrorToastSeen))
        .toBe(false)
      await expect(titleField).toHaveValue('Latest revision')

      releaseSecond.resolve()
      await waitForAutoSaveToRunAndComplete(page)

      await expect
        .poll(() => page.evaluate(() => (window as StaleErrorTestWindow).staleErrorToastSeen))
        .toBe(false)
      await page.evaluate(() =>
        (window as StaleErrorTestWindow).staleErrorToastObserver?.disconnect(),
      )
      await expect.poll(() => requestCount).toBe(2)
    })

    test('autosave - should preserve non-dirty local field updates made in flight', async () => {
      const doc = await payload.create({
        collection: autosavePostsSlug,
        data: {
          programmaticValue: 'Initial programmatic value',
          title: 'Initial revision',
        },
        draft: true,
      })
      await page.goto(autosavePostsUrl.edit(doc.id))
      await waitForFormReady(page)

      const firstStarted = Promise.withResolvers<void>()
      const releaseFirst = Promise.withResolvers<void>()
      let requestCount = 0

      releaseRoutes = () => releaseFirst.resolve()

      await page.route(`**/api/${autosavePostsSlug}/**`, async (route) => {
        if (route.request().method() !== 'PATCH') {
          return route.continue()
        }

        requestCount += 1

        if (requestCount === 1) {
          firstStarted.resolve()
          await releaseFirst.promise
        }

        await route.continue()
      })

      await page.locator('#field-title').fill('First revision')
      await firstStarted.promise
      await page.locator('#set-programmatic-value').click()
      releaseFirst.resolve()

      await expect.poll(() => requestCount).toBe(2)
      await waitForAutoSaveToRunAndComplete(page)
      await expect(page.locator('#field-programmaticValue')).toHaveValue('Updated programmatically')
    })

    test('should re-request form state after a late response follows a conditional field change', async () => {
      const doc = await payload.create({
        collection: conditionsSlug,
        data: { showField: false },
      })
      await page.goto(conditionsUrl.edit(doc.id))
      await waitForFormReady(page)

      const formStateCaptured = Promise.withResolvers<void>()
      let heldRoute: Route | undefined
      let heldResponse: Awaited<ReturnType<Route['fetch']>> | undefined

      const formStateURL =
        currentFramework === 'tanstack-start' ? '**/_serverFn/**' : conditionsUrl.edit(doc.id)

      await page.route(formStateURL, async (route) => {
        const request = route.request()
        const isFormStateRequest =
          request.method() === 'POST' &&
          (currentFramework === 'tanstack-start'
            ? (request.postData() ?? '').includes('form-state')
            : Boolean(request.headers()['next-action']))

        if (isFormStateRequest && !heldRoute) {
          heldResponse = await route.fetch()
          heldRoute = route
          formStateCaptured.resolve()
          return
        }

        await route.continue()
      })

      const conditionalField = page.locator('#field-conditionalCustomField')

      await page.locator('#field-showField').check()
      await formStateCaptured.promise
      await page.locator('#field-showField').uncheck()

      await heldRoute?.fulfill({ response: heldResponse })

      await expect(conditionalField).toBeHidden()
    })

    test('should retain save errors after a queued form-state refresh', async () => {
      const doc = await payload.create({
        collection: postsSlug,
        data: { title: 'initial' },
      })

      await page.goto(postsUrl.edit(doc.id))
      await waitForFormReady(page)

      let hasSaveStarted = false
      const releaseSave = Promise.withResolvers<void>()

      await page.route(`**/api/${postsSlug}/${doc.id}**`, async (route) => {
        if (route.request().method() !== 'PATCH') {
          await route.continue()
          return
        }

        hasSaveStarted = true
        await releaseSave.promise
        await route.fulfill({
          json: {
            errors: [
              {
                data: { errors: [{ message: 'Title must be unique', path: 'title' }] },
                message: 'The following field is invalid: title',
              },
            ],
          },
          status: 400,
        })
      })

      try {
        await page.locator('#field-title').fill('duplicate')
        await addArrayRowAsync(page, 'array')
        await page.click('#action-save')
        await expect.poll(() => hasSaveStarted).toBe(true)

        // Allow the debounced refresh to queue behind the in-flight save.
        await page.waitForTimeout(500)
        releaseSave.resolve()

        await expect(page.locator('#field-array__0__customTextField')).toHaveValue(
          'This is a default value',
        )
        await expect(
          page
            .locator('.field-type.text', { has: page.locator('#field-title') })
            .locator('.field-error'),
        ).toHaveText('Title must be unique')
      } finally {
        releaseSave.resolve()
      }
    })

    test('should keep failed-save field errors after an earlier form-state response', async () => {
      const doc = await payload.create({
        collection: postsSlug,
        data: { title: 'initial' },
      })
      await page.goto(postsUrl.edit(doc.id))
      await waitForFormReady(page)

      const formStateCaptured = Promise.withResolvers<void>()
      let heldRoute: Route | undefined
      let heldResponse: Awaited<ReturnType<Route['fetch']>> | undefined
      let saveRequestStarted = false

      const formStateURL =
        currentFramework === 'tanstack-start' ? '**/_serverFn/**' : postsUrl.edit(doc.id)

      await page.route(formStateURL, async (route) => {
        const request = route.request()
        const isFormStateRequest =
          request.method() === 'POST' &&
          (currentFramework === 'tanstack-start'
            ? (request.postData() ?? '').includes('form-state')
            : Boolean(request.headers()['next-action']))

        if (isFormStateRequest && !heldRoute) {
          heldResponse = await route.fetch()
          heldRoute = route
          formStateCaptured.resolve()
          return
        }

        await route.continue()
      })

      await page.route(`**/api/${postsSlug}/${doc.id}`, async (route) => {
        if (route.request().method() === 'PATCH') {
          saveRequestStarted = true
        }
        await route.continue()
      })

      await page.locator('#field-validateUsingEvent').fill('Not allowed')
      await formStateCaptured.promise
      await page.click('#action-save')

      expect(saveRequestStarted).toBe(false)

      await heldRoute?.fulfill({ response: heldResponse })

      const titleError = page
        .locator('.field-type.text', { has: page.locator('#field-validateUsingEvent') })
        .locator('.field-error')
      await expect(titleError).toBeVisible()
    })
  })

  describe('form request lifecycle', () => {
    afterEach(async () => {
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    })

    test('should accept field updates without initial form state', async () => {
      await page.route('**/api/form-request', (route) =>
        route.fulfill({ json: { message: 'Saved' } }),
      )
      await page.goto(
        formatAdminURL({
          adminRoute: '/admin',
          path: '/form-requests?scenario=empty',
          serverURL,
        }),
      )
      await waitForFormReady(page)
      await page.getByRole('textbox', { name: 'Title', exact: true }).fill('First input')

      const request = page.waitForRequest(
        (request) => request.url().endsWith('/api/form-request'),
        { timeout: 3000 },
      )

      await page.getByRole('button', { name: 'Submit request' }).click()

      expect((await request).postData()).toContain('"title":"First input"')
    })

    for (const update of ['reverted edit', 'non-dirty update'] as const) {
      test(`should reconcile a post-save response invalidated by a ${update}`, async () => {
        const doc = await payload.create({
          collection: autosavePostsSlug,
          data: { programmaticValue: 'Initial value', title: 'ok Initial revision' },
          draft: true,
        })
        await page.goto(autosavePostsUrl.edit(doc.id))
        await waitForFormReady(page)

        const responseCaptured = Promise.withResolvers<void>()
        const releaseResponse = Promise.withResolvers<void>()
        let hasCapturedResponse = false
        let requestCount = 0

        await page.route(`**/api/${autosavePostsSlug}/${doc.id}**`, async (route) => {
          if (route.request().method() === 'PATCH') {
            requestCount += 1
          }
          await route.continue()
        })
        const formStateURL =
          currentFramework === 'tanstack-start' ? '**/_serverFn/**' : autosavePostsUrl.edit(doc.id)

        await page.route(formStateURL, async (route) => {
          const request = route.request()
          const isFormStateRequest =
            request.method() === 'POST' &&
            (currentFramework === 'tanstack-start'
              ? (request.postData() ?? '').includes('form-state')
              : Boolean(request.headers()['next-action']))

          if (isFormStateRequest && !hasCapturedResponse) {
            hasCapturedResponse = true
            const response = await route.fetch()

            responseCaptured.resolve()
            await releaseResponse.promise
            await route.fulfill({ response })
          } else {
            await route.continue()
          }
        })

        try {
          const titleField = page.locator('#field-title')

          await titleField.fill('ok Latest revision')
          await responseCaptured.promise

          if (update === 'reverted edit') {
            await titleField.fill('ok Temporary edit')
            await titleField.fill('ok Latest revision')
          } else {
            await page.locator('#set-programmatic-value').click()
          }

          releaseResponse.resolve()

          await expect(page.locator('#field-computedTitle')).toHaveValue('ok Latest revision')
          await waitForAutoSaveToRunAndComplete(page)
          expect(requestCount).toBe(2)

          if (update === 'non-dirty update') {
            await expect(page.locator('#field-programmaticValue')).toHaveValue(
              'Updated programmatically',
            )
          }
        } finally {
          releaseResponse.resolve()
        }
      })
    }

    test('should preserve a save queued before pasting an array field', async () => {
      const doc = await payload.create({
        collection: postsSlug,
        data: {
          array: [{ customTextField: 'Copied value', defaultTextField: 'Copied value' }],
          title: 'Initial title',
        },
      })
      await page.goto(postsUrl.edit(doc.id))
      await waitForFormReady(page)

      const clipboardButton = page.locator('#field-array .clipboard-action__button').first()

      await clipboardButton.click()
      await page.getByRole('menuitem', { name: 'Copy Field', exact: true }).click()

      const responseCaptured = Promise.withResolvers<void>()
      const releaseResponse = Promise.withResolvers<void>()
      let hasCapturedResponse = false

      const formStateURL =
        currentFramework === 'tanstack-start' ? '**/_serverFn/**' : postsUrl.edit(doc.id)

      await page.route(formStateURL, async (route) => {
        const request = route.request()
        const isFormStateRequest =
          request.method() === 'POST' &&
          (currentFramework === 'tanstack-start'
            ? (request.postData() ?? '').includes('form-state')
            : Boolean(request.headers()['next-action']))

        if (isFormStateRequest && !hasCapturedResponse) {
          hasCapturedResponse = true
          const response = await route.fetch()

          responseCaptured.resolve()
          await releaseResponse.promise
          await route.fulfill({ response })
        } else {
          await route.continue()
        }
      })

      try {
        await page.locator('#field-title').fill('Updated title')
        await responseCaptured.promise
        await page.locator('#action-save').click()
        await clipboardButton.click()
        await page.getByRole('menuitem', { name: 'Paste Field', exact: true }).click()

        const saveRequest = page.waitForRequest(
          (request) =>
            request.method() === 'PATCH' && request.url().includes(`/api/${postsSlug}/${doc.id}`),
          { timeout: 3000 },
        )

        releaseResponse.resolve()

        expect((await saveRequest).postData()).toContain('"title":"Updated title"')
        await waitForFormReady(page)
      } finally {
        releaseResponse.resolve()
        await page.evaluate(() => localStorage.removeItem('_payloadClipboard'))
      }
    })

    test('should submit computed values merged by the preceding queued autosave', async () => {
      const doc = await payload.create({
        collection: autosavePostsSlug,
        data: { title: 'ok Initial revision' },
      })
      await page.goto(autosavePostsUrl.edit(doc.id))
      await waitForFormReady(page)

      const autosaveStarted = Promise.withResolvers<void>()
      const releaseAutosave = Promise.withResolvers<void>()

      await page.route(`**/api/${autosavePostsSlug}/${doc.id}**`, async (route) => {
        if (
          route.request().method() === 'PATCH' &&
          route.request().url().includes('autosave=true')
        ) {
          autosaveStarted.resolve()
          await releaseAutosave.promise
        }

        await route.continue()
      })

      try {
        await page.locator('#field-title').fill('ok Latest revision')
        await autosaveStarted.promise
        await page.getByRole('button', { name: 'Queue save', exact: true }).click()

        const saveRequest = page.waitForRequest(
          (request) =>
            request.method() === 'PATCH' &&
            request.url().includes(`/api/${autosavePostsSlug}/${doc.id}`) &&
            !request.url().includes('autosave=true'),
        )

        releaseAutosave.resolve()

        expect((await saveRequest).postData()).toContain('"computedTitle":"ok Latest revision"')
        await waitForFormReady(page)
      } finally {
        releaseAutosave.resolve()
      }
    })

    test('should submit values updated during the autocomplete wait', async () => {
      await page.route('**/api/form-request', (route) =>
        route.fulfill({ json: { message: 'Saved' } }),
      )
      await page.goto(
        formatAdminURL({
          adminRoute: '/admin',
          path: '/form-requests?scenario=autocomplete',
          serverURL,
        }),
      )
      await waitForFormReady(page)

      const request = page.waitForRequest(
        (request) => request.url().endsWith('/api/form-request'),
        { timeout: 3000 },
      )

      await page.getByRole('button', { name: 'Submit request' }).click()

      expect((await request).postData()).toContain('"title":"Autofilled value"')
      await expect(page.locator('#request-title')).toHaveValue('Autofilled value')
    })

    test('should dismiss the submitting toast when onSuccess resets the form', async () => {
      const callbackStarted = Promise.withResolvers<void>()
      const releaseCallback = Promise.withResolvers<void>()

      await page.route('**/api/form-request', (route) =>
        route.fulfill({ json: { message: 'Saved' } }),
      )
      await page.route('**/api/form-request-reset', async (route) => {
        callbackStarted.resolve()
        await releaseCallback.promise
        await route.fulfill({ json: {} })
      })
      await page.goto(
        formatAdminURL({
          adminRoute: '/admin',
          path: '/form-requests?scenario=reset',
          serverURL,
        }),
      )
      await waitForFormReady(page)

      try {
        await page.getByRole('button', { name: 'Submit request' }).click()
        await callbackStarted.promise

        const submittingToast = page.locator('[data-sonner-toast]', { hasText: 'Submitting' })

        await expect(submittingToast).toBeVisible()
        releaseCallback.resolve()

        await expect(page.locator('#request-title')).toHaveValue('Reset value')
        await expect(submittingToast).toHaveCount(0)
      } finally {
        releaseCallback.resolve()
      }
    })
  })

  test('array and block rows and maintain consistent row IDs across duplication', async () => {
    await page.goto(postsUrl.create)
    await waitForFormReady(page)

    await addArrayRow(page, { fieldName: 'array' })

    const row0 = page.locator('#field-array #array-row-0')

    await expect(row0.locator('#custom-array-row-label')).toHaveAttribute('data-id')

    await expect(row0.locator('#field-array__0__id')).toHaveValue(
      (await row0.locator('#custom-array-row-label').getAttribute('data-id'))!,
    )

    await duplicateArrayRow(page, { fieldName: 'array' })

    const row1 = page.locator('#field-array #array-row-1')

    await expect(row1.locator('#custom-array-row-label')).toHaveAttribute('data-id')

    await expect(row1.locator('#custom-array-row-label')).not.toHaveAttribute(
      'data-id',
      (await row0.locator('#custom-array-row-label').getAttribute('data-id'))!,
    )

    await expect(row1.locator('#field-array__1__id')).toHaveValue(
      (await row1.locator('#custom-array-row-label').getAttribute('data-id'))!,
    )
  })

  test.fixme('onChange events are queued even while autosave is in-flight', async () => {
    // TODO: This test is a flaky mess, relying on debounce and network timing. We need
    // to be more deliberate about testing this.
    const autosavePost = await payload.create({
      collection: autosavePostsSlug,
      data: {
        title: 'Initial Title',
      },
      overrideAccess: true,
    })

    await page.goto(autosavePostsUrl.edit(autosavePost.id))
    await waitForFormReady(page)

    const field = page.locator('#field-title')
    await expect(field).toBeEnabled()

    const stopThrottling = await throttleTest({
      context,
      delay: 'Slow 3G',
      page,
    })

    try {
      await assertNetworkRequests(
        page,
        `/api/${autosavePostsSlug}/${autosavePost.id}`,
        async () => {
          // Type a partial word, then pause for longer than debounce rate to trigger first onChange
          await field.fill('Tes')
          await wait(250) // wait for debounce to elapse, but not long enough for the autosave network request to complete
          // Finish the word, which importantly, should trigger a second onChange while the autosave is still in-flight
          await field.press('t')
        },
        {
          allowedNumberOfRequests: 2,
          minimumNumberOfRequests: 2,
          timeout: 10000,
        },
      )
    } finally {
      // Ensure throttling is always cleaned up, even if the test fails
      await stopThrottling()
    }
  })

  describe('Throttled tests', () => {
    let stopThrottling: () => Promise<void>

    beforeEach(async () => {
      await page.goto(postsUrl.create)
      await waitForFormReady(page)

      const field = page.locator('#field-title')
      await field.fill('Test')
      await expect(field).toBeEnabled()
      // Wait to ensure form state request from the field fill is done. Otherwise, it could
      // affect the request tracking of other tests depending on how fast they run
      await wait(1000)

      stopThrottling = await throttleTest({
        context,
        delay: 'Slow 3G',
        page,
      })
    })

    afterEach(async () => {
      await stopThrottling()
    })

    test('optimistic rows should not disappear between pending network requests', async () => {
      let requestCount = 0

      // Identifies a form-state request across adapters. Next.js posts RSC form
      // state to the document URL; TanStack Start dispatches it through the
      // `createServerFn` RPC at `/_serverFn/<id>` (shared by all server functions,
      // so the `form-state` name in the request body disambiguates it).
      const isFormStatePOST = (request: Request) => {
        if (request.method() !== 'POST') {
          return false
        }
        if (request.url() === postsUrl.create) {
          return true
        }
        return (
          currentFramework === 'tanstack-start' &&
          request.url().includes('/_serverFn/') &&
          (request.postData() ?? '').includes('form-state')
        )
      }

      const formStateRouteURL = (url: URL) =>
        url.href === postsUrl.create ||
        (currentFramework === 'tanstack-start' && url.pathname.includes('/_serverFn/'))

      // increment the response count for form state requests
      page.on('request', (request) => {
        if (isFormStatePOST(request)) {
          requestCount++
        }
      })

      // Add the first row and expect an optimistic loading state
      await addArrayRowAsync(page, 'array')
      await expect(page.locator('#field-array #array-row-0')).toBeVisible()

      // use waitForSelector because the shimmer effect is not always visible
      await page.waitForSelector('#field-array #array-row-0 .shimmer-effect')

      // Wait for the first request to be sent
      await expect.poll(() => requestCount).toBe(1)

      // Before the first request comes back, add the second row and expect an optimistic loading state
      await addArrayRowAsync(page, 'array')
      await expect(page.locator('#field-array #array-row-1')).toBeVisible()

      // use waitForSelector because the shimmer effect is not always visible
      await page.waitForSelector('#field-array #array-row-0 .shimmer-effect')

      // At this point there should have been a single request sent for the first row
      await expect.poll(() => requestCount).toBe(1)

      // Wait for the first request to finish
      await page.waitForResponse(
        (response) => isFormStatePOST(response.request()) && response.status() === 200,
      )

      // block the second request from executing to ensure the form remains in stale state
      const blockFormState = async (route: Route) => {
        if (isFormStatePOST(route.request())) {
          await route.abort()
          return
        }
        await route.continue()
      }
      await page.route(formStateRouteURL, blockFormState)

      await assertElementStaysVisible(page, '#field-array #array-row-1')

      // Remove all routes from the shared page. `unroute()` with a function
      // matcher does not reliably remove the route, which would otherwise leak
      // into subsequent tests and abort their form-state requests.
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    })

    test.fixme('should queue onChange functions', async () => {
      // TODO: Very flaky test. "Faster than the network request" is not a reliable way to test this
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
          minimumNumberOfRequests: 2,
          requestFilter(request) {
            if (request.url() === postsUrl.create && request.method() === 'POST') {
              return true
            }
            return false
          },
          timeout: 10000, // watch network for 10 seconds to allow requests to build up
        },
      )
    })

    test('should not cause nested custom components to disappear when adding a row then editing a field', async () => {
      await assertNetworkRequests(
        page,
        postsUrl.create,
        async () => {
          await addArrayRowAsync(page, 'array')
          // Ensure title field is filled after the form debounce, to guarantee 2 requests are sent
          await wait(500)
          await page.locator('#field-title').fill('Test 2')

          // use `waitForSelector` to ensure the element doesn't appear and then disappear
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

    test.fixme('should not cause nested custom components to disappear when adding rows back-to-back', async () => {
      // TODO: This test is too flaky
      // Add two rows quickly
      // Test that the custom text field within the rows do not disappear
      await assertNetworkRequests(
        page,
        postsUrl.create,
        async () => {
          await addArrayRowAsync(page, 'array')
          await addArrayRowAsync(page, 'array')

          // use `waitForSelector` to ensure the element doesn't appear and then disappear
          await page.waitForSelector('#field-array #array-row-0 #field-array__0__customTextField', {
            timeout: TEST_TIMEOUT,
          })

          // use `waitForSelector` to ensure the element doesn't appear and then disappear
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
    overrideAccess: true,
  }) as unknown as Promise<Post>
}

async function holdResponse({
  method,
  page,
  url,
}: {
  method: 'PATCH' | 'POST'
  page: Page
  url: string
}) {
  const captured = Promise.withResolvers<void>()
  const finished = Promise.withResolvers<void>()
  const release = Promise.withResolvers<void>()
  let hasHeldRequest = false
  const handler = async (route: Route) => {
    if (route.request().method() !== method || hasHeldRequest) {
      return route.fallback()
    }

    hasHeldRequest = true

    try {
      const response = await route.fetch()

      captured.resolve()
      await release.promise
      await route.fulfill({ response })
    } finally {
      finished.resolve()
    }
  }

  await page.route(url, handler)

  return {
    captured: captured.promise,
    cleanup: async () => {
      release.resolve()
      if (hasHeldRequest) {
        await finished.promise
      }
      await page.unroute(url, handler)
    },
  }
}
