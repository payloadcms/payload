import type { BrowserContext, Page, Request, Route } from '@playwright/test'
import type { FormState } from 'payload'

import { expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'
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
import { autosavePostsSlug, draftPostsSlug } from './collections/Autosave/index.js'
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
    const createdDocs: { collection: typeof autosavePostsSlug | typeof postsSlug; id: string }[] =
      []

    afterEach(async () => {
      releaseRoutes()
      await page.unrouteAll({ behavior: 'ignoreErrors' })
      for (const { collection, id } of createdDocs) {
        await payload.delete({ collection, id })
      }
      createdDocs.length = 0
    })

    test('should discard stale autosave responses and save the latest revision', async () => {
      const doc = await payload.create({
        collection: autosavePostsSlug,
        data: { title: 'Initial revision' },
        draft: true,
      })
      createdDocs.push({ collection: autosavePostsSlug, id: doc.id })
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

    test('should ignore errors from stale autosave responses', async () => {
      const doc = await payload.create({
        collection: autosavePostsSlug,
        data: { title: 'Initial revision' },
        draft: true,
      })
      createdDocs.push({ collection: autosavePostsSlug, id: doc.id })
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

      releaseFirst.resolve()
      await secondStarted.promise

      await expect(page.getByText('Stale autosave failure', { exact: true })).toHaveCount(0)
      await expect(titleField).toHaveValue('Latest revision')

      releaseSecond.resolve()
      await waitForAutoSaveToRunAndComplete(page)

      await expect(page.getByText('Stale autosave failure', { exact: true })).toHaveCount(0)
      await expect.poll(() => requestCount).toBe(2)
    })

    test('should persist programmatic updates made during autosave', async () => {
      const doc = await payload.create({
        collection: autosavePostsSlug,
        data: {
          programmaticValue: 'Initial programmatic value',
          title: 'Initial revision',
        },
        draft: true,
      })
      createdDocs.push({ collection: autosavePostsSlug, id: doc.id })
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

      await waitForAutoSaveToRunAndComplete(page)
      await expect(page.locator('#field-programmaticValue')).toHaveValue('Updated programmatically')
      await expect
        .poll(async () => {
          const { docs } = await payload.find({
            collection: autosavePostsSlug,
            draft: true,
            where: { id: { equals: doc.id } },
          })
          return docs[0]?.programmaticValue
        })
        .toBe('Updated programmatically')
      expect(requestCount).toBe(2)
    })

    test('should retain save errors after a queued form-state refresh', async () => {
      const doc = await payload.create({
        collection: postsSlug,
        data: { title: 'initial' },
      })
      createdDocs.push({ collection: postsSlug, id: doc.id })

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
  })

  test('should persist programmatic updates made during the post-save refresh', async () => {
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

      await page.locator('#set-programmatic-value').click()

      releaseResponse.resolve()

      await expect(page.locator('#field-computedTitle')).toHaveValue('ok Latest revision')
      await waitForAutoSaveToRunAndComplete(page)
      await expect(page.locator('#field-programmaticValue')).toHaveValue('Updated programmatically')
      await expect
        .poll(async () => {
          const { docs } = await payload.find({
            collection: autosavePostsSlug,
            draft: true,
            where: { id: { equals: doc.id } },
          })
          return docs[0]?.programmaticValue
        })
        .toBe('Updated programmatically')
      expect(requestCount).toBe(2)
    } finally {
      releaseResponse.resolve()
      await page.unrouteAll({ behavior: 'ignoreErrors' })
      await payload.delete({ collection: autosavePostsSlug, id: doc.id })
    }
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

    test('should not cause nested custom components to disappear when adding a row then editing a field', async ({}, testInfo) => {
      testInfo.setTimeout(TEST_TIMEOUT_LONG)

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

test.describe('Shared form request queue', () => {
  let payload: PayloadTestSDK<Config>
  let serverURL: string

  const createdDocs: {
    collection: 'autosave-posts' | 'draft-posts' | 'posts'
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
      data: { title: 'ok Initial value' },
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
    await page.locator('#field-title').fill('ok Updated value')
    await page.clock.runFor(200)
    await captured.promise
    await expect(page.locator('#field-computedTitle')).toHaveValue('ok Initial value')

    await page
      .locator('form.collection-edit__form')
      .evaluate((form: HTMLFormElement) => form.requestSubmit())

    released.resolve()

    await expect(saved.promise).resolves.toMatchObject({ computedTitle: 'ok Updated value' })
    await expect(page.locator('#field-computedTitle')).toHaveValue('ok Updated value')
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
  })

  test('should clear the saving indicator when an explicit save supersedes a pending autosave', async ({
    page,
  }) => {
    const doc = await payload.create({
      collection: autosavePostsSlug,
      data: { title: 'ok Initial value' },
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
    await page.locator('#field-title').fill('ok First autosave')
    await page.clock.runFor(200)
    await captured.promise
    await page.locator('#field-title').fill('ok Pending autosave')
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
      data: { title: 'ok Initial value' },
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

    await page.locator('#field-title').fill('ok Published value')
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
      data: { title: 'ok Initial value' },
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

    await title.fill('ok Autosaved value')
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

function readSubmittedData({ body }: { body: string }): Record<string, unknown> {
  const data = body.match(/name="_payload"\r?\n\r?\n([^\r\n]+)/)?.[1]

  if (!data) {
    throw new Error('The form request did not contain a serialized payload')
  }

  return JSON.parse(data) as Record<string, unknown>
}

test.describe('Server-computed autosave rows', () => {
  let payload: PayloadTestSDK<Config>
  let serverURL: string

  test.beforeAll(async () => {
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
  })

  test('should keep server-filtered rows removed on the next autosave', async ({ page }) => {
    const doc = await payload.create({
      collection: autosavePostsSlug,
      data: {
        blocks: [
          { blockType: 'text', text: 'First block' },
          { blockType: 'text', text: 'Keep this block' },
        ],
        title: 'ok Server-filtered blocks',
      },
      draft: true,
      overrideAccess: true,
    })

    try {
      await initPage({ page, serverURL })
      await page.goto(new AdminUrlUtil(serverURL, autosavePostsSlug).edit(doc.id))
      await waitForFormReady(page)
      await page.locator('#field-blocks__0__text').fill('Remove on server')
      await expect(page.locator('#field-blocks__0__text')).toHaveValue('Keep this block')
      await expect(page.locator('#field-blocks__1__text')).toHaveCount(0)

      const saved = page.waitForResponse(
        (response) =>
          response.request().method() === 'PATCH' &&
          response.url().includes(`/api/${autosavePostsSlug}/${doc.id}`) &&
          Boolean(response.request().postData()?.includes('Trigger the next autosave')),
      )

      await page.locator('#field-content').fill('Trigger the next autosave')
      await saved
      await expect
        .poll(async () => {
          const response = await page.request.get(
            formatAdminURL({
              apiRoute: '/api',
              path: `/${autosavePostsSlug}/${doc.id}`,
              serverURL,
            }),
            { params: { depth: 0, draft: true } },
          )
          const document = await response.json()

          return document.blocks?.map(({ id, text }: { id: string; text: string }) => ({
            id,
            text,
          }))
        })
        .toEqual([{ id: doc.blocks![1]!.id, text: 'Keep this block' }])
      await page.reload()
      await waitForFormReady(page)
      await expect(page.locator('#field-blocks__0__text')).toHaveValue('Keep this block')
      await expect(page.locator('#field-blocks__1__text')).toHaveCount(0)
    } finally {
      await payload.delete({ id: doc.id, collection: autosavePostsSlug, overrideAccess: true })
    }
  })
})

test.describe('Document submission outcomes', () => {
  let payload: PayloadTestSDK<Config>
  let serverURL: string
  let url: AdminUrlUtil
  const releases = new Set<() => void>()
  const createdIDs = new Set<Config['collections'][typeof draftPostsSlug]['id']>()

  test.beforeAll(async () => {
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    url = new AdminUrlUtil(serverURL, draftPostsSlug)
  })

  test.beforeEach(async ({ page }) => {
    await initPage({ page, serverURL })
  })

  test.afterEach(async ({ page }) => {
    releases.forEach((release) => release())
    releases.clear()
    await page.unrouteAll({ behavior: 'ignoreErrors' })

    for (const id of createdIDs) {
      await payload.delete({ id, collection: draftPostsSlug, overrideAccess: true })
    }

    createdIDs.clear()
  })

  test('should count a saved draft when slug generation makes its response stale', async ({
    page,
  }) => {
    const suffix = randomUUID()
    const title = `ok Late ${suffix}`
    const doc = await payload.create({
      collection: draftPostsSlug,
      data: { slug: `original-${suffix}`, _status: 'published', title: `ok Published ${suffix}` },
      overrideAccess: true,
    })

    createdIDs.add(doc.id)
    await page.goto(url.edit(doc.id))
    await waitForFormReady(page)
    await expect(page.locator('.status__value')).toHaveText('Published')
    await expect(page.locator('.pill-version-count')).toHaveText('1')
    await page.locator('#field-title').fill(title)
    await page.locator('#field-slug-lock').click()

    const slug = await holdServerFunction({ name: 'slugify', page })
    const captured = Promise.withResolvers<void>()
    const released = Promise.withResolvers<void>()

    releases.add(released.resolve)
    await page.route(`**/api/${draftPostsSlug}/${doc.id}?**`, async (route) => {
      if (route.request().method() !== 'PATCH') {
        return route.continue()
      }

      const response = await route.fetch()

      expect(response.ok()).toBe(true)
      captured.resolve()
      await released.promise
      await route.fulfill({ response })
    })
    await page.locator('#field-slug-generate').click()
    await slug.captured
    await page.locator('#action-save-draft').click()
    await captured.promise
    slug.release()
    await expect(page.locator('#field-slug')).toHaveValue(`ok-late-${suffix}`)
    released.resolve()
    await expect(page.locator('.status__value')).toHaveText('Changed')
    await expect(page.locator('.pill-version-count')).toHaveText('2')
    await expect(page.locator('#field-slug')).toHaveValue(`ok-late-${suffix}`)
    await expect(page.locator('#action-save-draft')).toBeEnabled()

    const { docs } = await payload.find({
      collection: draftPostsSlug,
      draft: true,
      overrideAccess: true,
      where: { id: { equals: doc.id } },
    })

    expect(docs[0]).toMatchObject({ slug: doc.slug, _status: 'draft', title })
  })

  test('should ignore save callbacks after resetting during the post-save refresh', async ({
    page,
  }) => {
    const doc = await payload.create({
      collection: draftPostsSlug,
      data: { title: `ok Before save ${randomUUID()}` },
      draft: true,
      overrideAccess: true,
    })
    const captured = Promise.withResolvers<void>()
    const released = Promise.withResolvers<void>()
    let hasCaptured = false

    createdIDs.add(doc.id)
    releases.add(released.resolve)
    await page.goto(url.edit(doc.id))
    await waitForFormReady(page)
    const documentState = page.locator('#document-info-state')
    const originalData = (await documentState.getAttribute('data-document-data')) ?? ''

    await page.route(`**/api/${draftPostsSlug}/access/${doc.id}**`, async (route) => {
      const response = await route.fetch()

      if (!hasCaptured) {
        hasCaptured = true
        captured.resolve()
        await released.promise
      }

      await route.fulfill({ response })
    })

    await page.locator('#field-title').fill('ok Saved before reset')
    await page.locator('#action-save-draft').click()
    await captured.promise
    await page.locator('#reset-form-state').click()
    await page.locator('#field-title').fill('ok Edited after reset')

    const refresh = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        (response.request().postData() ?? '').includes('form-state') &&
        (response.request().postData() ?? '').includes('ok Edited after reset'),
    )

    released.resolve()
    await refresh
    await expect(documentState).toHaveAttribute('data-document-data', originalData)
    await expect(page.locator('#field-title')).toHaveValue('ok Edited after reset')
    await expect(page.locator('#action-save-draft')).toBeEnabled()
  })

  async function holdServerFunction({ name, page }: { name: string; page: Page }) {
    const captured = Promise.withResolvers<void>()
    const released = Promise.withResolvers<void>()
    let hasCaptured = false

    releases.add(released.resolve)
    await page.route(
      currentFramework === 'tanstack-start' ? '**/_serverFn/**' : page.url(),
      async (route) => {
        const request = route.request()

        if (
          hasCaptured ||
          request.method() !== 'POST' ||
          !(request.postData() ?? '').includes(name)
        ) {
          return route.continue()
        }

        hasCaptured = true
        const response = await route.fetch()

        captured.resolve()
        await released.promise
        await route.fulfill({ response })
      },
    )

    return { captured: captured.promise, release: released.resolve }
  }
})

test.describe('Superseded autosaves', () => {
  let payload: PayloadTestSDK<Config>
  let serverURL: string
  let url: AdminUrlUtil
  const createdPostIDs = new Set<Config['collections']['autosave-posts']['id']>()
  const releases = new Set<() => void>()

  test.beforeAll(async () => {
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    url = new AdminUrlUtil(serverURL, autosavePostsSlug)
  })

  test.beforeEach(async ({ page }) => {
    await page.clock.install()
    await initPage({ page, serverURL })
  })

  test.afterEach(async ({ page }) => {
    releases.forEach((release) => release())
    releases.clear()
    await page.unrouteAll({ behavior: 'ignoreErrors' })

    for (const id of createdPostIDs) {
      await payload.delete({ id, collection: autosavePostsSlug, overrideAccess: true })
    }

    createdPostIDs.clear()
  })

  test('should autosave a draft after the publish replacing it fails on the server', async ({
    page,
  }) => {
    const doc = await createPost()
    const state = await queueAutosaveBehindFormState({ id: doc.id, page })

    await page.route(`**/api/${autosavePostsSlug}/${doc.id}**`, async (route) => {
      if (
        route.request().method() === 'PATCH' &&
        new URL(route.request().url()).searchParams.get('autosave') !== 'true'
      ) {
        return route.fulfill({
          contentType: 'application/json',
          json: { message: 'Publish rejected for regression test' },
          status: 400,
        })
      }

      return route.fallback()
    })

    await page.locator('#field-title').fill('ok Draft survives a rejected publish')
    await page.clock.runFor(1000)
    await expect(page.locator('.autosave')).toBeVisible()
    await page.locator('#action-save').click()

    const rejected = page.waitForResponse(
      (response) =>
        response.request().method() === 'PATCH' &&
        new URL(response.url()).pathname.endsWith(`/${autosavePostsSlug}/${doc.id}`) &&
        response.status() === 400,
    )

    state.release()
    await state.finished
    await rejected
    await page.clock.runFor(1000)
    await expect
      .poll(async () => (await readPost({ id: doc.id })).title)
      .toBe('ok Draft survives a rejected publish')
    expect((await readPost({ id: doc.id }))._status).toBe('draft')
  })

  test('should recover conditional fields after an autosave failure displaces their refresh', async ({
    page,
  }) => {
    const doc = await createPost()
    const state = await queueAutosaveBehindFormState({ id: doc.id, page })
    const status = 400
    let rejectedAutosaves = 0

    await page.route(`**/api/${autosavePostsSlug}/${doc.id}**`, async (route) => {
      const request = route.request()

      if (
        request.method() !== 'PATCH' ||
        new URL(request.url()).searchParams.get('autosave') !== 'true'
      ) {
        return route.fallback()
      }

      rejectedAutosaves += 1
      await route.fulfill({ json: { message: 'Autosave rejected' }, status })
    })

    await page.locator('label[for="field-type-custom"]').click()
    await expect(page.locator('#field-type-custom')).toBeChecked()
    await page.clock.runFor(1000)

    const rejected = page.waitForResponse(
      (response) =>
        response.status() === status &&
        response.request().method() === 'PATCH' &&
        new URL(response.url()).pathname.endsWith(`/${autosavePostsSlug}/${doc.id}`),
    )

    state.release()
    await state.finished
    await rejected
    await page.clock.runFor(1000)
    await expect(page.locator('#field-url')).toBeEditable()
    await expect(page.locator('#field-type-custom')).toBeChecked()
    await page.clock.runFor(2000)
    await expect(page.locator('.autosave')).toBeHidden()
    expect(rejectedAutosaves).toBe(1)
  })

  async function createPost() {
    const doc = await payload.create({
      collection: autosavePostsSlug,
      data: { title: 'ok Initial title' },
      draft: true,
      overrideAccess: true,
    })

    createdPostIDs.add(doc.id)

    return doc
  }

  async function queueAutosaveBehindFormState({ id, page }: { id: number | string; page: Page }) {
    await page.goto(url.edit(id))
    await waitForFormReady(page)
    await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 100)

    const autosave = await holdRequest({
      matches: (request) =>
        request.method() === 'PATCH' &&
        new URL(request.url()).searchParams.get('autosave') === 'true',
      page,
      routeURL: `**/api/${autosavePostsSlug}/${id}**`,
    })
    const state = await holdRequest({
      matches: (request) =>
        request.method() === 'POST' &&
        (request.postData() ?? '').includes('checkForStaleData') &&
        (currentFramework === 'tanstack-start'
          ? (request.postData() ?? '').includes('form-state')
          : Boolean(request.headers()['next-action'])),
      page,
      routeURL: currentFramework === 'tanstack-start' ? '**/_serverFn/**' : url.edit(id),
    })

    await page.locator('#field-title').fill('ok Saved before the pending edit')
    await page.clock.runFor(1000)
    await autosave.captured
    autosave.release()
    await autosave.finished
    await state.captured
    await page.clock.runFor(1000)
    await expect(page.locator('.autosave')).toBeHidden()

    return state
  }

  async function holdRequest({
    matches,
    page,
    routeURL,
  }: {
    matches: (request: Request) => boolean
    page: Page
    routeURL: string
  }) {
    const captured = Promise.withResolvers<void>()
    const released = Promise.withResolvers<void>()
    const finished = Promise.withResolvers<void>()
    const release = () => released.resolve()
    let didCapture = false

    releases.add(release)
    await page.route(routeURL, async (route) => {
      if (!matches(route.request()) || didCapture) {
        return route.continue()
      }

      didCapture = true

      const response = await route.fetch()

      captured.resolve()
      await released.promise
      await route.fulfill({ response })
      finished.resolve()
    })

    return { captured: captured.promise, finished: finished.promise, release }
  }

  async function readPost({ id }: { id: number | string }) {
    const { docs } = await payload.find({
      collection: autosavePostsSlug,
      depth: 0,
      draft: true,
      where: { id: { equals: id } },
    })

    return docs[0]!
  }
})
