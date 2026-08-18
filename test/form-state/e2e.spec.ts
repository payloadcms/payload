import type { BrowserContext, CDPSession, Page, Request, Route } from '@playwright/test'
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
import { postsSlug } from './collections/Posts/index.js'

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

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    postsUrl = new AdminUrlUtil(serverURL, postsSlug)
    autosavePostsUrl = new AdminUrlUtil(serverURL, autosavePostsSlug)

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

  // Next.js renders the create view then runs an initial client-side form-state
  // fetch during which fields are disabled. TanStack Start serves the form
  // already-initialized in the RSC payload, so there is no disabled phase — the
  // tanstack-start variant below asserts the form is immediately editable instead.
  test('should disable fields during initialization', { framework: 'next' }, async () => {
    await page.goto(postsUrl.create, { waitUntil: 'commit' })
    await expect(page.locator('#field-title')).toBeDisabled()
  })

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
    await page.click('#action-save', { delay: 100 })
    await expect(page.locator('#field-title')).toBeDisabled()
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
        title: 'Initial Title',
      },
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
        await titleField.fill('Updated Title')
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
        await titleField.fill('Updated Title Again')
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

    await titleField.fill('Test Title')

    await waitForAutoSaveToRunAndComplete(page)

    await expect(computedTitleField).toHaveValue('Test Title')
  })

  test('autosave - should not overwrite computed values that are being actively edited', async () => {
    await page.goto(autosavePostsUrl.create)
    await waitForFormReady(page)

    const titleField = page.locator('#field-title')
    const computedTitleField = page.locator('#field-computedTitle')

    await titleField.fill('Test Title')

    await expect(computedTitleField).toHaveValue('Test Title')

    // Put cursor at end of text
    await computedTitleField.evaluate((el: HTMLInputElement) => {
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
    })

    await computedTitleField.pressSequentially(' - Edited', { delay: 100 })

    await waitForAutoSaveToRunAndComplete(page)

    await expect(computedTitleField).toHaveValue('Test Title - Edited')

    // but then when editing another field, the computed field should update
    const autosaveResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'PATCH' &&
        response.url().includes(`/api/${autosavePostsSlug}/`) &&
        response.ok(),
    )
    await titleField.fill('Test Title 2')
    await autosaveResponse
    await expect(computedTitleField).toHaveValue('Test Title 2')
  })

  test('autosave - should not overwrite a field with a stale response after switching to another field mid-flight', async () => {
    const doc = await payload.create({
      collection: autosavePostsSlug,
      data: {
        title: 'Initial Title',
      },
    })

    await page.goto(autosavePostsUrl.edit(doc.id))
    await waitForFormReady(page)

    const titleField = page.locator('#field-title')
    const subtitleField = page.locator('#field-subtitle')

    let releaseFirstRequest: () => void
    const firstRequestReleased = new Promise<void>((resolve) => {
      releaseFirstRequest = resolve
    })

    let resolveFirstRequestHandled: () => void
    const firstRequestHandled = new Promise<void>((resolve) => {
      resolveFirstRequestHandled = resolve
    })

    let patchRequestCount = 0

    const isAutosaveRequest = (url: URL) => url.pathname.endsWith(`/${autosavePostsSlug}/${doc.id}`)

    await page.route(isAutosaveRequest, async (route) => {
      if (route.request().method() !== 'PATCH') {
        await route.continue()
        return
      }

      patchRequestCount += 1

      // Hold the first autosave request open, simulating a slow round-trip. This lets
      // us keep editing the form (moving to a different field) while it is still in
      // flight, and later resolve it with the stale, partially-typed value it was sent
      // with. Autosave requests are queued and sent strictly one at a time, so a second
      // request can only be dispatched (and land here) once the first one's response has
      // already been merged into form state - at which point we hold it forever. This
      // isolates the effect of the first (stale) response's merge from any subsequent,
      // corrective autosave that would otherwise overwrite it with the fresher value and
      // mask the bug.
      if (patchRequestCount === 1) {
        await firstRequestReleased
        await route.continue()
        // Signal that this route has already been continued, so the test knows it's
        // safe to unroute without racing Playwright's own auto-continue-on-unroute.
        resolveFirstRequestHandled()
        return
      }

      await new Promise<void>(() => {
        // Never resolves - intentionally holds all subsequent autosave requests forever.
      })
    })

    // Type a partial value into the title field. Once the debounce elapses, this
    // fires the first (held) autosave request with the incomplete text "Hel".
    await titleField.fill('Hel')

    await expect.poll(() => patchRequestCount).toBe(1)

    // Finish typing in the title field, then immediately move to another field and
    // keep typing - all while the first autosave request for "Hel" is still pending.
    await titleField.pressSequentially('lo')
    await subtitleField.fill('World')

    // Now let the stale first request resolve. Before the fix, this reverted the
    // title field back to "Hel" because switching to `subtitle` had already cleared
    // `title`'s modified protection.
    releaseFirstRequest()
    await firstRequestHandled

    // Wait for the second (corrective) autosave request to be dispatched and held.
    // Since requests are processed strictly one at a time, reaching this point
    // guarantees the first response has already been merged into form state.
    await expect.poll(() => patchRequestCount).toBe(2)

    await expect(titleField).toHaveValue('Hello')
    await expect(subtitleField).toHaveValue('World')

    await page.unroute(isAutosaveRequest)
  })

  test('autosave - should not remount an open relationship list drawer when an unmodified field is merged', async () => {
    const relatedDoc = await payload.create({
      collection: autosavePostsSlug,
      data: {
        title: 'Related Post',
      },
    })

    const doc = await payload.create({
      collection: autosavePostsSlug,
      data: {
        title: 'Initial Title',
        // The relationship field must already hold a value for this to reproduce the bug: an
        // empty/untouched value has nothing to get a new (but content-equal) reference on merge.
        relatedPosts: [relatedDoc.id],
      },
    })

    await page.goto(autosavePostsUrl.edit(doc.id))
    await waitForFormReady(page)

    // Open the relationship field's list drawer (appearance: 'drawer') and wait for it to load.
    await page.locator('#field-relatedPosts').click()
    const listDrawerContent = page.locator('.list-drawer .drawer__content')
    await expect(listDrawerContent).toBeVisible()
    await expect(listDrawerContent.locator('table tbody tr').first()).toBeVisible()

    // Tag the currently-rendered drawer content so we can detect if it gets unmounted and
    // replaced with a fresh element later - which is what a "remount" (the reported flicker)
    // would look like, even if the drawer stays open and its content looks the same.
    await listDrawerContent.evaluate((el) => {
      el.setAttribute('data-test-remount-marker', 'still-here')
    })

    // Edit a field unrelated to the relationship field and let autosave run to completion.
    // Before the fix, the relationship field's unmodified (but object/array-valued) value would
    // get a brand new, content-identical reference on every accepted autosave merge, causing its
    // list drawer to recompute its filter options and remount - even though nothing about the
    // relationship field itself changed.
    await page.locator('#field-title').fill('Updated Title')
    await waitForAutoSaveToRunAndComplete(page)

    await expect(listDrawerContent).toBeVisible()
    await expect(listDrawerContent).toHaveAttribute('data-test-remount-marker', 'still-here')

    await payload.delete({ collection: autosavePostsSlug, id: doc.id })
    await payload.delete({ collection: autosavePostsSlug, id: relatedDoc.id })
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
    })

    await page.goto(autosavePostsUrl.edit(autosavePost.id))
    await waitForFormReady(page)

    const field = page.locator('#field-title')
    await expect(field).toBeEnabled()

    const cdpSession = await throttleTest({
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
      await cdpSession.send('Network.emulateNetworkConditions', {
        downloadThroughput: -1,
        latency: 0,
        offline: false,
        uploadThroughput: -1,
      })

      await cdpSession.detach()
    }
  })

  describe('Throttled tests', () => {
    let cdpSession: CDPSession

    beforeEach(async () => {
      await page.goto(postsUrl.create)
      await waitForFormReady(page)

      const field = page.locator('#field-title')
      await field.fill('Test')
      await expect(field).toBeEnabled()
      // Wait to ensure form state request from the field fill is done. Otherwise, it could
      // affect the request tracking of other tests depending on how fast they run
      await wait(1000)

      cdpSession = await throttleTest({
        context,
        delay: 'Slow 3G',
        page,
      })
    })

    afterEach(async () => {
      await cdpSession.send('Network.emulateNetworkConditions', {
        downloadThroughput: -1,
        latency: 0,
        offline: false,
        uploadThroughput: -1,
      })

      await cdpSession.detach()
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
      // eslint-disable-next-line playwright/no-wait-for-selector
      await page.waitForSelector('#field-array #array-row-0 .shimmer-effect')

      // Wait for the first request to be sent
      await expect.poll(() => requestCount).toBe(1)

      // Before the first request comes back, add the second row and expect an optimistic loading state
      await addArrayRowAsync(page, 'array')
      await expect(page.locator('#field-array #array-row-1')).toBeVisible()

      // use waitForSelector because the shimmer effect is not always visible
      // eslint-disable-next-line playwright/no-wait-for-selector
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

    test.fixme(
      'should not cause nested custom components to disappear when adding rows back-to-back',
      async () => {
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
            // eslint-disable-next-line playwright/no-wait-for-selector
            await page.waitForSelector(
              '#field-array #array-row-0 #field-array__0__customTextField',
              {
                timeout: TEST_TIMEOUT,
              },
            )

            // use `waitForSelector` to ensure the element doesn't appear and then disappear
            // eslint-disable-next-line playwright/no-wait-for-selector
            await page.waitForSelector(
              '#field-array #array-row-1 #field-array__1__customTextField',
              {
                timeout: TEST_TIMEOUT,
              },
            )

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
      },
    )
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
