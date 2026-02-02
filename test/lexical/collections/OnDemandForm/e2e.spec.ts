import { expect, test } from '@playwright/test'
import { AdminUrlUtil } from '../../../helpers/shared/adminUrlUtil.js'
import { reInitializeDB } from 'helpers/shared/clearAndSeed/reInitializeDB.js'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, saveDocAndAssert } from '../../../__helpers/e2e/helpers.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { LexicalHelpers } from '../utils.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

const { serverURL } = await initPayloadE2ENoConfig({
  dirname,
})

describe('Lexical On Demand', () => {
  let lexical: LexicalHelpers
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    const page = await browser.newPage()
    await ensureCompilationIsDone({ page, serverURL })
    await page.close()
  })

  describe('within form', () => {
    beforeEach(async ({ page }) => {
      await reInitializeDB({
        serverURL,
        snapshotKey: 'lexicalTest',
        uploadsDir: [path.resolve(dirname, './collections/Upload/uploads')],
      })
      const url = new AdminUrlUtil(serverURL, 'OnDemandForm')
      lexical = new LexicalHelpers(page)
      await page.goto(url.create)
      await lexical.editor.first().focus()
    })
    test('lexical is rendered on demand within form', async ({ page }) => {
      await page.keyboard.type('Hello')

      await saveDocAndAssert(page)
      await page.reload()

      const paragraph = lexical.editor.locator('> p')
      await expect(paragraph).toHaveText('Hello')
    })

    test('on-demand editor within form can render nested fields', async () => {
      await lexical.slashCommand('table', false)

      await expect(lexical.drawer.locator('#field-rows')).toHaveValue('5')
      await expect(lexical.drawer.locator('#field-columns')).toHaveValue('5')
    })
  })

  describe('outside form', () => {
    beforeEach(async ({ page }) => {
      await reInitializeDB({
        serverURL,
        snapshotKey: 'lexicalTest',
        uploadsDir: [path.resolve(dirname, './collections/Upload/uploads')],
      })
      const url = new AdminUrlUtil(serverURL, 'OnDemandOutsideForm')
      lexical = new LexicalHelpers(page)
      await page.goto(url.create)
      await lexical.editor.first().focus()
    })
    test('lexical is rendered on demand outside form', async ({ page }) => {
      await page.keyboard.type('Hello')

      const paragraph = lexical.editor.locator('> p')
      await expect(paragraph).toHaveText('Hellostate default')

      await saveDocAndAssert(page)
      await page.reload()

      const paragraphAfterSave = lexical.editor.locator('> p')
      await expect(paragraphAfterSave).not.toHaveText('Hellostate default') // Outside Form => Not Saved
    })

    test('lexical value can be controlled outside form', async ({ page }) => {
      await page.keyboard.type('Hello')

      const paragraph = lexical.editor.locator('> p')
      await expect(paragraph).toHaveText('Hellostate default')

      // Click button with text
      const button = page.getByRole('button', { name: 'Reset Editor State' })
      await button.click()

      await expect(paragraph).toHaveText('state default')
    })

    test('on-demand editor outside form can render nested fields', async () => {
      await lexical.slashCommand('table', false)

      await expect(lexical.drawer.locator('#field-rows')).toHaveValue('5')
      await expect(lexical.drawer.locator('#field-columns')).toHaveValue('5')
    })

    test('on-demand editor renders label', async ({ page }) => {
      await expect(page.locator('.field-label[for="field-myField"]')).toHaveText('My Label')
    })

    test('ensure anchor richText field is hidden', async ({ page }) => {
      // Important: Wait for all fields to render
      await wait(1000)
      await expect(page.locator('.shimmer')).toHaveCount(0)

      await expect(page.locator('.field-label[for="field-hiddenAnchor"]')).toHaveCount(0)

      await expect(page.locator('.rich-text-lexical')).toHaveCount(1)
    })
  })
})
