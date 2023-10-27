/**
 * TODO: Versions, 3 separate collections
 * - drafts
 *  - save draft before publishing
 *  - publish immediately
 *  - validation should be skipped when creating a draft
 *
 * - autosave
 * - versions (no drafts)
 *  - version control shown
 *  - assert version counts increment
 *  - navigate to versions
 *  - versions view accurately shows number of versions
 *  - compare
 *    - iterable
 *    - nested
 *    - relationship
 *    - select w/ i18n options (label: { en: 'example', ... })
 *    - tabs
 *    - text
 *    - richtext
 *  - restore version
 *  - specify locales to show
 */

import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import wait from '../../packages/payload/src/utilities/wait'
import { changeLocale, saveDocAndAssert } from '../helpers'
import { AdminUrlUtil } from '../helpers/adminUrlUtil'
import { initPayloadE2E } from '../helpers/configHelpers'
import { autosaveSlug, draftGlobalSlug, draftSlug, titleToDelete } from './shared'

const { beforeAll, describe } = test

let page: Page
let url: AdminUrlUtil
let serverURL: string

const goToDoc = async (page: Page) => {
  await page.goto(url.list)
  const linkToDoc = page.locator('tbody tr:first-child .cell-title a').first()
  expect(linkToDoc).toBeTruthy()
  await linkToDoc.click()
}

const goToCollectionVersions = async (page: Page): Promise<void> => {
  await goToDoc(page)
  await page.goto(`${page.url()}/versions`)
}

const goToGlobalVersions = async (page: Page, slug: string): Promise<void> => {
  const global = new AdminUrlUtil(serverURL, slug)
  const versionsURL = `${global.global(slug)}/versions`
  await page.goto(versionsURL)
}

