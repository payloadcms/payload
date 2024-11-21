import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { openDocControls } from 'helpers/e2e/openDocControls.js'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config, LocalizedPost } from './payload-types.js'

import {
  changeLocale,
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { richTextSlug } from './collections/RichText/index.js'
import {
  defaultLocale,
  englishTitle,
  localizedPostsSlug,
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

const { beforeAll, describe } = test
let url: AdminUrlUtil
let urlWithRequiredLocalizedFields: AdminUrlUtil

const title = 'english title'
const spanishTitle = 'spanish title'
const arabicTitle = 'arabic title'
const description = 'description'

let page: Page
let payload: PayloadTestSDK<Config>
let serverURL: string
let richTextURL: AdminUrlUtil

describe('Localization', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    url = new AdminUrlUtil(serverURL, localizedPostsSlug)
    richTextURL = new AdminUrlUtil(serverURL, richTextSlug)
    urlWithRequiredLocalizedFields = new AdminUrlUtil(serverURL, withRequiredLocalizedFields)

    const context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  describe('localized text', () => {
    test('create english post, switch to spanish', async () => {
      await page.goto(url.create)

      await fillValues({ description, title })
      await saveDocAndAssert(page)

      // Change back to English
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

      // Expect english title
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
      await page.waitForURL(`**${url.edit(id)}`)
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
      await page.waitForURL(url.create)
      await changeLocale(page, defaultLocale)
      await fillValues({ description, title: englishTitle })
      await expect(page.locator('#field-localizedCheckbox')).toBeEnabled()
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
      await expect(page.locator('.id-label')).not.toContainText(originalID)
      await expect(page.locator('#field-title')).toHaveValue(englishTitle)
      await expect(page.locator('.payload-toast-container')).toContainText(
        'successfully duplicated',
      )
      await expect(page.locator('.id-label')).not.toContainText(originalID)
    })
  })

  describe('locale preference', () => {
    test('ensure preference is used when query param is not', async () => {
      await page.goto(url.create)
      await changeLocale(page, spanishLocale)
      await expect(page.locator('#field-title')).toBeEmpty()
      await fillValues({ title: spanishTitle })
      await saveDocAndAssert(page)
      await page.goto(url.admin)
      await page.goto(url.list)
      await expect(page.locator('.row-1 .cell-title')).toContainText(spanishTitle)
    })
  })

  describe('localized relationships', () => {
    test('ensure relationship field fetches are localised as well', async () => {
      await page.goto(url.list)
      await changeLocale(page, spanishLocale)

      const localisedPost = page.locator('.cell-title a').first()
      const localisedPostUrl = await localisedPost.getAttribute('href')
      await page.goto(serverURL + localisedPostUrl)
      await page.waitForURL(serverURL + localisedPostUrl)

      const selectField = page.locator('#field-children .rs__control')
      await selectField.click()

      await expect(page.locator('#field-children .rs__menu')).toContainText('spanish-relation2')
    })
  })

  describe('copy localized data', () => {
    test('should show Copy To Locale button and drawer', async () => {
      await createAndSaveDoc(page, url, { description, title })
      await openCopyToLocaleDrawer(page)
      await expect(page.locator('.copy-locale-data__content')).toBeVisible()
    })

    test('should copy data to correct locale', async () => {
      await createAndSaveDoc(page, url, { title })
      await openCopyToLocaleDrawer(page)
      await setFromLocale(page, 'English')
      await setToLocale(page, 'Spanish')
      await runCopy(page)
      await expect(page.locator('#field-title')).toHaveValue(title)
    })

    test('should copy rich text data to correct locale', async () => {
      await page.goto(richTextURL.create)
      const richTextField = page.locator('#field-richText')
      const richTextContent = '<p>This is rich text in English</p>'
      await richTextField.fill(richTextContent)
      await saveDocAndAssert(page)

      await openCopyToLocaleDrawer(page)
      await setFromLocale(page, 'English')
      await setToLocale(page, 'Spanish')
      await runCopy(page)

      await expect(richTextField).toContainText(richTextContent)
    })

    test('should default source locale to current locale', async () => {
      await changeLocale(page, 'Spanish')
      await createAndSaveDoc(page, url, { title })
      await openCopyToLocaleDrawer(page)

      const fromLocaleField = page.locator('#field-fromLocale')
      await expect(fromLocaleField).toHaveText('Spanish')
    })

    test('should not overwrite existing data when overwrite is unchecked', async () => {
      await createAndSaveDoc(page, url, { title: englishTitle, description })

      await changeLocale(page, spanishLocale)
      await fillValues({ title: spanishTitle, description: 'Spanish description' })
      await saveDocAndAssert(page)

      await openCopyToLocaleDrawer(page)
      await setFromLocale(page, 'English')
      await setToLocale(page, 'Spanish')
      const overwriteCheckbox = page.locator('#field-overwriteExisting')
      await expect(overwriteCheckbox).not.toBeChecked()
      await runCopy(page)

      await expect(page.locator('#field-title')).toHaveValue(spanishTitle)
      await expect(page.locator('#field-description')).toHaveValue('Spanish description')
    })

    test('should overwrite existing data when overwrite is checked', async () => {
      await createAndSaveDoc(page, url, { title: englishTitle, description })
      await changeLocale(page, spanishLocale)
      await fillValues({ title: spanishTitle })
      await saveDocAndAssert(page)

      await openCopyToLocaleDrawer(page)
      await setFromLocale(page, 'English')
      await setToLocale(page, 'Spanish')
      const overwriteCheckbox = page.locator('#field-overwriteExisting')
      await overwriteCheckbox.click()
      await runCopy(page)

      await expect(page.locator('#field-title')).toHaveValue(spanishTitle)
    })

    test('should not copy when from and to locales are the same', async () => {
      await createAndSaveDoc(page, url, { title })
      await openCopyToLocaleDrawer(page)
      await setFromLocale(page, 'English')
      await setToLocale(page, 'English')
      await runCopy(page)

      await expect(page.locator('.payload-toast-container')).toContainText('same locale')
    })

    test('should handle back to back copies', async () => {
      await createAndSaveDoc(page, url, { title })

      await openCopyToLocaleDrawer(page)
      await setFromLocale(page, 'English')
      await setToLocale(page, 'Spanish')
      await runCopy(page)
      await expect(page.locator('#field-title')).toHaveValue(title)

      await openCopyToLocaleDrawer(page)
      await setToLocale(page, 'French')
      await runCopy(page)
      await changeLocale(page, 'French')
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
  const copyDrawerClose = page.locator('.copy-locale-data__sub-header button')
  await expect(copyDrawerClose).toBeVisible()
  await copyDrawerClose.click()
}

async function createAndSaveDoc(page, url, values) {
  await page.goto(url.create)
  await fillValues(values)
  await saveDocAndAssert(page)
}

async function openCopyToLocaleDrawer(page) {
  const docControls = page.locator('.doc-controls__popup')
  await docControls.click()
  const copyButton = page.locator('#copy-locale-data__button')
  await expect(copyButton).toBeVisible()
  await copyButton.click()
  await expect(page.locator('.copy-locale-data__content')).toBeVisible()
}
async function setFromLocale(page, locale) {
  const fromField = page.locator('#field-fromLocale')
  await fromField.click({ delay: 100 })
  const options = page.locator('.rs__option')
  await options.locator(`text=${locale}`).click()
}
async function setToLocale(page, locale) {
  const toField = page.locator('#field-toLocale')
  await toField.click({ delay: 100 })
  const options = page.locator('.rs__option')
  await options.locator(`text=${locale}`).click()
}
