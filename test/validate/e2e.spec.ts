import type { PayloadSDK } from '@payloadcms/sdk'
import type { Page } from '@playwright/test'
import type { UntypedPayloadTypes } from 'payload'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import { changeLocale, saveDocAndAssert, waitForFormReady } from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import {
  validationCustomButtonsCollectionSlug,
  validationRequestFailureTitle,
  validationTranslatedLabelTitle,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Publish all locales', () => {
  const createdIDs: string[] = []
  let sdk: PayloadSDK<UntypedPayloadTypes>
  let publishAllLocalesURL: AdminUrlUtil
  let page: Page
  let serverURL: string

  test.beforeAll(async ({ browser }) => {
    ;({ sdk, serverURL } = await initPayloadE2ENoConfig<UntypedPayloadTypes>({ dirname }))
    publishAllLocalesURL = new AdminUrlUtil(serverURL, validationCustomButtonsCollectionSlug)

    const context = await browser.newContext()
    ;({ page } = await initPage({ context, serverURL }))
  })

  test.afterEach(async () => {
    await page.goto(publishAllLocalesURL.admin)

    for (const id of createdIDs) {
      await sdk.delete({ collection: validationCustomButtonsCollectionSlug, id })
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
        const doc = await sdk.findByID({ collection: validationCustomButtonsCollectionSlug, id })

        return doc._status
      })
      .not.toBe('published')
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
    const doc = await sdk.create({
      collection: validationCustomButtonsCollectionSlug,
      data: {
        _status: 'draft',
        summary: 'Shared summary',
        title: englishTitle,
      },
      draft: true,
      locale: 'en',
    })
    const id = String(doc.id)

    createdIDs.push(id)

    for (const [locale, title] of [
      ['es', spanishTitle],
      ['de', germanTitle],
      ['fr', frenchTitle],
    ]) {
      if (title) {
        await sdk.update({
          collection: validationCustomButtonsCollectionSlug,
          data: {
            _status: 'draft',
            title,
          },
          draft: true,
          id,
          locale,
        })
      }
    }

    return id
  }

  async function openDraft(id: string): Promise<void> {
    await page.goto(publishAllLocalesURL.edit(id))
    await changeLocale(page, 'en')
    await waitForFormReady(page)
  }

  async function getLocaleStatus({ id, locale }: { id: string; locale: string }): Promise<unknown> {
    const doc = await sdk.findByID({
      collection: validationCustomButtonsCollectionSlug,
      draft: true,
      id,
      locale,
    })

    return doc._status
  }
})
