import {
  buildEditorState,
  type DefaultNodeTypes,
  type RichTextNodes,
  type SerializedBlockNode,
  type SerializedInlineBlockNode,
} from '@payloadcms/richtext-lexical'
import { expect, type Page, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../../__helpers/shared/sdk/index.js'
import type {
  Config,
  InlineBlockWithSelect,
  MyBlock,
  MyInlineBlock,
} from '../../../payload-types.js'

import { assertNetworkRequests } from '../../../../__helpers/e2e/assertNetworkRequests.js'
import { changeLocale, saveDocAndAssert } from '../../../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../../__helpers/shared/adminUrlUtil.js'
import { reInitializeDB } from '../../../../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { initPayloadE2ENoConfig } from '../../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { ensureCompilationIsDone } from '../../../../__setup/e2e/ensureCompilationIsDone.js'
import { TEST_TIMEOUT_LONG } from '../../../../playwright.config.js'
import { lexicalFullyFeaturedSlug } from '../../../slugs.js'
import { LexicalHelpers, type PasteMode } from '../../utils.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../../')

type FullyFeaturedNode = RichTextNodes<Config['collections']['lexical-fully-featured']['richText']>
type PastedTextBlockNode = Extract<FullyFeaturedNode, { type: 'heading' | 'paragraph' }>

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
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    const page = await browser.newPage()
    await ensureCompilationIsDone({ page, serverURL })
    await page.close()
  })
  beforeEach(async ({ page }) => {
    await reInitializeDB({
      serverURL,
    })
    url = new AdminUrlUtil(serverURL, lexicalFullyFeaturedSlug)
    lexical = new LexicalHelpers(page)
    await page.goto(url.create)
    await expect(lexical.editor.first()).toBeVisible()
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

      await expect(lexical.bulkUploadDrawer).toBeVisible()
      await lexical.bulkUploadDrawer
        .locator('.bulk-upload--actions-bar__saveButtons button')
        .click()
      await expect(lexical.bulkUploadDrawer).toBeHidden()

      await expect(lexical.editor.locator('.LexicalEditorTheme__upload')).toHaveCount(1)
      await expect(
        lexical.editor.locator('.LexicalEditorTheme__upload__doc-drawer-toggler'),
      ).toHaveText(expectedFileName || 'payload-1.jpg')

      const uploadedImage = await payload.find({
        collection: 'uploads',
        where: { filename: { equals: expectedFileName || 'payload-1.jpg' } },
        overrideAccess: true,
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
      test.slow()

      await page.goto(url.admin + '/custom-image')
      await page.keyboard.press('Meta+A')
      await page.keyboard.press('Control+A')

      await page.keyboard.press('Meta+C')
      await page.keyboard.press('Control+C')

      await page.goto(url.create)
      await expect(lexical.editor.first()).toBeVisible()
      await lexical.editor.first().focus()
      await expect(lexical.editor).toBeFocused()

      await uploadsTest(page, 'cmd+v')

      // Save page
      await saveDocAndAssert(page)

      const lexicalFullyFeatured = await payload.find({
        collection: lexicalFullyFeaturedSlug,
        limit: 1,
        overrideAccess: true,
      })
      const richText = lexicalFullyFeatured?.docs?.[0]?.richText

      const pastedTextBlock = richText?.root.children[0] as PastedTextBlockNode | undefined
      expect(pastedTextBlock).toBeDefined()

      // Browser clipboard serialization can insert a leading linebreak node.
      // Assert the combined text instead of a fixed child index.
      const combinedText = pastedTextBlock?.children
        .map((child) => ('text' in child ? child.text : ''))
        .join('')

      expect(combinedText).toBe('This is an image:')

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
          allowedNumberOfRequests: 3,
          minimumNumberOfRequests: 2,
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
          allowedNumberOfRequests: 2,
          minimumNumberOfRequests: 2,
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
              fields: {
                id: '1',
                blockType: 'inlineBlockWithSelect',
              },
              version: 1,
            },
            {
              type: 'inlineBlock',
              fields: {
                id: '2',
                blockType: 'inlineBlockWithSelect',
              },
              version: 1,
            },
            {
              type: 'inlineBlock',
              fields: {
                id: '3',
                blockType: 'inlineBlockWithSelect',
              },
              version: 1,
            },
          ],
        }),
      },
      overrideAccess: true,
    })

    /**
     * Ensure there are no unnecessary, additional form state requests made, since we already have the form state as part of the initial state.
     */
    await assertNetworkRequests(
      page,
      `/admin/collections/${lexicalFullyFeaturedSlug}`,
      async () => {
        await page.goto(url.edit(doc.id))
        await expect(lexical.editor.first()).toBeVisible()
        await lexical.editor.first().focus()
      },
      {
        allowedNumberOfRequests: 0,
        minimumNumberOfRequests: 0,
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

  test('should preserve null arrays when regular and inline block fields change', async ({
    page,
  }) => {
    const doc = await payload.create({
      collection: lexicalFullyFeaturedSlug,
      data: {
        richText: buildEditorState<FullyFeaturedNode>({
          nodes: [
            {
              type: 'block',
              fields: {
                id: 'regular-block',
                blockType: 'myBlock',
                items: null,
                someText: 'Regular before',
              },
              format: '',
              version: 2,
            },
            {
              type: 'block',
              fields: {
                id: 'empty-array-block',
                blockType: 'myBlock',
                items: null,
                someText: 'Empty array block',
              },
              format: '',
              version: 2,
            },
            {
              type: 'inlineBlock',
              fields: {
                id: 'inline-block',
                blockType: 'myInlineBlock',
                items: null,
                someText: 'Inline before',
              },
              version: 1,
            },
          ],
        }),
      },
    })

    await page.goto(url.edit(doc.id))
    await expect(lexical.editor.first()).toBeVisible()

    const regularBlocks = lexical.editor.locator('.LexicalEditorTheme__block-myBlock')
    const regularBlock = regularBlocks.nth(0)
    await regularBlock.locator('#field-someText').fill('Regular after')

    const inlineBlock = lexical.editor.locator('.LexicalEditorTheme__inlineBlock').first()
    await inlineBlock.locator('.LexicalEditorTheme__inlineBlock__container').click()
    await expect(lexical.drawer).toBeVisible()
    await lexical.drawer.locator('#field-someText').fill('Inline after')
    await lexical.drawer.getByText('Save changes').click()
    await expect(lexical.drawer).toBeHidden()

    const emptyArrayBlock = regularBlocks.nth(1)
    const itemsField = emptyArrayBlock.locator('#field-items')
    const emptyFormStateResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes(`/admin/collections/${lexicalFullyFeaturedSlug}/`),
    )
    await itemsField.getByRole('button', { name: 'Add Item' }).click()
    await expect(itemsField.locator('.array-field__row')).toHaveCount(1)

    await itemsField.locator('#items-row-0 .array-actions__button').click()
    await page.locator('.popup__content .array-actions__remove').click()
    await emptyArrayBlock.locator('#field-someText').fill('Empty array after')
    await emptyFormStateResponsePromise
    await expect(itemsField.locator('.array-field__row')).toHaveCount(0)

    const updateRequestPromise = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' && request.url().includes(`/api/${lexicalFullyFeaturedSlug}/`),
    )
    await saveDocAndAssert(page)

    const updateRequest = await updateRequestPromise
    const serializedUpdateData = updateRequest
      .postData()
      ?.match(/name="_payload"\r\n\r\n(.*?)\r\n--/s)?.[1]
    expect(serializedUpdateData).toBeDefined()
    const updateData = JSON.parse(serializedUpdateData as string)
    const savedNodes = updateData.richText.root.children as FullyFeaturedNode[]
    const savedRegularBlock = savedNodes.find(
      (node) => node.type === 'block' && node.fields.id === 'regular-block',
    ) as SerializedBlockNode<MyBlock> | undefined
    const savedEmptyArrayBlock = savedNodes.find(
      (node) => node.type === 'block' && node.fields.id === 'empty-array-block',
    ) as SerializedBlockNode<MyBlock> | undefined
    const savedParagraph = savedNodes.find((node) => node.type === 'paragraph')
    const savedInlineBlock = savedParagraph?.children.find(
      (node) => node.type === 'inlineBlock' && node.fields.blockType === 'myInlineBlock',
    ) as SerializedInlineBlockNode<MyInlineBlock> | undefined

    expect(savedRegularBlock?.fields.items).toBeNull()
    expect(savedEmptyArrayBlock?.fields.items).toBeUndefined()
    expect(savedInlineBlock?.fields.items).toBeNull()
  })

  test('should keep a localized block array empty after fallback is disabled', async ({ page }) => {
    const doc = await payload.create({
      collection: lexicalFullyFeaturedSlug,
      data: {
        richText: buildEditorState<FullyFeaturedNode>({
          nodes: [
            {
              type: 'block',
              fields: {
                id: 'localized-empty-array-block',
                blockType: 'myBlock',
                items: null,
                someText: 'Before',
              },
              format: '',
              version: 2,
            },
          ],
        }),
      },
    })

    await page.goto(url.edit(doc.id))
    await expect(lexical.editor.first()).toBeVisible()
    await changeLocale(page, 'es')

    const block = lexical.editor.locator('.LexicalEditorTheme__block-myBlock')
    const itemsField = block.locator('#field-items')
    const fallbackCheckbox = itemsField.locator('input[type="checkbox"]')
    await expect(fallbackCheckbox).toBeChecked()

    const formStateResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes(`/admin/collections/${lexicalFullyFeaturedSlug}/`),
    )
    await fallbackCheckbox.click()
    await expect(fallbackCheckbox).not.toBeChecked()
    await block.locator('#field-someText').fill('After')
    await formStateResponsePromise

    const updateRequestPromise = page.waitForRequest(
      (request) =>
        request.method() === 'PATCH' && request.url().includes(`/api/${lexicalFullyFeaturedSlug}/`),
    )
    await saveDocAndAssert(page)

    const updateRequest = await updateRequestPromise
    const serializedUpdateData = updateRequest
      .postData()
      ?.match(/name="_payload"\r\n\r\n(.*?)\r\n--/s)?.[1]
    expect(serializedUpdateData).toBeDefined()
    const updateData = JSON.parse(serializedUpdateData as string)
    const savedNodes = updateData.richText.root.children as FullyFeaturedNode[]
    const savedBlock = savedNodes.find(
      (node) => node.type === 'block' && node.fields.id === 'localized-empty-array-block',
    ) as SerializedBlockNode<MyBlock> | undefined

    expect(savedBlock?.fields.items).toBeUndefined()
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
        allowedNumberOfRequests: 3,
        minimumNumberOfRequests: 2,
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
        allowedNumberOfRequests: 2,
        minimumNumberOfRequests: 2,
      },
    )
    await expect(blockNameInput).toHaveValue('Updated blockname')
    await saveDocAndAssert(page)
    await expect(blockNameInput).toHaveValue('Updated blockname')
    await page.reload()
    await expect(blockNameInput).toHaveValue('Updated blockname')
  })
})
