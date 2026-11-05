import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { waitForFormReady } from '../__helpers/e2e/helpers.js'
import { currentFramework } from '../__helpers/e2e/playwright.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { draftPostsSlug } from './slugs.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

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

  test('should retain the created document when slug generation finishes during a save', async ({
    page,
  }) => {
    const title = `ok Created once ${randomUUID()}`

    await page.goto(url.create)
    await waitForFormReady(page)
    await page.locator('#field-title').fill(title)
    await page.locator('#field-slug-lock').click()
    await page.locator('#field-slug').fill(`initial-${randomUUID()}`)

    const initialSlug = await page.locator('#field-slug').inputValue()
    const slug = await holdServerFunction({ name: 'slugify', page })
    const creation = await holdCreate({ page })

    await page.locator('#field-slug-generate').click()
    await slug.captured
    await page.locator('#action-save-draft').click()

    const createdID = await creation.captured

    slug.release()
    await expect(page.locator('#field-slug')).not.toHaveValue(initialSlug)
    creation.release()
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe(`/admin/collections/${draftPostsSlug}/${createdID}`)
    await waitForFormReady(page)
    await page.locator('#field-content').fill('Saved to the existing document')

    const saved = page.waitForResponse(
      (response) =>
        response.request().method() === 'PATCH' &&
        new URL(response.url()).pathname === `/api/${draftPostsSlug}/${createdID}`,
    )

    await page.locator('#action-save-draft').click()
    expect((await saved).ok()).toBe(true)
    await expect(page.locator('#action-save-draft')).toBeDisabled()

    const { docs } = await payload.find({
      collection: draftPostsSlug,
      draft: true,
      overrideAccess: true,
      where: { title: { equals: title } },
    })

    expect(docs).toHaveLength(1)
    expect(docs[0]).toMatchObject({ id: createdID, content: 'Saved to the existing document' })
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
    await expect(page.locator('#document-info-state')).toHaveAttribute('data-version-count', '1')
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

  test('should ignore a create response after its form is reset', async ({ page }) => {
    await page.goto(url.create)
    await waitForFormReady(page)
    await page.clock.install()
    await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 100)
    await page.locator('#field-title').fill(`ok Before reset ${randomUUID()}`)

    const creation = await holdCreate({ page })

    await page.locator('#action-save-draft').click()
    await creation.captured
    await page.locator('#reset-form-state').click()

    const refresh = await holdServerFunction({ name: 'form-state', page })
    const title = `ok After reset ${randomUUID()}`

    await page.locator('#field-title').fill(title)
    await page.clock.runFor(1000)
    creation.release()
    await refresh.captured
    refresh.release()
    await refresh.finished
    await expect(page.locator('#field-title')).toHaveValue(title)
    const documentData = await page
      .locator('#document-info-state')
      .getAttribute('data-document-data')

    expect(JSON.parse(documentData || 'null')?.id).toBeUndefined()
    expect(new URL(page.url()).pathname).toBe(`/admin/collections/${draftPostsSlug}/create`)
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
    await expect(
      page.locator('.payload-toast-container').filter({ hasText: 'successfully' }),
    ).toHaveCount(0)
  })

  async function holdServerFunction({ name, page }: { name: string; page: Page }) {
    const captured = Promise.withResolvers<void>()
    const released = Promise.withResolvers<void>()
    const finished = Promise.withResolvers<void>()
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
        finished.resolve()
      },
    )

    return { captured: captured.promise, finished: finished.promise, release: released.resolve }
  }

  async function holdCreate({ page }: { page: Page }) {
    const captured = Promise.withResolvers<Config['collections'][typeof draftPostsSlug]['id']>()
    const released = Promise.withResolvers<void>()
    const finished = Promise.withResolvers<void>()

    releases.add(released.resolve)
    await page.route(`**/api/${draftPostsSlug}?**`, async (route) => {
      if (route.request().method() !== 'POST') {
        return route.continue()
      }

      const response = await route.fetch()
      const { doc } = await response.json()

      expect(response.ok()).toBe(true)
      createdIDs.add(doc.id)
      captured.resolve(doc.id)
      await released.promise
      await route.fulfill({ response })
      finished.resolve()
    })

    return { captured: captured.promise, finished: finished.promise, release: released.resolve }
  }
})
