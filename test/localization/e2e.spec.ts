import type { BrowserContext, Page } from '@playwright/test'
import type { GeneratedTypes } from 'helpers/sdk/types.js'

import { expect, test } from '@playwright/test'
import { addArrayRow } from 'helpers/e2e/fields/array/index.js'
import { addBlock } from 'helpers/e2e/fields/blocks/addBlock.js'
import { navigateToDoc } from 'helpers/e2e/navigateToDoc.js'
import { openDocControls } from 'helpers/e2e/openDocControls.js'
import { upsertPreferences } from 'helpers/e2e/preferences.js'
import { runAxeScan } from 'helpers/e2e/runAxeScan.js'
import { openDocDrawer } from 'helpers/e2e/toggleDocDrawer.js'
import { waitForAutoSaveToRunAndComplete } from 'helpers/e2e/waitForAutoSaveToRunAndComplete.js'
import { RESTClient } from 'helpers/rest.js'
import path from 'path'
import { formatAdminURL } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config, LocalizedPost } from './payload-types.js'

import {
  changeLocale,
  closeLocaleSelector,
  ensureCompilationIsDone,
  findTableRow,
  initPageConsoleErrorCatch,
  openLocaleSelector,
  saveDocAndAssert,
  throttleTest,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { arrayCollectionSlug } from './collections/Array/index.js'
import { blocksCollectionSlug } from './collections/Blocks/index.js'
import { nestedToArrayAndBlockCollectionSlug } from './collections/NestedToArrayAndBlock/index.js'
import { noLocalizedFieldsCollectionSlug } from './collections/NoLocalizedFields/index.js'
import { richTextSlug } from './collections/RichText/index.js'
import {
  allFieldsLocalizedSlug,
  arrayWithFallbackCollectionSlug,
  defaultLocale,
  englishTitle,
  hungarianLocale,
  localizedDraftsSlug,
  localizedPostsSlug,
  relationshipLocalizedSlug,
  spanishLocale,
  withRequiredLocalizedFields,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * TODO: Localization
 *
 * Fieldtypes to test: (collections for each field type)
 *  - localized and non-localized: array, block, group, relationship, text
 *
 * Repeat above for Globals
 */

const { beforeAll, beforeEach, describe } = test
let url: AdminUrlUtil
let urlWithRequiredLocalizedFields: AdminUrlUtil
let urlRelationshipLocalized: AdminUrlUtil
let urlCannotCreateDefaultLocale: AdminUrlUtil
let urlPostsWithDrafts: AdminUrlUtil
let urlArray: AdminUrlUtil
let arrayWithFallbackURL: AdminUrlUtil
let noLocalizedFieldsURL: AdminUrlUtil
let urlBlocks: AdminUrlUtil
let urlAllFieldsLocalized: AdminUrlUtil

const title = 'english title'
const spanishTitle = 'spanish title'
const arabicTitle = 'arabic title'
const description = 'description'

let page: Page
let payload: PayloadTestSDK<Config>
let client: RESTClient
let serverURL: string
let richTextURL: AdminUrlUtil
let context: BrowserContext

describe('Localization', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    url = new AdminUrlUtil(serverURL, localizedPostsSlug)
    urlRelationshipLocalized = new AdminUrlUtil(serverURL, relationshipLocalizedSlug)
    richTextURL = new AdminUrlUtil(serverURL, richTextSlug)
    urlWithRequiredLocalizedFields = new AdminUrlUtil(serverURL, withRequiredLocalizedFields)
    urlCannotCreateDefaultLocale = new AdminUrlUtil(serverURL, 'cannot-create-default-locale')
    urlPostsWithDrafts = new AdminUrlUtil(serverURL, localizedDraftsSlug)
    urlArray = new AdminUrlUtil(serverURL, arrayCollectionSlug)
    arrayWithFallbackURL = new AdminUrlUtil(serverURL, arrayWithFallbackCollectionSlug)
    noLocalizedFieldsURL = new AdminUrlUtil(serverURL, noLocalizedFieldsCollectionSlug)
    urlBlocks = new AdminUrlUtil(serverURL, blocksCollectionSlug)
    urlAllFieldsLocalized = new AdminUrlUtil(serverURL, allFieldsLocalizedSlug)

    context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })

    client = new RESTClient({ defaultSlug: 'users', serverURL })
    await client.login()
  })

  beforeEach(async () => {
    // await throttleTest({
    //   page,
    //   context,
    //   delay: 'Fast 4G',
    // })
  })

  describe('localizer', () => {
    test('should show localizer controls', async () => {
      await page.goto(url.create)
      await expect(page.locator('.localizer.app-header__localizer')).toBeVisible()
      await page.locator('.localizer >> button').first().click()
      await expect(page.locator('.popup__content')).toBeVisible()
    })

    test('should filter locale with filterAvailableLocales', async () => {
      await page.goto(url.create)
      await expect(page.locator('.localizer.app-header__localizer')).toBeVisible()
      await page.locator('.localizer >> button').first().click()
      await expect(page.locator('.popup__content')).toBeVisible()
      await expect(page.locator('.popup__content')).not.toContainText('FILTERED')
    })

    test('should filter version locale selector with filterAvailableLocales', async () => {
      await page.goto(urlPostsWithDrafts.create)
      await page.locator('#field-title').fill('title')
      await saveDocAndAssert(page)

      await page.locator('text=Versions').click()
      const firstVersion = await findTableRow(page, 'Currently Published')
      await firstVersion.locator('a').click()

      await expect(page.locator('.view-version__toggle-locales')).toBeVisible()
      await page.locator('.view-version__toggle-locales').click()

      await expect(page.locator('.select-version-locales .pill-selector')).toBeVisible()
      await expect(page.locator('.select-version-locales .pill-selector')).not.toContainText(
        'FILTERED',
      )
    })

    test('should disable control for active locale', async () => {
      await page.goto(url.create)

      await page.locator('.localizer button.popup-button').first().click()

      await expect(page.locator('.popup__content')).toBeVisible()

      const activeOption = page.locator(`.popup__content .popup-button-list__button--selected`)

      await expect(activeOption).toBeVisible()
      const tagName = await activeOption.evaluate((node) => node.tagName)
      expect(tagName).not.toBe('A')
      await expect(activeOption).not.toHaveAttribute('href')
      expect(tagName).not.toBe('BUTTON')
      expect(tagName).toBe('DIV')
    })
  })

  describe('access control', () => {
    test('should have req.locale within access control', async () => {
      await changeLocale(page, defaultLocale)
      await page.goto(urlCannotCreateDefaultLocale.list)

      const createNewButtonLocator =
        '.collection-list a[href="/admin/collections/cannot-create-default-locale/create"]'

      await expect(page.locator(createNewButtonLocator)).toBeHidden()
      await changeLocale(page, spanishLocale)
      await expect(page.locator(createNewButtonLocator).first()).toBeVisible()
      await page.goto(urlCannotCreateDefaultLocale.create)
      await expect(page.locator('#field-name')).toBeVisible()
      await changeLocale(page, defaultLocale)

      await expect(
        page.locator('h1', {
          hasText: 'Unauthorized',
        }),
      ).toBeVisible()
    })
  })

  describe('localized text', () => {
    test('create english post, switch to spanish', async () => {
      await changeLocale(page, defaultLocale)
      await page.goto(url.create)
      await fillValues({ description, title })
      await saveDocAndAssert(page)

      await changeLocale(page, 'es')

      // Localized field should not be populated
      await expect
        .poll(() => page.locator('#field-title').inputValue(), {
          timeout: 45000,
        })
        .not.toBe(title)

      await expect(page.locator('#field-description')).toHaveValue(description)
      await fillValues({ description, title: spanishTitle })
      await saveDocAndAssert(page)

      await changeLocale(page, defaultLocale)
      await expect(page.locator('#field-title')).toHaveValue(title)
      await expect(page.locator('#field-description')).toHaveValue(description)
    })

    test('create spanish post, add english', async () => {
      await page.goto(url.create)

      const newLocale = 'es'

      // Change to Spanish
      await changeLocale(page, newLocale)

      await fillValues({ description, title: spanishTitle })
      await saveDocAndAssert(page)

      // Change back to English
      await changeLocale(page, defaultLocale)

      // Localized field should not be populated
      await expect(page.locator('#field-title')).toBeEmpty()
      await expect(page.locator('#field-description')).toHaveValue(description)

      // Add English

      await fillValues({ description, title })
      await saveDocAndAssert(page)

      await expect(page.locator('#field-title')).toHaveValue(title)
      await expect(page.locator('#field-description')).toHaveValue(description)
    })

    test('create arabic post, add english', async () => {
      await page.goto(url.create)
      const newLocale = 'ar'
      await changeLocale(page, newLocale)
      await fillValues({ description, title: arabicTitle })
      await saveDocAndAssert(page)
      await changeLocale(page, defaultLocale)
      await expect(page.locator('#field-title')).toBeEmpty()
      await expect(page.locator('#field-description')).toHaveValue(description)
      await fillValues({ description, title })
      await saveDocAndAssert(page)
      await expect(page.locator('#field-title')).toHaveValue(title)
      await expect(page.locator('#field-description')).toHaveValue(description)
    })
  })

  describe('localized duplicate', () => {
    test('should duplicate data for all locales', async () => {
      const localizedPost = await payload.create({
        collection: localizedPostsSlug,
        data: {
          localizedCheckbox: true,
          title: englishTitle,
        },
        locale: defaultLocale,
      })

      const id = localizedPost.id.toString()

      await payload.update({
        id,
        collection: localizedPostsSlug,
        data: {
          localizedCheckbox: false,
          title: spanishTitle,
        },
        locale: spanishLocale,
      })

      await page.goto(url.edit(id))
      await openDocControls(page)
      await page.locator('#action-duplicate').click()
      await expect(page.locator('.payload-toast-container')).toContainText('successfully')
      await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).not.toContain(id)
      await expect(page.locator('#field-title')).toHaveValue(englishTitle)
      await changeLocale(page, spanishLocale)
      await expect(page.locator('#field-title')).toBeEnabled()
      await expect(page.locator('#field-title')).toHaveValue(spanishTitle)
      await expect(page.locator('#field-localizedCheckbox')).toBeEnabled()
      await page.reload() // TODO: remove this line, the checkbox _is not_ checked, but Playwright is unable to detect it without a reload for some reason
      await expect(page.locator('#field-localizedCheckbox')).not.toBeChecked()
    })

    test('should duplicate localized checkbox correctly', async () => {
      await page.goto(url.create)
      await changeLocale(page, defaultLocale)
      await fillValues({ description, title: englishTitle })
      await page.locator('#field-localizedCheckbox').click()
      await saveDocAndAssert(page)

      const collectionUrl = page.url()
      await changeLocale(page, spanishLocale)
      await expect(page.locator('#field-localizedCheckbox')).toBeEnabled()
      await page.reload() // TODO: remove this line, the checkbox _is not_ checked, but Playwright is unable to detect it without a reload for some reason
      await expect(page.locator('#field-localizedCheckbox')).not.toBeChecked()
      await changeLocale(page, defaultLocale)
      await openDocControls(page)
      await page.locator('#action-duplicate').click()
      await expect
        .poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT })
        .not.toContain(collectionUrl)
      await changeLocale(page, spanishLocale)
      await expect(page.locator('#field-localizedCheckbox')).toBeEnabled()
      await page.reload() // TODO: remove this line, the checkbox _is not_ checked, but Playwright is unable to detect it without a reload for some reason
      await expect(page.locator('#field-localizedCheckbox')).not.toBeChecked()
    })

    test('should duplicate even if missing some localized data', async () => {
      await page.goto(urlWithRequiredLocalizedFields.create)
      await changeLocale(page, defaultLocale)
      await page.locator('#field-title').fill(englishTitle)
      await page.locator('#field-nav__layout .blocks-field__drawer-toggler').click()
      await page.locator('button[title="Text"]').click()
      await page.fill('#field-nav__layout__0__text', 'test')
      await expect(page.locator('#field-nav__layout__0__text')).toHaveValue('test')
      await saveDocAndAssert(page)
      const originalID = await page.locator('.id-label').innerText()
      await openDocControls(page)
      await page.locator('#action-duplicate').click()

      await expect(page.locator('.payload-toast-container')).toContainText(
        'successfully duplicated',
      )

      await expect(page.locator('.id-label')).not.toContainText(originalID)
      await expect(page.locator('#field-title')).toHaveValue(englishTitle)
      await expect(page.locator('.id-label')).not.toContainText(originalID)
    })
  })

  describe('locale preference', () => {
    test('should set preference on locale change and use preference no locale param is present', async () => {
      await page.goto(url.create)
      await changeLocale(page, spanishLocale)
      await expect(page.locator('#field-title')).toBeEmpty()
      await fillValues({ title: spanishTitle })
      await saveDocAndAssert(page)
      await page.goto(url.list)
      await expect(page.locator('.row-1 .cell-title')).toContainText(spanishTitle)
    })

    test('should not render default locale in locale selector when prefs are not default', async () => {
      await upsertPreferences<Config, GeneratedTypes<any>>({
        payload,
        user: client.user,
        key: 'locale',
        value: 'es',
      })

      await page.goto(url.list)

      const localeLabel = page.locator(
        '.localizer.app-header__localizer .localizer-button__current-label',
      )

      await expect(localeLabel).not.toHaveText('English')
    })
  })

  describe('localized relationships', () => {
    test('ensure relationship field fetches are localized as well', async () => {
      await changeLocale(page, spanishLocale)
      await navigateToDoc(page, url)
      await page.locator('#field-children .rs__control').click()
      await expect(page.locator('#field-children .rs__menu')).toContainText('spanish-relation2')
    })

    test('ensure relationship edit drawers are opened in currently selected locale', async () => {
      await changeLocale(page, spanishLocale)
      await navigateToDoc(page, urlRelationshipLocalized)
      const drawerToggler =
        '#field-relationMultiRelationTo .relationship--single-value__drawer-toggler'
      await expect(page.locator(drawerToggler)).toBeEnabled()
      await openDocDrawer({ page, selector: drawerToggler })
      await expect(page.locator('.doc-drawer__header-text')).toContainText('spanish-relation2')
      await page.locator('.doc-drawer__header-close').click()
    })
  })

  describe('copy localized data', () => {
    test('should show Copy To Locale button and drawer', async () => {
      await changeLocale(page, defaultLocale)
      await navigateToDoc(page, url)
      await openCopyToLocaleDrawer(page)
      await expect(page.locator('.copy-locale-data__content')).toBeVisible()
      await page.locator('.drawer-close-button').click()
    })

    test('should copy data to correct locale', async () => {
      await createAndSaveDoc(page, url, { title })
      await openCopyToLocaleDrawer(page)
      await setToLocale(page, 'Spanish')
      await runCopy({ page, toLocale: spanishLocale })
      await expect(page.locator('#field-title')).toHaveValue(title)
      await changeLocale(page, defaultLocale)
    })

    test('should copy rich text data to correct locale', async () => {
      await changeLocale(page, defaultLocale)
      await page.goto(richTextURL.create)
      const richTextField = page.locator('#field-richText')
      const richTextContent = '<p>This is rich text in English</p>'
      await richTextField.fill(richTextContent)
      await saveDocAndAssert(page)

      await openCopyToLocaleDrawer(page)
      await setToLocale(page, 'Spanish')
      await runCopy({ page, toLocale: spanishLocale })

      await expect(richTextField).toContainText(richTextContent)
    })

    test('should copy nested array to locale', async () => {
      const sampleText = 'Copy this text'
      const nestedArrayURL = new AdminUrlUtil(serverURL, nestedToArrayAndBlockCollectionSlug)
      await page.goto(nestedArrayURL.create)
      await changeLocale(page, 'ar')
      await addArrayRow(page, { fieldName: 'topLevelArray' })

      const arrayField = page.locator('#field-topLevelArray__0__localizedText')
      await expect(arrayField).toBeVisible()
      await arrayField.fill(sampleText)
      await saveDocAndAssert(page)

      await openCopyToLocaleDrawer(page)
      await setToLocale(page, 'English')
      await runCopy({ page, toLocale: defaultLocale })

      await expect(arrayField).toHaveValue(sampleText)
    })

    test('should default source locale to current locale', async () => {
      await changeLocale(page, spanishLocale)
      await createAndSaveDoc(page, url, { title })
      await openCopyToLocaleDrawer(page)
      const fromLocaleField = page.locator('#field-fromLocale')
      await expect(fromLocaleField).toContainText('Spanish')
      await page.locator('.drawer-close-button').click()
    })

    test('should not overwrite existing data when overwrite is unchecked', async () => {
      await changeLocale(page, defaultLocale)
      await createAndSaveDoc(page, url, { title: englishTitle, description })

      await changeLocale(page, spanishLocale)
      await fillValues({ title: spanishTitle, description: 'Spanish description' })
      await saveDocAndAssert(page)

      await changeLocale(page, defaultLocale)
      await openCopyToLocaleDrawer(page)
      await setToLocale(page, 'Spanish')
      const overwriteCheckbox = page.locator('#field-overwriteExisting')
      await expect(overwriteCheckbox).not.toBeChecked()
      await runCopy({ page, toLocale: spanishLocale })

      await expect(page.locator('#field-title')).toHaveValue(spanishTitle)
      await expect(page.locator('#field-description')).toHaveValue('Spanish description')
    })

    test('should overwrite existing data when overwrite is checked', async () => {
      await changeLocale(page, defaultLocale)
      await createAndSaveDoc(page, url, { title: englishTitle, description })
      await changeLocale(page, spanishLocale)
      await fillValues({ title: spanishTitle })
      await saveDocAndAssert(page)
      await changeLocale(page, defaultLocale)
      await openCopyToLocaleDrawer(page)
      await setToLocale(page, 'Spanish')
      const overwriteCheckbox = page.locator('#field-overwriteExisting')
      await overwriteCheckbox.click()
      await runCopy({ page, toLocale: spanishLocale })
      await expect(page.locator('#field-title')).toHaveValue(englishTitle)
      await changeLocale(page, defaultLocale)
    })

    test('should not include current locale in toLocale options', async () => {
      await changeLocale(page, defaultLocale)
      await createAndSaveDoc(page, url, { title })
      await openCopyToLocaleDrawer(page)
      const toLocaleDropdown = page.locator('#field-toLocale')
      await toLocaleDropdown.click()

      const options = await page
        .locator('.rs__option')
        .evaluateAll((els) => els.map((el) => el.textContent))

      await expect.poll(() => options).not.toContain('English')
      await page.locator('.drawer-close-button').click()
    })

    test('should handle back to back copies', async () => {
      await changeLocale(page, defaultLocale)
      await createAndSaveDoc(page, url, { title })

      await openCopyToLocaleDrawer(page)
      await setToLocale(page, 'Spanish')
      await runCopy({ page, toLocale: spanishLocale })
      await expect(page.locator('#field-title')).toHaveValue(title)

      const regexPattern = /locale=es/
      await expect(page).toHaveURL(regexPattern)

      await openCopyToLocaleDrawer(page)
      await setToLocale(page, 'Hungarian')
      await runCopy({ page, toLocale: hungarianLocale })
      await expect(page.locator('#field-title')).toHaveValue(title)
    })

    test('should throw error if unsaved data', async () => {
      await createAndSaveDoc(page, url, { title })
      await fillValues({ title: 'updated' })
      const docControls = page.locator('.doc-controls__popup')
      await docControls.click()

      const copyButton = page.locator('#copy-locale-data__button')
      await expect(copyButton).toBeVisible()
      await copyButton.click()

      await expect(page.locator('.payload-toast-container')).toContainText('unsaved')
    })
  })

  describe('locale change', () => {
    test('should disable fields during locale change', async () => {
      await page.goto(url.create)
      await changeLocale(page, defaultLocale)
      await expect(page.locator('#field-title')).toBeEnabled()

      await openLocaleSelector(page)

      const localeToSelect = page
        .locator('.popup__content .popup-button-list__button')
        .locator('.localizer__locale-code', {
          hasText: `${spanishLocale}`,
        })

      // only throttle test after initial load to avoid timeouts
      const cdpSession = await throttleTest({
        page,
        context,
        delay: 'Fast 4G',
      })

      await localeToSelect.click()
      await expect(page.locator('#field-title')).toBeDisabled()

      const regexPattern = new RegExp(`locale=${spanishLocale}`)
      await expect(page).toHaveURL(regexPattern)
      await expect(page.locator('#field-title')).toBeEnabled()
      await closeLocaleSelector(page)

      await cdpSession.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1,
      })

      await cdpSession.detach()
    })

    test('should not show fallback data after saving data', async () => {
      await page.goto(url.create)
      await changeLocale(page, defaultLocale)
      await page.locator('#field-title').fill(title)

      await saveDocAndAssert(page)
      await changeLocale(page, spanishLocale)

      // POST data
      await page.locator('#field-description').fill('non-localized description')
      await saveDocAndAssert(page)

      // POST updated data
      await page.locator('#field-description').fill('non-localized description 2')
      await saveDocAndAssert(page)

      // The title should not have posted with a value
      await expect
        .poll(() => page.locator('#field-title').inputValue(), {
          timeout: POLL_TOPASS_TIMEOUT,
        })
        .not.toBe(title)
    })
  })

  describe('fallback checkbox', () => {
    test('should show fallback checkbox for non-default locale', async () => {
      await createLocalizedArrayItem(page, arrayWithFallbackURL)

      const fallbackCheckbox = page.locator('#field-items', {
        hasText: 'Fallback to default locale',
      })
      await expect(fallbackCheckbox).toBeVisible()
    })

    test('should save document successfully when fallback checkbox is checked', async () => {
      await createLocalizedArrayItem(page, arrayWithFallbackURL)

      const checkbox = page.locator('#field-items input[type="checkbox"]')
      // have to uncheck and check again to allow save
      await checkbox.click()
      await expect(checkbox).not.toBeChecked()
      await checkbox.click()
      await expect(checkbox).toBeChecked()
      await saveDocAndAssert(page)
      await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    })

    test('should save correct data when fallback checkbox is checked', async () => {
      await createLocalizedArrayItem(page, arrayWithFallbackURL)

      const checkbox = page.locator('#field-items input[type="checkbox"]')
      // have to uncheck and check again to allow save
      await checkbox.click()
      await expect(checkbox).not.toBeChecked()
      await checkbox.click()
      await expect(checkbox).toBeChecked()
      await saveDocAndAssert(page)

      const id = page.url().split('/').pop()
      const apiURL = formatAdminURL({
        apiRoute: '/api',
        path: `/${arrayWithFallbackCollectionSlug}/${id}`,
        serverURL,
      })
      await page.goto(apiURL)
      const data = await page.evaluate(() => {
        return JSON.parse(document.querySelector('body')?.innerText || '{}')
      })

      // should see fallback data when querying the locale individually
      await expect.poll(() => data.items[0].text).toBe('test')

      const apiURLAll = apiURL.replace('es', 'all')
      await page.goto(apiURLAll)
      const dataAll = await page.evaluate(() => {
        return JSON.parse(document.querySelector('body')?.innerText || '{}')
      })
      // should not see fallback data when querying all locales
      // - sql it will be undefined
      // - mongodb it will be null
      await expect
        .poll(() => {
          return !dataAll.items?.es
        })
        .toBeTruthy()
    })

    test('blocks - should show fallback checkbox for non-default locale', async () => {
      // Navigate to page first (previous test may have left page on API endpoint)
      await page.goto(urlBlocks.create)
      await changeLocale(page, 'en')
      const titleLocator = page.locator('#field-title')
      await titleLocator.fill('Block Test')
      await addBlock({ page, blockToSelect: 'Block Inside Block', fieldName: 'content' })
      const rowTextInput = page.locator(`#field-content__0__text`)
      await rowTextInput.fill('text')
      await saveDocAndAssert(page)

      await changeLocale(page, spanishLocale)
      await titleLocator.fill('PT Block Test')
      await waitForAutoSaveToRunAndComplete(page)
      const fallbackCheckbox = page.locator('#field-content', {
        hasText: 'Fallback to default locale',
      })

      await expect(fallbackCheckbox).toBeVisible()
    })

    test('blocks - should successfully save with the fallback', async () => {
      await page.goto(urlBlocks.create)
      await addBlock({ page, blockToSelect: 'Block Inside Block', fieldName: 'content' })
      const rowTextInput = page.locator(`#field-content__0__text`)
      await rowTextInput.fill('text')
      await saveDocAndAssert(page)
      await changeLocale(page, 'pt')
      await rowTextInput.fill('changed')
      await waitForAutoSaveToRunAndComplete(page)
      await saveDocAndAssert(page)
      const docID = page.url().split('/').pop()?.split('?').shift()

      const doc = await payload.find({
        collection: 'blocks-fields',
        where: { id: { equals: docID } },
        locale: 'all',
      })
      // eslint-disable-next-line payload/no-flaky-assertions
      expect(doc.docs).toHaveLength(1)
    })
  })

  test('should use label in search filter when string or object', async () => {
    await page.goto(url.list)
    const searchInput = page.locator('.search-filter__input')
    await expect(searchInput).toBeVisible()
    await expect(searchInput).toHaveAttribute('placeholder', 'Search by Full title')
  })

  describe('publish specific locale', () => {
    test('should create post in correct locale with publishSpecificLocale', async () => {
      await page.goto(urlPostsWithDrafts.create)
      await changeLocale(page, 'es')
      await fillValues({ title: 'Created In Spanish' })
      await saveDocAndAssert(page, '#publish-locale')

      await expect(page.locator('#field-title')).toHaveValue('Created In Spanish')
      await changeLocale(page, defaultLocale)
      await expect(page.locator('#field-title')).toBeEmpty()
    })

    test('blocks - ensure publish locale popup is visible on smaller screen sizes', async () => {
      // This verifies that the Popup component is not hidden behind overflow: hidden of the parent element,
      // which is set for smaller screen sizes.
      // This was an issue until createPortal was introduced in the Popup component.
      await page.setViewportSize({ width: 480, height: 720 })
      await page.goto(urlBlocks.create)
      await page.locator('.form-submit .popup-button').click()

      const popup = page.locator('.popup__content')
      await expect(popup).toBeVisible()

      // Verify popup is actually visible (not clipped by overflow: hidden)
      // by checking if elementFromPoint at popup's center returns the popup or its child
      const box = await popup.boundingBox()
      expect(box).not.toBeNull()

      const centerX = box!.x + box!.width / 2
      const centerY = box!.y + box!.height / 2

      const isActuallyVisible = await page.evaluate(
        ({ selector, x, y }) => {
          const popup = document.querySelector(selector)
          const elementAtPoint = document.elementFromPoint(x, y)
          return popup?.contains(elementAtPoint) ?? false
        },
        { selector: '.popup__content', x: centerX, y: centerY },
      )

      expect(isActuallyVisible).toBe(true)
    })
  })

  test('should not show publish specific locale button when no localized fields exist', async () => {
    await page.goto(urlPostsWithDrafts.create)
    await expect(page.locator('#publish-locale')).toHaveCount(1)
    await page.goto(noLocalizedFieldsURL.create)
    await expect(page.locator('#publish-locale')).toHaveCount(0)
  })

  describe('duplicate selected locales', () => {
    test('should duplicate document with data from selected locales', async () => {
      await page.goto(urlPostsWithDrafts.create)
      await changeLocale(page, defaultLocale)
      await fillValues({ title: 'English Title' })
      await saveDocAndAssert(page)
      const id = await page.locator('.id-label').innerText()

      await changeLocale(page, spanishLocale)
      await fillValues({ title: 'Spanish Title' })
      await saveDocAndAssert(page)

      await changeLocale(page, 'pt')
      await fillValues({ title: 'Portuguese Title' })
      await saveDocAndAssert(page)

      await openDocControls(page)
      await page.locator('#action-duplicate-locales').click()

      await expect(page.locator('.select-locales-drawer__content')).toBeVisible()
      await page
        .locator('.select-locales-drawer__item', { hasText: 'English' })
        .locator('input')
        .click()
      await page
        .locator('.select-locales-drawer__item', { hasText: 'Portuguese' })
        .locator('input')
        .click()
      const confirmButton = page.locator('#\\#action-duplicate-confirm')
      await expect(confirmButton).toBeEnabled()
      await confirmButton.click()
      await expect(page.locator('.payload-toast-container')).toContainText(
        'successfully duplicated',
      )
      // Close all toasts to prevent them from interfering with subsequent tests. E.g. the following could happen
      const closeButtons = page.locator(
        '.payload-toast-container button.payload-toast-close-button',
      )
      const count = await closeButtons.count()
      for (let i = 0; i < count; i++) {
        await closeButtons.nth(i).click()
      }

      await expect.poll(() => page.url()).not.toContain(id)
      await page.waitForURL((url) => !url.toString().includes(id))

      // Wait for page to be ready after duplicate redirect
      await expect(page.locator('.localizer button.popup-button')).toBeVisible()
      await changeLocale(page, defaultLocale)
      await expect(page.locator('#field-title')).toHaveValue('English Title')
      await changeLocale(page, spanishLocale)
      await expect(page.locator('#field-title')).toBeEmpty()
      await changeLocale(page, 'pt')
      await expect(page.locator('#field-title')).toHaveValue('Portuguese Title')
    })
  })

  describe('localize status', () => {
    describe('versions list', () => {
      test('should show currently published doc in version list', async () => {
        await changeLocale(page, defaultLocale)
        await page.goto(urlAllFieldsLocalized.create)

        // draft en
        await page.locator('#field-text').fill('EN Draft')
        await saveDocAndAssert(page, '#action-save-draft')

        const docID = (await page.locator('.render-title').getAttribute('data-doc-id')) as string

        // publish en
        await page.locator('#field-text').fill('EN Published')
        await saveDocAndAssert(page, '#publish-locale')

        await page.goto(urlAllFieldsLocalized.versions(docID))

        const firstRow = page.locator('tbody tr').first()
        await expect(firstRow.locator('.pill__label span')).toHaveText('Currently Published')
      })

      test('should only show published status when viewing the published locale', async () => {
        await changeLocale(page, defaultLocale)
        await page.goto(urlAllFieldsLocalized.create)

        // publish en
        await page.locator('#field-text').fill('EN Published')
        await saveDocAndAssert(page, '#publish-locale')

        const docID = (await page.locator('.render-title').getAttribute('data-doc-id')) as string

        // draft en
        await page.locator('#field-text').fill('EN Draft')
        await saveDocAndAssert(page, '#action-save-draft')

        await changeLocale(page, spanishLocale)

        // publish es
        await page.locator('#field-text').fill('ES Published')
        await saveDocAndAssert(page, '#publish-locale')

        await page.goto(urlAllFieldsLocalized.versions(docID))
        await changeLocale(page, defaultLocale)

        const firstRow = page.locator('tbody tr').first()
        await expect(firstRow.locator('.pill__label span')).toHaveText('Current Draft')
      })
    })
  })

  describe('A11y', () => {
    test.fixme('Locale picker should have no accessibility violations', async ({}, testInfo) => {
      await page.goto(url.list)

      const scanResults = await runAxeScan({
        page,
        testInfo,
        include: ['.localizer'],
        exclude: ['main'],
      })

      expect(scanResults.violations.length).toBe(0)
    })
  })
})

