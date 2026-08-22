import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import { changeLocale, saveDocAndAssert, waitForFormReady } from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { RESTClient } from '../__helpers/shared/rest.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { validationCustomButtonsCollectionSlug } from './config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Custom locale validation buttons', () => {
  const createdIDs: string[] = []
  let client: RESTClient
  let customButtonsURL: AdminUrlUtil
  let page: Page
  let serverURL: string

  test.beforeAll(async ({ browser }) => {
    ;({ serverURL } = await initPayloadE2ENoConfig({ dirname }))
    customButtonsURL = new AdminUrlUtil(serverURL, validationCustomButtonsCollectionSlug)
    client = new RESTClient({
      defaultSlug: validationCustomButtonsCollectionSlug,
      serverURL,
    })

    const context = await browser.newContext()
    ;({ page } = await initPage({ context, serverURL }))
    await client.login()
  })

  test.afterEach(async () => {
    await page.goto(customButtonsURL.admin)

    for (const id of createdIDs) {
      await client.delete(id, {
        id,
        slug: validationCustomButtonsCollectionSlug,
      })
    }
    createdIDs.length = 0
  })

  test('should render a validate-all button and one validate button per other locale', async () => {
    const id = await createDraft({})

    await openDraft(id)

    await expect(page.locator('#custom-validate-all-locales-button')).toBeVisible()
    await expect(page.locator('#custom-validate-locale-es')).toBeVisible()
    await expect(page.locator('#custom-validate-locale-de')).toBeVisible()
    await expect(page.locator('#custom-validate-locale-fr')).toBeVisible()
    await expect(page.locator('#custom-validate-locale-en')).toHaveCount(0)
  })

  test('should update the rendered per-locale buttons when the active locale changes', async () => {
    const id = await createDraft({})

    await openDraft(id)
    await expect(page.locator('#custom-validate-locale-en')).toHaveCount(0)
    await expect(page.locator('#custom-validate-locale-de')).toBeVisible()

    await changeLocale(page, 'de')
    await waitForFormReady(page)

    await expect(page.locator('#custom-validate-locale-en')).toBeVisible()
    await expect(page.locator('#custom-validate-locale-de')).toHaveCount(0)
  })

  test('should validate a single sibling locale independently of the others', async () => {
    const id = await createDraft({ germanTitle: 'Deutscher Titel' })

    await openDraft(id)

    await page.locator('#custom-validate-locale-de').click()
    await expect(page.locator('#custom-validate-locale-de-result')).toContainText('de valid')

    await page.locator('#custom-validate-locale-es').click()
    await expect(page.locator('#custom-validate-locale-es-result')).toContainText('title')
  })

  test('should aggregate errors across every locale for the validate-all button', async () => {
    const id = await createDraft({ germanTitle: 'Deutscher Titel' })

    await openDraft(id)
    await page.locator('#custom-validate-all-locales-button').click()

    const result = page.locator('#custom-validate-all-locales-result')
    await expect(result).toContainText('es title')
    await expect(result).toContainText('fr title')
    await expect(result).not.toContainText('de title')
  })

  test('should block publishing all locales and toast the invalid locale when a sibling locale is missing required data', async () => {
    const id = await createDraft({ spanishTitle: 'Título en español' })

    await openDraft(id)
    await saveDocAndAssert(page, '#action-save', 'error')
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
    await saveDocAndAssert(page, '#action-save', 'success')
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
      `/api/${validationCustomButtonsCollectionSlug}?draft=true&locale=en`,
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
    await page.goto(customButtonsURL.edit(id))
    await changeLocale(page, 'en')
    await waitForFormReady(page)
  }
})
