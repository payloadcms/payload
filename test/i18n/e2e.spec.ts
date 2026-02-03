import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import type { Config } from './payload-types.js'

const { beforeAll, beforeEach, describe } = test

import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '@tools/test-utils/int'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../helpers.js'
import { AdminUrlUtil } from '@tools/test-utils/e2e'
import { assertNetworkRequests } from '@tools/test-utils/e2e'
import { openListFilters } from '@tools/test-utils/e2e'
import { initPayloadE2ENoConfig } from '@tools/test-utils/e2e'
import { reInitializeDB } from '@tools/test-utils/int'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

let payload: PayloadTestSDK<Config>

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('i18n', () => {
  let page: Page

  let serverURL: string
  let collection1URL: AdminUrlUtil

  beforeAll(async ({ browser }, testInfo) => {
    const prebuild = false // Boolean(process.env.CI)

    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      prebuild,
    }))

    collection1URL = new AdminUrlUtil(serverURL, 'collection1')

    const context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })
  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'i18nTests',
    })

    await ensureCompilationIsDone({ page, serverURL })
  })

  async function setUserLanguage(language: 'de' | 'en' | 'es') {
    {
      const LanguageLabel = {
        de: {
          fieldLabel: 'Sprache',
          valueLabel: 'Deutsch',
        },
        en: {
          fieldLabel: 'Language',
          valueLabel: 'English',
        },
        es: {
          fieldLabel: 'Idioma',
          valueLabel: 'Español',
        },
      }[language]
      await page.goto(serverURL + '/admin/account')
      await page.locator('.payload-settings__language .react-select').click()

      // Wait for the server action response after selecting the language
      const responsePromise = page.waitForResponse((response) => {
        // Server actions in Next.js show up as POST requests
        return response.request().method() === 'POST' && response.status() === 200
      })

      await page.locator('.rs__option', { hasText: LanguageLabel.valueLabel }).click()

      await responsePromise

      // Wait for the language field label to update with the translated text
      // This confirms router.refresh() has completed and re-rendered the page
      await expect(
        page.locator('.payload-settings__language', { hasText: LanguageLabel.fieldLabel }),
      ).toBeVisible()
    }
  }

  test('ensure i18n labels and useTranslation hooks display correct translation', async () => {
    // set language to English
    await setUserLanguage('en')

    await page.goto(serverURL + '/admin')

    await expect(
      page.locator('.componentWithDefaultI18n .componentWithDefaultI18nValidT'),
    ).toHaveText('Add Link')
    await expect(
      page.locator('.componentWithDefaultI18n .componentWithDefaultI18nValidI18nT'),
    ).toHaveText('Add Link')
    await expect(
      page.locator('.componentWithDefaultI18n .componentWithDefaultI18nInvalidT'),
    ).toHaveText('fields:addLink2')
    await expect(
      page.locator('.componentWithDefaultI18n .componentWithDefaultI18nInvalidI18nT'),
    ).toHaveText('fields:addLink2')

    await expect(
      page.locator('.componentWithCustomI18n .componentWithCustomI18nDefaultValidT'),
    ).toHaveText('Add Link')
    await expect(
      page.locator('.componentWithCustomI18n .componentWithCustomI18nDefaultValidI18nT'),
    ).toHaveText('Add Link')
    await expect(
      page.locator('.componentWithCustomI18n .componentWithCustomI18nDefaultInvalidT'),
    ).toHaveText('fields:addLink2')
    await expect(
      page.locator('.componentWithCustomI18n .componentWithCustomI18nDefaultInvalidI18nT'),
    ).toHaveText('fields:addLink2')
    await expect(
      page.locator('.componentWithCustomI18n .componentWithCustomI18nCustomValidT'),
    ).toHaveText('My custom translation')
    await expect(
      page.locator('.componentWithCustomI18n .componentWithCustomI18nCustomValidI18nT'),
    ).toHaveText('My custom translation')
  })

  test('ensure translations update correctly when switching language', async () => {
    // set language to English
    await setUserLanguage('en')

    await expect(page.locator('div.payload-settings h3')).toHaveText('Payload Settings')

    await page.goto(serverURL + '/admin/collections/collection1/create')
    await expect(page.locator('label[for="field-fieldDefaultI18nValid"]')).toHaveText(
      'Add {{label}}',
    )

    // set language to Spanish
    await setUserLanguage('es')
    await expect(page.locator('div.payload-settings h3')).toHaveText('Configuración de Payload')

    await page.goto(serverURL + '/admin/collections/collection1/create')
    await expect(page.locator('label[for="field-fieldDefaultI18nValid"]')).toHaveText(
      'Añadir {{label}}',
    )
  })

  describe('i18n labels', () => {
    test('should show translated document field label', async () => {
      // set language to Spanish
      await setUserLanguage('es')

      await page.goto(collection1URL.create)
      await expect(
        page.locator('label[for="field-i18nFieldLabel"]', {
          hasText: 'es-label',
        }),
      ).toBeVisible()
    })

    test('should show translated pill field label', async () => {
      // set language to Spanish
      await setUserLanguage('es')

      await page.goto(collection1URL.list)
      await page.locator('.list-controls__toggle-columns').click()

      // expecting the label to fall back to english as default fallbackLng
      await expect(
        page.locator('.pill-selector__pill', {
          hasText: 'es-label',
        }),
      ).toBeVisible()
    })

    test('should show fallback pill field label', async () => {
      // set language to German
      await setUserLanguage('de')

      await page.goto(collection1URL.list)
      await page.locator('.list-controls__toggle-columns').click()

      // expecting the label to fall back to english as default fallbackLng
      await expect(
        page.locator('.pill-selector__pill', {
          hasText: 'en-label',
        }),
      ).toBeVisible()
    })

    test('should show translated field label in where builder', async () => {
      await payload.create({
        collection: 'collection1',
        data: {
          i18nFieldLabel: 'Test',
        },
      })

      // set language to Spanish
      await setUserLanguage('es')

      await page.goto(collection1URL.list)

      await openListFilters(page, {})
      await page.locator('.where-builder__add-first-filter').click()
      await page.locator('.condition__field .rs__control').click()

      await expect(page.locator('.rs__option', { hasText: 'es-label' })).toBeVisible()

      // expect heading to be translated
      await expect(
        page.locator('#heading-i18nFieldLabel .sort-column__label', { hasText: 'es-label' }),
      ).toBeVisible()
      await expect(page.locator('.search-filter input')).toHaveAttribute(
        'placeholder',
        /(Buscar por ID)/,
      )
    })

    test('should display translated collections and globals config options', async () => {
      // set language to Spanish
      await setUserLanguage('es')

      await page.goto(collection1URL.list)
      await expect(
        page.locator('#nav-collection1', {
          hasText: 'ES Collection 1s',
        }),
      ).toBeVisible()
      await expect(page.locator('#nav-global-global')).toContainText('ES Global')
    })
  })
})