async function createLocalizedArrayItem(page: Page, url: AdminUrlUtil) {
  await changeLocale(page, defaultLocale)
  await page.goto(url.create)
  await addArrayRow(page, { fieldName: 'items' })
  const textField = page.locator('#field-items__0__text')
  await textField.fill('test')
  await saveDocAndAssert(page)
  await changeLocale(page, spanishLocale)
}

async function fillValues(data: Partial<LocalizedPost>) {
  const { description: descVal, title: titleVal } = data

  if (titleVal) {
    await page.locator('#field-title').fill(titleVal)
  }
  if (descVal) {
    await page.locator('#field-description').fill(descVal)
  }
}

async function runCopy({ page, toLocale }: { page: Page; toLocale: string }) {
  await page.locator('.copy-locale-data__sub-header button').click()

  const regexPattern = new RegExp(`locale=${toLocale}`)
  await expect(page).toHaveURL(regexPattern)
}

async function createAndSaveDoc(page, url, values) {
  await page.goto(url.create)
  await fillValues(values)
  await saveDocAndAssert(page)
}

async function openCopyToLocaleDrawer(page) {
  await page.locator('.doc-controls__popup button.popup-button').click()
  await page.locator('#copy-locale-data__button').click()
  await expect(page.locator('#copy-locale')).toBeVisible()
  await expect(page.locator('.copy-locale-data__content')).toBeVisible()
}

async function setToLocale(page, locale) {
  const toField = page.locator('#field-toLocale')
  await toField.click({ delay: 100 })
  const options = page.locator('.rs__option')
  await options.locator(`text=${locale}`).click()
}
