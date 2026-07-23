import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import {
  changeLocale,
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  waitForFormReady,
} from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { RESTClient } from '../__helpers/shared/rest.js'
import {
  publishGlobalSlug,
  validationAdminCollectionSlug,
  validationDeniedCollectionSlug,
  validationNonLocalizedCollectionSlug,
} from './config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Admin document validation', () => {
  const createdIDs: string[] = []
  let client: RESTClient
  let page: Page
  let serverURL: string
  let validationURL: AdminUrlUtil

  test.beforeAll(async ({ browser }) => {
    ;({ serverURL } = await initPayloadE2ENoConfig({ dirname }))
    validationURL = new AdminUrlUtil(serverURL, validationAdminCollectionSlug)
    client = new RESTClient({
      defaultSlug: validationAdminCollectionSlug,
      serverURL,
    })

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
    await client.login()
  })

  test.afterEach(async () => {
    await page.goto(validationURL.admin)

    for (const id of createdIDs) {
      await client.delete(id, {
        id,
        slug: validationAdminCollectionSlug,
      })
    }
    createdIDs.length = 0
  })

  test('should only show the action on localized documents with validation access', async () => {
    await page.goto(validationURL.create)
    await expect(page.locator('#action-validate-all-locales')).toBeVisible()

    const nonLocalizedURL = new AdminUrlUtil(serverURL, validationNonLocalizedCollectionSlug)
    await page.goto(nonLocalizedURL.create)
    await expect(page.locator('#action-validate-all-locales')).toHaveCount(0)

    const deniedURL = new AdminUrlUtil(serverURL, validationDeniedCollectionSlug)
    await page.goto(deniedURL.create)
    await expect(page.locator('#action-validate-all-locales')).toHaveCount(0)

    await page.goto(validationURL.global(publishGlobalSlug))
    await expect(page.locator('#action-validate-all-locales')).toBeVisible()
  })

  test('should show sibling-locale errors without discarding unsaved active-locale data', async () => {
    const id = await createDraft({ spanishTitle: 'Título en español' })

    await openDraft(id)
    await page.locator('#field-title').fill('Unsaved English title')
    await page.locator('#action-validate-all-locales').click()

    const result = page.locator('.validation-results')
    await expect(result.getByRole('alert')).toBeVisible()
    await expect(result).toContainText('German')
    await expect(result).toContainText('title')
    await expect(page.locator('#field-title')).toHaveValue('Unsaved English title')
  })

  test('should announce a valid result accessibly', async () => {
    const id = await createDraft({
      frenchTitle: 'Titre français',
      germanTitle: 'Deutscher Titel',
      spanishTitle: 'Título en español',
    })

    await openDraft(id)
    await page.locator('#action-validate-all-locales').click()

    await expect(page.locator('.validation-results').getByRole('status')).toHaveText(
      'All selected locales are valid.',
    )
  })

  test('should block publish-all for an invalid optional locale but allow normal publish', async () => {
    const id = await createDraft({ spanishTitle: 'Título en español' })

    await openDraft(id)
    await page.locator('#action-save').click()

    await expect(page.locator('.validation-results').getByRole('alert')).toBeVisible()
    await expect(page.locator('.validation-results')).toContainText('German')

    await page.locator('.validation-results .drawer__header__close').click()
    await page.locator('#action-save-popup').click()
    await page.locator('#publish-locale').click()

    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await expect(page.locator('.validation-results')).toHaveCount(0)
  })

  test('should block normal publish when a required locale is invalid', async () => {
    const id = await createDraft({})

    await openDraft(id)
    await page.locator('#action-save-popup').click()
    await page.locator('#publish-locale').click()

    const result = page.locator('.validation-results')
    await expect(result.getByRole('alert')).toBeVisible()
    await expect(result).toContainText('Spanish')
    await expect(result).toContainText('Required')
  })

  async function createDraft({
    frenchTitle,
    germanTitle,
    spanishTitle,
  }: {
    frenchTitle?: string
    germanTitle?: string
    spanishTitle?: string
  }): Promise<string> {
    const response = await client.endpointWithAuth<{ doc: { id: number | string } }>(
      `/api/${validationAdminCollectionSlug}?draft=true&locale=en`,
      'POST',
      {
        _status: 'draft',
        summary: 'Shared summary',
        title: 'English title',
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
          `/api/${validationAdminCollectionSlug}/${id}?draft=true&locale=${locale}`,
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
    await page.goto(validationURL.edit(id))
    await changeLocale(page, 'en')
    await waitForFormReady(page)
  }
})
