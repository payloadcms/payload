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
      snapshotKey: 'fieldsTest',
      uploadsDir: [
        path.resolve(dirname, './collections/Upload/uploads'),
        path.resolve(dirname, './collections/Upload2/uploads2'),
      ],
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
})
