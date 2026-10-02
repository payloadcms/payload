import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import { changeLocale, saveDocAndAssert, waitForFormReady } from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { RESTClient } from '../__helpers/shared/rest.js'
import { initPage } from '../__setup/e2e/initPage.js'
import {
  validationCustomButtonsCollectionSlug,
  validationRequestFailureTitle,
  validationTranslatedLabelTitle,
} from './config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Publish all locales', () => {
  const createdIDs: string[] = []
  let client: RESTClient
  let publishAllLocalesURL: AdminUrlUtil
  let page: Page
  let serverURL: string

  test.beforeAll(async ({ browser }) => {
    ;({ serverURL } = await initPayloadE2ENoConfig({ dirname }))
    publishAllLocalesURL = new AdminUrlUtil(serverURL, validationCustomButtonsCollectionSlug)
    client = new RESTClient({
      defaultSlug: validationCustomButtonsCollectionSlug,
      serverURL,
    })

    const context = await browser.newContext()
    ;({ page } = await initPage({ context, serverURL }))
    await client.login()
  })

  test.afterEach(async () => {
    await page.goto(publishAllLocalesURL.admin)

    for (const id of createdIDs) {
      await client.delete(id, {
        id,
        slug: validationCustomButtonsCollectionSlug,
      })
    }
    createdIDs.length = 0
  })

  test('should block publishing all locales and toast the invalid locale when a sibling locale is missing required data', async () => {
    const id = await createDraft({ spanishTitle: 'Título en español' })

    await openDraft(id)
    await saveDocAndAssert(page, '#publish-all-locales', 'error', {
      disableDismissAllToasts: true,
    })
    await expect(page.locator('.payload-toast-container')).toContainText('[de]')

    await expect
      .poll(async () => {
        const { doc } = await client.findByID({
          id,
          slug: validationCustomButtonsCollectionSlug,
        })

        return doc._status
      })
      .not.toBe('published')
  })

  test('should publish successfully when every locale has valid data', async () => {
    const id = await createDraft({
      frenchTitle: 'Titre en français',
      germanTitle: 'Deutscher Titel',
      spanishTitle: 'Título en español',
    })

    await openDraft(id)
    await saveDocAndAssert(page, '#publish-all-locales', 'success')

    for (const locale of ['en', 'es', 'de', 'fr']) {
      await expect.poll(() => getLocaleStatus({ id, locale })).toBe('published')
    }
  })

  test('should report a denied validation request without publishing', async () => {
    const id = await createDraft({
      englishTitle: validationRequestFailureTitle,
      frenchTitle: 'Titre en français',
      germanTitle: 'Deutscher Titel',
      spanishTitle: 'Título en español',
    })

    await openDraft(id)
    await saveDocAndAssert(page, '#publish-all-locales', 'error', {
      disableDismissAllToasts: true,
    })

    await expect(page.locator('.payload-toast-container')).toContainText(
      'An unknown error has occurred.',
    )
    await expect.poll(() => getLocaleStatus({ id, locale: 'en' })).toBe('draft')
  })

  test('should render a translated validation label', async () => {
    const id = await createDraft({
      englishTitle: validationTranslatedLabelTitle,
      frenchTitle: 'Titre en français',
      germanTitle: 'Deutscher Titel',
      spanishTitle: 'Título en español',
    })

    await openDraft(id)
    await saveDocAndAssert(page, '#publish-all-locales', 'error', {
      disableDismissAllToasts: true,
    })

    const toast = page.locator('.payload-toast-container')

    await expect(toast).toContainText('Translated title')
    await expect(toast).not.toContainText('[object Object]')
    await expect.poll(() => getLocaleStatus({ id, locale: 'en' })).toBe('draft')
  })

  async function createDraft({
    englishTitle = 'English title',
    frenchTitle,
    germanTitle,
    spanishTitle,
  }: {
    englishTitle?: string
    frenchTitle?: string
    germanTitle?: string
    spanishTitle?: string
  }): Promise<string> {
    const response = await client.endpointWithAuth<{ doc: { id: number | string } }>(
      `/api/${validationCustomButtonsCollectionSlug}?draft=true&locale=en`,
      'POST',
      {
        _status: 'draft',
        summary: 'Shared summary',
        title: englishTitle,
      },
    )
    const id = String(response.data.doc.id)

    createdIDs.push(id)

    for (const [locale, title] of [
      ['es', spanishTitle],
      ['de', germanTitle],
      ['fr', frenchTitle],
    ]) {
      if (title) {
        await client.endpointWithAuth(
          `/api/${validationCustomButtonsCollectionSlug}/${id}?draft=true&locale=${locale}`,
          'PATCH',
          {
            _status: 'draft',
            title,
          },
        )
      }
    }

    return id
  }

  async function openDraft(id: string): Promise<void> {
    await page.goto(publishAllLocalesURL.edit(id))
    await changeLocale(page, 'en')
    await waitForFormReady(page)
  }

  async function getLocaleStatus({ id, locale }: { id: string; locale: string }): Promise<string> {
    const { data } = await client.endpointWithAuth<{ _status: string }>(
      `/api/${validationCustomButtonsCollectionSlug}/${id}?draft=true&locale=${locale}`,
    )

    return data._status
  }
})
