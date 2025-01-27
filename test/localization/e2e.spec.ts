import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import type { LocalizedPost } from './payload-types'

import payload from '../../packages/payload/src'
import wait from '../../packages/payload/src/utilities/wait'
import {
  changeLocale,
  initPageConsoleErrorCatch,
  openDocControls,
  saveDocAndAssert,
} from '../helpers'
import { AdminUrlUtil } from '../helpers/adminUrlUtil'
import { initPayloadTest } from '../helpers/configHelpers'
import {
  englishTitle,
  localizedPostsSlug,
  spanishLocale,
  withRequiredLocalizedFields,
} from './shared'

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

const defaultLocale = 'en'
const title = 'english title'
const spanishTitle = 'spanish title'
const arabicTitle = 'arabic title'
const description = 'description'

let page: Page

describe('Localization', () => {
  beforeAll(async ({ browser }) => {
    const { serverURL } = await initPayloadTest({
      __dirname,
      init: {
        local: false,
      },
    })

    url = new AdminUrlUtil(serverURL, localizedPostsSlug)
    urlWithRequiredLocalizedFields = new AdminUrlUtil(serverURL, withRequiredLocalizedFields)

    const context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)
  })

  describe('localized text', () => {
    test('create english post, switch to spanish', async () => {
      await page.goto(url.create)

      await fillValues({ description, title })
      await saveDocAndAssert(page)

      // Change back to English
      await changeLocale(page, 'es')

      // Localized field should not be populated
      await expect(page.locator('#field-title')).toBeEmpty()
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
      await saveDocAndAssert(page)

      await expect(page.locator('#field-title')).toHaveValue(title)
      await expect(page.locator('#field-description')).toHaveValue(description)
    })

    test('create arabic post, add english', async () => {
      await page.goto(url.create)

      const newLocale = 'ar'

      // Change to Arabic
      await changeLocale(page, newLocale)

      await fillValues({ description, title: arabicTitle })
      await saveDocAndAssert(page)

      // Change back to English
      await changeLocale(page, defaultLocale)

      // Localized field should not be populated
      await expect(page.locator('#field-title')).toBeEmpty()
      await expect(page.locator('#field-description')).toHaveValue(description)

      // Add English

      await fillValues({ description, title })
      await saveDocAndAssert(page)
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

      // duplicate document
      await page.locator('#action-duplicate').click()
      await expect(page.locator('.Toastify')).toContainText('successfully')

      // check fields
      await expect(page.locator('#field-title')).toHaveValue(englishTitle)
      await changeLocale(page, spanishLocale)
      await expect(page.locator('#field-title')).toHaveValue(spanishTitle)

      await expect(page.locator('#field-localizedCheckbox')).not.toBeChecked()
    })

    test('should duplicate localized checkbox correctly', async () => {
      await page.goto(url.create)
      await changeLocale(page, defaultLocale)
      await fillValues({ description, title: englishTitle })
      await page.locator('#field-localizedCheckbox').click()

      await page.locator('#action-save').click()
      // wait for navigation to update route
      await wait(500)

      // ensure spanish is not checked
      await changeLocale(page, spanishLocale)
      await expect(page.locator('#field-localizedCheckbox')).not.toBeChecked()

      // duplicate doc
      await changeLocale(page, defaultLocale)
      await openDocControls(page)
      await page.locator('#action-duplicate').click()

      // wait for navigation to update route
      await wait(500)

      // finally change locale to spanish
      await changeLocale(page, spanishLocale)
      await expect(page.locator('#field-localizedCheckbox')).not.toBeChecked()
    })

    test('should duplicate even if missing some localized data', async () => {
      // create a localized required doc
      await page.goto(urlWithRequiredLocalizedFields.create)
      await changeLocale(page, defaultLocale)
      await page.locator('#field-title').fill(englishTitle)
      await page.locator('#field-layout .blocks-field__drawer-toggler').click()
      await page.locator('button[title="Text"]').click()
      await page.fill('#field-layout__0__text', 'test')
      await saveDocAndAssert(page)

      const originalID = await page.locator('.id-label').innerText()

      // duplicate
      await openDocControls(page)
      await page.locator('#action-duplicate').click()
      await page.locator('#action-save').click()

      // verify that the locale did copy
      await expect(page.locator('#field-title')).toHaveValue(englishTitle)

      // await the success toast
      await expect(page.locator('.Toastify')).toContainText('successfully duplicated')

      // expect that the document has a new id
      await expect(page.locator('.id-label')).not.toContainText(originalID)
    })
  })
})

async function fillValues(data: Partial<LocalizedPost>) {
  const { description: descVal, title: titleVal } = data

  if (titleVal) await page.locator('#field-title').fill(titleVal)
  if (descVal) await page.locator('#field-description').fill(descVal)
}
