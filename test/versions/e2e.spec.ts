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

import type { BrowserContext, Dialog, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config, Diff } from './payload-types.js'

import {
  changeLocale,
  ensureCompilationIsDone,
  exactText,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { assertNetworkRequests } from '../helpers/e2e/assertNetworkRequests.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../helpers/reInitializeDB.js'
import { waitForAutoSaveToRunAndComplete } from '../helpers/waitForAutoSaveToRunAndComplete.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
import {
  autosaveCollectionSlug,
  autoSaveGlobalSlug,
  autosaveWithDraftButtonGlobal,
  autosaveWithDraftButtonSlug,
  autosaveWithValidateCollectionSlug,
  customIDSlug,
  diffCollectionSlug,
  disablePublishGlobalSlug,
  disablePublishSlug,
  draftCollectionSlug,
  draftGlobalSlug,
  draftWithMaxCollectionSlug,
  draftWithMaxGlobalSlug,
  draftWithValidateCollectionSlug,
  errorOnUnpublishSlug,
  localizedCollectionSlug,
  localizedGlobalSlug,
  postCollectionSlug,
} from './slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let context: BrowserContext

const londonTimezone = 'Europe/London'

describe('Versions', () => {
  let page: Page
  let url: AdminUrlUtil
  let serverURL: string
  let autosaveURL: AdminUrlUtil
  let autosaveWithDraftButtonURL: AdminUrlUtil
  let autosaveWithValidateURL: AdminUrlUtil
  let draftWithValidateURL: AdminUrlUtil
  let disablePublishURL: AdminUrlUtil
  let customIDURL: AdminUrlUtil
  let postURL: AdminUrlUtil
  let errorOnUnpublishURL: AdminUrlUtil
  let id: string

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  beforeEach(async () => {
    /* await throttleTest({
      page,
      context,
      delay: 'Slow 4G',
    }) */
    await reInitializeDB({
      serverURL,
      snapshotKey: 'versionsTest',
    })

    await ensureCompilationIsDone({ page, serverURL })
  })

  describe('draft collections', () => {
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, draftCollectionSlug)
      autosaveURL = new AdminUrlUtil(serverURL, autosaveCollectionSlug)
      autosaveWithDraftButtonURL = new AdminUrlUtil(serverURL, autosaveWithDraftButtonSlug)
      autosaveWithValidateURL = new AdminUrlUtil(serverURL, autosaveWithValidateCollectionSlug)
      disablePublishURL = new AdminUrlUtil(serverURL, disablePublishSlug)
      customIDURL = new AdminUrlUtil(serverURL, customIDSlug)
      postURL = new AdminUrlUtil(serverURL, postCollectionSlug)
      errorOnUnpublishURL = new AdminUrlUtil(serverURL, errorOnUnpublishSlug)
    })

    test('collection — has versions tab', async () => {
      await page.goto(url.list)
      await page.locator('tbody tr .cell-title a').first().click()

      const versionsTab = page.locator('.doc-tab:has-text("Versions")')
      await versionsTab.waitFor({ state: 'visible' })
      await expect(() => expect(versionsTab).toBeTruthy()).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })

      const docURL = page.url()
      const pathname = new URL(docURL).pathname
      const href = await versionsTab.getAttribute('href')
      await expect(() => expect(href).toBe(`${pathname}/versions`)).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })
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
      const versionsPill = versionsTab.locator('.pill-version-count')
      await versionsPill.waitFor({ state: 'visible' })
      const versionCount = versionsTab.locator('.pill-version-count').first()
      await expect(versionCount).toHaveText('11')
    })

    test('collection — has versions route', async () => {
      await page.goto(url.list)
      await page.locator('tbody tr .cell-title a').first().click()
      await page.waitForSelector('.doc-header__title', { state: 'visible' })
      await page.goto(`${page.url()}/versions`)
      await expect(() => {
        expect(page.url()).toMatch(/\/versions/)
      }).toPass({ timeout: 10000, intervals: [100] })
    })

    test('autosave relationships - should select doc after creating from relationship field', async () => {
      await page.goto(postURL.create)
      const autosaveRelationField = page.locator('#field-relationToAutosaves')
      await expect(autosaveRelationField).toBeVisible()
      const addNewButton = autosaveRelationField.locator(
        '.relationship-add-new__add-button.doc-drawer__toggler',
      )
      await addNewButton.click()
      const titleField = page.locator('#field-title')
      const descriptionField = page.locator('#field-description')
      await titleField.fill('test')
      await descriptionField.fill('test')

      const createdDate = await page.textContent(
        'li:has(p:has-text("Created:")) .doc-controls__value',
      )

      // wait for modified date and created date to be different
      await expect(async () => {
        const modifiedDateLocator = page.locator(
          'li:has(p:has-text("Last Modified:")) .doc-controls__value',
        )
        await expect(modifiedDateLocator).not.toHaveText(createdDate ?? '')
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT, intervals: [100] })

      const closeDrawer = page.locator('.doc-drawer__header-close')
      await closeDrawer.click()
      const fieldValue = autosaveRelationField.locator('.value-container')
      await expect(fieldValue).toContainText('test')
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
      await page.locator('#field-title').fill('v1')
      await page.locator('#field-description').fill('hello')
      await saveDocAndAssert(page)
      await page.locator('#field-title').fill('v2')
      await saveDocAndAssert(page, '#action-save-draft')
      const savedDocURL = page.url()
      await page.goto(`${savedDocURL}/versions`)
      const row2 = page.locator('tbody .row-2')
      const versionID = await row2.locator('.cell-id').textContent()
      await page.goto(`${savedDocURL}/versions/${versionID}`)
      await expect(page.locator('.render-field-diffs')).toBeVisible()
      await page.locator('.restore-version__restore-as-draft-button').click()
      await page.locator('button:has-text("Confirm")').click()
      await page.waitForURL(savedDocURL)
      await expect(page.locator('#field-title')).toHaveValue('v1')
    })

    test('should show currently published version status in versions view', async () => {
      const publishedDoc = await payload.create({
        collection: draftCollectionSlug,
        data: {
          _status: 'published',
          title: 'title',
          description: 'description',
        },
        overrideAccess: true,
      })

      await page.goto(`${url.edit(publishedDoc.id)}/versions`)
      await expect(page.locator('main.versions')).toContainText('Currently Published')
    })

    test('should show unpublished version status in versions view', async () => {
      const publishedDoc = await payload.create({
        collection: draftCollectionSlug,
        data: {
          _status: 'published',
          title: 'title',
          description: 'description',
        },
        overrideAccess: true,
      })

      // Unpublish the document
      await payload.update({
        collection: draftCollectionSlug,
        id: publishedDoc.id,
        data: {
          _status: 'draft',
        },
        draft: false,
      })

      await page.goto(`${url.edit(publishedDoc.id)}/versions`)
      await expect(page.locator('main.versions')).toContainText('Previously Published')
    })

    test('should show global versions view level action in globals versions view', async () => {
      const global = new AdminUrlUtil(serverURL, draftGlobalSlug)
      await page.goto(`${global.global(draftGlobalSlug)}/versions`)
      await expect(page.locator('.app-header .global-versions-button')).toHaveCount(1)
    })

    test('global — has versions tab', async () => {
      const global = new AdminUrlUtil(serverURL, draftGlobalSlug)
      await page.goto(global.global(draftGlobalSlug))

      const docURL = page.url()
      const pathname = new URL(docURL).pathname

      const versionsTab = page.locator('.doc-tab:has-text("Versions")')
      await versionsTab.waitFor({ state: 'visible' })
      await expect(() => expect(versionsTab).toBeTruthy()).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })

      const href = await versionsTab.getAttribute('href')
      await expect(() => expect(href).toBe(`${pathname}/versions`)).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })
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
      await expect(() => {
        expect(page.url()).toMatch(/\/versions/)
      }).toPass({ timeout: 10000, intervals: [100] })
    })

    test('collection - should autosave', async () => {
      await page.goto(autosaveURL.create)
      await page.locator('#field-title').fill('autosave title')
      await waitForAutoSaveToRunAndComplete(page)
      await expect(page.locator('#field-title')).toHaveValue('autosave title')

      const { id: postID } = await payload.create({
        collection: postCollectionSlug,
        data: {
          title: 'post title',
          description: 'post description',
        },
      })

      await page.goto(postURL.edit(postID))

      await assertNetworkRequests(
        page,
        `${serverURL}/admin/collections/${postCollectionSlug}/${postID}`,
        async () => {
          await page
            .locator(
              '#field-relationToAutosaves.field-type.relationship .relationship-add-new__add-button.doc-drawer__toggler',
            )
            .click()
        },
        {
          allowedNumberOfRequests: 1,
        },
      )

      const drawer = page.locator('[id^=doc-drawer_autosave-posts_1_]')
      await expect(drawer).toBeVisible()
      await expect(drawer.locator('.id-label')).toBeVisible()
    })

    test('collection - should show "save as draft" button when showSaveDraftButton is true', async () => {
      await page.goto(autosaveWithDraftButtonURL.create)
      await expect(page.locator('#action-save-draft')).toBeVisible()
    })

    test('collection - should not show "save as draft" button when showSaveDraftButton is false', async () => {
      await page.goto(autosaveURL.create)
      await expect(page.locator('#action-save-draft')).toBeHidden()
    })

    test('collection - autosave - should not create duplicates when clicking Create new', async () => {
      // This test checks that when we click "Create new" in the list view, it only creates 1 extra document and not more
      const { totalDocs: initialDocsCount } = await payload.find({
        collection: autosaveCollectionSlug,
        draft: true,
      })

      await page.goto(autosaveURL.create)
      await page.locator('#field-title').fill('autosave title')
      await waitForAutoSaveToRunAndComplete(page)
      await expect(page.locator('#field-title')).toHaveValue('autosave title')

      const { totalDocs: updatedDocsCount } = await payload.find({
        collection: autosaveCollectionSlug,
        draft: true,
      })

      await expect(() => {
        expect(updatedDocsCount).toBe(initialDocsCount + 1)
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT, intervals: [100] })

      await page.goto(autosaveURL.list)
      const createNewButton = page.locator('.list-header .btn:has-text("Create New")')
      await createNewButton.click()

      await page.waitForURL(`**/${autosaveCollectionSlug}/**`)

      await page.locator('#field-title').fill('autosave title')
      await waitForAutoSaveToRunAndComplete(page)
      await expect(page.locator('#field-title')).toHaveValue('autosave title')

      const { totalDocs: latestDocsCount } = await payload.find({
        collection: autosaveCollectionSlug,
        draft: true,
      })

      await expect(() => {
        expect(latestDocsCount).toBe(updatedDocsCount + 1)
      }).toPass({ timeout: POLL_TOPASS_TIMEOUT, intervals: [100] })
    })

    test('collection - should update updatedAt', async () => {
      await page.goto(url.create)

      // fill out doc in english
      await page.locator('#field-title').fill('title')
      await page.locator('#field-description').fill('initial description')
      await saveDocAndAssert(page)

      const updatedAtWrapper = page.locator(
        '.doc-controls .doc-controls__content .doc-controls__list-item',
        {
          hasText: 'Last Modified',
        },
      )
      const initialUpdatedAt = await updatedAtWrapper.locator('.doc-controls__value').textContent()

      // wait for 1 second so that the timestamp can be different
      await wait(1000)

      await page.locator('#field-description').fill('changed description')
      await saveDocAndAssert(page)

      const newUpdatedAt = updatedAtWrapper.locator('.doc-controls__value')

      await expect(newUpdatedAt).not.toHaveText(initialUpdatedAt)
    })

    test('collection - should update updatedAt on autosave', async () => {
      await page.goto(autosaveURL.create)
      await page.locator('#field-title').fill('autosave title')
      await waitForAutoSaveToRunAndComplete(page)
      await expect(page.locator('#field-title')).toHaveValue('autosave title')

      const updatedAtWrapper = page.locator(
        '.doc-controls .doc-controls__content .doc-controls__list-item',
        {
          hasText: 'Last Modified',
        },
      )
      const initialUpdatedAt = await updatedAtWrapper.locator('.doc-controls__value').textContent()

      // wait for 1 second so that the timestamp can be different
      await wait(1000)

      await page.locator('#field-title').fill('autosave title updated')
      await waitForAutoSaveToRunAndComplete(page)

      const newUpdatedAt = updatedAtWrapper.locator('.doc-controls__value')

      await expect(newUpdatedAt).not.toHaveText(initialUpdatedAt)
    })

    test('should retain localized data during autosave', async () => {
      const en = 'en'
      const es = 'es'
      const englishTitle = 'english title'
      const spanishTitle = 'spanish title'
      const newDescription = 'new description'
      await page.goto(autosaveURL.create)
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
            await page.locator('.doc-tab[aria-label="Versions"] .pill-version-count').textContent(),
          { timeout: POLL_TOPASS_TIMEOUT },
        )
        .toEqual('2')

      // fill out draft content in spanish
      await page.locator('#field-title').fill(`${spanishTitle}--draft`)
      await saveDocAndAssert(page, '#action-save-draft')

      // revert to last published version
      await page.locator('#action-revert-to-published').click()
      await saveDocAndAssert(page, '[id^=confirm-revert-] #confirm-action')

      // verify that spanish content is reverted correctly
      await expect(page.locator('#field-title')).toHaveValue(spanishTitle)
    })

    test('collection — autosave should only update the current document', async () => {
      await page.goto(autosaveURL.create)
      await expect(page.locator('#field-title')).toBeEnabled()
      await page.locator('#field-title').fill('first post title')
      await expect(page.locator('#field-description')).toBeEnabled()
      await page.locator('#field-description').fill('first post description')
      await saveDocAndAssert(page)
      await page.goto(autosaveURL.create)
      await wait(500)
      await expect(page.locator('#field-title')).toBeEnabled()
      await page.locator('#field-title').fill('second post title')
      await expect(page.locator('#field-description')).toBeEnabled()
      await page.locator('#field-description').fill('second post description')
      await saveDocAndAssert(page)
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
      await page.locator('#field-id').fill('custom')
      await page.locator('#field-title').fill('title')
      await saveDocAndAssert(page)

      await page.goto(customIDURL.list)
      await page.locator('tbody tr .cell-id a').click()

      await expect(page.locator('div.id-label')).toHaveText(/custom/)
      await expect(page.locator('#field-title')).toHaveValue('title')
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

    test('collections — should show custom error message when unpublishing fails', async () => {
      const publishedDoc = await payload.create({
        collection: errorOnUnpublishSlug,
        data: {
          _status: 'published',
          title: 'title',
        },
      })
      await page.goto(errorOnUnpublishURL.edit(String(publishedDoc.id)))
      await page.locator('#action-unpublish').click()
      await page.locator('[id^="confirm-un-publish-"] #confirm-action').click()
      await expect(
        page.locator('.payload-toast-item:has-text("Custom error on unpublish")'),
      ).toBeVisible()
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

    test('correctly increments version count', async () => {
      const createdDoc = await payload.create({
        collection: draftCollectionSlug,
        data: {
          description: 'some description',
          title: 'some title',
        },
        draft: true,
      })

      await page.goto(url.edit(createdDoc.id))

      const versionsCountSelector = `.doc-tabs__tabs .pill-version-count`
      const initialCount = await page.locator(versionsCountSelector).textContent()

      const field = page.locator('#field-description')

      await field.fill('new description 1')
      await saveDocAndAssert(page, '#action-save-draft')

      let newCount1: null | string

      await expect(async () => {
        newCount1 = await page.locator(versionsCountSelector).textContent()
        expect(Number(newCount1)).toBeGreaterThan(Number(initialCount))
      }).toPass({ timeout: 10000, intervals: [100] })

      await field.fill('new description 2')
      await saveDocAndAssert(page, '#action-save-draft')

      let newCount2: null | string

      await expect(async () => {
        newCount2 = await page.locator(versionsCountSelector).textContent()
        expect(Number(newCount2)).toBeGreaterThan(Number(newCount1))
      }).toPass({ timeout: 10000, intervals: [100] })

      await field.fill('new description 3')
      await saveDocAndAssert(page, '#action-save-draft')

      await expect(async () => {
        const newCount3 = await page.locator(versionsCountSelector).textContent()
        expect(Number(newCount3)).toBeGreaterThan(Number(newCount2))
      }).toPass({ timeout: 10000, intervals: [100] })
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

  describe('draft globals', () => {
    test('should show global versions view level action in globals versions view', async () => {
      const global = new AdminUrlUtil(serverURL, draftGlobalSlug)
      await page.goto(`${global.global(draftGlobalSlug)}/versions`)
      await expect(page.locator('.app-header .global-versions-button')).toHaveCount(1)
    })

    test('global — has versions tab', async () => {
      const global = new AdminUrlUtil(serverURL, draftGlobalSlug)
      await page.goto(global.global(draftGlobalSlug))

      const docURL = page.url()
      const pathname = new URL(docURL).pathname

      const versionsTab = page.locator('.doc-tab:has-text("Versions")')
      await versionsTab.waitFor({ state: 'visible' })
      await expect(() => expect(versionsTab).toBeTruthy()).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })

      const href = await versionsTab.getAttribute('href')
      await expect(() => expect(href).toBe(`${pathname}/versions`)).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })
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
      await expect(() => {
        expect(page.url()).toMatch(/\/versions/)
      }).toPass({ timeout: 10000, intervals: [100] })
    })

    test('global - should show "save as draft" button when showSaveDraftButton is true', async () => {
      const url = new AdminUrlUtil(serverURL, autosaveWithDraftButtonGlobal)
      await page.goto(url.global(autosaveWithDraftButtonGlobal))
      await expect(page.locator('#action-save-draft')).toBeVisible()
    })

    test('global - should not show "save as draft" button when showSaveDraftButton is false', async () => {
      const url = new AdminUrlUtil(serverURL, autoSaveGlobalSlug)
      await page.goto(url.global(autoSaveGlobalSlug))
      await expect(page.locator('#action-save-draft')).toBeHidden()
    })

    test('global - should autosave', async () => {
      const url = new AdminUrlUtil(serverURL, autoSaveGlobalSlug)
      await page.goto(url.global(autoSaveGlobalSlug))
      const titleField = page.locator('#field-title')
      await titleField.fill('global title')
      await waitForAutoSaveToRunAndComplete(page)
      await expect(titleField).toHaveValue('global title')
      await page.goto(url.global(autoSaveGlobalSlug))
      await expect(page.locator('#field-title')).toHaveValue('global title')
    })

    test('globals — should hide publish button when access control prevents update', async () => {
      const url = new AdminUrlUtil(serverURL, disablePublishGlobalSlug)
      await page.goto(url.global(disablePublishGlobalSlug))
      await expect(page.locator('#action-save')).not.toBeAttached()
    })
  })

  describe('Scheduled publish', () => {
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, draftCollectionSlug)
      autosaveURL = new AdminUrlUtil(serverURL, autosaveCollectionSlug)
    })

    test('should schedule publish', async () => {
      await page.goto(url.create)
      await page.locator('#field-title').fill('scheduled publish')
      await page.locator('#field-description').fill('scheduled publish description')

      // schedule publish should not be available before document has been saved
      await page.locator('#action-save-popup').click()
      await expect(page.locator('#schedule-publish')).toBeHidden()

      // save draft then try to schedule publish
      await saveDocAndAssert(page)
      await page.locator('#action-save-popup').click()
      await page.locator('#schedule-publish').click()

      // drawer should open
      await expect(page.locator('.schedule-publish__drawer-header')).toBeVisible()
      // nothing in scheduled
      await expect(page.locator('.drawer__content')).toContainText('No upcoming events scheduled.')

      // set date and time
      await page.locator('.date-time-picker input').fill('Feb 21, 2050 12:00 AM')
      await page.keyboard.press('Enter')

      // save the scheduled publish
      await page.locator('#scheduled-publish-save').click()

      // delete the scheduled event after it was made
      await page.locator('.cell-delete').locator('.btn').click()

      // see toast deleted successfully
      await expect(
        page.locator('.payload-toast-item:has-text("Deleted successfully.")'),
      ).toBeVisible()
    })

    test('schedule publish config is respected', async () => {
      await page.goto(url.create)
      await page.locator('#field-title').fill('scheduled publish')
      await page.locator('#field-description').fill('scheduled publish description')

      // schedule publish should not be available before document has been saved
      await page.locator('#action-save-popup').click()
      await expect(page.locator('#schedule-publish')).toBeHidden()

      // save draft then try to schedule publish
      await saveDocAndAssert(page)
      await page.locator('#action-save-popup').click()
      await page.locator('#schedule-publish').click()

      // drawer should open
      await expect(page.locator('.schedule-publish__drawer-header')).toBeVisible()
      // nothing in scheduled
      await expect(page.locator('.drawer__content')).toContainText('No upcoming events scheduled.')

      // set date and time
      await page.locator('.date-time-picker input').click()

      const listItem = page
        .locator('.react-datepicker__time-list .react-datepicker__time-list-item')
        .first()

      // We customised it in config to not contain a 12 hour clock
      await expect(async () => {
        await expect(listItem).toHaveText('00:00')
      }).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })
    })

    test('can still schedule publish once autosave is triggered', async () => {
      await page.goto(autosaveURL.create)
      await page.locator('#field-title').fill('scheduled publish')
      await page.locator('#field-description').fill('scheduled publish description')

      await saveDocAndAssert(page)

      await page.locator('#field-title').fill('scheduled publish updated')

      await waitForAutoSaveToRunAndComplete(page)

      await page.locator('#action-save-popup').click()

      await expect(async () => {
        await expect(page.locator('#schedule-publish')).toBeVisible()
      }).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })
    })
  })

  describe('Collections - publish specific locale', () => {
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, localizedCollectionSlug)
    })

    test('should show publish individual locale dropdown', async () => {
      await page.goto(url.create)
      const publishOptions = page.locator('.doc-controls__controls .popup')

      await expect(publishOptions).toBeVisible()
    })

    test('should show option to publish current locale', async () => {
      await page.goto(url.create)
      const publishOptions = page.locator('.doc-controls__controls .popup')
      await publishOptions.click()

      const publishSpecificLocale = page.locator('.doc-controls__controls .popup__content')

      await expect(publishSpecificLocale).toContainText('English')
    })

    test('should publish specific locale', async () => {
      await page.goto(url.create)
      await changeLocale(page, 'es')
      const textField = page.locator('#field-text')
      const status = page.locator('.status__value')

      await textField.fill('spanish published')
      await saveDocAndAssert(page)
      await expect(status).toContainText('Published')

      await textField.fill('spanish draft')
      await saveDocAndAssert(page, '#action-save-draft')
      await expect(status).toContainText('Changed')

      await changeLocale(page, 'en')
      await textField.fill('english published')
      const publishOptions = page.locator('.doc-controls__controls .popup')
      await publishOptions.click()

      const publishSpecificLocale = page.locator('#publish-locale')
      await expect(publishSpecificLocale).toContainText('English')
      await publishSpecificLocale.click()

      await wait(500)

      await expect(async () => {
        await expect(
          page.locator('.payload-toast-item:has-text("Updated successfully.")'),
        ).toBeVisible()
      }).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })

      id = await page.locator('.id-label').getAttribute('title')

      const data = await payload.find({
        collection: localizedCollectionSlug,
        locale: '*',
        where: {
          id: { equals: id },
        },
      })

      const publishedDoc = data.docs[0]

      expect(publishedDoc.text).toStrictEqual({
        en: 'english published',
        es: 'spanish published',
      })
    })
  })

  describe('Collections with draft validation', () => {
    beforeAll(() => {
      autosaveWithValidateURL = new AdminUrlUtil(serverURL, autosaveWithValidateCollectionSlug)
      draftWithValidateURL = new AdminUrlUtil(serverURL, draftWithValidateCollectionSlug)
    })

    test('- can save', async () => {
      await page.goto(draftWithValidateURL.create)

      const titleField = page.locator('#field-title')
      await titleField.fill('Initial')
      await saveDocAndAssert(page, '#action-save-draft')

      await expect(titleField).toBeEnabled()
      await titleField.fill('New title')
      await saveDocAndAssert(page, '#action-save-draft')

      await page.reload()

      // Ensure its saved
      await expect(page.locator('#field-title')).toHaveValue('New title')
    })

    test('- can safely trigger validation errors and then continue editing', async () => {
      await page.goto(draftWithValidateURL.create)

      const titleField = page.locator('#field-title')
      await titleField.fill('Initial')
      await saveDocAndAssert(page, '#action-save-draft')
      await page.reload()

      await expect(titleField).toBeEnabled()
      await titleField.fill('')
      await saveDocAndAssert(page, '#action-save-draft', 'error')

      await titleField.fill('New title')

      await saveDocAndAssert(page, '#action-save-draft')

      await page.reload()

      // Ensure its saved
      await expect(page.locator('#field-title')).toHaveValue('New title')
    })

    test('- shows a prevent leave alert when form is submitted but invalid', async () => {
      await page.goto(draftWithValidateURL.create)

      // Flag to check against if window alert has been displayed and dismissed since we can only check via events
      let alertDisplayed = false

      async function dismissAlert(dialog: Dialog) {
        alertDisplayed = true

        await dialog.dismiss()
      }

      async function acceptAlert(dialog: Dialog) {
        await dialog.accept()
      }

      const titleField = page.locator('#field-title')
      await titleField.fill('Initial')
      await saveDocAndAssert(page, '#action-save-draft')

      // Remove required data, then let autosave trigger
      await expect(titleField).toBeEnabled()
      await titleField.fill('')
      await saveDocAndAssert(page, '#action-save-draft', 'error')

      // Expect the prevent leave and then dismiss it
      page.on('dialog', dismissAlert)
      await expect(async () => {
        await page.reload({ timeout: 500 }) // custom short timeout since we want this to fail
      }).not.toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })

      await expect(() => {
        expect(alertDisplayed).toEqual(true)
      }).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })

      // Remove event listener and reset our flag
      page.removeListener('dialog', dismissAlert)

      await expect(page.locator('#field-title')).toHaveValue('')

      // Now has updated data
      await titleField.fill('New title')
      await saveDocAndAssert(page, '#action-save-draft')
      await expect(page.locator('#field-title')).toHaveValue('New title')

      await page.reload()

      page.on('dialog', acceptAlert)

      // Ensure data is saved
      await expect(page.locator('#field-title')).toHaveValue('New title')

      // Fill with invalid data again, then reload and accept the warning, should contain previous data
      await titleField.fill('')

      await page.reload()

      await expect(titleField).toBeEnabled()

      // Contains previous data
      await expect(page.locator('#field-title')).toHaveValue('New title')

      // Remove listener
      page.removeListener('dialog', acceptAlert)
    })

    test('- with autosave - can save', async () => {
      await page.goto(autosaveWithValidateURL.create)

      const titleField = page.locator('#field-title')
      await titleField.fill('Initial')
      await saveDocAndAssert(page, '#action-save-draft')

      await expect(titleField).toBeEnabled()
      await titleField.fill('New title')
      await waitForAutoSaveToRunAndComplete(page)

      await page.reload()

      // Ensure its saved
      await expect(page.locator('#field-title')).toHaveValue('New title')
    })

    test('- with autosave - can safely trigger validation errors and then continue editing', async () => {
      // This test has to make sure we don't enter an infinite loop when draft.validate is on and we have autosave enabled
      await page.goto(autosaveWithValidateURL.create)

      const titleField = page.locator('#field-title')
      await titleField.fill('Initial')
      await saveDocAndAssert(page, '#action-save-draft')
      await page.reload()

      await expect(titleField).toBeEnabled()
      await titleField.fill('')
      await waitForAutoSaveToRunAndComplete(page, 'error')

      await titleField.fill('New title')

      await waitForAutoSaveToRunAndComplete(page)

      await page.reload()

      // Ensure its saved
      await expect(page.locator('#field-title')).toHaveValue('New title')
    })

    test('- with autosave - shows a prevent leave alert when form is submitted but invalid', async () => {
      await page.goto(autosaveWithValidateURL.create)

      // Flag to check against if window alert has been displayed and dismissed since we can only check via events
      let alertDisplayed = false

      async function dismissAlert(dialog: Dialog) {
        alertDisplayed = true

        await dialog.dismiss()
      }

      async function acceptAlert(dialog: Dialog) {
        await dialog.accept()
      }

      const titleField = page.locator('#field-title')
      await titleField.fill('Initial')
      await saveDocAndAssert(page, '#action-save-draft')

      // Remove required data, then let autosave trigger
      await expect(titleField).toBeEnabled()
      await titleField.fill('')
      await waitForAutoSaveToRunAndComplete(page, 'error')

      // Expect the prevent leave and then dismiss it
      page.on('dialog', dismissAlert)
      await expect(async () => {
        await page.reload({ timeout: 500 }) // custom short timeout since we want this to fail
      }).not.toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })

      await expect(() => {
        expect(alertDisplayed).toEqual(true)
      }).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })

      // Remove event listener and reset our flag
      page.removeListener('dialog', dismissAlert)

      await expect(page.locator('#field-title')).toHaveValue('')

      // Now has updated data
      await titleField.fill('New title')
      await waitForAutoSaveToRunAndComplete(page)
      await expect(page.locator('#field-title')).toHaveValue('New title')

      await page.reload()

      page.on('dialog', acceptAlert)

      // Ensure data is saved
      await expect(page.locator('#field-title')).toHaveValue('New title')

      // Fill with invalid data again, then reload and accept the warning, should contain previous data
      await titleField.fill('')

      await waitForAutoSaveToRunAndComplete(page, 'error')

      await page.reload()

      await expect(titleField).toBeEnabled()

      // Contains previous data
      await expect(page.locator('#field-title')).toHaveValue('New title')

      // Remove listener
      page.removeListener('dialog', acceptAlert)
    })
  })

  describe('Globals - publish individual locale', () => {
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, localizedGlobalSlug)
    })

    test('should show publish individual locale dropdown', async () => {
      await page.goto(url.global(localizedGlobalSlug))
      const publishOptions = page.locator('.doc-controls__controls .popup')

      await expect(publishOptions).toBeVisible()
    })

    test('should show option to publish current locale', async () => {
      await page.goto(url.global(localizedGlobalSlug))
      const publishOptions = page.locator('.doc-controls__controls .popup')
      await publishOptions.click()

      const publishSpecificLocale = page.locator('.doc-controls__controls .popup__content')

      await expect(publishSpecificLocale).toContainText('English')
    })
  })

  describe('Versions diff view', () => {
    let postID: string
    let versionID: string
    let diffID: string
    let versionDiffID: string

    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, draftCollectionSlug)
    })

    beforeEach(async () => {
      const newPost = await payload.create({
        collection: draftCollectionSlug,
        depth: 0,
        data: {
          title: 'new post',
          description: 'new description',
        },
      })

      postID = newPost.id

      await payload.update({
        collection: draftCollectionSlug,
        id: postID,
        draft: true,
        depth: 0,
        data: {
          title: 'draft post',
          description: 'draft description',
          blocksField: [
            {
              blockName: 'block1',
              blockType: 'block',
              text: 'block text',
            },
          ],
        },
      })

      const versions = await payload.findVersions({
        collection: draftCollectionSlug,
        limit: 1,
        depth: 0,
        where: {
          parent: { equals: postID },
        },
      })

      versionID = versions.docs[0].id

      const diffDoc = (
        await payload.find({
          collection: diffCollectionSlug,
          depth: 0,
          limit: 1,
        })
      ).docs[0] as Diff

      diffID = diffDoc.id

      const versionDiff = (
        await payload.findVersions({
          collection: diffCollectionSlug,
          depth: 0,
          limit: 1,
          where: {
            parent: { equals: diffID },
          },
        })
      ).docs[0] as Diff

      versionDiffID = versionDiff.id
    })

    async function navigateToDraftVersionView() {
      const versionURL = `${serverURL}/admin/collections/${draftCollectionSlug}/${postID}/versions/${versionID}`
      await page.goto(versionURL)
      await expect(page.locator('.render-field-diffs').first()).toBeVisible()
    }

    async function navigateToDiffVersionView() {
      const versionURL = `${serverURL}/admin/collections/${diffCollectionSlug}/${diffID}/versions/${versionDiffID}`
      await page.goto(versionURL)
      await expect(page.locator('.render-field-diffs').first()).toBeVisible()
    }

    test('should render diff', async () => {
      await navigateToDraftVersionView()
      expect(true).toBe(true)
    })

    test('should render diff for nested fields', async () => {
      await navigateToDraftVersionView()

      const blocksDiffLabel = page.getByText('Blocks Field', { exact: true })
      await expect(blocksDiffLabel).toBeVisible()

      const blocksDiff = page.locator('.iterable-diff', { has: blocksDiffLabel })
      await expect(blocksDiff).toBeVisible()

      const blocksDiffRows = blocksDiff.locator('.iterable-diff__rows')
      await expect(blocksDiffRows).toBeVisible()

      const firstBlocksDiffRow = blocksDiffRows.locator('.iterable-diff__row').first()
      await expect(firstBlocksDiffRow).toBeVisible()

      const firstBlockDiffLabel = firstBlocksDiffRow.getByText('Block 01', { exact: true })
      await expect(firstBlockDiffLabel).toBeVisible()
    })

    test('should render diff collapser for nested fields', async () => {
      await navigateToDraftVersionView()

      const blocksDiffLabel = page.getByText('Blocks Field', { exact: true })
      await expect(blocksDiffLabel).toBeVisible()

      // Expect iterable rows diff to be visible
      const blocksDiff = page.locator('.iterable-diff', { has: blocksDiffLabel })
      await expect(blocksDiff).toBeVisible()

      // Collapse to show iterable fields change count
      await blocksDiff.locator('.diff-collapser__toggle-button').first().click()

      // Expect iterable change count to be visible
      const iterableChangeCount = blocksDiff.locator('.diff-collapser__field-change-count').first()
      await expect(iterableChangeCount).toHaveText('2 changed fields')

      await blocksDiff.locator('.diff-collapser__toggle-button').first().click()

      // Expect iterable rows to be visible
      const blocksDiffRows = blocksDiff.locator('.iterable-diff__rows')
      await expect(blocksDiffRows).toBeVisible()

      // Expect first iterable row to be visible
      const firstBlocksDiffRow = blocksDiffRows.locator('.iterable-diff__row').first()
      await expect(firstBlocksDiffRow).toBeVisible()

      await firstBlocksDiffRow.locator('.diff-collapser__toggle-button').first().click()
      // Expect first row change count to be visible
      const firstBlocksDiffRowChangeCount = firstBlocksDiffRow
        .locator('.diff-collapser__field-change-count')
        .first()
      await expect(firstBlocksDiffRowChangeCount).toHaveText('2 changed fields')
      await firstBlocksDiffRow.locator('.diff-collapser__toggle-button').first().click()

      // Expect collapser content to be visible
      const diffCollapserContent = blocksDiffRows.locator('.diff-collapser__content')
      await expect(diffCollapserContent).toBeVisible()

      // Expect toggle button to be visible
      const toggleButton = firstBlocksDiffRow.locator('.diff-collapser__toggle-button').first()
      await expect(toggleButton).toBeVisible()

      // Collapse content
      await toggleButton.click()

      // Expect collapser content to be hidden
      await expect(diffCollapserContent).toBeHidden()

      // Uncollapse content
      await toggleButton.click()

      // Expect collapser content to be visible
      await expect(diffCollapserContent).toBeVisible()
    })

    test('correctly renders diff for array fields', async () => {
      await navigateToDiffVersionView()

      const textInArray = page.locator('[data-field-path="array.0.textInArray"]')

      await expect(textInArray.locator('.html-diff__diff-old')).toHaveText('textInArray')
      await expect(textInArray.locator('.html-diff__diff-new')).toHaveText('textInArray2')
    })

    test('correctly renders diff for localized array fields', async () => {
      await navigateToDiffVersionView()

      const textInArray = page
        .locator('[data-field-path="arrayLocalized"][data-locale="en"]')
        .locator('[data-field-path="arrayLocalized.0.textInArrayLocalized"]')

      await expect(textInArray.locator('.html-diff__diff-old')).toHaveText('textInArrayLocalized')
      await expect(textInArray.locator('.html-diff__diff-new')).toHaveText('textInArrayLocalized2')
    })

    test('correctly renders modified-only diff for localized array fields', async () => {
      await navigateToDiffVersionView()

      const textInArrayES = page.locator('[data-field-path="arrayLocalized"][data-locale="es"]')

      await expect(textInArrayES).toBeHidden()

      await page.locator('#modifiedOnly').click()

      await expect(textInArrayES).toContainText('No Array Localizeds found')
    })

    test('correctly renders diff for block fields', async () => {
      await navigateToDiffVersionView()

      const textInBlock = page.locator('[data-field-path="blocks.0.textInBlock"]')

      await expect(textInBlock.locator('.html-diff__diff-old')).toHaveText('textInBlock')
      await expect(textInBlock.locator('.html-diff__diff-new')).toHaveText('textInBlock2')
    })

    test('correctly renders diff for collapsibles within block fields', async () => {
      await navigateToDiffVersionView()

      const textInBlock = page.locator(
        '[data-field-path="blocks.1.textInCollapsibleInCollapsibleBlock"]',
      )

      await expect(textInBlock.locator('.html-diff__diff-old')).toHaveText(
        'textInCollapsibleInCollapsibleBlock',
      )
      await expect(textInBlock.locator('.html-diff__diff-new')).toHaveText(
        'textInCollapsibleInCollapsibleBlock2',
      )
    })

    test('correctly renders diff for rows within block fields', async () => {
      await navigateToDiffVersionView()

      const textInBlock = page.locator('[data-field-path="blocks.1.textInRowInCollapsibleBlock"]')

      await expect(textInBlock.locator('.html-diff__diff-old')).toHaveText(
        'textInRowInCollapsibleBlock',
      )
      await expect(textInBlock.locator('.html-diff__diff-new')).toHaveText(
        'textInRowInCollapsibleBlock2',
      )
    })

    test('correctly renders diff for named tabs within block fields', async () => {
      await navigateToDiffVersionView()

      const textInBlock = page.locator(
        '[data-field-path="blocks.2.namedTab1InBlock.textInNamedTab1InBlock"]',
      )

      await expect(textInBlock.locator('.html-diff__diff-old')).toHaveText('textInNamedTab1InBlock')
      await expect(textInBlock.locator('.html-diff__diff-new')).toHaveText(
        'textInNamedTab1InBlock2',
      )
    })

    test('correctly renders diff for unnamed tabs within block fields', async () => {
      await navigateToDiffVersionView()

      const textInBlock = page.locator('[data-field-path="blocks.2.textInUnnamedTab2InBlock"]')

      await expect(textInBlock.locator('.html-diff__diff-old')).toHaveText(
        'textInUnnamedTab2InBlock',
      )
      await expect(textInBlock.locator('.html-diff__diff-new')).toHaveText(
        'textInUnnamedTab2InBlock2',
      )
    })

    test('correctly renders diff for checkbox fields', async () => {
      await navigateToDiffVersionView()

      const checkbox = page.locator('[data-field-path="checkbox"]')

      await expect(checkbox.locator('.html-diff__diff-old')).toHaveText('true')
      await expect(checkbox.locator('.html-diff__diff-new')).toHaveText('false')
    })

    test('correctly renders diff for code fields', async () => {
      await navigateToDiffVersionView()

      const code = page.locator('[data-field-path="code"]')

      await expect(code.locator('.html-diff__diff-old')).toHaveText('code')
      await expect(code.locator('.html-diff__diff-new')).toHaveText('code2')
    })

    test('correctly renders diff for collapsible fields', async () => {
      await navigateToDiffVersionView()

      const collapsible = page.locator('[data-field-path="textInCollapsible"]')

      await expect(collapsible.locator('.html-diff__diff-old')).toHaveText('textInCollapsible')
      await expect(collapsible.locator('.html-diff__diff-new')).toHaveText('textInCollapsible2')
    })

    test('correctly renders diff for date fields', async () => {
      await navigateToDiffVersionView()

      const date = page.locator('[data-field-path="date"]')

      await expect(date.locator('.html-diff__diff-old')).toContainText(' 2021, ')
      await expect(date.locator('.html-diff__diff-new')).toContainText(' 2023, ')
      // Do not check for exact date, as it may vary based on
      // timezone of the test runner which could cause flakiness
    })

    test('correctly renders diff for email fields', async () => {
      await navigateToDiffVersionView()

      const email = page.locator('[data-field-path="email"]')

      await expect(email.locator('.html-diff__diff-old')).toHaveText('email@email.com')
      await expect(email.locator('.html-diff__diff-new')).toHaveText('email2@email.com')
    })

    test('correctly renders diff for group fields', async () => {
      await navigateToDiffVersionView()

      const group = page.locator('[data-field-path="group.textInGroup"]')

      await expect(group.locator('.html-diff__diff-old')).toHaveText('textInGroup')
      await expect(group.locator('.html-diff__diff-new')).toHaveText('textInGroup2')
    })

    test('correctly renders diff for number fields', async () => {
      await navigateToDiffVersionView()

      const number = page.locator('[data-field-path="number"]')

      await expect(number.locator('.html-diff__diff-old')).toHaveText('1')
      await expect(number.locator('.html-diff__diff-new')).toHaveText('2')
    })

    test('correctly renders diff for point fields', async () => {
      await navigateToDiffVersionView()

      const point = page.locator('[data-field-path="point"]')

      await expect(point.locator('.html-diff__diff-old')).toHaveText('[\n 1,\n 2\n]')
      await expect(point.locator('.html-diff__diff-new')).toHaveText('[\n 1,\n 3\n]')
    })

    test('correctly renders diff for radio fields', async () => {
      await navigateToDiffVersionView()

      const radio = page.locator('[data-field-path="radio"]')

      await expect(radio.locator('.html-diff__diff-old')).toHaveText('Option 1')
      await expect(radio.locator('.html-diff__diff-new')).toHaveText('Option 2')
    })

    test('correctly renders diff for relationship fields', async () => {
      await navigateToDiffVersionView()

      const relationship = page.locator('[data-field-path="relationship"]')

      const draftDocs = await payload.find({
        collection: 'draft-posts',
        sort: 'createdAt',
        limit: 3,
        depth: 0,
      })

      await expect(
        relationship.locator('.html-diff__diff-old .relationship-diff__info'),
      ).toHaveText(String(draftDocs?.docs?.[1]?.title))
      await expect(
        relationship.locator('.html-diff__diff-new .relationship-diff__info'),
      ).toHaveText(String(draftDocs?.docs?.[2]?.title))
    })

    test('correctly renders diff for richtext fields', async () => {
      await navigateToDiffVersionView()

      const richtext = page.locator('[data-field-path="richtext"]')

      const oldDiff = richtext.locator('.html-diff__diff-old')
      const newDiff = richtext.locator('.html-diff__diff-new')

      const oldHTML =
        `Fugiat <span data-match-type="delete">essein</span> dolor aleiqua <span data-match-type="delete">cillum</span> proident ad cillum excepteur mollit reprehenderit mollit commodo. Pariatur incididunt non exercitation est mollit nisi <span data-match-type="delete">laboredeleteofficia</span> cupidatat amet commodo commodo proident occaecat.
      `.trim()
      const newHTML =
        `Fugiat <span data-match-type="create">esse new in</span> dolor aleiqua <span data-match-type="create">gillum</span> proident ad cillum excepteur mollit reprehenderit mollit commodo. Pariatur incididunt non exercitation est mollit nisi <span data-match-type="create">labore officia</span> cupidatat amet commodo commodo proident occaecat.`.trim()

      expect(await oldDiff.locator('p').first().innerHTML()).toEqual(oldHTML)
      expect(await newDiff.locator('p').first().innerHTML()).toEqual(newHTML)
    })

    test('correctly renders diff for richtext fields with custom Diff component', async () => {
      await navigateToDiffVersionView()

      const richtextWithCustomDiff = page.locator('[data-field-path="richtextWithCustomDiff"]')

      await expect(richtextWithCustomDiff.locator('p')).toHaveText('Test')
    })

    test('correctly renders diff for row fields', async () => {
      await navigateToDiffVersionView()

      const textInRow = page.locator('[data-field-path="textInRow"]')

      await expect(textInRow.locator('.html-diff__diff-old')).toHaveText('textInRow')
      await expect(textInRow.locator('.html-diff__diff-new')).toHaveText('textInRow2')
    })

    test('correctly renders diff for select fields', async () => {
      await navigateToDiffVersionView()

      const select = page.locator('[data-field-path="select"]')

      await expect(select.locator('.html-diff__diff-old')).toHaveText('Option 1')
      await expect(select.locator('.html-diff__diff-new')).toHaveText('Option 2')
    })

    test('correctly renders diff for named tabs', async () => {
      await navigateToDiffVersionView()

      const textInNamedTab1 = page.locator('[data-field-path="namedTab1.textInNamedTab1"]')

      await expect(textInNamedTab1.locator('.html-diff__diff-old')).toHaveText('textInNamedTab1')
      await expect(textInNamedTab1.locator('.html-diff__diff-new')).toHaveText('textInNamedTab12')
    })

    test('correctly renders diff for unnamed tabs', async () => {
      await navigateToDiffVersionView()

      const textInUnamedTab2 = page.locator('[data-field-path="textInUnnamedTab2"]')

      await expect(textInUnamedTab2.locator('.html-diff__diff-old')).toHaveText('textInUnnamedTab2')
      await expect(textInUnamedTab2.locator('.html-diff__diff-new')).toHaveText(
        'textInUnnamedTab22',
      )
    })

    test('correctly renders diff for text fields', async () => {
      await navigateToDiffVersionView()

      const text = page.locator('[data-field-path="text"]')

      await expect(text.locator('.html-diff__diff-old')).toHaveText('text')
      await expect(text.locator('.html-diff__diff-new')).toHaveText('text2')
    })

    test('correctly renders diff for textArea fields', async () => {
      await navigateToDiffVersionView()

      const textArea = page.locator('[data-field-path="textArea"]')

      await expect(textArea.locator('.html-diff__diff-old')).toHaveText('textArea')
      await expect(textArea.locator('.html-diff__diff-new')).toHaveText('textArea2')
    })

    test('correctly renders diff for upload fields', async () => {
      await navigateToDiffVersionView()

      const upload = page.locator('[data-field-path="upload"]')

      const uploadDocs = await payload.find({
        collection: 'media',
        sort: 'createdAt',
        depth: 0,
        limit: 2,
      })

      await expect(upload.locator('.html-diff__diff-old .upload-diff__info')).toHaveText(
        String(uploadDocs?.docs?.[0]?.filename),
      )
      await expect(upload.locator('.html-diff__diff-new .upload-diff__info')).toHaveText(
        String(uploadDocs?.docs?.[1]?.filename),
      )
    })
  })

  describe('Scheduled publish', () => {
    test.use({
      timezoneId: londonTimezone,
    })

    test('correctly sets a UTC date for the chosen timezone', async () => {
      const post = await payload.create({
        collection: draftCollectionSlug,
        data: {
          title: 'new post',
          description: 'new description',
        },
      })

      await page.goto(`${serverURL}/admin/collections/${draftCollectionSlug}/${post.id}`)

      const publishDropdown = page.locator('.doc-controls__controls .popup-button')
      await publishDropdown.click()

      const schedulePublishButton = page.locator(
        '.popup-button-list__button:has-text("Schedule Publish")',
      )
      await schedulePublishButton.click()

      const drawerContent = page.locator('.schedule-publish__scheduler')

      const dropdownControlSelector = drawerContent.locator(`.timezone-picker .rs__control`)
      const timezoneOptionSelector = drawerContent.locator(
        `.timezone-picker .rs__menu .rs__option:has-text("Paris")`,
      )
      await dropdownControlSelector.click()
      await timezoneOptionSelector.click()

      const dateInput = drawerContent.locator('.date-time-picker__input-wrapper input')
      // Create a date for 2049-01-01 18:00:00
      const date = new Date(2049, 0, 1, 18, 0)

      await dateInput.fill(date.toISOString())
      await page.keyboard.press('Enter') // formats the date to the correct format

      const saveButton = drawerContent.locator('.schedule-publish__actions button')

      await saveButton.click()

      const upcomingContent = page.locator('.schedule-publish__upcoming')
      const createdDate = await upcomingContent.locator('.row-1 .cell-waitUntil').textContent()

      await expect(() => {
        expect(createdDate).toContain('6:00:00 PM')
      }).toPass({ timeout: 10000, intervals: [100] })

      const {
        docs: [createdJob],
      } = await payload.find({
        collection: 'payload-jobs',
        where: {
          'input.doc.value': {
            equals: String(post.id),
          },
        },
      })

      // eslint-disable-next-line payload/no-flaky-assertions
      expect(createdJob).toBeTruthy()

      // eslint-disable-next-line payload/no-flaky-assertions
      expect(createdJob?.waitUntil).toEqual('2049-01-01T17:00:00.000Z')
    })
  })
})
