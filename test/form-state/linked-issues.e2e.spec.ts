import type { Page, Request } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { openArrayRowActions } from '../__helpers/e2e/fields/array/index.js'
import { addBlock, reorderBlocks } from '../__helpers/e2e/fields/blocks/index.js'
import { waitForFormReady } from '../__helpers/e2e/helpers.js'
import { currentFramework } from '../__helpers/e2e/playwright.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { autosavePostsSlug, draftPostsSlug } from './collections/Autosave/index.js'
import { formMediaSlug } from './collections/Media/index.js'
import { postsSlug } from './collections/Posts/index.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

test.describe('Linked autosave issues', () => {
  let payload: PayloadTestSDK<Config>
  let serverURL: string
  let autosaveURL: AdminUrlUtil
  let draftURL: AdminUrlUtil
  let postsURL: AdminUrlUtil
  const releases = new Set<() => void>()

  test.beforeAll(async () => {
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    autosaveURL = new AdminUrlUtil(serverURL, autosavePostsSlug)
    draftURL = new AdminUrlUtil(serverURL, draftPostsSlug)
    postsURL = new AdminUrlUtil(serverURL, postsSlug)
  })

  test.beforeEach(async ({ page }) => {
    await page.clock.install()
    await initPage({ page, serverURL })
  })

  test.afterEach(async ({ page }) => {
    releases.forEach((release) => release())
    releases.clear()
    await page.unrouteAll({ behavior: 'ignoreErrors' })
  })

  test('should keep the initial static slug through overlapping autosaves (#15430)', async ({
    page,
  }) => {
    await page.goto(autosaveURL.create)
    await waitForFormReady(page)

    const slugField = page.locator('#field-slug')

    await expect(slugField).not.toHaveValue('')

    const initialSlug = await slugField.inputValue()
    const heldRequests = await holdRequests({
      matches: isAutosave,
      page,
      url: `**/api/${autosavePostsSlug}/**`,
    })

    const first = heldRequests[0]!

    await page.locator('#field-title').fill('ok P')
    await first.captured
    await page.locator('#field-title').fill('ok Page title entered completely')
    first.release()

    await expect(page.locator('#field-computedTitle')).toHaveValue(
      'ok Page title entered completely',
    )
    await expect(slugField).toHaveValue(initialSlug)
    await page.reload()
    await waitForFormReady(page)
    await expect(slugField).toHaveValue(initialSlug)
    await expect(page.locator('#field-title')).toHaveValue('ok Page title entered completely')
  })

  test('should preserve both fields when switching inputs during autosave (#17676)', async ({
    page,
  }) => {
    const doc = await createAutosavePost()

    await page.goto(autosaveURL.edit(doc.id))
    await waitForFormReady(page)

    const heldRequests = await holdRequests({
      matches: isAutosave,
      page,
      url: autosaveRoute({ id: doc.id }),
    })

    const first = heldRequests[0]!

    await page.locator('#field-title').fill('ok Partial title')
    await first.captured
    await page.locator('#field-title').fill('ok Complete title')
    await page.locator('#field-content').fill('Text in the second field')
    first.release()

    await expect(page.locator('#field-title')).toHaveValue('ok Complete title')
    await expect(page.locator('#field-content')).toHaveValue('Text in the second field')
    await expect
      .poll(async () => {
        const saved = await readDocument({ id: doc.id, collection: autosavePostsSlug, page })

        return { content: saved.content, title: saved.title }
      })
      .toEqual({ content: 'Text in the second field', title: 'ok Complete title' })
    await page.reload()
    await waitForFormReady(page)
    await expect(page.locator('#field-title')).toHaveValue('ok Complete title')
    await expect(page.locator('#field-content')).toHaveValue('Text in the second field')
  })

  test('should preserve media-picker search and focus when autosave completes (#17676)', async ({
    page,
  }) => {
    const media = await payload.create({
      collection: formMediaSlug,
      data: { alt: 'Autosave picker fixture' },
      filePath: path.resolve(dirname, '../uploads/image.png'),
      overrideAccess: true,
    })

    try {
      const doc = await createAutosavePost()

      await page.goto(autosaveURL.edit(doc.id))
      await waitForFormReady(page)

      const heldRequests = await holdRequests({
        matches: isAutosave,
        page,
        url: autosaveRoute({ id: doc.id }),
      })

      const first = heldRequests[0]!

      await page.locator('#field-title').fill('ok Open media picker')
      await first.captured
      await page
        .locator('#field-media')
        .getByRole('button', { name: 'Choose from existing' })
        .click()

      const drawer = page.locator('[id^="list-drawer_"]')
      const search = drawer.locator('#search-filter-input')

      await expect(drawer.locator('table')).toBeVisible()

      const searchResponse = page.waitForResponse(
        (response) =>
          (response.request().postData() ?? '').includes('render-list') &&
          (response.request().postData() ?? '').includes('image'),
      )

      await search.fill('image')
      await searchResponse
      await search.focus()

      const searchElement = await search.elementHandle()
      let listRefreshCount = 0
      const recordRefresh = (request: Request) => {
        if ((request.postData() ?? '').includes('render-list')) {
          listRefreshCount += 1
        }
      }

      page.on('request', recordRefresh)
      await pauseClock({ page })
      first.release()
      await first.finished
      await expect(page.locator('#field-computedTitle')).toHaveValue('ok Open media picker')
      await page.clock.runFor(1000)
      expect(await searchElement.evaluate((element) => element.isConnected)).toBe(true)
      expect(listRefreshCount).toBe(0)
      await expect(search).toHaveValue('image')
      await expect(search).toBeFocused()
      await expect(drawer.locator('table')).toBeVisible()
      page.off('request', recordRefresh)
    } finally {
      await payload.delete({ id: media.id, collection: formMediaSlug, overrideAccess: true })
    }
  })

  test('should persist an edit made during the second queued autosave (#18348)', async ({
    page,
  }) => {
    const doc = await createAutosavePost()

    await page.goto(autosaveURL.edit(doc.id))
    await waitForFormReady(page)

    const heldRequests = await holdRequests({
      count: 2,
      matches: isAutosave,
      page,
      url: autosaveRoute({ id: doc.id }),
    })

    const first = heldRequests[0]!
    const second = heldRequests[1]!

    await pauseClock({ page })
    await page.locator('#field-title').fill('ok A')
    await page.clock.runFor(300)
    await first.captured
    await page.locator('#field-title').fill('ok AB')
    await page.clock.runFor(300)
    first.release()
    await second.captured
    await page.locator('#field-title').fill('ok ABC')
    second.release()
    await second.finished
    await page.clock.runFor(1000)
    await expect
      .poll(
        async () => (await readDocument({ id: doc.id, collection: autosavePostsSlug, page })).title,
      )
      .toBe('ok ABC')
    await page.reload()
    await waitForFormReady(page)
    await expect(page.locator('#field-title')).toHaveValue('ok ABC')
  })

  test('should allow saving a draft after a rejected publish (#17517)', async ({ page }) => {
    const doc = await payload.create({
      collection: draftPostsSlug,
      data: { slug: randomUUID(), title: 'ok Initial title' },
      draft: true,
      overrideAccess: true,
    })

    await page.goto(draftURL.edit(doc.id))
    await waitForFormReady(page)
    await page.locator('#field-title').fill('not publishable')
    await page.locator('#field-content').fill('Unsaved work worth keeping')

    const rejected = page.waitForResponse(
      (response) => response.request().method() === 'PATCH' && response.status() === 400,
    )

    await page.locator('#action-save').click()
    await rejected
    await expect(page.locator('#action-save-draft')).toBeEnabled()

    const saved = page.waitForResponse(
      (response) => response.request().method() === 'PATCH' && response.ok(),
    )

    await page.locator('#action-save-draft').click()
    await saved
    await page.reload()
    await waitForFormReady(page)
    await expect(page.locator('#field-content')).toHaveValue('Unsaved work worth keeping')
  })

  test('should allow retrying a rejected save without another edit (#17517)', async ({ page }) => {
    const doc = await payload.create({
      collection: postsSlug,
      data: { title: 'Initial title' },
      overrideAccess: true,
    })

    await page.goto(postsURL.edit(doc.id))
    await waitForFormReady(page)

    let hasRejected = false

    await page.route(`**/api/${postsSlug}/${doc.id}**`, async (route) => {
      if (route.request().method() === 'PATCH' && !hasRejected) {
        hasRejected = true
        return route.fulfill({
          json: { message: 'Save rejected for regression test' },
          status: 500,
        })
      }

      await route.continue()
    })
    await page.locator('#field-title').fill('Retried title')
    await page.locator('#action-save').click()
    await expect(page.getByText('Save rejected for regression test', { exact: true })).toBeVisible()
    await expect(page.locator('#action-save')).toBeEnabled()

    const saved = page.waitForResponse(
      (response) => response.request().method() === 'PATCH' && response.ok(),
    )

    await page.locator('#action-save').click()
    await saved
    await page.reload()
    await waitForFormReady(page)
    await expect(page.locator('#field-title')).toHaveValue('Retried title')
  })

  test('should preserve block identities after reorder, removal, and insertion during autosave (#15226)', async ({
    page,
  }) => {
    const doc = await payload.create({
      collection: autosavePostsSlug,
      data: {
        slug: randomUUID(),
        blocks: [
          { blockType: 'text', text: 'Block A' },
          { blockType: 'text', text: 'Block B' },
          { blockType: 'text', text: 'Block C' },
        ],
        title: 'ok Initial title',
      },
      draft: true,
      overrideAccess: true,
    })

    await page.goto(autosaveURL.edit(doc.id))
    await waitForFormReady(page)

    const heldRequests = await holdRequests({
      matches: isAutosave,
      page,
      url: autosaveRoute({ id: doc.id }),
    })

    const first = heldRequests[0]!

    await page.locator('#field-title').fill('ok Edited title')
    await first.captured
    await reorderBlocks({ fieldName: 'blocks', fromBlockIndex: 2, page, toBlockIndex: 0 })

    const { popupContentLocator } = await openArrayRowActions(page, {
      fieldName: 'blocks',
      rowIndex: 1,
    })

    await popupContentLocator.getByRole('menuitem', { name: 'Remove', exact: true }).click()
    await addBlock({ blockToSelect: 'Text', fieldName: 'blocks', page })
    first.release()

    const inserted = page.locator('#field-blocks__2__text')

    await expect(inserted).toBeEditable()
    await inserted.fill('Block D')
    await expect
      .poll(async () => {
        const saved = await readDocument({ id: doc.id, collection: autosavePostsSlug, page })

        return saved.blocks?.map((block) => ({
          id: block.id,
          text: 'text' in block ? block.text : undefined,
        }))
      })
      .toEqual([
        { id: doc.blocks![2]!.id, text: 'Block C' },
        { id: doc.blocks![1]!.id, text: 'Block B' },
        { id: expect.any(String), text: 'Block D' },
      ])
    const saved = await readDocument({ id: doc.id, collection: autosavePostsSlug, page })
    const savedIDs = saved.blocks!.map(({ id }) => id)

    expect(new Set(savedIDs).size).toBe(3)
    expect(doc.blocks!.map(({ id }) => id)).not.toContain(savedIDs[2])
    await page.reload()
    await waitForFormReady(page)
    await expect(page.locator('#field-blocks__0__text')).toHaveValue('Block C')
    await expect(page.locator('#field-blocks__1__text')).toHaveValue('Block B')
    await expect(page.locator('#field-blocks__2__text')).toHaveValue('Block D')
  })

  test('should render editable block fields after adding a block during form-state synchronization (#18638)', async ({
    page,
  }) => {
    const doc = await payload.create({
      collection: postsSlug,
      data: { title: 'Initial title' },
      overrideAccess: true,
    })

    await page.goto(postsURL.edit(doc.id))
    await waitForFormReady(page)

    const heldRequests = await holdFormState({
      count: 2,
      documentURL: postsURL.edit(doc.id),
      page,
    })

    const earlier = heldRequests[0]!
    const latest = heldRequests[1]!

    await page.locator('#field-title').fill('Updated before adding a block')
    await earlier.captured
    await addBlock({ blockToSelect: 'Text', fieldName: 'blocks', page })
    earlier.release()
    await latest.captured
    latest.release()
    await latest.finished

    const text = page.locator('#field-blocks__0__text')

    await expect(text).toBeEditable()
    await text.fill('Editable without reloading')
    await page.locator('#action-save').click()
    await expect
      .poll(async () => (await readDocument({ id: doc.id, collection: postsSlug, page })).blocks)
      .toMatchObject([{ blockType: 'text', text: 'Editable without reloading' }])
    await page.reload()
    await waitForFormReady(page)
    await expect(text).toHaveValue('Editable without reloading')
  })

  test('should show a newly revealed conditional field after an earlier response (#18425)', async ({
    page,
  }) => {
    const doc = await createDraftPost()

    await page.goto(draftURL.edit(doc.id))
    await waitForFormReady(page)

    const heldRequests = await holdFormState({
      count: 2,
      documentURL: draftURL.edit(doc.id),
      page,
    })

    const earlier = heldRequests[0]!
    const latest = heldRequests[1]!

    await page.locator('#field-title').fill('ok Changed title')
    await earlier.captured
    await page.locator('label[for="field-type-custom"]').click()
    earlier.release()
    await latest.captured
    latest.release()
    await latest.finished
    await expect(page.locator('#field-url')).toBeEditable()
    await expect(page.locator('#field-type-custom')).toBeChecked()
  })

  test('should render editable block fields when added before the form-state debounce (#18638)', async ({
    page,
  }) => {
    const doc = await payload.create({
      collection: postsSlug,
      data: { title: 'Initial title' },
      overrideAccess: true,
    })

    await page.goto(postsURL.edit(doc.id))
    await waitForFormReady(page)

    const heldRequests = await holdFormState({ documentURL: postsURL.edit(doc.id), page })
    const state = heldRequests[0]!

    await pauseClock({ page })
    await page.locator('#field-title').fill('Updated immediately before adding a block')
    await addBlock({ blockToSelect: 'Text', fieldName: 'blocks', page })
    await page.clock.runFor(1000)
    await state.captured
    state.release()
    await state.finished
    await page.clock.runFor(1000)

    const text = page.locator('#field-blocks__0__text')

    await expect(text).toBeEditable()
    await text.fill('Editable before the debounce')
    await page.locator('#action-save').click()
    await expect
      .poll(async () => (await readDocument({ id: doc.id, collection: postsSlug, page })).blocks)
      .toMatchObject([{ blockType: 'text', text: 'Editable before the debounce' }])
    await page.reload()
    await waitForFormReady(page)
    await expect(text).toHaveValue('Editable before the debounce')
  })

  for (const order of ['form state before save', 'form state during save'] as const) {
    test(`should retain server validation errors with ${order} (#18425)`, async ({ page }) => {
      const doc = await createDraftPost()

      await page.goto(draftURL.edit(doc.id))
      await waitForFormReady(page)

      const stateRequests = await holdFormState({ documentURL: draftURL.edit(doc.id), page })

      const state = stateRequests[0]!
      const saveRequests = await holdRequests({
        matches: (request) => request.method() === 'PATCH',
        page,
        url: `**/api/${draftPostsSlug}/${doc.id}**`,
      })

      const save = saveRequests[0]!

      await pauseClock({ page })
      await page.locator('#field-title').fill('not ok')

      if (order === 'form state before save') {
        await page.clock.runFor(300)
        await state.captured
        await page.locator('#action-save').click()
        state.release()
      } else {
        await page.locator('#action-save').click()
      }

      await save.captured
      // Allow both field validation and the form debounce to finish while the save is held.
      await page.clock.runFor(1000)
      save.release()
      await save.finished

      const titleField = page.locator('#field-title')
      const error = page
        .locator('.field-type.text')
        .filter({ has: titleField })
        .locator('.field-error')

      await expect(titleField).toHaveAttribute('aria-invalid', 'true')
      await expect(error).toHaveText('Must start with "ok".')

      const errorMonitor = await titleField.evaluateHandle((input) => {
        let didClearError = false
        const check = (records: MutationRecord[]) => {
          didClearError ||=
            input.getAttribute('aria-invalid') !== 'true' ||
            records.some((record) => record.oldValue !== 'true')
        }
        const observer = new MutationObserver(check)

        observer.observe(input, {
          attributeFilter: ['aria-invalid'],
          attributeOldValue: true,
          attributes: true,
        })

        return {
          stop: () => {
            check(observer.takeRecords())
            observer.disconnect()
            return didClearError
          },
        }
      })

      if (order === 'form state during save') {
        await state.captured
        state.release()
        await state.finished
      }

      await page.clock.runFor(1000)
      expect(await errorMonitor.evaluate((monitor) => monitor.stop())).toBe(false)
      await errorMonitor.dispose()
      await expect(titleField).toHaveAttribute('aria-invalid', 'true')
      await expect(error).toHaveText('Must start with "ok".')
      await expect(page.locator('#action-save')).toBeEnabled()
    })
  }

  test('should evaluate a condition changed while a failed save is queued (#18425)', async ({
    page,
  }) => {
    const doc = await createDraftPost()

    await page.goto(draftURL.edit(doc.id))
    await waitForFormReady(page)

    const heldRequests = await holdFormState({
      count: 2,
      documentURL: draftURL.edit(doc.id),
      page,
    })
    const earlier = heldRequests[0]!
    const latest = heldRequests[1]!

    await pauseClock({ page })
    await page.locator('#field-title').fill('not ok')
    await page.clock.runFor(300)
    await earlier.captured
    await page.locator('#action-save').click()
    await page.locator('label[for="field-type-custom"]').click()
    await page.clock.runFor(1000)

    const rejected = page.waitForResponse(
      (response) =>
        response.request().method() === 'PATCH' &&
        new URL(response.url()).pathname.endsWith(`/${draftPostsSlug}/${doc.id}`) &&
        response.status() === 400,
    )

    earlier.release()
    await rejected
    await expect(page.locator('#field-title')).toHaveAttribute('aria-invalid', 'true')
    await page.clock.runFor(300)
    await latest.captured
    latest.release()
    await latest.finished
    await page.clock.runFor(1000)
    await expect(page.locator('#field-url')).toBeEditable()
    await expect(page.locator('#field-title')).toHaveAttribute('aria-invalid', 'true')
  })

  async function createAutosavePost() {
    return payload.create({
      collection: autosavePostsSlug,
      data: { slug: randomUUID(), title: 'ok Initial title' },
      draft: true,
      overrideAccess: true,
    })
  }

  async function createDraftPost() {
    return payload.create({
      collection: draftPostsSlug,
      data: { slug: randomUUID(), type: 'internal', title: 'ok Initial title' },
      draft: true,
      overrideAccess: true,
    })
  }

  function autosaveRoute({ id }: { id: number | string }) {
    return `**/api/${autosavePostsSlug}/${id}**`
  }

  async function holdFormState({
    count = 1,
    documentURL,
    page,
  }: {
    count?: number
    documentURL: string
    page: Page
  }) {
    return holdRequests({
      count,
      matches: (request) =>
        request.method() === 'POST' &&
        (currentFramework === 'tanstack-start'
          ? (request.postData() ?? '').includes('form-state')
          : Boolean(request.headers()['next-action'])),
      page,
      url: currentFramework === 'tanstack-start' ? '**/_serverFn/**' : documentURL,
    })
  }

  async function holdRequests({
    count = 1,
    matches,
    page,
    url,
  }: {
    count?: number
    matches: (request: Request) => boolean
    page: Page
    url: string
  }) {
    const gates = Array.from({ length: count }, () => {
      const captured = deferred()
      const released = deferred()
      const finished = deferred()
      const release = () => released.resolve()

      releases.add(release)

      return { captured, finished, release, released }
    })
    let capturedCount = 0

    await page.route(url, async (route) => {
      if (!matches(route.request()) || capturedCount >= gates.length) {
        return route.continue()
      }

      const gate = gates[capturedCount++]!
      const response = await route.fetch()

      gate.captured.resolve()
      await gate.released.promise
      await route.fulfill({ response })
      gate.finished.resolve()
    })

    return gates.map(({ captured, finished, release }) => ({
      captured: captured.promise,
      finished: finished.promise,
      release,
    }))
  }
})

function isAutosave(request: Request) {
  return (
    request.method() === 'PATCH' && new URL(request.url()).searchParams.get('autosave') === 'true'
  )
}

async function readDocument<T extends keyof Config['collections']>({
  id,
  collection,
  page,
}: {
  collection: T
  id: number | string
  page: Page
}): Promise<Config['collections'][T]> {
  const query = qs.stringify({ depth: 0, draft: true }, { addQueryPrefix: true })
  const response = await page.request.get(
    formatAdminURL({
      apiRoute: '/api',
      path: `/${collection}/${id}${query}`,
      serverURL: new URL(page.url()).origin,
    }),
  )

  expect(response.ok()).toBe(true)

  return response.json()
}

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}

async function pauseClock({ page }: { page: Page }) {
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 100)
}
