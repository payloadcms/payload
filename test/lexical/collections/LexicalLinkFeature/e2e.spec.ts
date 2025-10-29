import { expect, test } from '@playwright/test'
import { AdminUrlUtil } from 'helpers/adminUrlUtil.js'
import { reInitializeDB } from 'helpers/reInitializeDB.js'
import { lexicalLinkFeatureSlug } from 'lexical/slugs.js'
import path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone } from '../../../helpers.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { LexicalHelpers } from '../utils.js'
const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

// Unlike the other suites, this one runs in parallel, as they run on the `lexical-fully-featured/create` URL and are "pure" tests
// PLEASE do not reset the database or perform any operations that modify it in this file.
test.describe.configure({ mode: 'parallel' })

const { serverURL } = await initPayloadE2ENoConfig({
  dirname,
})

describe('Lexical Link Feature', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    const page = await browser.newPage()
    await ensureCompilationIsDone({ page, serverURL })
    await page.close()
  })
  beforeEach(async ({ page }) => {
    const url = new AdminUrlUtil(serverURL, lexicalLinkFeatureSlug)
    const lexical = new LexicalHelpers(page)
    await page.goto(url.create)
    await lexical.editor.first().focus()
  })

  test('can add new custom fields in link feature modal', async ({ page }) => {
    const lexical = new LexicalHelpers(page)

    await lexical.editor.fill('link')
    await lexical.editor.selectText()

    const linkButtonClass = `.rich-text-lexical__wrap .fixed-toolbar .toolbar-popup__button-link`
    const linkButton = page.locator(linkButtonClass).first()

    await linkButton.click()

    const customField = lexical.drawer.locator('#field-someText')

    await expect(customField).toBeVisible()
  })

  test('can set default value of newTab checkbox to checked', async ({ page }) => {
    const lexical = new LexicalHelpers(page)

    await lexical.editor.fill('link')
    await lexical.editor.selectText()

    const linkButtonClass = `.rich-text-lexical__wrap .fixed-toolbar .toolbar-popup__button-link`
    const linkButton = page.locator(linkButtonClass).first()

    await linkButton.click()

    const checkboxField = lexical.drawer.locator(`[id^="field-newTab"]`)

    await expect(checkboxField).toBeChecked()
  })
})