describe('versions', () => {
  beforeAll(async ({ browser }) => {
    const config = await initPayloadE2E(__dirname)
    serverURL = config.serverURL

    const context = await browser.newContext()
    page = await context.newPage()
  })

  describe('draft collections', () => {
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, draftSlug)
    })

    // This test has to run before bulk updates that will rename the title
    test('should delete', async () => {
      await page.goto(url.list)

      const rows = page.locator(`tr`)
      const rowToDelete = rows.filter({ hasText: titleToDelete })

      await rowToDelete.locator('.cell-_select input').click()
      await page.locator('.delete-documents__toggle').click()
      await page.locator('#confirm-delete').click()

      await expect(page.locator('.Toastify__toast--success')).toContainText(
        'Deleted 1 Draft Post successfully.',
      )

      await expect(page.locator('.row-1 .cell-title')).not.toHaveText(titleToDelete)
    })

    test('should bulk publish', async () => {
      await page.goto(url.list)

      await page.locator('.checkbox-input:has(#select-all) input').check()

      await page.locator('.publish-many__toggle').click()

      await page.locator('#confirm-publish').click()

      await expect(page.locator('.row-1 .cell-_status')).toContainText('Published')
      await expect(page.locator('.row-2 .cell-_status')).toContainText('Published')
    })

    test('should bulk unpublish', async () => {
      await page.goto(url.list)

      await page.locator('.checkbox-input:has(#select-all) input').check()

      await page.locator('.unpublish-many__toggle').click()

      await page.locator('#confirm-unpublish').click()

      await expect(page.locator('.row-1 .cell-_status')).toContainText('Draft')
      await expect(page.locator('.row-2 .cell-_status')).toContainText('Draft')
    })

    test('should publish while editing many', async () => {
      const description = 'published document'
      await page.goto(url.list)
      await page.locator('.checkbox-input:has(#select-all) input').check()
      await page.locator('.edit-many__toggle').click()
      await page.locator('.field-select .rs__control').click()
      const options = page.locator('.rs__option')
      const field = options.locator('text=description')
      await field.click()
      await page.locator('#field-description').fill(description)
      await page.locator('.form-submit .edit-many__publish').click()

      await expect(page.locator('.Toastify__toast--success')).toContainText(
        'Draft Posts successfully.',
      )
      await expect(page.locator('.row-1 .cell-_status')).toContainText('Published')
      await expect(page.locator('.row-2 .cell-_status')).toContainText('Published')
    })

    test('should save as draft while editing many', async () => {
      const description = 'draft document'
      await page.goto(url.list)
      await page.locator('.checkbox-input:has(#select-all) input').check()
      await page.locator('.edit-many__toggle').click()
      await page.locator('.field-select .rs__control').click()
      const options = page.locator('.rs__option')
      const field = options.locator('text=description')
      await field.click()
      await page.locator('#field-description').fill(description)
      await page.locator('.form-submit .edit-many__draft').click()

      await expect(page.locator('.Toastify__toast--success')).toContainText(
        'Draft Posts successfully.',
      )
      await expect(page.locator('.row-1 .cell-_status')).toContainText('Draft')
      await expect(page.locator('.row-2 .cell-_status')).toContainText('Draft')
    })

    test('collection - has versions tab', async () => {
      await goToDoc(page)
      const docURL = page.url()
      const pathname = new URL(docURL).pathname

      const versionsTab = page.locator('.doc-tab', {
        hasText: 'Versions',
      })

      expect(versionsTab).toBeTruthy()
      const href = await versionsTab.locator('a').first().getAttribute('href')
      expect(href).toBe(`${pathname}/versions`)
    })

    test('collection - tab displays proper number of versions', async () => {
      await page.goto(url.create)
      console.log(url.create)

      // save a version and check count
      await page.locator('#field-title').fill('title')
      await page.locator('#field-description').fill('description')
      await saveDocAndAssert(page)

      const versionsTab = page.locator('.doc-tab', {
        hasText: 'Versions',
      })

      const versionCount = await versionsTab.locator('.doc-tab__count').first().textContent()
      expect(versionCount).toBe('1')

      // save another version and check count again
      await page.locator('#field-title').fill('title edit')
      await saveDocAndAssert(page)

      await wait(100) // wait for save and rerender
      const versionCount2 = await versionsTab.locator('.doc-tab__count').first().textContent()
      expect(versionCount2).toBe('2')

      const make10More = async () => {
        for (let i = 0; i < 9; i++) {
          await wait(50) // wait for save and rerender
          await page.locator('#field-title').fill(`title ${i + 1}`)
          await saveDocAndAssert(page)
        }
      }

      await make10More()
      await wait(50) // wait for save and rerender

      const versionCount3 = await versionsTab.locator('.doc-tab__count').first().textContent()
      expect(versionCount3).toBe('11')
    })

    test('collection - has versions route', async () => {
      const url = page.url()
      await goToCollectionVersions(page)
      expect(page.url()).toBe(`${url}/versions`)
    })

    test('global - has versions tab', async () => {
      const global = new AdminUrlUtil(serverURL, draftGlobalSlug)
      await page.goto(global.global(draftGlobalSlug))

      const docURL = page.url()
      const pathname = new URL(docURL).pathname

      const versionsTab = page.locator('.doc-tab', {
        hasText: 'Versions',
      })

      expect(versionsTab).toBeTruthy()
      const href = await versionsTab.locator('a').first().getAttribute('href')
      expect(href).toBe(`${pathname}/versions`)
    })

    test('global - has versions route', async () => {
      const url = page.url()
      await goToGlobalVersions(page, draftGlobalSlug)
      expect(page.url()).toBe(`${url}/versions`)
    })

    test('should retain localized data during autosave', async () => {
      const autosaveURL = new AdminUrlUtil(serverURL, autosaveSlug)
      const locale = 'en'
      const spanishLocale = 'es'
      const title = 'english title'
      const spanishTitle = 'spanish title'
      const description = 'description'
      const newDescription = 'new description'

      await page.goto(autosaveURL.create)
      await page.locator('#field-title').fill(title)
      await page.locator('#field-description').fill(description)
      await wait(500) // wait for autosave

      await changeLocale(page, spanishLocale)
      await page.locator('#field-title').fill(spanishTitle)
      await wait(500) // wait for autosave

      await changeLocale(page, locale)
      await page.locator('#field-description').fill(newDescription)
      await wait(500) // wait for autosave

      await changeLocale(page, spanishLocale)
      await wait(500) // wait for autosave

      await page.reload()
      await expect(page.locator('#field-title')).toHaveValue(spanishTitle)
      await expect(page.locator('#field-description')).toHaveValue(newDescription)
    })

    test('should restore localized docs correctly', async () => {
      const spanishLocale = 'es'
      const spanishTitle = 'spanish title'
      const englishTitle = 'english title'

      await page.goto(url.create)

      // fill out doc in english
      await page.locator('#field-title').fill(englishTitle)
      await page.locator('#field-description').fill('unchanged description')
      await page.locator('#action-save').click()

      // change locale to spanish
      await changeLocale(page, spanishLocale)

      // fill out doc in spanish
      await page.locator('#field-title').fill(spanishTitle)
      await page.locator('#action-save').click()

      // fill out draft content in spanish
      await page.locator('#field-title').fill(`${spanishTitle}--draft`)
      await page.locator('#action-save-draft').click()

      // revert to last published version
      await page.locator('#action-revert-to-published').click()
      await page.locator('#action-revert-to-published-confirm').click()

      // verify that spanish content is reverted correctly
      await expect(page.locator('#field-title')).toHaveValue(spanishTitle)
    })
  })
})
