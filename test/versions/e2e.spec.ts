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
 *  - specify locales to show
 */

import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import payload from '../../packages/payload/src'
import wait from '../../packages/payload/src/utilities/wait'
import { POLL_TOPASS_TIMEOUT } from '../../playwright.config'
import { globalSlug } from '../admin/slugs'
import {
  changeLocale,
  exactText,
  findTableCell,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
  selectTableRow,
} from '../helpers'
import { AdminUrlUtil } from '../helpers/adminUrlUtil'
import { initPayloadE2E } from '../helpers/configHelpers'
import { clearAndSeedEverything } from './seed'
import { titleToDelete } from './shared'
import {
  autoSaveGlobalSlug,
  autosaveCollectionSlug,
  customIDSlug,
  disablePublishGlobalSlug,
  disablePublishSlug,
  draftCollectionSlug,
  draftGlobalSlug,
  postCollectionSlug,
} from './slugs'

const { beforeAll, beforeEach, describe } = test

describe('versions', () => {
  let page: Page
  let url: AdminUrlUtil
  let serverURL: string
  let autosaveURL: AdminUrlUtil
  let disablePublishURL: AdminUrlUtil
  let customIDURL: AdminUrlUtil
  let postURL: AdminUrlUtil

  beforeAll(async ({ browser }) => {
    const config = await initPayloadE2E(__dirname)
    serverURL = config.serverURL
    const context = await browser.newContext()
    page = await context.newPage()
    url = new AdminUrlUtil(serverURL, draftCollectionSlug)
    autosaveURL = new AdminUrlUtil(serverURL, autosaveCollectionSlug)
    disablePublishURL = new AdminUrlUtil(serverURL, disablePublishSlug)
    customIDURL = new AdminUrlUtil(serverURL, customIDSlug)
    postURL = new AdminUrlUtil(serverURL, postCollectionSlug)

    initPageConsoleErrorCatch(page)
  })

  beforeEach(async () => {
    await clearAndSeedEverything(payload)
  })

  describe('draft collections', () => {
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

    test('bulk update - should publish many', async () => {
      await page.goto(url.list)

      // Select specific rows by title
      await selectTableRow(page, 'Published Title')
      await selectTableRow(page, 'Draft Title')

      // Bulk edit the selected rows
      await page.locator('.publish-many__toggle').click()
      await page.locator('#confirm-publish').click()

      // Check that the statuses for each row has been updated to `published`
      await expect(await findTableCell(page, '_status', 'Published Title')).toContainText(
        'Published',
      )

      await expect(await findTableCell(page, '_status', 'Draft Title')).toContainText('Published')
    })

    test('bulk publish with autosave documents', async () => {
      const title = 'autosave title'
      const description = 'autosave description'
      await page.goto(autosaveURL.create)

      // fill the fields
      await page.locator('#field-title').fill(title)
      await page.locator('#field-description').fill(description)

      // wait for autosave
      await wait(2000)

      // go to list
      await page.goto(autosaveURL.list)

      // expect the status to be draft
      await expect(await findTableCell(page, '_status', title)).toContainText('Draft')

      // select the row
      // await page.locator('.row-1 .select-row__checkbox').click()
      await selectTableRow(page, title)

      // click the publish many
      await page.locator('.publish-many__toggle').click()

      // confirm the dialog
      await page.locator('#confirm-publish').click()

      // expect the status to be published
      await expect(await findTableCell(page, '_status', title)).toContainText('Published')
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
      await expect(await findTableCell(page, '_status', 'Published Title')).toContainText('Draft')
      await expect(await findTableCell(page, '_status', 'Draft Title')).toContainText('Draft')
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
      await expect(await findTableCell(page, '_status', 'Published Title')).toContainText(
        'Published',
      )

      await expect(await findTableCell(page, '_status', 'Draft Title')).toContainText('Published')
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
      await expect(await findTableCell(page, '_status', 'Published Title')).toContainText('Draft')
      await expect(await findTableCell(page, '_status', 'Draft Title')).toContainText('Draft')
    })

    test('collection - has versions tab', async () => {
      await page.goto(url.list)
      await page.locator('tbody tr .cell-title a').first().click()
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

      const versionCount = await versionsTab.locator('.doc-tab__count').first().textContent()
      expect(versionCount).toBe('11')
    })

    test('collection - has versions route', async () => {
      await page.goto(url.list)
      await page.locator('tbody tr .cell-title a').first().click()
      await page.goto(`${page.url()}/versions`)
      expect(page.url()).toMatch(/\/versions$/)
    })

    test('should show collection versions view level action in collection versions view', async () => {
      await page.goto(url.list)
      await page.locator('tbody tr .cell-title a').first().click()
      await page.goto(`${page.url()}/versions`)
      await expect(page.locator('.app-header .collection-versions-button')).toHaveCount(1)
    })

    test('should restore version with correct data', async () => {
      await page.goto(url.create)
      await page.waitForURL(url.create)

      // publish a doc
      await page.locator('#field-title').fill('v1')
      await page.locator('#field-description').fill('hello')
      await saveDocAndAssert(page)

      // save a draft
      await page.locator('#field-title').fill('v2')
      await saveDocAndAssert(page, '#action-save-draft')

      // go to versions list view
      const savedDocURL = page.url()
      await page.goto(`${savedDocURL}/versions`)
      await page.waitForURL(`${savedDocURL}/versions`)

      // select the first version (row 2)
      const row2 = page.locator('tbody .row-2')
      const versionID = await row2.locator('.cell-id').textContent()
      await page.goto(`${savedDocURL}/versions/${versionID}`)
      await page.waitForURL(`${savedDocURL}/versions/${versionID}`)

      // restore doc
      await page.locator('.pill.restore-version').click()
      await page.locator('button:has-text("Confirm")').click()
      await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).not.toContain(versionID)

      await expect(page.locator('#field-title')).toHaveValue('v1')
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

    // TODO: This test is flaky and fails sometimes
    test('global - should autosave', async () => {
      const url = new AdminUrlUtil(serverURL, autoSaveGlobalSlug)
      // fill out global title and wait for autosave
      await page.goto(url.global(autoSaveGlobalSlug))
      await page.locator('#field-title').fill('global title')
      await wait(1000)

      // refresh the page and ensure value autosaved
      await page.goto(url.global(autoSaveGlobalSlug))
      await expect(page.locator('#field-title')).toHaveValue('global title')
    })

    test('should retain localized data during autosave', async () => {
      const locale = 'en'
      const spanishLocale = 'es'
      const title = 'english title'
      const spanishTitle = 'spanish title'
      const description = 'description'
      const newDescription = 'new description'

      await page.goto(autosaveURL.create)
      await page.locator('#field-title').fill(title)
      await page.locator('#field-description').fill(description)
      await wait(1000) // wait for autosave

      await changeLocale(page, spanishLocale)
      await page.locator('#field-title').fill(spanishTitle)
      await wait(1000) // wait for autosave

      await changeLocale(page, locale)
      await page.locator('#field-description').fill(newDescription)
      await wait(1000) // wait for autosave

      await changeLocale(page, spanishLocale)
      await wait(1000) // wait for autosave

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

    test('collection - autosave should only update the current document', async () => {
      // create and save first doc
      await page.goto(autosaveURL.create)
      await page.locator('#field-title').fill('first post title')
      await page.locator('#field-description').fill('first post description')
      await page.locator('#action-save').click()

      // create and save second doc
      await page.goto(autosaveURL.create)
      await page.locator('#field-title').fill('second post title')
      await page.locator('#field-description').fill('second post description')
      await page.locator('#action-save').click()

      // update second doc and wait for autosave
      await page.locator('#field-title').fill('updated second post title')
      await page.locator('#field-description').fill('updated second post description')
      await wait(1000)

      // verify that the first doc is unchanged
      await page.goto(autosaveURL.list)
      await page.locator('tbody tr .cell-title a').nth(1).click()
      await expect(page.locator('#field-title')).toHaveValue('first post title')
      await expect(page.locator('#field-description')).toHaveValue('first post description')
    })

    test('should save versions with custom IDs', async () => {
      await page.goto(customIDURL.create)
      await page.locator('#field-id').fill('custom')
      await page.locator('#field-title').fill('title')
      await page.locator('#action-save').click()

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
