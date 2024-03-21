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
import type { Payload } from 'payload/types'

import { expect, test } from '@playwright/test'
import path from 'path'
import { wait } from 'payload/utilities'
import { fileURLToPath } from 'url'

import { globalSlug } from '../admin/slugs.js'
import {
  changeLocale,
  exactText,
  findTableCell,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
  selectTableRow,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2E } from '../helpers/initPayloadE2E.js'
import config from './config.js'
import { clearAndSeedEverything } from './seed.js'
import { titleToDelete } from './shared.js'
import {
  autoSaveGlobalSlug,
  autosaveCollectionSlug,
  customIDSlug,
  disablePublishGlobalSlug,
  disablePublishSlug,
  draftCollectionSlug,
  draftGlobalSlug,
  postCollectionSlug,
} from './slugs.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, beforeEach, describe } = test

let payload: Payload

const waitForAutoSaveToComplete = async (page: Page) => {
  await expect(async () => {
    await expect(page.locator('.autosave:has-text("Saving...")')).toBeVisible()
  }).toPass({
    timeout: 45000,
  })

  await expect(async () => {
    await expect(
      page.locator('.autosave:has-text("Last saved less than a minute ago")'),
    ).toBeVisible()
  }).toPass({
    timeout: 45000,
  })
}

describe('versions', () => {
  let page: Page
  let url: AdminUrlUtil
  let serverURL: string
  let autosaveURL: AdminUrlUtil
  let disablePublishURL: AdminUrlUtil
  let customIDURL: AdminUrlUtil
  let postURL: AdminUrlUtil

  beforeAll(async ({ browser }) => {
    ;({ payload, serverURL } = await initPayloadE2E({ config, dirname }))
    const context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)
  })

  beforeEach(async () => {
    await clearAndSeedEverything(payload)
  })

  describe('draft collections', () => {
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, draftCollectionSlug)
      autosaveURL = new AdminUrlUtil(serverURL, autosaveCollectionSlug)
      disablePublishURL = new AdminUrlUtil(serverURL, disablePublishSlug)
      customIDURL = new AdminUrlUtil(serverURL, customIDSlug)
    })

    // This test has to run before bulk updates that will rename the title
    test('should delete', async () => {
      await page.goto(url.list)

      const rows = page.locator(`tr`)
      const rowToDelete = rows.filter({ hasText: titleToDelete })

      await rowToDelete.locator('.cell-_select input').check()
      await page.locator('.delete-documents__toggle').click()
      await page.locator('#confirm-delete').click()

      await expect(page.locator('.Toastify__toast--success')).toContainText(
        'Deleted 1 Draft Post successfully.',
      )

      await expect(page.locator('.row-1 .cell-title')).not.toHaveText(titleToDelete)
    })

    test('bulk update - should publish many', async () => {
      await page.goto(url.list)

      // Select specific rows by title
      await selectTableRow(page, 'Published Title')
      await selectTableRow(page, 'Draft Title')

      // Bulk edit the selected rows
      await page.locator('.publish-many__toggle').click()
      await page.locator('#confirm-publish').click()

      // Check that the statuses for each row has been updated to `published`
      await expect(findTableCell(page, '_status', 'Published Title')).toContainText('Published')

      await expect(findTableCell(page, '_status', 'Draft Title')).toContainText('Published')
    })

    test('bulk update - should unpublish many', async () => {
      await page.goto(url.list)

      // Select specific rows by title
      await selectTableRow(page, 'Published Title')
      await selectTableRow(page, 'Draft Title')

      // Bulk edit the selected rows
      await page.locator('.unpublish-many__toggle').click()
      await page.locator('#confirm-unpublish').click()

      // Check that the statuses for each row has been updated to `draft`
      await expect(findTableCell(page, '_status', 'Published Title')).toContainText('Draft')
      await expect(findTableCell(page, '_status', 'Draft Title')).toContainText('Draft')
    })

    test('bulk update - should publish changes', async () => {
      const description = 'published document'
      await page.goto(url.list)

      // Select specific rows by title
      await selectTableRow(page, 'Published Title')
      await selectTableRow(page, 'Draft Title')

      // Bulk edit the selected rows to `published` status
      await page.locator('.edit-many__toggle').click()
      await page.locator('.field-select .rs__control').click()
      const options = page.locator('.rs__option')
      const field = options.locator('text=Description')
      await field.click()
      await page.locator('#field-description').fill(description)
      await page.locator('.form-submit .edit-many__publish').click()

      await expect(page.locator('.Toastify__toast--success')).toContainText(
        'Draft Posts successfully.',
      )

      // Check that the statuses for each row has been updated to `published`
      await expect(findTableCell(page, '_status', 'Published Title')).toContainText('Published')

      await expect(findTableCell(page, '_status', 'Draft Title')).toContainText('Published')
    })

    test('bulk update - should draft changes', async () => {
      const description = 'draft document'
      await page.goto(url.list)

      // Select specific rows by title
      await selectTableRow(page, 'Published Title')
      await selectTableRow(page, 'Draft Title')

      // Bulk edit the selected rows to `draft` status
      await page.locator('.edit-many__toggle').click()
      await page.locator('.field-select .rs__control').click()
      const options = page.locator('.rs__option')
      const field = options.locator('text=Description')
      await field.click()
      await page.locator('#field-description').fill(description)
      await page.locator('.form-submit .edit-many__draft').click()

      await expect(page.locator('.Toastify__toast--success')).toContainText(
        'Draft Posts successfully.',
      )

      // Check that the statuses for each row has been updated to `draft`
      await expect(findTableCell(page, '_status', 'Published Title')).toContainText('Draft')
      await expect(findTableCell(page, '_status', 'Draft Title')).toContainText('Draft')
    })

    test('collection - has versions tab', async () => {
      await page.goto(url.list)
      await page.locator('tbody tr .cell-title a').first().click()

      const versionsTab = page.locator('.doc-tab', {
        hasText: 'Versions',
      })
      await versionsTab.waitFor({ state: 'visible' })

      const docURL = page.url()
      const pathname = new URL(docURL).pathname

      expect(versionsTab).toBeTruthy()
      const href = await versionsTab.locator('a').first().getAttribute('href')
      expect(href).toBe(`${pathname}/versions`)
    })

    test('collection - tab displays proper number of versions', async () => {
      await page.goto(url.list)

      const linkToDoc = page
        .locator('tbody tr .cell-title a', {
          hasText: exactText('Title With Many Versions 11'),
        })
        .first()

      expect(linkToDoc).toBeTruthy()
      await linkToDoc.click()

      const versionsTab = page.locator('.doc-tab', {
        hasText: 'Versions',
      })
      await versionsTab.waitFor({ state: 'visible' })

      const versionCount = await versionsTab.locator('.doc-tab__count').first().textContent()
      expect(versionCount).toBe('11')
    })

    test('collection - has versions route', async () => {
      await page.goto(url.list)
      await page.locator('tbody tr .cell-title a').first().click()

      await page.waitForSelector('.doc-header__title', { state: 'visible' })

      await page.goto(`${page.url()}/versions`)
      expect(page.url()).toMatch(/\/versions$/)
    })

    test('should show collection versions view level action in collection versions view', async () => {
      await page.goto(url.list)
      await page.locator('tbody tr .cell-title a').first().click()

      // Wait for the document to load
      const versionsTab = page.locator('.doc-tab', {
        hasText: 'Versions',
      })
      await versionsTab.waitFor({ state: 'visible' })

      await page.goto(`${page.url()}/versions`)
      await expect(page.locator('.app-header .collection-versions-button')).toHaveCount(1)
    })

    test('should show global versions view level action in globals versions view', async () => {
      const global = new AdminUrlUtil(serverURL, draftGlobalSlug)
      await page.goto(`${global.global(draftGlobalSlug)}/versions`)
      await expect(page.locator('.app-header .global-versions-button')).toHaveCount(1)
    })

    // TODO: Check versions/:version-id view for collections / globals

    test('global - has versions tab', async () => {
      const global = new AdminUrlUtil(serverURL, draftGlobalSlug)
      await page.goto(global.global(draftGlobalSlug))

      const docURL = page.url()
      const pathname = new URL(docURL).pathname

      const versionsTab = page.locator('.doc-tab', {
        hasText: 'Versions',
      })
      await versionsTab.waitFor({ state: 'visible' })

      expect(versionsTab).toBeTruthy()
      const href = await versionsTab.locator('a').first().getAttribute('href')
      expect(href).toBe(`${pathname}/versions`)
    })

    test('global - has versions route', async () => {
      const global = new AdminUrlUtil(serverURL, globalSlug)
      const versionsURL = `${global.global(globalSlug)}/versions`
      await page.goto(versionsURL)
      expect(page.url()).toMatch(/\/versions$/)
    })

    test('global - should autosave', async () => {
      const titleToMatch = 'global title'
      const url = new AdminUrlUtil(serverURL, autoSaveGlobalSlug)
      // fill out global title and wait for autosave
      await page.goto(url.global(autoSaveGlobalSlug))
      const titleField = page.locator('#field-title')
      await titleField.fill(titleToMatch)

      await waitForAutoSaveToComplete(page)

      // refresh the page and ensure value autosaved
      await page.reload()
      await expect(page.locator('#field-title')).toHaveValue(titleToMatch)
    })

    test('should retain localized data during autosave', async () => {
      const en = 'en'
      const es = 'es'
      const englishTitle = 'english title'
      const spanishTitle = 'spanish title'
      const newDescription = 'new description'

      await page.goto(autosaveURL.create)
      await expect(page.locator('.id-label')).toBeVisible()

      // field locators
      const localizedTitleField = page.locator('#field-title')
      const descriptionField = page.locator('#field-description')

      // fill out en doc
      await localizedTitleField.fill(englishTitle)
      await descriptionField.fill('description')
      await waitForAutoSaveToComplete(page)

      // change locale to spanish
      await changeLocale(page, es)
      await localizedTitleField.fill(spanishTitle)
      await waitForAutoSaveToComplete(page)

      // change locale back to en
      await changeLocale(page, en)
      await expect(localizedTitleField).toHaveValue(englishTitle)
      // change non-localized description field
      await descriptionField.fill(newDescription)
      await waitForAutoSaveToComplete(page)

      // change locale to spanish
      await changeLocale(page, es)

      // reload page in spanish
      // title should not be english title
      // description should be new description
      await page.reload()
      await expect(localizedTitleField).toHaveValue(spanishTitle)
      await expect(descriptionField).toHaveValue(newDescription)
    })

    test('should restore localized docs correctly', async () => {
      const es = 'es'
      const spanishTitle = 'spanish title'
      const englishTitle = 'english title'

      await page.goto(url.create)
      await wait(500)

      // fill out doc in english
      await page.locator('#field-title').fill(englishTitle)
      await page.locator('#field-description').fill('unchanged description')
      await saveDocAndAssert(page)

      // change locale to spanish
      await changeLocale(page, es)

      // fill out doc in spanish
      await page.locator('#field-title').fill(spanishTitle)
      await saveDocAndAssert(page)

      // fill out draft content in spanish
      await page.locator('#field-title').fill(`${spanishTitle}--draft`)
      await saveDocAndAssert(page, '#action-save-draft')

      // revert to last published version
      await page.locator('#action-revert-to-published').click()
      await saveDocAndAssert(page, '#action-revert-to-published-confirm')

      // verify that spanish content is reverted correctly
      await expect(page.locator('#field-title')).toHaveValue(spanishTitle)
    })

    test('collection - autosave should only update the current document', async () => {
      // create and save first doc
      await page.goto(autosaveURL.create)
      await page.waitForURL('**/create')
      await page.locator('#field-title').fill('first post title')
      await page.locator('#field-description').fill('first post description')
      await page.locator('#action-save').click()
      await expect.poll(() => page.url(), { timeout: 5000 }).not.toContain('create')

      // create and save second doc
      await page.goto(autosaveURL.create)
      await page.waitForURL('**/create')
      await page.locator('#field-title').fill('second post title')
      await page.locator('#field-description').fill('second post description')
      await page.locator('#action-save').click()
      await expect.poll(() => page.url(), { timeout: 5000 }).not.toContain('create')

      // update second doc and wait for autosave
      await page.locator('#field-title').fill('updated second post title')
      await page.locator('#field-description').fill('updated second post description')
      await waitForAutoSaveToComplete(page)

      // verify that the first doc is unchanged
      await page.goto(autosaveURL.list)
      await page.locator('tbody tr .cell-title a').nth(1).click()
      await page.waitForURL(`${autosaveURL.list}/**`)
      await expect(page.locator('#field-title')).toHaveValue('first post title')
      await expect(page.locator('#field-description')).toHaveValue('first post description')
    })

    test('should save versions with custom IDs', async () => {
      await page.goto(customIDURL.create)
      await wait(500)
      await page.locator('#field-id').fill('custom')
      await page.locator('#field-title').fill('title')
      await saveDocAndAssert(page)

      await page.goto(customIDURL.list)
      await page.locator('tbody tr .cell-id a').click()

      await expect(page.locator('div.id-label')).toHaveText(/custom/)
      await expect(page.locator('#field-title')).toHaveValue('title')
    })

    test('should hide publish when access control prevents updating on globals', async () => {
      const url = new AdminUrlUtil(serverURL, disablePublishGlobalSlug)
      await page.goto(url.global(disablePublishGlobalSlug))

      await expect(page.locator('#action-save')).not.toBeAttached()
    })

    test('should hide publish when access control prevents create operation', async () => {
      await page.goto(disablePublishURL.create)

      await expect(page.locator('#action-save')).not.toBeAttached()
    })

    test('should hide publish when access control prevents update operation', async () => {
      const publishedDoc = await payload.create({
        collection: disablePublishSlug,
        data: {
          _status: 'published',
          title: 'title',
        },
        overrideAccess: true,
      })

      await page.goto(disablePublishURL.edit(String(publishedDoc.id)))

      await expect(page.locator('#action-save')).not.toBeAttached()
    })
  })
  describe('posts collection', () => {
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, draftCollectionSlug)
      autosaveURL = new AdminUrlUtil(serverURL, autosaveCollectionSlug)
      disablePublishURL = new AdminUrlUtil(serverURL, disablePublishSlug)
      customIDURL = new AdminUrlUtil(serverURL, customIDSlug)
      postURL = new AdminUrlUtil(serverURL, postCollectionSlug)
    })

    test('should show documents title in relationship even if draft document', async () => {
      await payload.create({
        collection: autosaveCollectionSlug,
        data: {
          title: 'some title',
        },
        draft: true,
      })

      await page.goto(postURL.create)

      const field = page.locator('#field-relationToAutosaves')

      await field.click()

      await expect(page.locator('.rs__option')).toHaveCount(1)

      await expect(page.locator('.rs__option')).toHaveText('some title')
    })
  })
})
