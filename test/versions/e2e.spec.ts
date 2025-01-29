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
import type { Config, Diff } from './payload-types.js'

import {
  changeLocale,
  ensureCompilationIsDone,
  exactText,
  findTableCell,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
  selectTableRow,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { trackNetworkRequests } from '../helpers/e2e/trackNetworkRequests.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../helpers/reInitializeDB.js'
import { waitForAutoSaveToRunAndComplete } from '../helpers/waitForAutoSaveToRunAndComplete.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { titleToDelete } from './shared.js'
import {
  autosaveCollectionSlug,
  autoSaveGlobalSlug,
  customIDSlug,
  diffCollectionSlug,
  disablePublishGlobalSlug,
  disablePublishSlug,
  draftCollectionSlug,
  draftGlobalSlug,
  draftWithMaxCollectionSlug,
  draftWithMaxGlobalSlug,
  localizedCollectionSlug,
  localizedGlobalSlug,
  postCollectionSlug,
} from './slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let context: BrowserContext

describe('Versions', () => {
  let page: Page
  let url: AdminUrlUtil
  let serverURL: string
  let autosaveURL: AdminUrlUtil
  let disablePublishURL: AdminUrlUtil
  let customIDURL: AdminUrlUtil
  let postURL: AdminUrlUtil
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
      const versionsPill = versionsTab.locator('.doc-tab__count')
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
      const row2 = page.locator('tbody .row-2')
      const versionID = await row2.locator('.cell-id').textContent()
      await page.goto(`${savedDocURL}/versions/${versionID}`)
      await page.waitForURL(`${savedDocURL}/versions/${versionID}`)
      await expect(page.locator('.render-field-diffs')).toBeVisible()
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

      await trackNetworkRequests(
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

    test('collection - should update updatedAt', async () => {
      await page.goto(url.create)
      await page.waitForURL(`**/${url.create}`)

      // fill out doc in english
      await page.locator('#field-title').fill('title')
      await page.locator('#field-description').fill('initial description')
      await saveDocAndAssert(page)

      const updatedAtWrapper = await page.locator(
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

      const newUpdatedAt = await updatedAtWrapper.locator('.doc-controls__value').textContent()

      expect(newUpdatedAt).not.toEqual(initialUpdatedAt)
    })

    test('collection - should update updatedAt on autosave', async () => {
      await page.goto(autosaveURL.create)
      await page.locator('#field-title').fill('autosave title')
      await waitForAutoSaveToRunAndComplete(page)
      await expect(page.locator('#field-title')).toHaveValue('autosave title')

      const updatedAtWrapper = await page.locator(
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

      const newUpdatedAt = await updatedAtWrapper.locator('.doc-controls__value').textContent()

      expect(newUpdatedAt).not.toEqual(initialUpdatedAt)
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

      const publishSpecificLocale = page.locator('.popup-button-list button').first()
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
        where: {
          parent: { equals: postID },
        },
      })

      versionID = versions.docs[0].id

      const diffDoc = (
        await payload.find({
          collection: diffCollectionSlug,
        })
      ).docs[0] as Diff

      diffID = diffDoc.id

      const versionDiff = (
        await payload.findVersions({
          collection: diffCollectionSlug,
          where: {
            parent: { equals: diffID },
          },
        })
      ).docs[0] as Diff

      versionDiffID = versionDiff.id
    })

    async function navigateToVersionDiff() {
      const versionURL = `${serverURL}/admin/collections/${draftCollectionSlug}/${postID}/versions/${versionID}`
      await page.goto(versionURL)
      await page.waitForURL(versionURL)
      await expect(page.locator('.render-field-diffs').first()).toBeVisible()
    }

    async function navigateToVersionFieldsDiff() {
      const versionURL = `${serverURL}/admin/collections/${diffCollectionSlug}/${diffID}/versions/${versionDiffID}`
      await page.goto(versionURL)
      await page.waitForURL(versionURL)
      await expect(page.locator('.render-field-diffs').first()).toBeVisible()
    }

    test('should render diff', async () => {
      await navigateToVersionDiff()
    })

    test('should render diff for nested fields', async () => {
      await navigateToVersionDiff()

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
      await navigateToVersionDiff()

      const blocksDiffLabel = page.getByText('Blocks Field', { exact: true })
      await expect(blocksDiffLabel).toBeVisible()

      // Expect iterable rows diff to be visible
      const blocksDiff = page.locator('.iterable-diff', { has: blocksDiffLabel })
      await expect(blocksDiff).toBeVisible()

      // Expect iterable change count to be visible
      const iterableChangeCount = blocksDiff.locator('.diff-collapser__field-change-count').first()
      await expect(iterableChangeCount).toHaveText('2 changed fields')

      // Expect iterable rows to be visible
      const blocksDiffRows = blocksDiff.locator('.iterable-diff__rows')
      await expect(blocksDiffRows).toBeVisible()

      // Expect first iterable row to be visible
      const firstBlocksDiffRow = blocksDiffRows.locator('.iterable-diff__row').first()
      await expect(firstBlocksDiffRow).toBeVisible()

      // Expect first row change count to be visible
      const firstBlocksDiffRowChangeCount = firstBlocksDiffRow
        .locator('.diff-collapser__field-change-count')
        .first()
      await expect(firstBlocksDiffRowChangeCount).toHaveText('2 changed fields')

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
      await navigateToVersionFieldsDiff()

      const textInArray = page.locator('[data-field-path="array.0.textInArray"]')

      await expect(textInArray.locator('tr').nth(1).locator('td').nth(1)).toHaveText('textInArray')
      await expect(textInArray.locator('tr').nth(1).locator('td').nth(3)).toHaveText('textInArray2')
    })

    test('correctly renders diff for block fields', async () => {
      await navigateToVersionFieldsDiff()

      const textInBlock = page.locator('[data-field-path="blocks.0.textInBlock"]')

      await expect(textInBlock.locator('tr').nth(1).locator('td').nth(1)).toHaveText('textInBlock')
      await expect(textInBlock.locator('tr').nth(1).locator('td').nth(3)).toHaveText('textInBlock2')
    })

    test('correctly renders diff for checkbox fields', async () => {
      await navigateToVersionFieldsDiff()

      const checkbox = page.locator('[data-field-path="checkbox"]')

      await expect(checkbox.locator('tr').nth(1).locator('td').nth(1)).toHaveText('true')
      await expect(checkbox.locator('tr').nth(1).locator('td').nth(3)).toHaveText('false')
    })

    test('correctly renders diff for code fields', async () => {
      await navigateToVersionFieldsDiff()

      const code = page.locator('[data-field-path="code"]')

      await expect(code.locator('tr').nth(1).locator('td').nth(1)).toHaveText('code')
      await expect(code.locator('tr').nth(1).locator('td').nth(3)).toHaveText('code2')
    })

    test('correctly renders diff for collapsible fields', async () => {
      await navigateToVersionFieldsDiff()

      const collapsible = page.locator('[data-field-path="textInCollapsible"]')

      await expect(collapsible.locator('tr').nth(1).locator('td').nth(1)).toHaveText(
        'textInCollapsible',
      )
      await expect(collapsible.locator('tr').nth(1).locator('td').nth(3)).toHaveText(
        'textInCollapsible2',
      )
    })

    test('correctly renders diff for date fields', async () => {
      await navigateToVersionFieldsDiff()

      const date = page.locator('[data-field-path="date"]')

      await expect(date.locator('tr').nth(1).locator('td').nth(1)).toHaveText(
        '2021-01-01T00:00:00.000Z',
      )
      await expect(date.locator('tr').nth(1).locator('td').nth(3)).toHaveText(
        '2023-01-01T00:00:00.000Z',
      )
    })

    test('correctly renders diff for email fields', async () => {
      await navigateToVersionFieldsDiff()

      const email = page.locator('[data-field-path="email"]')

      await expect(email.locator('tr').nth(1).locator('td').nth(1)).toHaveText('email@email.com')
      await expect(email.locator('tr').nth(1).locator('td').nth(3)).toHaveText('email2@email.com')
    })

    test('correctly renders diff for group fields', async () => {
      await navigateToVersionFieldsDiff()

      const group = page.locator('[data-field-path="group.textInGroup"]')

      await expect(group.locator('tr').nth(1).locator('td').nth(1)).toHaveText('textInGroup')
      await expect(group.locator('tr').nth(1).locator('td').nth(3)).toHaveText('textInGroup2')
    })

    test('correctly renders diff for number fields', async () => {
      await navigateToVersionFieldsDiff()

      const number = page.locator('[data-field-path="number"]')

      await expect(number.locator('tr').nth(1).locator('td').nth(1)).toHaveText('1')
      await expect(number.locator('tr').nth(1).locator('td').nth(3)).toHaveText('2')
    })

    test('correctly renders diff for point fields', async () => {
      await navigateToVersionFieldsDiff()

      const point = page.locator('[data-field-path="point"]')

      await expect(point.locator('tr').nth(3).locator('td').nth(1)).toHaveText('2')
      await expect(point.locator('tr').nth(3).locator('td').nth(3)).toHaveText('3')
    })

    test('correctly renders diff for radio fields', async () => {
      await navigateToVersionFieldsDiff()

      const radio = page.locator('[data-field-path="radio"]')

      await expect(radio.locator('tr').nth(1).locator('td').nth(1)).toHaveText('Option 1')
      await expect(radio.locator('tr').nth(1).locator('td').nth(3)).toHaveText('Option 2')
    })

    test('correctly renders diff for relationship fields', async () => {
      await navigateToVersionFieldsDiff()

      const relationship = page.locator('[data-field-path="relationship"]')

      const draftDocs = await payload.find({
        collection: 'draft-posts',
        sort: 'createdAt',
        limit: 3,
      })

      await expect(relationship.locator('tr').nth(1).locator('td').nth(1)).toHaveText(
        String(draftDocs?.docs?.[1]?.id),
      )
      await expect(relationship.locator('tr').nth(1).locator('td').nth(3)).toHaveText(
        String(draftDocs?.docs?.[2]?.id),
      )
    })

    test('correctly renders diff for richtext fields', async () => {
      await navigateToVersionFieldsDiff()

      const richtext = page.locator('[data-field-path="richtext"]')

      await expect(richtext.locator('tr').nth(16).locator('td').nth(1)).toHaveText(
        '"text": "richtext",',
      )
      await expect(richtext.locator('tr').nth(16).locator('td').nth(3)).toHaveText(
        '"text": "richtext2",',
      )
    })

    test('correctly renders diff for richtext fields with custom Diff component', async () => {
      await navigateToVersionFieldsDiff()

      const richtextWithCustomDiff = page.locator('[data-field-path="richtextWithCustomDiff"]')

      await expect(richtextWithCustomDiff.locator('p')).toHaveText('Test')
    })

    test('correctly renders diff for row fields', async () => {
      await navigateToVersionFieldsDiff()

      const textInRow = page.locator('[data-field-path="textInRow"]')

      await expect(textInRow.locator('tr').nth(1).locator('td').nth(1)).toHaveText('textInRow')
      await expect(textInRow.locator('tr').nth(1).locator('td').nth(3)).toHaveText('textInRow2')
    })

    test('correctly renders diff for select fields', async () => {
      await navigateToVersionFieldsDiff()

      const select = page.locator('[data-field-path="select"]')

      await expect(select.locator('tr').nth(1).locator('td').nth(1)).toHaveText('Option 1')
      await expect(select.locator('tr').nth(1).locator('td').nth(3)).toHaveText('Option 2')
    })

    test('correctly renders diff for named tabs', async () => {
      await navigateToVersionFieldsDiff()

      const textInNamedTab1 = page.locator('[data-field-path="namedTab1.textInNamedTab1"]')

      await expect(textInNamedTab1.locator('tr').nth(1).locator('td').nth(1)).toHaveText(
        'textInNamedTab1',
      )
      await expect(textInNamedTab1.locator('tr').nth(1).locator('td').nth(3)).toHaveText(
        'textInNamedTab12',
      )
    })

    test('correctly renders diff for unnamed tabs', async () => {
      await navigateToVersionFieldsDiff()

      const textInUnamedTab2 = page.locator('[data-field-path="textInUnnamedTab2"]')

      await expect(textInUnamedTab2.locator('tr').nth(1).locator('td').nth(1)).toHaveText(
        'textInUnnamedTab2',
      )
      await expect(textInUnamedTab2.locator('tr').nth(1).locator('td').nth(3)).toHaveText(
        'textInUnnamedTab22',
      )
    })

    test('correctly renders diff for text fields', async () => {
      await navigateToVersionFieldsDiff()

      const text = page.locator('[data-field-path="text"]')

      await expect(text.locator('tr').nth(1).locator('td').nth(1)).toHaveText('text')
      await expect(text.locator('tr').nth(1).locator('td').nth(3)).toHaveText('text2')
    })

    test('correctly renders diff for textArea fields', async () => {
      await navigateToVersionFieldsDiff()

      const textArea = page.locator('[data-field-path="textArea"]')

      await expect(textArea.locator('tr').nth(1).locator('td').nth(1)).toHaveText('textArea')
      await expect(textArea.locator('tr').nth(1).locator('td').nth(3)).toHaveText('textArea2')
    })

    test('correctly renders diff for upload fields', async () => {
      await navigateToVersionFieldsDiff()

      const upload = page.locator('[data-field-path="upload"]')

      const uploadDocs = await payload.find({
        collection: 'media',
        sort: 'createdAt',
        limit: 2,
      })

      await expect(upload.locator('tr').nth(1).locator('td').nth(1)).toHaveText(
        String(uploadDocs?.docs?.[0]?.id),
      )
      await expect(upload.locator('tr').nth(1).locator('td').nth(3)).toHaveText(
        String(uploadDocs?.docs?.[1]?.id),
      )
    })
  })
})
