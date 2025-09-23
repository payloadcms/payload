import { expect, type Page, test } from '@playwright/test'
import { lexicalFullyFeaturedSlug } from 'lexical/slugs.js'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../../helpers/sdk/index.js'
import type { Config } from '../../../payload-types.js'

import { ensureCompilationIsDone, saveDocAndAssert } from '../../../../helpers.js'
import { AdminUrlUtil } from '../../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../../helpers/reInitializeDB.js'
import { TEST_TIMEOUT_LONG } from '../../../../playwright.config.js'
import { LexicalHelpers, type PasteMode } from '../../utils.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../../')

let payload: PayloadTestSDK<Config>
let serverURL: string

const { beforeAll, beforeEach, describe } = test

// This test suite resets the database before each test to ensure a clean state and cannot be run in parallel.
// Use this for tests that modify the database.
describe('Lexical Fully Featured - database', () => {
  let lexical: LexicalHelpers
  let url: AdminUrlUtil
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

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
    url = new AdminUrlUtil(serverURL, lexicalFullyFeaturedSlug)
    lexical = new LexicalHelpers(page)
    await page.goto(url.create)
    await lexical.editor.first().focus()
  })

  describe('auto upload', () => {
    const filePath = path.resolve(dirname, './collections/Upload/payload.jpg')

    async function uploadsTest(page: Page, mode: 'cmd+v' | PasteMode, expectedFileName?: string) {
      if (mode === 'cmd+v') {
        await page.keyboard.press('Meta+V')
        await page.keyboard.press('Control+V')
      } else {
        await lexical.pasteFile({ filePath, mode })
      }

      await expect(lexical.drawer).toBeVisible()
      await lexical.drawer.locator('.bulk-upload--actions-bar').getByText('Save').click()
      await expect(lexical.drawer).toBeHidden()

      await expect(lexical.editor.locator('.lexical-upload')).toHaveCount(1)
      await expect(lexical.editor.locator('.lexical-upload__doc-drawer-toggler')).toHaveText(
        expectedFileName || 'payload-1.jpg',
      )

      const uploadedImage = await payload.find({
        collection: 'uploads',
        where: { filename: { equals: expectedFileName || 'payload-1.jpg' } },
      })
      expect(uploadedImage.totalDocs).toBe(1)
    }

    // eslint-disable-next-line playwright/expect-expect
    test('ensure auto upload by copy & pasting image works when pasting a blob', async ({
      page,
    }) => {
      await uploadsTest(page, 'blob')
    })

    // eslint-disable-next-line playwright/expect-expect
    test('ensure auto upload by copy & pasting image works when pasting as html', async ({
      page,
    }) => {
      // blob will be put in src of img tag => cannot infer file name
      await uploadsTest(page, 'html', 'pasted-image.jpeg')
    })

    test('ensure auto upload by copy & pasting image works when pasting from website', async ({
      page,
    }) => {
      await page.goto(url.admin + '/custom-image')
      await page.keyboard.press('Meta+A')
      await page.keyboard.press('Control+A')

      await page.keyboard.press('Meta+C')
      await page.keyboard.press('Control+C')

      await page.goto(url.create)
      await lexical.editor.first().focus()
      await expect(lexical.editor).toBeFocused()

      await uploadsTest(page, 'cmd+v')

      // Save page
      await saveDocAndAssert(page)

      const lexicalFullyFeatured = await payload.find({
        collection: lexicalFullyFeaturedSlug,
        limit: 1,
      })
      const richText = lexicalFullyFeatured?.docs?.[0]?.richText

      const headingNode = richText?.root?.children[0]
      expect(headingNode).toBeDefined()
      expect(headingNode?.children?.[1]?.text).toBe('This is an image:')

      const uploadNode = richText?.root?.children?.[1]?.children?.[0]
      // @ts-expect-error unsafe access is fine in tests
      expect(uploadNode.value?.filename).toBe('payload-1.jpg')
    })
  })
})
