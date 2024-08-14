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

import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config } from './payload-types.js'

import {
  changeLocale,
  ensureCompilationIsDone,
  exactText,
  findTableCell,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
  selectTableRow,
  throttleTest,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../helpers/reInitializeDB.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { titleToDelete } from './shared.js'
import {
  autoSaveGlobalSlug,
  autosaveCollectionSlug,
  customIDSlug,
  disablePublishGlobalSlug,
  disablePublishSlug,
  draftCollectionSlug,
  draftGlobalSlug,
  draftWithMaxCollectionSlug,
  draftWithMaxGlobalSlug,
  postCollectionSlug,
} from './slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>

const waitForAutoSaveToComplete = async (page: Page) => {
  await expect(async () => {
    await expect(
      page.locator('.autosave:has-text("Last saved less than a minute ago")'),
    ).toBeVisible()
  }).toPass({
    timeout: POLL_TOPASS_TIMEOUT,
  })
}

const waitForAutoSaveToRunAndComplete = async (page: Page) => {
  await expect(async () => {
    await expect(page.locator('.autosave:has-text("Saving...")')).toBeVisible()
  }).toPass({
    timeout: POLL_TOPASS_TIMEOUT,
  })

  await waitForAutoSaveToComplete(page)
}

let context: BrowserContext

describe('versions', () => {
  let page: Page
  let url: AdminUrlUtil
  let serverURL: string
  let autosaveURL: AdminUrlUtil
  let disablePublishURL: AdminUrlUtil
  let customIDURL: AdminUrlUtil
  let postURL: AdminUrlUtil

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)
  })

  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'versionsTest',
    })

    await ensureCompilationIsDone({ page, serverURL })
    //await clearAndSeedEverything(payload)
  })

  describe('draft collections', () => {
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, draftCollectionSlug)
      autosaveURL = new AdminUrlUtil(serverURL, autosaveCollectionSlug)
      disablePublishURL = new AdminUrlUtil(serverURL, disablePublishSlug)
      customIDURL = new AdminUrlUtil(serverURL, customIDSlug)
      postURL = new AdminUrlUtil(serverURL, postCollectionSlug)
    })

    // This test has to run before bulk updates that will rename the title
    test('should delete', async () => {
      await page.goto(url.list)

      const rows = page.locator(`tr`)
      const rowToDelete = rows.filter({ hasText: titleToDelete })

      await rowToDelete.locator('.cell-_select input').check()
      await page.locator('.delete-documents__toggle').click()
      await page.locator('#confirm-delete').click()

      await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
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

    test('bulk publish with autosave documents', async () => {
      const title = 'autosave title'
      const description = 'autosave description'
      await page.goto(autosaveURL.create)
      // gets redirected from /create to /slug/id due to autosave
      await page.waitForURL(new RegExp(`${autosaveURL.edit('')}`))
      await wait(500)
      await expect(page.locator('#field-title')).toBeEnabled()
      await page.locator('#field-title').fill(title)
      await expect(page.locator('#field-description')).toBeEnabled()
      await page.locator('#field-description').fill(description)
      await waitForAutoSaveToRunAndComplete(page)
      await page.goto(autosaveURL.list)
      await expect(findTableCell(page, '_status', title)).toContainText('Draft')
      await selectTableRow(page, title)
      await page.locator('.publish-many__toggle').click()
      await page.locator('#confirm-publish').click()
      await expect(findTableCell(page, '_status', title)).toContainText('Published')
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

    test('bulk update — should publish changes', async () => {
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

      await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
        'Draft Posts successfully.',
      )

      // Check that the statuses for each row has been updated to `published`
      await expect(findTableCell(page, '_status', 'Published Title')).toContainText('Published')

      await expect(findTableCell(page, '_status', 'Draft Title')).toContainText('Published')
    })

    test('bulk update — should draft changes', async () => {
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

      await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
        'Draft Posts successfully.',
      )

      // Check that the statuses for each row has been updated to `draft`
      await expect(findTableCell(page, '_status', 'Published Title')).toContainText('Draft')
      await expect(findTableCell(page, '_status', 'Draft Title')).toContainText('Draft')
    })

    test('collection — has versions tab', async () => {
      await page.goto(url.list)
      await page.locator('tbody tr .cell-title a').first().click()

      const versionsTab = page.locator('.doc-tab', {
        hasText: 'Versions',
      })
      await versionsTab.waitFor({ state: 'visible' })

      const docURL = page.url()
      const pathname = new URL(docURL).pathname

      expect(versionsTab).toBeTruthy()
      const href = versionsTab.locator('a').first()
      await expect(href).toHaveAttribute('href', `${pathname}/versions`)
    })

    test('collection — tab displays proper number of versions', async () => {
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
      const versionsPill = versionsTab.locator('.doc-tab__count--has-count')
      await versionsPill.waitFor({ state: 'visible' })
      const versionCount = versionsTab.locator('.doc-tab__count').first()
      await expect(versionCount).toHaveText('11')
    })

    test('collection — has versions route', async () => {
      await page.goto(url.list)
      await page.locator('tbody tr .cell-title a').first().click()
      await page.waitForSelector('.doc-header__title', { state: 'visible' })
      await page.goto(`${page.url()}/versions`)
      expect(page.url()).toMatch(/\/versions/)
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

    test('should restore version with correct data', async () => {
      await page.goto(url.create)
      await page.waitForURL(url.create)
      await page.locator('#field-title').fill('v1')
      await page.locator('#field-description').fill('hello')
      await saveDocAndAssert(page)
      await page.locator('#field-title').fill('v2')
      await saveDocAndAssert(page, '#action-save-draft')
      const savedDocURL = page.url()
      await page.goto(`${savedDocURL}/versions`)
      await page.waitForURL(`${savedDocURL}/versions`)
      const row2 = page.locator('tbody .row-2')
      const versionID = await row2.locator('.cell-id').textContent()
      await page.goto(`${savedDocURL}/versions/${versionID}`)
      await page.waitForURL(`${savedDocURL}/versions/${versionID}`)
      await page.locator('.restore-version__button').click()
      await page.locator('button:has-text("Confirm")').click()
      await page.waitForURL(savedDocURL)
      await expect(page.locator('#field-title')).toHaveValue('v1')
    })

    test('should show global versions view level action in globals versions view', async () => {
      const global = new AdminUrlUtil(serverURL, draftGlobalSlug)
      await page.goto(`${global.global(draftGlobalSlug)}/versions`)
      await expect(page.locator('.app-header .global-versions-button')).toHaveCount(1)
    })

    // TODO: Check versions/:version-id view for collections / globals

    test('global — has versions tab', async () => {
      const global = new AdminUrlUtil(serverURL, draftGlobalSlug)
      await page.goto(global.global(draftGlobalSlug))

      const docURL = page.url()
      const pathname = new URL(docURL).pathname

      const versionsTab = page.locator('.doc-tab', {
        hasText: 'Versions',
      })
      await versionsTab.waitFor({ state: 'visible' })

      expect(versionsTab).toBeTruthy()
      const href = versionsTab.locator('a').first()
      await expect(href).toHaveAttribute('href', `${pathname}/versions`)
    })

    test('global — respects max number of versions', async () => {
      await payload.updateGlobal({
        slug: draftWithMaxGlobalSlug,
        data: {
          title: 'initial title',
        },
      })

      const global = new AdminUrlUtil(serverURL, draftWithMaxGlobalSlug)
      await page.goto(global.global(draftWithMaxGlobalSlug))

      const titleFieldInitial = page.locator('#field-title')
      await titleFieldInitial.fill('updated title')
      await saveDocAndAssert(page, '#action-save-draft')
      await expect(titleFieldInitial).toHaveValue('updated title')

      const versionsTab = page.locator('.doc-tab', {
        hasText: '1',
      })

      await versionsTab.waitFor({ state: 'visible' })

      expect(versionsTab).toBeTruthy()

      const titleFieldUpdated = page.locator('#field-title')
      await titleFieldUpdated.fill('latest title')
      await saveDocAndAssert(page, '#action-save-draft')
      await expect(titleFieldUpdated).toHaveValue('latest title')

      const versionsTabUpdated = page.locator('.doc-tab', {
        hasText: '1',
      })

      await versionsTabUpdated.waitFor({ state: 'visible' })

      expect(versionsTabUpdated).toBeTruthy()
    })

    test('global — has versions route', async () => {
      const global = new AdminUrlUtil(serverURL, autoSaveGlobalSlug)
      const versionsURL = `${global.global(autoSaveGlobalSlug)}/versions`
      await page.goto(versionsURL)
      expect(page.url()).toMatch(/\/versions$/)
    })

    test('global - should autosave', async () => {
      const url = new AdminUrlUtil(serverURL, autoSaveGlobalSlug)
      await page.goto(url.global(autoSaveGlobalSlug))
      await page.waitForURL(`**/${autoSaveGlobalSlug}`)
      const titleField = page.locator('#field-title')
      await titleField.fill('global title')
      await waitForAutoSaveToRunAndComplete(page)
      await expect(titleField).toHaveValue('global title')
      await page.goto(url.global(autoSaveGlobalSlug))
      await expect(page.locator('#field-title')).toHaveValue('global title')
    })

    test('should retain localized data during autosave', async () => {
      const en = 'en'
      const es = 'es'
      const englishTitle = 'english title'
      const spanishTitle = 'spanish title'
      const newDescription = 'new description'
      await page.goto(autosaveURL.create)
      await waitForAutoSaveToComplete(page)
      const titleField = page.locator('#field-title')
      await expect(titleField).toBeEnabled()
      await titleField.fill(englishTitle)
      const descriptionField = page.locator('#field-description')
      await expect(descriptionField).toBeEnabled()
      await descriptionField.fill('description')
      await waitForAutoSaveToRunAndComplete(page)
      await changeLocale(page, es)
      await titleField.fill(spanishTitle)
      await waitForAutoSaveToRunAndComplete(page)
      await changeLocale(page, en)
      await expect(titleField).toHaveValue(englishTitle)
      await descriptionField.fill(newDescription)
      await waitForAutoSaveToRunAndComplete(page)
      await changeLocale(page, es)
      await page.reload()
      await expect(titleField).toHaveValue(spanishTitle)
      await expect(descriptionField).toHaveValue(newDescription)
    })

    test('should restore localized docs correctly', async () => {
      const es = 'es'
      const spanishTitle = 'spanish title'
      const englishTitle = 'english title'

      await page.goto(url.create)
      await page.waitForURL(`**/${url.create}`)

      // fill out doc in english
      await page.locator('#field-title').fill(englishTitle)
      await page.locator('#field-description').fill('unchanged description')
      await saveDocAndAssert(page)

      // change locale to spanish
      await changeLocale(page, es)

      // fill out doc in spanish
      await page.locator('#field-title').fill(spanishTitle)
      await saveDocAndAssert(page)

      // wait for the page to load with the new version
      await expect
        .poll(
          async () =>
            await page.locator('.doc-tab[aria-label="Versions"] .doc-tab__count').textContent(),
          { timeout: POLL_TOPASS_TIMEOUT },
        )
        .toEqual('2')

      // fill out draft content in spanish
      await page.locator('#field-title').fill(`${spanishTitle}--draft`)
      await saveDocAndAssert(page, '#action-save-draft')

      // revert to last published version
      await page.locator('#action-revert-to-published').click()
      await saveDocAndAssert(page, '#action-revert-to-published-confirm')

      // verify that spanish content is reverted correctly
      await expect(page.locator('#field-title')).toHaveValue(spanishTitle)
    })

    test('collection — autosave should only update the current document', async () => {
      await page.goto(autosaveURL.create)
      await waitForAutoSaveToComplete(page)
      await expect(page.locator('#field-title')).toBeEnabled()
      await page.locator('#field-title').fill('first post title')
      await expect(page.locator('#field-description')).toBeEnabled()
      await page.locator('#field-description').fill('first post description')
      await saveDocAndAssert(page)
      await waitForAutoSaveToComplete(page) // Make sure nothing is auto-saving before next steps
      await page.goto(autosaveURL.create)
      await waitForAutoSaveToComplete(page) // Make sure nothing is auto-saving before next steps
      await wait(500)
      await expect(page.locator('#field-title')).toBeEnabled()
      await page.locator('#field-title').fill('second post title')
      await expect(page.locator('#field-description')).toBeEnabled()
      await page.locator('#field-description').fill('second post description')
      await saveDocAndAssert(page)
      await waitForAutoSaveToComplete(page) // Make sure nothing is auto-saving before next steps
      await page.locator('#field-title').fill('updated second post title')
      await page.locator('#field-description').fill('updated second post description')
      await waitForAutoSaveToRunAndComplete(page)
      await page.goto(autosaveURL.list)
      const secondRowLink = page.locator('tbody tr:nth-child(2) .cell-title a')
      const docURL = await secondRowLink.getAttribute('href')
      await secondRowLink.click()
      await page.waitForURL(`**${docURL}`)
      await expect(page.locator('#field-title')).toHaveValue('first post title')
      await expect(page.locator('#field-description')).toHaveValue('first post description')
    })

    test('should save versions with custom IDs', async () => {
      await page.goto(customIDURL.create)
      await page.waitForURL(`${customIDURL.create}`)
      await page.locator('#field-id').fill('custom')
      await page.locator('#field-title').fill('title')
      await saveDocAndAssert(page)

      await page.goto(customIDURL.list)
      await page.locator('tbody tr .cell-id a').click()

      await expect(page.locator('div.id-label')).toHaveText(/custom/)
      await expect(page.locator('#field-title')).toHaveValue('title')
    })

    test('globals — should hide publish button when access control prevents update', async () => {
      const url = new AdminUrlUtil(serverURL, disablePublishGlobalSlug)
      await page.goto(url.global(disablePublishGlobalSlug))
      await expect(page.locator('#action-save')).not.toBeAttached()
    })

    test('collections — should hide publish button when access control prevents create', async () => {
      await page.goto(disablePublishURL.create)
      await expect(page.locator('#action-save')).not.toBeAttached()
    })

    test('collections — should hide publish button when access control prevents update', async () => {
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
          description: 'some description',
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

    test('collection — respects max number of versions', async () => {
      const maxOneCollection = await payload.create({
        collection: draftWithMaxCollectionSlug,
        data: {
          description: 'some description',
          title: 'initial title',
        },
        draft: true,
      })

      const collection = new AdminUrlUtil(serverURL, draftWithMaxCollectionSlug)
      await page.goto(collection.edit(maxOneCollection.id))

      const titleFieldInitial = page.locator('#field-title')
      await titleFieldInitial.fill('updated title')
      await saveDocAndAssert(page, '#action-save-draft')
      await expect(titleFieldInitial).toHaveValue('updated title')

      const versionsTab = page.locator('.doc-tab', {
        hasText: '1',
      })

      await versionsTab.waitFor({ state: 'visible' })

      expect(versionsTab).toBeTruthy()

      const titleFieldUpdated = page.locator('#field-title')
      await titleFieldUpdated.fill('latest title')
      await saveDocAndAssert(page, '#action-save-draft')
      await expect(titleFieldUpdated).toHaveValue('latest title')

      const versionsTabUpdated = page.locator('.doc-tab', {
        hasText: '1',
      })

      await versionsTabUpdated.waitFor({ state: 'visible' })

      expect(versionsTabUpdated).toBeTruthy()
    })
  })
})
