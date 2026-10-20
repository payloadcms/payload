import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatAdminURL } from 'payload/shared'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { saveDocAndAssert, waitForFormReady } from '../__helpers/e2e/helpers.js'
import { reInitializeDB } from '../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import {
  customIDSlug,
  localizedCollectionSlug,
  restoreAccessCollectionSlug,
  simpleDraftGlobalSlug,
} from './slugs.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

test.describe('Restore historical content', () => {
  let context: BrowserContext
  let page: Page
  let payload: PayloadTestSDK<Config>
  let serverURL: string

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    context = await browser.newContext()
    ;({ page } = await initPage({ context, serverURL }))
  })

  test.beforeEach(async () => {
    await reInitializeDB({ serverURL })
  })

  test.afterAll(async () => {
    await context?.close()
  })

  for (const historicalStatus of ['draft', 'published', 'mixed'] as const) {
    test(`should restore a historical ${historicalStatus} localized collection as drafts without changing live content`, async () => {
      const enStatus = historicalStatus === 'published' ? 'published' : 'draft'
      const doc = await payload.create({
        collection: localizedCollectionSlug,
        data: { _status: enStatus, text: 'Historical en' },
        draft: enStatus === 'draft',
        locale: 'en',
        overrideAccess: true,
      })
      const apiURL = formatAdminURL({
        apiRoute: '/api',
        path: `/${localizedCollectionSlug}/${doc.id}`,
        serverURL,
      })
      const editorURL = formatAdminURL({
        adminRoute: '/admin',
        path: `/collections/${localizedCollectionSlug}/${doc.id}`,
        serverURL,
      })

      for (const locale of ['de', 'es'] as const) {
        const status = historicalStatus === 'draft' ? 'draft' : 'published'

        await updateLocalizedContent({
          apiURL,
          data: { _status: status, text: `Historical ${locale}` },
          draft: status === 'draft',
          entity: 'collection',
          locale,
          page,
        })
      }

      const versionsURL = formatAdminURL({
        apiRoute: '/api',
        path: `/${localizedCollectionSlug}/versions`,
        serverURL,
      })
      const versionsResponse = await page.request.get(versionsURL, {
        params: {
          limit: 1,
          locale: 'all',
          sort: '-updatedAt',
          'where[parent][equals]': String(doc.id),
        },
      })

      await expect(versionsResponse).toBeOK()

      const { docs } = await versionsResponse.json()
      const version = docs[0]

      expect(version.version._status).toEqual({
        de: historicalStatus === 'draft' ? 'draft' : 'published',
        en: enStatus,
        es: historicalStatus === 'draft' ? 'draft' : 'published',
      })

      for (const locale of ['en', 'de', 'es'] as const) {
        await updateLocalizedContent({
          apiURL,
          data: { _status: 'published', text: `Current ${locale}` },
          entity: 'collection',
          locale,
          page,
        })
      }

      await updateLocalizedContent({
        apiURL,
        data: { _status: 'draft' },
        entity: 'collection',
        locale: 'es',
        page,
      })

      const publishedResponse = await page.request.get(apiURL, {
        params: { draft: false, locale: 'all' },
      })

      await expect(publishedResponse).toBeOK()

      const publishedBefore = await publishedResponse.json()

      expect(publishedBefore._status).toEqual({ de: 'published', en: 'published', es: 'draft' })

      await page.goto(`${editorURL}/versions/${version.id}`)

      const restore = page.getByRole('button', { name: 'Restore as draft', exact: true })

      await expect(restore).toBeVisible()
      await expect(page.locator('.restore-version button')).toHaveCount(1)
      await restore.click()

      const dialog = page.getByRole('dialog', { name: 'Restore as draft', exact: true })

      await expect(dialog).toContainText('across all locales')
      await expect(dialog).toContainText('Published content will remain unchanged')
      await dialog.getByRole('button', { name: 'Confirm', exact: true }).click()
      await page.waitForURL(editorURL)
      await expect(page.locator('#field-text')).toHaveValue('Historical en')

      const restoredResponse = await page.request.get(apiURL, {
        params: { draft: true, locale: 'all' },
      })

      await expect(restoredResponse).toBeOK()

      const restoredDraft = await restoredResponse.json()
      const liveResponse = await page.request.get(apiURL, {
        params: { draft: false, locale: 'all' },
      })

      await expect(liveResponse).toBeOK()
      expect(restoredDraft.text).toEqual({
        de: 'Historical de',
        en: 'Historical en',
        es: 'Historical es',
      })
      expect(restoredDraft._status).toEqual({ de: 'draft', en: 'draft', es: 'draft' })
      expect(await liveResponse.json()).toEqual(publishedBefore)

      if (historicalStatus === 'published') {
        await waitForFormReady(page)
        await saveDocAndAssert(page)

        const publishedLocaleResponse = await page.request.get(apiURL, {
          params: { draft: false, locale: 'en' },
        })
        const publishedLocale = await publishedLocaleResponse.json()

        expect(publishedLocale.text).toBe('Historical en')
        expect(publishedLocale._status).toBe('published')
      }
    })
  }

  for (const historicalStatus of ['draft', 'published'] as const) {
    test(`should restore a historical ${historicalStatus} scalar collection as a draft`, async () => {
      const doc = await payload.create({
        collection: restoreAccessCollectionSlug,
        data: { _status: historicalStatus, title: 'Historical' },
        draft: historicalStatus === 'draft',
        overrideAccess: true,
      })
      const { docs } = await payload.findVersions({
        collection: restoreAccessCollectionSlug,
        limit: 1,
        sort: '-updatedAt',
        overrideAccess: true,
        where: { parent: { equals: doc.id } },
      })

      await payload.update({
        id: doc.id,
        collection: restoreAccessCollectionSlug,
        data: { _status: 'published', title: 'Current' },
        overrideAccess: true,
      })

      const editorURL = `${serverURL}/admin/collections/${restoreAccessCollectionSlug}/${doc.id}`

      await page.goto(`${editorURL}/versions/${docs[0]!.id}`)
      await page.getByRole('button', { name: 'Restore as draft', exact: true }).click()
      await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click()
      await page.waitForURL(editorURL)
      await expect(page.locator('#field-title')).toHaveValue('Historical')

      const live = await page.request.get(
        `${serverURL}/api/${restoreAccessCollectionSlug}/${doc.id}`,
      )
      const published = await live.json()

      expect(published.title).toBe('Current')
      expect(published._status).toBe('published')
    })
  }

  for (const historicalStatus of ['draft', 'published'] as const) {
    test(`should restore a historical ${historicalStatus} scalar global as a draft`, async () => {
      const apiURL = `${serverURL}/api/globals/${simpleDraftGlobalSlug}`
      const editorURL = `${serverURL}/admin/globals/${simpleDraftGlobalSlug}`

      await updateLocalizedContent({
        apiURL,
        data: { _status: historicalStatus, title: 'Historical' },
        draft: historicalStatus === 'draft',
        entity: 'global',
        locale: 'en',
        page,
      })

      const versionsResponse = await page.request.get(`${apiURL}/versions`, {
        params: { limit: 1, sort: '-updatedAt' },
      })
      const { docs } = await versionsResponse.json()

      await updateLocalizedContent({
        apiURL,
        data: { _status: 'published', title: 'Current' },
        entity: 'global',
        locale: 'en',
        page,
      })

      await page.goto(`${editorURL}/versions/${docs[0].id}`)
      await page.getByRole('button', { name: 'Restore as draft', exact: true }).click()

      const dialog = page.getByRole('dialog', { name: 'Restore as draft', exact: true })

      await expect(dialog).not.toContainText('across all locales')
      await expect(dialog).toContainText('Published content will remain unchanged')
      await dialog.getByRole('button', { name: 'Confirm', exact: true }).click()
      await page.waitForURL(editorURL)
      await expect(page.locator('#field-title')).toHaveValue('Historical')

      const live = await page.request.get(apiURL)
      const published = await live.json()

      expect(published.title).toBe('Current')
      expect(published._status).toBe('published')
    })
  }

  test('should directly restore a version when drafts are disabled', async () => {
    const doc = await payload.create({
      collection: customIDSlug,
      data: { id: 'restore-without-drafts', title: 'Historical' },
      overrideAccess: true,
    })
    const { docs } = await payload.findVersions({
      collection: customIDSlug,
      limit: 1,
      sort: '-updatedAt',
      overrideAccess: true,
      where: { parent: { equals: doc.id } },
    })

    await payload.update({
      id: doc.id,
      collection: customIDSlug,
      data: { title: 'Current' },
      overrideAccess: true,
    })

    const editorURL = `${serverURL}/admin/collections/${customIDSlug}/${doc.id}`

    await page.goto(`${editorURL}/versions/${docs[0]!.id}`)
    await page.getByRole('button', { name: 'Restore this version', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click()
    await page.waitForURL(editorURL)
    await expect(page.locator('#field-title')).toHaveValue('Historical')

    const response = await page.request.get(`${serverURL}/api/${customIDSlug}/${doc.id}`)

    expect((await response.json()).title).toBe('Historical')
  })
})

async function updateLocalizedContent({
  apiURL,
  data,
  draft = false,
  entity,
  locale,
  page,
}: {
  apiURL: string
  data: Record<string, unknown>
  draft?: boolean
  entity: 'collection' | 'global'
  locale: string
  page: Page
}): Promise<void> {
  const response = await page.request.fetch(apiURL, {
    data,
    method: entity === 'collection' ? 'PATCH' : 'POST',
    params: { draft, locale },
  })

  await expect(response).toBeOK()
}
