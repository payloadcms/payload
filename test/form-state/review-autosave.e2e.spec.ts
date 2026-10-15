import type { Page, Request } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { waitForFormReady } from '../__helpers/e2e/helpers.js'
import { currentFramework } from '../__helpers/e2e/playwright.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { autosavePostsSlug } from './collections/Autosave/index.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

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

  test('should autosave a draft after a queued autosave is replaced by a failed publish', async ({
    page,
  }) => {
    const doc = await createPost()
    const state = await queueAutosaveBehindFormState({ id: doc.id, page })

    await page.locator('#field-title').fill('Invalid title worth keeping as a draft')
    await page.clock.runFor(1000)
    await expect(page.locator('.autosave')).toBeVisible()
    await expect(page.locator('#action-save')).toBeEnabled()

    const rejected = page.waitForResponse(
      (response) =>
        response.request().method() === 'PATCH' &&
        new URL(response.url()).pathname.endsWith(`/${autosavePostsSlug}/${doc.id}`) &&
        new URL(response.url()).searchParams.get('autosave') !== 'true' &&
        response.status() === 400,
    )

    await page.locator('#action-save').click()
    state.release()
    await state.finished
    await rejected
    await page.clock.runFor(1000)

    await expect
      .poll(async () => (await readPost({ id: doc.id, page })).title)
      .toBe('Invalid title worth keeping as a draft')
    await page.reload()
    await waitForFormReady(page)
    await expect(page.locator('#field-title')).toHaveValue('Invalid title worth keeping as a draft')
  })

  test('should keep a successful publish published after replacing a queued autosave', async ({
    page,
  }) => {
    const doc = await createPost()
    const state = await queueAutosaveBehindFormState({ id: doc.id, page })

    await page.locator('#field-title').fill('ok Published title')
    await page.clock.runFor(1000)
    await expect(page.locator('.autosave')).toBeVisible()
    await expect(page.locator('#action-save')).toBeEnabled()
    await page.locator('#action-save').click()
    state.release()
    await state.finished

    await expect.poll(async () => (await readPost({ id: doc.id, page }))._status).toBe('published')
    await page.clock.runFor(2000)
    await expect(page.locator('#field-title')).toHaveValue('ok Published title')
    expect(await readPost({ id: doc.id, page })).toMatchObject({
      _status: 'published',
      title: 'ok Published title',
    })
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
      .poll(async () => (await readPost({ id: doc.id, page })).title)
      .toBe('ok Draft survives a rejected publish')
    expect((await readPost({ id: doc.id, page }))._status).toBe('draft')
  })

  test('should keep a successful publish published when its response cannot be parsed', async ({
    page,
  }) => {
    const doc = await createPost()
    const state = await queueAutosaveBehindFormState({ id: doc.id, page })
    const failureMonitor = await page.evaluateHandle(() => {
      // eslint-disable-next-line no-console
      const originalError = console.error
      let hasParsingError = false

      // eslint-disable-next-line no-console
      console.error = (...args) => {
        if (args[0] === 'Error submitting form' && args[1] instanceof SyntaxError) {
          hasParsingError = true
          return
        }

        originalError(...args)
      }

      return {
        hasParsingError: () => hasParsingError,
        restore: () => {
          // eslint-disable-next-line no-console
          console.error = originalError
        },
      }
    })

    try {
      await page.route(`**/api/${autosavePostsSlug}/${doc.id}**`, async (route) => {
        const request = route.request()

        if (
          request.method() === 'PATCH' &&
          new URL(request.url()).searchParams.get('autosave') !== 'true'
        ) {
          const response = await route.fetch()

          expect(response.ok()).toBe(true)
          return route.fulfill({ body: '{', contentType: 'application/json', response })
        }

        return route.fallback()
      })

      await page.locator('#field-title').fill('ok Published despite response parsing failure')
      await page.clock.runFor(1000)
      await expect(page.locator('.autosave')).toBeVisible()
      await page.locator('#action-save').click()
      state.release()
      await state.finished
      await expect
        .poll(() => failureMonitor.evaluate((monitor) => monitor.hasParsingError()))
        .toBe(true)
      await expect
        .poll(async () => {
          await page.clock.runFor(1000)

          return page.locator('.autosave').isVisible()
        })
        .toBe(false)
      expect(await readPost({ id: doc.id, page })).toMatchObject({
        _status: 'published',
        title: 'ok Published despite response parsing failure',
      })
    } finally {
      await failureMonitor.evaluate((monitor) => monitor.restore())
      await failureMonitor.dispose()
    }
  })

  for (const failure of ['message-only', 'non-JSON'] as const) {
    test(`should recover conditional fields after a ${failure} autosave failure displaces their refresh`, async ({
      page,
    }) => {
      const doc = await createPost()
      const state = await queueAutosaveBehindFormState({ id: doc.id, page })
      const status = failure === 'message-only' ? 400 : 503
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
        await route.fulfill(
          failure === 'message-only'
            ? { json: { message: 'Autosave rejected' }, status }
            : { body: '<h1>Service unavailable</h1>', contentType: 'text/html', status },
        )
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
  }

  async function createPost() {
    const doc = await payload.create({
      collection: autosavePostsSlug,
      data: { slug: randomUUID(), title: 'ok Initial title' },
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
})

async function readPost({ id, page }: { id: number | string; page: Page }) {
  const query = qs.stringify({ depth: 0, draft: true }, { addQueryPrefix: true })
  const response = await page.request.get(
    formatAdminURL({
      apiRoute: '/api',
      path: `/${autosavePostsSlug}/${id}${query}`,
      serverURL: new URL(page.url()).origin,
    }),
  )

  expect(response.ok()).toBe(true)

  return response.json() as Promise<Config['collections']['autosave-posts']>
}
