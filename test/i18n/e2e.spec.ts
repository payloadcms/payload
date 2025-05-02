import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import type { Config } from './payload-types.js'

const { beforeAll, beforeEach, describe } = test

import path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../helpers.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../helpers/reInitializeDB.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('i18n', () => {
  let page: Page

  let serverURL: string

  beforeAll(async ({ browser }, testInfo) => {
    const prebuild = false // Boolean(process.env.CI)

    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      prebuild,
    }))

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

  test('ensure i18n labels and useTranslation hooks display correct translation', async () => {
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
    await page.goto(serverURL + '/admin/account')

    await page.locator('div.rs__control').click()
    await page.locator('div.rs__option').filter({ hasText: 'English' }).click()
    await expect(page.locator('div.payload-settings h3')).toHaveText('Payload Settings')

    await page.goto(serverURL + '/admin/collections/collection1/create')
    await expect(page.locator('label[for="field-fieldDefaultI18nValid"]')).toHaveText(
      'Add {{label}}',
    )

    await page.goto(serverURL + '/admin/account')
    await page.locator('div.rs__control').click()
    await page.locator('div.rs__option').filter({ hasText: 'Español' }).click()
    await expect(page.locator('div.payload-settings h3')).toHaveText('Configuración de la carga')

    await page.goto(serverURL + '/admin/collections/collection1/create')
    await expect(page.locator('label[for="field-fieldDefaultI18nValid"]')).toHaveText(
      'Añadir {{label}}',
    )
  })
})
