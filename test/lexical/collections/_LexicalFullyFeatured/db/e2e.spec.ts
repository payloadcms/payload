import {
  buildEditorState,
  type DefaultNodeTypes,
  type SerializedInlineBlockNode,
} from '@payloadcms/richtext-lexical'
import { expect, type Page, test } from '@playwright/test'
import { lexicalFullyFeaturedSlug } from 'lexical/slugs.js'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../../__helpers/shared/sdk/index.js'
import type { Config, InlineBlockWithSelect } from '../../../payload-types.js'

import { ensureCompilationIsDone, saveDocAndAssert } from '../../../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../../__helpers/shared/adminUrlUtil.js'
import { assertNetworkRequests } from '../../../../__helpers/e2e/assertNetworkRequests.js'
import { initPayloadE2ENoConfig } from '../../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../../__helpers/shared/clearAndSeed/reInitializeDB.js'
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

      await expect(lexical.editor.locator('.LexicalEditorTheme__upload')).toHaveCount(1)
      await expect(
        lexical.editor.locator('.LexicalEditorTheme__upload__doc-drawer-toggler'),
      ).toHaveText(expectedFileName || 'payload-1.jpg')

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

    test('ensure block contents are not reset on save on both create and update', async ({
      page,
    }) => {
      await lexical.slashCommand('myblock')
      await expect(lexical.editor.locator('.LexicalEditorTheme__block')).toBeVisible()

      /**
       * Test on create
       */
      await assertNetworkRequests(
        page,
        `/admin/collections/${lexicalFullyFeaturedSlug}`,
        async () => {
          await lexical.editor.locator('#field-someText').first().fill('Testing 123')
        },
        {
          minimumNumberOfRequests: 2,
          allowedNumberOfRequests: 3,
        },
      )

      await expect(lexical.editor.locator('#field-someText')).toHaveValue('Testing 123')
      await saveDocAndAssert(page)
      await expect(lexical.editor.locator('#field-someText')).toHaveValue('Testing 123')
      await page.reload()
      await expect(lexical.editor.locator('#field-someText')).toHaveValue('Testing 123')

      /**
       * Test on update (this is where the issue appeared)
       */
      await assertNetworkRequests(
        page,
        `/admin/collections/${lexicalFullyFeaturedSlug}`,
        async () => {
          await lexical.editor.locator('#field-someText').first().fill('Updated text')
        },
        {
          minimumNumberOfRequests: 2,
          allowedNumberOfRequests: 2,
        },
      )
      await expect(lexical.editor.locator('#field-someText')).toHaveValue('Updated text')
      await saveDocAndAssert(page)
      await expect(lexical.editor.locator('#field-someText')).toHaveValue('Updated text')
      await page.reload()
      await expect(lexical.editor.locator('#field-someText')).toHaveValue('Updated text')
    })
  })

  test('ensure inline block initial form state is applied on load for inline blocks with select fields', async ({
    page,
  }) => {
    const doc = await payload.create({
      collection: 'lexical-fully-featured',
      data: {
        richText: buildEditorState<
          DefaultNodeTypes | SerializedInlineBlockNode<InlineBlockWithSelect>
        >({
          nodes: [
            {
              type: 'inlineBlock',
              version: 1,
              fields: {
                blockType: 'inlineBlockWithSelect',
                id: '1',
              },
            },
            {
              type: 'inlineBlock',
              version: 1,
              fields: {
                blockType: 'inlineBlockWithSelect',
                id: '2',
              },
            },
            {
              type: 'inlineBlock',
              version: 1,
              fields: {
                blockType: 'inlineBlockWithSelect',
                id: '3',
              },
            },
          ],
        }),
      },
    })

    /**
     * Ensure there are no unnecessary, additional form state requests made, since we already have the form state as part of the initial state.
     */
    await assertNetworkRequests(
      page,
      `/admin/collections/${lexicalFullyFeaturedSlug}`,
      async () => {
        await page.goto(url.edit(doc.id))
        await lexical.editor.first().focus()
      },
      {
        minimumNumberOfRequests: 0,
        allowedNumberOfRequests: 0,
        requestFilter: (request) => {
          // Ensure it's a form state request
          if (request.method() === 'POST') {
            const requestBody = request.postDataJSON()

            return (
              Array.isArray(requestBody) &&
              requestBody.length > 0 &&
              requestBody[0].name === 'form-state'
            )
          }
          return false
        },
      },
    )
  })

  test('ensure block name can be saved and loaded', async ({ page }) => {
    await lexical.slashCommand('myblock')
    await expect(lexical.editor.locator('.LexicalEditorTheme__block')).toBeVisible()

    const blockNameInput = lexical.editor.locator('#blockName')

    /**
     * Test on create
     */
    await assertNetworkRequests(
      page,
      `/admin/collections/${lexicalFullyFeaturedSlug}`,
      async () => {
        await blockNameInput.fill('Testing 123')
      },
      {
        minimumNumberOfRequests: 2,
        allowedNumberOfRequests: 3,
      },
    )

    await expect(blockNameInput).toHaveValue('Testing 123')
    await saveDocAndAssert(page)
    await expect(blockNameInput).toHaveValue('Testing 123')
    await page.reload()
    await expect(blockNameInput).toHaveValue('Testing 123')

    /**
     * Test on update
     */
    await assertNetworkRequests(
      page,
      `/admin/collections/${lexicalFullyFeaturedSlug}`,
      async () => {
        await blockNameInput.fill('Updated blockname')
      },
      {
        minimumNumberOfRequests: 2,
        allowedNumberOfRequests: 2,
      },
    )
    await expect(blockNameInput).toHaveValue('Updated blockname')
    await saveDocAndAssert(page)
    await expect(blockNameInput).toHaveValue('Updated blockname')
    await page.reload()
    await expect(blockNameInput).toHaveValue('Updated blockname')
  })
})
