import { expect, test } from '@playwright/test'
import { AdminUrlUtil } from 'helpers/adminUrlUtil.js'
import { reInitializeDB } from 'helpers/reInitializeDB.js'
import { lexicalFullyFeaturedSlug } from 'lexical/slugs.js'
import path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone } from '../../../helpers.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { LexicalHelpers } from './utils.js'
const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

// Unlike the other suites, this one runs in parallel, as they run on the `lexical-fully-featured/create` URL and are "pure" tests
test.describe.configure({ mode: 'parallel' })

const { serverURL } = await initPayloadE2ENoConfig({
  dirname,
})

describe('Lexical Fully Featured', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    const page = await browser.newPage()
    await ensureCompilationIsDone({ page, serverURL })
    await page.close()
  })
  beforeEach(async ({ page }) => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'lexicalTest',
      uploadsDir: [path.resolve(dirname, './collections/Upload/uploads')],
    })
    const url = new AdminUrlUtil(serverURL, lexicalFullyFeaturedSlug)
    const lexical = new LexicalHelpers(page)
    await page.goto(url.create)
    await lexical.editor.first().focus()
  })
  test('prevent extra paragraph when inserting decorator blocks like blocks or upload node', async ({
    page,
  }) => {
    const lexical = new LexicalHelpers(page)
    await lexical.slashCommand('block')
    await lexical.slashCommand('relationship')
    await lexical.drawer.locator('.list-drawer__header').getByText('Create New').click()
    await lexical.save('drawer')
    await expect(lexical.decorator).toHaveCount(2)
    await lexical.slashCommand('upload')
    await lexical.drawer.locator('.list-drawer__header').getByText('Create New').click()
    await lexical.drawer.getByText('Paste URL').click()
    await lexical.drawer
      .locator('.file-field__remote-file')
      .fill('https://payloadcms.com/images/universal-truth.jpg')
    await lexical.drawer.getByText('Add file').click()
    await lexical.save('drawer')
    await expect(lexical.decorator).toHaveCount(3)
    const paragraph = lexical.editor.locator('> p')
    await expect(paragraph).toHaveText('')
  })

  test('ControlOrMeta+A inside input should select all the text inside the input', async ({
    page,
  }) => {
    const lexical = new LexicalHelpers(page)
    await lexical.editor.first().focus()
    await page.keyboard.type('Hello')
    await page.keyboard.press('Enter')
    await lexical.slashCommand('block')
    await page.locator('#field-someText').first().focus()
    await page.keyboard.type('World')
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Backspace')
    const paragraph = lexical.editor.locator('> p').first()
    await expect(paragraph).toHaveText('Hello')
    await expect(page.getByText('World')).toHaveCount(0)
  })

  test('text state feature', async ({ page }) => {
    await page.keyboard.type('Hello')
    await page.keyboard.press('ControlOrMeta+A')
    await page.locator('.toolbar-popup__dropdown-textState').first().click()
    await page.getByRole('button', { name: 'Red' }).first().click()
    const colored = page.locator('span').filter({ hasText: 'Hello' })
    await expect(colored).toHaveCSS('background-color', 'oklch(0.704 0.191 22.216)')
    await expect(colored).toHaveAttribute('data-color', 'bg-red')
    await page.locator('.toolbar-popup__dropdown-textState').first().click()
    await page.getByRole('button', { name: 'Default style' }).click()
    await expect(colored).toBeVisible()
    await expect(colored).not.toHaveCSS('background-color', 'oklch(0.704 0.191 22.216)')
    await expect(colored).not.toHaveAttribute('data-color', 'bg-red')
  })
})
