import type { BrowserContext, Page } from '@playwright/test'
import type { GeneratedTypes } from 'helpers/sdk/types.js'

import { expect, test } from '@playwright/test'
import { navigateToDoc } from 'helpers/e2e/navigateToDoc.js'
import { openDocControls } from 'helpers/e2e/openDocControls.js'
import { upsertPreferences } from 'helpers/e2e/preferences.js'
import { openDocDrawer } from 'helpers/e2e/toggleDocDrawer.js'
import { RESTClient } from 'helpers/rest.js'
import path from 'path'
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
import { nestedToArrayAndBlockCollectionSlug } from './collections/NestedToArrayAndBlock/index.js'
import { richTextSlug } from './collections/RichText/index.js'
import {
  defaultLocale,
  englishTitle,
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

    context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)

    client = new RESTClient({ defaultSlug: 'users', serverURL })
    await client.login()

    await ensureCompilationIsDone({ page, serverURL })
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
      await expect(page.locator('.localizer .popup.popup--active')).toBeVisible()
    })

    test('should filter locale with filterAvailableLocales', async () => {
      await page.goto(url.create)
      await expect(page.locator('.localizer.app-header__localizer')).toBeVisible()
      await page.locator('.localizer >> button').first().click()
      await expect(page.locator('.localizer .popup.popup--active')).not.toContainText('FILTERED')
    })

    test('should filter version locale selector with filterAvailableLocales', async () => {
      await page.goto(urlPostsWithDrafts.create)
      await page.locator('#field-title').fill('title')
      await page.locator('#action-save').click()

      await page.locator('text=Versions').click()
      const firstVersion = findTableRow(page, 'Current Published Version')
      await firstVersion.locator('a').click()

      await expect(page.locator('.select-version-locales__label')).toBeVisible()
      await expect(page.locator('.select-version-locales .react-select')).not.toContainText(
        'FILTERED',
      )
    })

    test('should disable control for active locale', async () => {
      await page.goto(url.create)

      await page.locator('.localizer button.popup-button').first().click()

      await expect(page.locator('.localizer .popup')).toHaveClass(/popup--active/)

      const activeOption = page.locator(
        `.localizer .popup.popup--active .popup-button-list__button--selected`,
      )

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
      await page.locator('#action-save').click()
      await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).not.toContain('create')
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
      await runCopy(page)
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
      await runCopy(page)

      await expect(richTextField).toContainText(richTextContent)
    })

    test('should copy nested array to locale', async () => {
      const sampleText = 'Copy this text'
      const nestedArrayURL = new AdminUrlUtil(serverURL, nestedToArrayAndBlockCollectionSlug)
      await page.goto(nestedArrayURL.create)
      await changeLocale(page, 'ar')
      const addArrayRow = page.locator('#field-topLevelArray .array-field__add-row')
      await addArrayRow.click()

      const arrayField = page.locator('#field-topLevelArray__0__localizedText')
      await expect(arrayField).toBeVisible()
      await arrayField.fill(sampleText)
      await saveDocAndAssert(page)

      await openCopyToLocaleDrawer(page)
      await setToLocale(page, 'English')
      await runCopy(page)

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
      await runCopy(page)

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
      await runCopy(page)
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
      await runCopy(page)
      await expect(page.locator('#field-title')).toHaveValue(title)

      const regexPattern = /locale=es/
      await expect(page).toHaveURL(regexPattern)

      await openCopyToLocaleDrawer(page)
      await setToLocale(page, 'Hungarian')
      await runCopy(page)
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
        .locator('.localizer .popup.popup--active .popup-button-list__button')
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

  test('should use label in search filter when string or object', async () => {
    await page.goto(url.list)
    const searchInput = page.locator('.search-filter__input')
    await expect(searchInput).toBeVisible()
    await expect(searchInput).toHaveAttribute('placeholder', 'Search by Full title')
  })
})

async function fillValues(data: Partial<LocalizedPost>) {
  const { description: descVal, title: titleVal } = data

  if (titleVal) {
    await page.locator('#field-title').fill(titleVal)
  }
  if (descVal) {
    await page.locator('#field-description').fill(descVal)
  }
}

async function runCopy(page) {
  await page.locator('.copy-locale-data__sub-header button').click()
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
