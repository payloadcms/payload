import type { BrowserContext, Page, Request, Route } from '@playwright/test'
import type { FormState } from 'payload'

import { expect } from '@playwright/test'
import * as path from 'path'
import { formatAdminURL, wait } from 'payload/shared'
import { fromJSON } from 'seroval'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config, Post } from './payload-types.js'

import { assertElementStaysVisible } from '../__helpers/e2e/assertElementStaysVisible.js'
import { assertNetworkRequests } from '../__helpers/e2e/assertNetworkRequests.js'
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
import { draftPostsSlug } from './collections/DraftPosts/index.js'
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
    const hydration = Promise.withResolvers<void>()
    const scriptURL = '**/_next/static/**/*.js*'
    const holdHydration = async (route: Route) => {
      await hydration.promise
      await route.fallback()
    }

    // Keep hydration from finishing before the disabled state can be observed.
    await page.route(scriptURL, holdHydration)

    try {
      await page.goto(postsUrl.create, { waitUntil: 'commit' })
      await expect(page.locator('#field-title')).toBeDisabled()
    } finally {
      hydration.resolve()
      await page.unroute(scriptURL, holdHydration)
    }

    await expect(page.locator('#field-title')).toBeEnabled()
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

  // Asserts the lastRenderedPath optimization by inspecting outgoing form-state requests on both frameworks.
  // Previously rendered fields should retain their rendering paths as new array rows are added.
  test('should send `lastRenderedPath` only when necessary', async () => {
    await page.goto(postsUrl.create)
    await waitForFormReady(page)
    await page.locator('#field-title').fill('Test')

    // Both frameworks send the same form state, but TanStack wraps it in a Seroval-encoded RPC payload.
    const readFormState = ({ request }: { request: Request }): FormState | undefined => {
      if (currentFramework === 'tanstack-start') {
        const { data }: { data: { args: { formState?: FormState }; name: string } } = fromJSON(
          request.postDataJSON(),
        )

        return data.name === 'form-state' ? data.args.formState : undefined
      }

      const body = request.postDataJSON() as { args: { formState?: FormState } }[]

      return body[0]?.args?.formState
    }

    // Add three rows to check that each request remembers fields rendered by earlier requests.
    for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
      const requestPromise = page.waitForRequest((request) => {
        const isFormStateURL =
          currentFramework === 'tanstack-start'
            ? request.url().startsWith(`${serverURL}/_serverFn/`)
            : request.url() === postsUrl.create

        return (
          request.method() === 'POST' &&
          isFormStateURL &&
          Boolean(readFormState({ request })?.array)
        )
      })

      await addArrayRowAsync(page, 'array')

      const request = await requestPromise
      const formState = readFormState({ request })
      const response = await request.response()

      // The `array` itself SHOULD have a `lastRenderedPath` because it was rendered on initial load.
      expect(formState?.array.lastRenderedPath).toBe('array')
      expect(formState?.array.customComponents).toBeUndefined()
      expect(formState?.array.rows).toHaveLength(rowIndex + 1)
      expect(formState?.title.value).toBe('Test')

      for (const [index, row] of (formState?.array.rows ?? []).entries()) {
        expect(row.id).toBe(formState?.[`array.${index}.id`]?.value)
        expect(row.customComponents).toBeUndefined()
      }

      // Each earlier row's custom text field SHOULD ALSO have a `lastRenderedPath` because it was rendered in a previous request.
      // The second request checks the first row; the third request checks both earlier rows.
      for (let renderedRowIndex = 0; renderedRowIndex < rowIndex; renderedRowIndex++) {
        const fieldPath = `array.${renderedRowIndex}.customTextField`

        expect(formState?.[fieldPath]?.lastRenderedPath).toBe(fieldPath)
        expect(formState?.array.rows?.[renderedRowIndex]?.lastRenderedPath).toBe(
          `array.${renderedRowIndex}`,
        )
        expect(formState?.[fieldPath]?.initialValue).toBe('This is a default value')
        expect(formState?.[fieldPath]?.customComponents).toBeUndefined()
      }

      expect(response?.status()).toBe(200)
      expect(response?.headers()['content-type']?.split(';')[0].trim()).toBe('text/x-component')
      await expect(page.locator(`#field-array__${rowIndex}__customTextField`)).toBeVisible()
      await expect(page.locator('#field-array .array-field__row')).toHaveCount(rowIndex + 1)
    }
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

  test('should finish post-save rebuilding before a pending edit refresh', async () => {
    const doc = await createPost({ title: 'Before save' })
    const { page: savePage } = await initPage({ context, serverURL })
    const editURL = postsUrl.edit(doc.id)
    const backgroundStarted = Promise.withResolvers<void>()
    const releaseBackground = Promise.withResolvers<void>()
    const backgroundReleased = Promise.withResolvers<void>()
    const permissionsStarted = Promise.withResolvers<void>()
    const releasePermissions = Promise.withResolvers<void>()
    let hasHeldBackground = false
    let hasHeldPermissions = false

    try {
      await savePage.clock.install()
      await savePage.goto(editURL)
      await waitForFormReady(savePage)
      await savePage.clock.pauseAt(await savePage.evaluate(() => Date.now() + 1000))

      await savePage.route(
        (url) =>
          url.href === editURL ||
          (currentFramework === 'tanstack-start' && url.pathname.startsWith('/_serverFn/')),
        async (route) => {
          const request = route.request()

          if (request.method() !== 'POST' || hasHeldBackground) {
            return route.fallback()
          }

          const call = (
            currentFramework === 'tanstack-start'
              ? fromJSON(request.postDataJSON()).data
              : request.postDataJSON()[0]
          ) as { name?: string }

          if (call?.name !== 'form-state') {
            return route.fallback()
          }

          hasHeldBackground = true
          const response = await route.fetch()

          backgroundStarted.resolve()
          await releaseBackground.promise
          await route.fulfill({ response })
          backgroundReleased.resolve()
        },
      )
      await savePage.route(`**/api/posts/access/${doc.id}*`, async (route) => {
        if (hasHeldPermissions || route.request().method() !== 'POST') {
          return route.fallback()
        }

        hasHeldPermissions = true
        const response = await route.fetch()

        permissionsStarted.resolve()
        await releasePermissions.promise
        await route.fulfill({ response })
      })

      const titleField = savePage.locator('#field-title')

      await titleField.fill('Intermediate title')
      await savePage.clock.runFor(300)
      await backgroundStarted.promise
      await titleField.fill('After save')
      await savePage.clock.runFor(300)
      await savePage.locator('#action-save').click()
      releaseBackground.resolve()
      await backgroundReleased.promise
      await permissionsStarted.promise
      await savePage.clock.runFor(300)
      releasePermissions.resolve()
      await savePage.clock.resume()

      await expect(savePage.locator('.payload-toast-container')).toContainText('successfully')
      await expect(savePage.locator('#field-computedTitle')).toHaveValue('After save')
    } finally {
      releaseBackground.resolve()
      releasePermissions.resolve()
      await savePage.unrouteAll({ behavior: 'wait' })
      await savePage.close()
    }
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

test.describe('Shared form request queue', () => {
  let payload: PayloadTestSDK<Config>
  let serverURL: string

  const createdDocs: {
    collection: 'autosave-posts' | 'conditions' | 'draft-posts' | 'posts'
    id: Post['id']
  }[] = []

  const releases = new Set<() => void>()

  test.beforeAll(async () => {
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
  })

  test.beforeEach(async ({ page }) => {
    await page.clock.install()
    await initPage({ page, serverURL })
  })

  test.afterEach(async ({ page }) => {
    releases.forEach((release) => release())
    releases.clear()

    await page.unrouteAll({ behavior: 'ignoreErrors' })

    for (const { collection, id } of createdDocs) {
      await payload.delete({ collection, id, overrideAccess: true })
    }

    createdDocs.length = 0
  })

  for (const failure of ['HTTP error', 'network error'] as const) {
    test(`should refresh conditional fields after an explicit save ${failure}`, async ({
      page,
    }) => {
      const doc = await payload.create({
        collection: conditionsSlug,
        data: { showField: true, conditionalRowField: 'Initial value' },
        overrideAccess: true,
      })
      const captured = Promise.withResolvers<void>()
      const released = Promise.withResolvers<void>()
      const failed = Promise.withResolvers<void>()
      const editURL = new AdminUrlUtil(serverURL, conditionsSlug).edit(doc.id)
      let didHoldRefresh = false

      createdDocs.push({ collection: conditionsSlug, id: doc.id })
      releases.add(released.resolve)

      await page.goto(editURL)
      await waitForFormReady(page)
      await page.clock.pauseAt(new Date(Date.now() + 1000))

      const checkbox = page.locator('#field-showField')
      const conditionalField = page.locator('#field-conditionalRowField')
      const save = page.locator('#action-save')
      const prepared = page.waitForResponse(
        (response) =>
          response.request().method() === 'PATCH' &&
          response.url().includes(`/api/${conditionsSlug}/${doc.id}`) &&
          response.ok(),
      )

      await conditionalField.fill('Prepared value')
      await save.click()
      await prepared
      await waitForFormReady(page)

      await page.route(
        (url) => url.href === editURL || url.pathname.startsWith('/_serverFn/'),
        async (route) => {
          if (
            didHoldRefresh ||
            route.request().method() !== 'POST' ||
            !route.request().postData()?.includes('form-state')
          ) {
            return route.continue()
          }

          didHoldRefresh = true
          const response = await route.fetch()

          captured.resolve()
          await released.promise
          await route.fulfill({ response })
        },
      )
      await page.route(`**/api/${conditionsSlug}/${doc.id}**`, async (route) => {
        if (route.request().method() !== 'PATCH') {
          return route.continue()
        }

        if (failure === 'network error') {
          await route.abort('failed')
        } else {
          await route.fulfill({ status: 500, json: { message: 'Save failed' } })
        }

        failed.resolve()
      })

      await checkbox.uncheck()
      await page.clock.runFor(300)
      await captured.promise
      await checkbox.check()
      await page.clock.runFor(300)
      await save.click()

      released.resolve()

      await failed.promise
      await expect(save).toBeEnabled()
      await page.clock.runFor(1000)
      await expect(checkbox).toBeChecked()
      await expect(conditionalField).toBeVisible()
    })
  }

  for (const submissionType of ['submit', 'autosave'] as const) {
    test(`should retain client validation errors after a rejected ${submissionType}`, async ({
      page,
    }) => {
      const captured = Promise.withResolvers<void>()
      const released = Promise.withResolvers<void>()
      const viewURL = formatAdminURL({
        adminRoute: '/admin',
        path: '/client-validation',
        serverURL,
      })
      let didHoldRefresh = false
      let saveCount = 0

      releases.add(released.resolve)

      await page.goto(viewURL)

      const form = page.locator(`.client-validation-form--${submissionType}`)
      const field = form.getByRole('textbox', { name: 'Client validated value', exact: true })
      const error = form
        .getByRole('alert')
        .filter({ hasText: 'This value is rejected by client validation.' })
      const submit = form.getByRole('button', { name: 'Submit', exact: true })

      await expect(form).toHaveAttribute('data-form-ready', 'true')
      await expect(field).toBeVisible()
      await page.clock.runFor(200)
      await page.clock.pauseAt(new Date(Date.now() + 1000))

      await page.route(
        (url) => url.href === viewURL || url.pathname.startsWith('/_serverFn/'),
        async (route) => {
          if (
            didHoldRefresh ||
            route.request().method() !== 'POST' ||
            !route.request().postData()?.includes('form-state')
          ) {
            return route.continue()
          }

          didHoldRefresh = true
          const response = await route.fetch()

          expect(await response.text()).toContain('clientValidatedValue')

          captured.resolve()
          await released.promise
          await route.fulfill({ response })
        },
      )
      await page.route(
        (url) => url.pathname === `/api/${conditionsSlug}`,
        async (route) => {
          if (route.request().method() !== 'POST') {
            return route.continue()
          }

          saveCount += 1

          const response = await route.fetch()
          const json = await response.json()

          if (response.ok() && json.doc?.id) {
            createdDocs.push({ collection: conditionsSlug, id: json.doc.id })
          }

          await route.fulfill({ response })
        },
      )

      await submit.click()
      await captured.promise
      await expect(submit).toBeDisabled()

      // Exercise the onChange debounce before the submission refresh can finish.
      await page.clock.runFor(300)
      await page.clock.setSystemTime(new Date(await page.evaluate(() => Date.now() + 2000)))

      released.resolve()

      await expect(submit).toBeEnabled()
      await expect.poll(() => saveCount).toBe(0)
      await expect(field).toHaveAttribute('aria-invalid', 'true')
      await expect(error).toContainText('This value is rejected by client validation.')
      await expect(error).toBeVisible()

      const saved = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          new URL(response.url()).pathname === `/api/${conditionsSlug}` &&
          response.status() === 201,
      )

      await field.fill('Allowed value')
      await submit.click()

      const response = await saved
      const { doc } = await response.json()

      await expect(submit).toBeEnabled()
      await expect(field).not.toHaveAttribute('aria-invalid', 'true')
      await expect(error).toBeHidden()
      await expect
        .poll(async () => {
          const { docs } = await payload.find({
            collection: conditionsSlug,
            overrideAccess: true,
            where: { id: { equals: doc.id } },
          })

          return docs[0]?.clientValidatedValue
        })
        .toBe('Allowed value')
    })
  }

  test('should preserve edits made during a queued autosave', async ({ page }) => {
    const doc = await payload.create({
      collection: autosavePostsSlug,
      data: { title: 'Initial value' },
      draft: true,
      overrideAccess: true,
    })
    const saves = Array.from({ length: 3 }, () => ({
      captured: Promise.withResolvers<void>(),
      released: Promise.withResolvers<void>(),
    }))
    const submittedValues: unknown[] = []
    const readDraftValue = async () => {
      const { docs } = await payload.find({
        collection: autosavePostsSlug,
        draft: true,
        overrideAccess: true,
        where: { id: { equals: doc.id } },
      })

      return docs[0]?.restrictedValue
    }

    createdDocs.push({ collection: autosavePostsSlug, id: doc.id })
    saves.forEach(({ released }) => releases.add(released.resolve))

    await page.goto(new AdminUrlUtil(serverURL, autosavePostsSlug).edit(doc.id))
    await waitForFormReady(page)
    await page.clock.pauseAt(new Date(Date.now() + 1000))

    await page.route(`**/api/${autosavePostsSlug}/${doc.id}**`, async (route) => {
      if (
        route.request().method() !== 'PATCH' ||
        new URL(route.request().url()).searchParams.get('autosave') !== 'true'
      ) {
        return route.continue()
      }

      const save = saves[submittedValues.length]

      submittedValues.push(
        readSubmittedData({ body: route.request().postData() ?? '' }).restrictedValue,
      )

      const response = await route.fetch()

      if (save) {
        save.captured.resolve()
        await save.released.promise
      }

      await route.fulfill({ response })
    })

    const field = page.locator('#field-restrictedValue')
    const savingIndicator = page.locator('.autosave')

    await field.fill('a')
    await page.clock.runFor(100)
    await saves[0].captured.promise

    await field.fill('ab')
    await page.clock.runFor(100)
    await expect.poll(() => submittedValues).toEqual(['a'])

    saves[0].released.resolve()
    await saves[1].captured.promise
    await expect.poll(() => submittedValues).toEqual(['a', 'ab'])
    await expect(savingIndicator).toBeVisible()

    await field.fill('abc')

    // Elapse the saving indicator's minimum duration without firing the last edit's debounce.
    await page.clock.setSystemTime(new Date(await page.evaluate(() => Date.now() + 2000)))
    saves[1].released.resolve()
    await expect(savingIndicator).toBeHidden()
    await expect(field).toHaveValue('abc')
    await expect.poll(() => submittedValues).toEqual(['a', 'ab'])
    await expect.poll(readDraftValue).toBe('ab')

    await page.clock.runFor(100)
    await saves[2].captured.promise
    await page.clock.setSystemTime(new Date(await page.evaluate(() => Date.now() + 2000)))
    saves[2].released.resolve()
    await expect(savingIndicator).toBeHidden()
    await expect.poll(() => submittedValues).toEqual(['a', 'ab', 'abc'])
    await expect.poll(readDraftValue).toBe('abc')

    await page.reload()
    await waitForFormReady(page)
    await expect(field).toHaveValue('abc')
  })

  test('should refresh conditional fields when an autosave supersedes a refresh and fails', async ({
    page,
  }) => {
    const doc = await payload.create({
      collection: autosavePostsSlug,
      data: { title: 'Initial value' },
      draft: true,
      overrideAccess: true,
    })
    const editURL = new AdminUrlUtil(serverURL, autosavePostsSlug).edit(doc.id)
    const captured = Promise.withResolvers<void>()
    const released = Promise.withResolvers<void>()
    const failedAutosave = Promise.withResolvers<void>()
    let autosaveCount = 0
    let didHoldRefresh = false

    createdDocs.push({ collection: autosavePostsSlug, id: doc.id })
    releases.add(released.resolve)

    await page.goto(editURL)
    await waitForFormReady(page)

    await page.route(
      (url) => url.href === editURL || url.pathname.startsWith('/_serverFn/'),
      async (route) => {
        if (
          didHoldRefresh ||
          route.request().method() !== 'POST' ||
          !route.request().postData()?.includes('form-state')
        ) {
          return route.continue()
        }

        didHoldRefresh = true
        const response = await route.fetch()

        captured.resolve()
        await released.promise
        await route.fulfill({ response })
      },
    )

    await page.route(`**/api/${autosavePostsSlug}/${doc.id}**`, async (route) => {
      if (
        route.request().method() !== 'PATCH' ||
        new URL(route.request().url()).searchParams.get('autosave') !== 'true'
      ) {
        return route.continue()
      }

      autosaveCount += 1

      if (autosaveCount === 1) {
        return route.fulfill({ response: await route.fetch() })
      }

      await route.fulfill({
        status: 500,
        json: { message: 'Autosave failed' },
      })
      failedAutosave.resolve()
    })

    await expect(page.locator('#field-conditionalField')).toBeHidden()
    await page.locator('#field-restrictedValue').fill('First autosave')
    await page.clock.runFor(200)
    await captured.promise

    await page.locator('#field-showConditionalField').check()
    await page.clock.runFor(500)

    released.resolve()

    await failedAutosave.promise
    await page.clock.runFor(1000)
    await expect(page.locator('#field-showConditionalField')).toBeChecked()
    await expect(page.locator('#field-conditionalField')).toBeVisible()
  })

  for (const failure of ['HTTP error', 'network error'] as const) {
    test(`should refresh form state after an autosave ${failure} without a pending refresh`, async ({
      page,
    }) => {
      const doc = await payload.create({
        collection: autosavePostsSlug,
        data: { title: 'Initial value' },
        draft: true,
        overrideAccess: true,
      })

      createdDocs.push({ collection: autosavePostsSlug, id: doc.id })

      await page.goto(new AdminUrlUtil(serverURL, autosavePostsSlug).edit(doc.id))
      await waitForFormReady(page)
      await page.clock.pauseAt(new Date(Date.now() + 1000))

      await page.route(`**/api/${autosavePostsSlug}/${doc.id}**`, async (route) => {
        if (route.request().method() !== 'PATCH') {
          return route.continue()
        }

        if (failure === 'network error') {
          return route.abort('failed')
        }

        await route.fulfill({ status: 500, json: { message: 'Autosave failed' } })
      })

      await page.locator('#field-showConditionalField').check()
      await page.clock.runFor(100)

      await expect(page.locator('#field-conditionalField')).toBeVisible()
    })
  }

  test('should restore field focus after a keyboard save', async ({ page }) => {
    const doc = await payload.create({
      collection: postsSlug,
      data: { title: 'Initial value' },
      overrideAccess: true,
    })

    const captured = Promise.withResolvers<void>()
    const released = Promise.withResolvers<void>()

    createdDocs.push({ collection: postsSlug, id: doc.id })
    releases.add(released.resolve)

    await page.route(`**/api/${postsSlug}/${doc.id}**`, async (route) => {
      if (route.request().method() !== 'PATCH') {
        return route.continue()
      }

      captured.resolve()

      await released.promise
      await route.fulfill({ response: await route.fetch() })
    })

    await page.goto(new AdminUrlUtil(serverURL, postsSlug).edit(doc.id))
    await waitForFormReady(page)
    const title = page.locator('#field-title')

    await title.fill('Keyboard save')

    const modifier = await page.evaluate(() =>
      navigator.userAgent.includes('Mac OS X') ? 'Meta' : 'Control',
    )

    await title.press(`${modifier}+s`)
    await captured.promise
    await expect(title).toBeDisabled()

    released.resolve()

    await expect(title).toBeEnabled()
    await expect(title).toBeFocused()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
  })

  test('should wait for a form-state refresh before starting an explicit save', async ({
    page,
  }) => {
    const doc = await payload.create({
      collection: postsSlug,
      data: { title: 'Initial value' },
      overrideAccess: true,
    })

    const captured = Promise.withResolvers<void>()
    const released = Promise.withResolvers<void>()
    const saved = Promise.withResolvers<Record<string, unknown>>()
    const editURL = new AdminUrlUtil(serverURL, postsSlug).edit(doc.id)
    let saveCount = 0

    createdDocs.push({ collection: postsSlug, id: doc.id })
    releases.add(released.resolve)
    await page.goto(editURL)
    await waitForFormReady(page)

    await page.route(
      (url) => url.href === editURL || url.pathname.startsWith('/_serverFn/'),
      async (route) => {
        if (
          route.request().method() !== 'POST' ||
          !route.request().postData()?.includes('form-state')
        ) {
          return route.continue()
        }
        const response = await route.fetch()

        captured.resolve()
        await released.promise
        await route.fulfill({ response })
      },
    )

    await page.route(`**/api/${postsSlug}/${doc.id}**`, async (route) => {
      if (route.request().method() !== 'PATCH') {
        return route.continue()
      }

      saveCount += 1
      saved.resolve(readSubmittedData({ body: route.request().postData() ?? '' }))
      await route.fulfill({ response: await route.fetch() })
    })

    await page.locator('#field-title').fill('Edited value')
    await page.clock.runFor(500)
    await captured.promise
    await page.locator('#action-save').click()
    await page.clock.runFor(500)
    expect(saveCount).toBe(0)

    await expect(page.locator('#action-save')).toBeDisabled()
    await expect(page.locator('#field-title')).toBeDisabled()

    released.resolve()

    await expect(saved.promise).resolves.toMatchObject({ title: 'Edited value' })
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
  })

  test('should submit values merged by the preceding queued autosave', async ({ page }) => {
    const doc = await payload.create({
      collection: autosavePostsSlug,
      data: { title: 'Initial value' },
      draft: true,
      overrideAccess: true,
    })

    const captured = Promise.withResolvers<void>()
    const released = Promise.withResolvers<void>()
    const saved = Promise.withResolvers<Record<string, unknown>>()

    createdDocs.push({ collection: autosavePostsSlug, id: doc.id })
    releases.add(released.resolve)

    await page.route(`**/api/${autosavePostsSlug}/${doc.id}**`, async (route) => {
      if (route.request().method() !== 'PATCH') {
        return route.continue()
      }

      const isAutosave = new URL(route.request().url()).searchParams.get('autosave') === 'true'

      if (isAutosave) {
        const response = await route.fetch()

        captured.resolve()
        await released.promise
        return route.fulfill({ response })
      }

      saved.resolve(readSubmittedData({ body: route.request().postData() ?? '' }))
      await route.fulfill({ response: await route.fetch() })
    })

    await page.goto(new AdminUrlUtil(serverURL, autosavePostsSlug).edit(doc.id))
    await waitForFormReady(page)
    await page.locator('#field-title').fill('Updated value')
    await page.clock.runFor(200)
    await captured.promise
    await expect(page.locator('#field-computedTitle')).toHaveValue('Initial value')

    await page
      .locator('form.collection-edit__form')
      .evaluate((form: HTMLFormElement) => form.requestSubmit())

    released.resolve()

    await expect(saved.promise).resolves.toMatchObject({ computedTitle: 'Updated value' })
    await expect(page.locator('#field-computedTitle')).toHaveValue('Updated value')
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
  })

  test('should clear the saving indicator when an explicit save supersedes a pending autosave', async ({
    page,
  }) => {
    const doc = await payload.create({
      collection: autosavePostsSlug,
      data: { title: 'Initial value' },
      draft: true,
      overrideAccess: true,
    })

    const captured = Promise.withResolvers<void>()
    const released = Promise.withResolvers<void>()
    const explicitSaved = Promise.withResolvers<void>()
    let didHoldAutosave = false

    createdDocs.push({ collection: autosavePostsSlug, id: doc.id })
    releases.add(released.resolve)

    await page.route(`**/api/${autosavePostsSlug}/${doc.id}**`, async (route) => {
      if (route.request().method() !== 'PATCH') {
        return route.continue()
      }

      const isAutosave = new URL(route.request().url()).searchParams.get('autosave') === 'true'

      if (isAutosave && !didHoldAutosave) {
        didHoldAutosave = true
        captured.resolve()
        await released.promise
      }

      const response = await route.fetch()
      await route.fulfill({ response })

      if (!isAutosave) {
        explicitSaved.resolve()
      }
    })

    await page.goto(new AdminUrlUtil(serverURL, autosavePostsSlug).edit(doc.id))
    await waitForFormReady(page)
    await page.locator('#field-title').fill('First autosave')
    await page.clock.runFor(200)
    await captured.promise
    await page.locator('#field-title').fill('Pending autosave')
    await page.clock.runFor(1000)
    await expect(page.locator('.autosave')).toBeVisible()

    await page.locator('form.collection-edit__form').evaluate((form: HTMLFormElement) => {
      form.requestSubmit()
    })

    released.resolve()

    await explicitSaved.promise
    await expect(page.locator('.collection-edit__form')).toHaveAttribute('data-form-ready', 'true')
    await page.clock.runFor(2000)
    await expect(page.locator('.autosave')).toBeHidden()
  })

  test('should not allow saving a draft while a publish is queued', async ({ page }) => {
    const doc = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'Initial value' },
      draft: true,
      overrideAccess: true,
    })

    const captured = Promise.withResolvers<void>()
    const released = Promise.withResolvers<void>()
    const editURL = new AdminUrlUtil(serverURL, draftPostsSlug).edit(doc.id)
    const statuses: unknown[] = []

    createdDocs.push({ collection: draftPostsSlug, id: doc.id })
    releases.add(released.resolve)
    await page.goto(editURL)
    await waitForFormReady(page)

    await page.route(
      (url) => url.href === editURL || url.pathname.startsWith('/_serverFn/'),
      async (route) => {
        if (
          route.request().method() !== 'POST' ||
          !route.request().postData()?.includes('form-state')
        ) {
          return route.continue()
        }
        const response = await route.fetch()

        captured.resolve()
        await released.promise
        await route.fulfill({ response })
      },
    )

    await page.route(`**/api/${draftPostsSlug}/${doc.id}**`, async (route) => {
      if (route.request().method() !== 'PATCH') {
        return route.continue()
      }

      statuses.push(readSubmittedData({ body: route.request().postData() ?? '' })._status)
      await route.fulfill({ response: await route.fetch() })
    })

    await page.locator('#field-title').fill('Published value')
    await page.clock.runFor(500)
    await captured.promise
    await page.locator('#action-save').click()
    await expect(page.locator('#action-save-draft')).toBeDisabled()

    released.resolve()

    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    expect(statuses).toEqual(['published'])
  })

  test('should keep the form disabled when an autosave settles while a save is queued', async ({
    page,
  }) => {
    const doc = await payload.create({
      collection: autosavePostsSlug,
      data: { title: 'Initial value' },
      draft: true,
      overrideAccess: true,
    })

    const autosaveCaptured = Promise.withResolvers<void>()
    const autosaveReleased = Promise.withResolvers<void>()
    const saveCaptured = Promise.withResolvers<void>()
    const saveReleased = Promise.withResolvers<void>()

    createdDocs.push({ collection: autosavePostsSlug, id: doc.id })
    releases.add(autosaveReleased.resolve)
    releases.add(saveReleased.resolve)

    await page.route(`**/api/${autosavePostsSlug}/${doc.id}**`, async (route) => {
      if (route.request().method() !== 'PATCH') {
        return route.continue()
      }

      const isAutosave = new URL(route.request().url()).searchParams.get('autosave') === 'true'
      const response = await route.fetch()

      if (isAutosave) {
        autosaveCaptured.resolve()
        await autosaveReleased.promise
      } else {
        saveCaptured.resolve()
        await saveReleased.promise
      }

      await route.fulfill({ response })
    })

    await page.goto(new AdminUrlUtil(serverURL, autosavePostsSlug).edit(doc.id))
    await waitForFormReady(page)
    const title = page.locator('#field-title')

    await title.fill('Autosaved value')
    await page.clock.runFor(200)
    await autosaveCaptured.promise

    // The save button is inert during autosave, so submit the form directly.
    await page
      .locator('form.collection-edit__form')
      .evaluate((form: HTMLFormElement) => form.requestSubmit())

    await expect(title).toBeDisabled()

    autosaveReleased.resolve()

    await saveCaptured.promise
    await expect(title).toBeDisabled()

    saveReleased.resolve()

    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await expect(title).toBeEnabled()
  })

  test('should reject submissions until the saved document state is applied', async ({ page }) => {
    const doc = await payload.create({
      collection: postsSlug,
      data: { title: 'Initial value' },
      overrideAccess: true,
    })

    const saved = Promise.withResolvers<void>()
    const captured = Promise.withResolvers<void>()
    const released = Promise.withResolvers<void>()
    const editURL = new AdminUrlUtil(serverURL, postsSlug).edit(doc.id)

    let didSave = false
    let saveCount = 0

    createdDocs.push({ collection: postsSlug, id: doc.id })
    releases.add(released.resolve)

    await page.goto(editURL)
    await waitForFormReady(page)

    await page.route(`**/api/${postsSlug}/${doc.id}**`, async (route) => {
      if (route.request().method() !== 'PATCH') {
        return route.continue()
      }

      saveCount += 1
      await route.fulfill({ response: await route.fetch() })
      didSave = true
      saved.resolve()
    })

    await page.route(
      (url) => url.href === editURL || url.pathname.startsWith('/_serverFn/'),
      async (route) => {
        if (
          !didSave ||
          route.request().method() !== 'POST' ||
          !route.request().postData()?.includes('form-state')
        ) {
          return route.continue()
        }

        const response = await route.fetch()

        captured.resolve()

        await released.promise
        await route.fulfill({ response })
      },
    )

    const title = page.locator('#field-title')

    await title.fill('Saved value')
    await page.clock.runFor(500)
    await page.locator('#action-save').click()
    await saved.promise
    await captured.promise

    // Fields stay disabled while processing, so only a direct submit can reach the guard here.
    await page
      .locator('form.collection-edit__form')
      .evaluate((form: HTMLFormElement) => form.requestSubmit())

    released.resolve()

    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await expect(title).toBeEnabled()
    await page.clock.runFor(500)
    await expect(page.locator('.collection-edit__form')).toHaveAttribute('data-form-ready', 'true')
    expect(saveCount).toBe(1)
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
  })
}

function readSubmittedData({ body }: { body: string }): Record<string, unknown> {
  const data = body.match(/name="_payload"\r?\n\r?\n([^\r\n]+)/)?.[1]

  if (!data) {
    throw new Error('The form request did not contain a serialized payload')
  }

  return JSON.parse(data) as Record<string, unknown>
}
