import type {
  SerializedBlockNode,
  SerializedInlineBlockNode,
  SerializedLinkNode,
} from '@payloadcms/richtext-lexical'
import type {
  SerializedEditorState,
  SerializedParagraphNode,
  SerializedTextNode,
} from '@payloadcms/richtext-lexical/lexical'
import type { BrowserContext, Locator, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../../../helpers/sdk/index.js'
import type { Config, LexicalField, Upload } from '../../../../payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../../../../../helpers.js'
import { AdminUrlUtil } from '../../../../../helpers/adminUrlUtil.js'
import { assertToastErrors } from '../../../../../helpers/assertToastErrors.js'
import { assertNetworkRequests } from '../../../../../helpers/e2e/assertNetworkRequests.js'
import { initPayloadE2ENoConfig } from '../../../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../../../helpers/reInitializeDB.js'
import { RESTClient } from '../../../../../helpers/rest.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../../../../../playwright.config.js'
import { lexicalFieldsSlug } from '../../../../slugs.js'
import { lexicalDocData } from '../../data.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../../../')

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let client: RESTClient
let page: Page
let context: BrowserContext
let serverURL: string

/**
 * Client-side navigation to the lexical editor from list view
 */
async function navigateToLexicalFields(
  navigateToListView: boolean = true,
  localized: boolean = false,
): Promise<{
  richTextField: Locator
}> {
  if (navigateToListView) {
    const url: AdminUrlUtil = new AdminUrlUtil(
      serverURL,
      localized ? 'lexical-localized-fields' : 'lexical-fields',
    )
    await page.goto(url.list)
  }

  const linkToDoc = page.locator('tbody tr:first-child .cell-title a').first()
  await expect(() => expect(linkToDoc).toBeTruthy()).toPass({ timeout: POLL_TOPASS_TIMEOUT })
  const linkDocHref = await linkToDoc.getAttribute('href')

  await linkToDoc.click()

  await page.waitForURL(`**${linkDocHref}`)

  const richTextField = page.locator('.rich-text-lexical').nth(2) // second
  await richTextField.scrollIntoViewIfNeeded()
  await expect(richTextField).toBeVisible()
  // Wait until there at least 10 blocks visible in that richtext field - thus wait for it to be fully loaded
  await expect(richTextField.locator('.lexical-block')).toHaveCount(10)

  return {
    richTextField,
  }
}

async function createInlineBlock({
  name,
  richTextField,
}: {
  name: string
  richTextField: Locator
}): Promise<{
  inlineBlockDrawer: Locator
  saveDrawer: () => Promise<{
    inlineBlock: Locator
    openEditDrawer: () => Promise<{ editDrawer: Locator; saveEditDrawer: () => Promise<void> }>
  }>
}> {
  const lastParagraph = richTextField.locator('p').last()
  await lastParagraph.scrollIntoViewIfNeeded()
  await expect(lastParagraph).toBeVisible()

  const spanInEditor = richTextField.locator('span').getByText('Upload Node:').first()
  await expect(spanInEditor).toBeVisible()
  await spanInEditor.click()

  /**
   * Create new sub-block
   */
  await page.keyboard.press(' ')
  await page.keyboard.press('/')
  await page.keyboard.type(name.includes(' ') ? (name.split(' ')?.[0] ?? name) : name)

  // Create Rich Text Block
  const slashMenuPopover = page.locator('#slash-menu .slash-menu-popup')
  await expect(slashMenuPopover).toBeVisible()

  const richTextBlockSelectButton = slashMenuPopover.locator('button').getByText(name).first()
  await expect(richTextBlockSelectButton).toBeVisible()
  await expect(richTextBlockSelectButton).toHaveText(name)
  await richTextBlockSelectButton.click()
  await expect(slashMenuPopover).toBeHidden()

  // Wait for inline block drawer to pop up. Drawer id starts with drawer_1_lexical-inlineBlocks-create-
  const inlineBlockDrawer = page
    .locator('dialog[id^=drawer_1_lexical-inlineBlocks-create-]')
    .first()
  await expect(inlineBlockDrawer).toBeVisible()
  await expect(page.locator('.shimmer-effect')).toHaveCount(0)
  await wait(500)

  return {
    inlineBlockDrawer,
    saveDrawer: async () => {
      await wait(500)
      await inlineBlockDrawer.locator('button').getByText('Save changes').click()
      await expect(inlineBlockDrawer).toBeHidden()

      const inlineBlock = richTextField.locator('.inline-block').nth(0)
      const editButton = inlineBlock.locator('.inline-block__editButton').first()

      return {
        inlineBlock,
        openEditDrawer: async () => {
          await editButton.click()
          const editDrawer = page
            .locator('dialog[id^=drawer_1_lexical-inlineBlocks-create-]')
            .first()
          await expect(editDrawer).toBeVisible()
          await expect(page.locator('.shimmer-effect')).toHaveCount(0)
          await wait(500)

          return {
            editDrawer,
            saveEditDrawer: async () => {
              await wait(500)
              const saveButton = editDrawer.locator('button').getByText('Save changes').first()
              await saveButton.click()
              await expect(editDrawer).toBeHidden()
            },
          }
        },
      }
    },
  }
}

async function assertLexicalDoc({
  depth = 0,
  fn,
}: {
  depth?: number
  fn: (args: {
    lexicalDoc: LexicalField
    lexicalWithBlocks: SerializedEditorState
  }) => Promise<void> | void
}) {
  await expect(async () => {
    const lexicalDoc: LexicalField = (
      await payload.find({
        collection: lexicalFieldsSlug,
        depth,
        overrideAccess: true,
        where: {
          title: {
            equals: lexicalDocData.title,
          },
        },
      })
    ).docs[0] as never

    await fn({ lexicalDoc, lexicalWithBlocks: lexicalDoc.lexicalWithBlocks })
  }).toPass({
    timeout: POLL_TOPASS_TIMEOUT,
  })
}

describe('lexicalBlocks', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })
  beforeEach(async () => {
    /*await throttleTest({
      page,
      context,
      delay: 'Slow 4G',
    })*/
    await reInitializeDB({
      serverURL,
      snapshotKey: 'fieldsTest',
      uploadsDir: [
        path.resolve(dirname, './collections/Upload/uploads'),
        path.resolve(dirname, './collections/Upload2/uploads2'),
      ],
    })

    if (client) {
      await client.logout()
    }
    client = new RESTClient({ defaultSlug: 'rich-text-fields', serverURL })
    await client.login()
  })

  test('ensure block with custom Block RSC can be created, updates data when saving edit fields drawer, and maintains cursor position', async () => {
    const { richTextField } = await navigateToLexicalFields()

    const lastParagraph = richTextField.locator('p').last()
    await lastParagraph.scrollIntoViewIfNeeded()
    await expect(lastParagraph).toBeVisible()

    await lastParagraph.click()
    await page.keyboard.press('1')
    await page.keyboard.press('2')
    await page.keyboard.press('3')

    await page.keyboard.press('Enter')
    await page.keyboard.press('/')
    await page.keyboard.type('RSC')

    // CreateBlock
    const slashMenuPopover = page.locator('#slash-menu .slash-menu-popup')
    await expect(slashMenuPopover).toBeVisible()

    // Click 1. Button and ensure it's the RSC block creation button (it should be! Otherwise, sorting wouldn't work)
    const rscBlockSelectButton = slashMenuPopover.locator('button').first()
    await expect(rscBlockSelectButton).toBeVisible()
    await expect(rscBlockSelectButton).toContainText('Block R S C')
    await rscBlockSelectButton.click()
    await expect(slashMenuPopover).toBeHidden()

    const newRSCBlock = richTextField
      .locator('.lexical-block:not(.lexical-block .lexical-block)')
      .nth(8) // The :not(.lexical-block .lexical-block) makes sure this does not select sub-blocks
    await newRSCBlock.scrollIntoViewIfNeeded()
    await expect(newRSCBlock.locator('.collapsible__content')).toHaveText('Data:')

    // Select paragraph with text "123"
    // Now double-click to select entire line
    await richTextField.locator('p').getByText('123').first().click({ clickCount: 2 })

    const editButton = newRSCBlock.locator('.lexical-block__editButton').first()
    await editButton.click()

    await wait(500)
    const editDrawer = page.locator('dialog[id^=drawer_1_lexical-blocks-create-]').first() // IDs starting with list-drawer_1_ (there's some other symbol after the underscore)
    await expect(editDrawer).toBeVisible()
    await wait(500)
    await expect(page.locator('.shimmer-effect')).toHaveCount(0)

    await editDrawer.locator('.rs__control .value-container').first().click()
    await wait(500)
    await expect(editDrawer.locator('.rs__option').nth(1)).toBeVisible()
    await expect(editDrawer.locator('.rs__option').nth(1)).toContainText('value2')
    await editDrawer.locator('.rs__option').nth(1).click()

    // Click button with text Save changes
    await editDrawer.locator('button').getByText('Save changes').click()
    await expect(editDrawer).toBeHidden()

    await expect(newRSCBlock.locator('.collapsible__content')).toHaveText('Data: value2')

    // press ctrl+B to bold the text previously selected (assuming it is still selected now, which it should be)
    await page.keyboard.press('Meta+B')
    // In case this is mac or windows
    await page.keyboard.press('Control+B')

    await wait(300)

    // save document and assert
    await saveDocAndAssert(page)
    await wait(300)
    await expect(newRSCBlock.locator('.collapsible__content')).toHaveText('Data: value2')

    // Check if the API result is correct
    await assertLexicalDoc({
      fn: ({ lexicalWithBlocks }) => {
        const rscBlock: SerializedBlockNode = lexicalWithBlocks.root
          .children[14] as SerializedBlockNode
        const paragraphNode: SerializedParagraphNode = lexicalWithBlocks.root
          .children[12] as SerializedParagraphNode

        expect(rscBlock.fields.blockType).toBe('BlockRSC')
        expect(rscBlock.fields.key).toBe('value2')
        expect((paragraphNode.children[0] as SerializedTextNode).text).toBe('123')
        expect((paragraphNode.children[0] as SerializedTextNode).format).toBe(1)
      },
    })
  })

  describe('block filterOptions', () => {
    async function setupFilterOptionsTests() {
      const { richTextField } = await navigateToLexicalFields()

      await payload.create({
        collection: 'text-fields',
        data: {
          text: 'invalid',
        },
        depth: 0,
      })

      const lastParagraph = richTextField.locator('p').last()
      await lastParagraph.scrollIntoViewIfNeeded()
      await expect(lastParagraph).toBeVisible()

      await lastParagraph.click()

      await page.keyboard.press('Enter')
      await page.keyboard.press('/')
      await page.keyboard.type('filter')

      // CreateBlock
      const slashMenuPopover = page.locator('#slash-menu .slash-menu-popup')
      await expect(slashMenuPopover).toBeVisible()

      const blockSelectButton = slashMenuPopover.locator('button').first()
      await expect(blockSelectButton).toBeVisible()
      await expect(blockSelectButton).toContainText('Filter Options Block')
      await blockSelectButton.click()
      await expect(slashMenuPopover).toBeHidden()

      const newBlock = richTextField
        .locator('.lexical-block:not(.lexical-block .lexical-block)')
        .nth(8) // The :not(.lexical-block .lexical-block) makes sure this does not select sub-blocks
      await newBlock.scrollIntoViewIfNeeded()

      await saveDocAndAssert(page)

      const topLevelDocTextField = page.locator('#field-title').first()
      const blockTextField = newBlock.locator('#field-text').first()
      const blockGroupTextField = newBlock.locator('#field-group__groupText').first()

      const dependsOnDocData = newBlock.locator('#field-group__dependsOnDocData').first()
      const dependsOnSiblingData = newBlock.locator('#field-group__dependsOnSiblingData').first()
      const dependsOnBlockData = newBlock.locator('#field-group__dependsOnBlockData').first()

      await expect(page.locator('.payload-toast-container .payload-toast-item')).toBeHidden()

      return {
        blockGroupTextField,
        blockTextField,
        dependsOnDocData,
        dependsOnBlockData,
        dependsOnSiblingData,
        topLevelDocTextField,
        newBlock,
      }
    }

    test('ensure block fields with filter options have access to document-level data', async () => {
      const {
        blockGroupTextField,
        blockTextField,
        dependsOnBlockData,
        dependsOnDocData,
        dependsOnSiblingData,
        newBlock,
        topLevelDocTextField,
      } = await setupFilterOptionsTests()

      await dependsOnDocData.locator('.rs__control').click()
      await expect(newBlock.locator('.rs__menu')).toHaveText('No options')
      await dependsOnDocData.locator('.rs__control').click()

      await dependsOnSiblingData.locator('.rs__control').click()
      await expect(newBlock.locator('.rs__menu')).toContainText('Seeded text document')
      await expect(newBlock.locator('.rs__menu')).toContainText('Another text document')
      await dependsOnSiblingData.locator('.rs__control').click()

      await dependsOnBlockData.locator('.rs__control').click()
      await expect(newBlock.locator('.rs__menu')).toContainText('Seeded text document')
      await expect(newBlock.locator('.rs__menu')).toContainText('Another text document')
      await dependsOnBlockData.locator('.rs__control').click()

      // Fill and wait for form state to come back
      await assertNetworkRequests(page, '/admin/collections/lexical-fields', async () => {
        await topLevelDocTextField.fill('invalid')
      })

      // Ensure block form state is updated and comes back (=> filter options are updated)
      await assertNetworkRequests(
        page,
        '/admin/collections/lexical-fields',
        async () => {
          await blockTextField.fill('.')
          await blockTextField.fill('')
        },
        { allowedNumberOfRequests: 2 },
      )

      await dependsOnDocData.locator('.rs__control').click()
      await expect(newBlock.locator('.rs__menu')).toHaveText('Text Fieldsinvalid')
      await dependsOnDocData.locator('.rs__control').click()

      await dependsOnSiblingData.locator('.rs__control').click()
      await expect(newBlock.locator('.rs__menu')).toContainText('Seeded text document')
      await expect(newBlock.locator('.rs__menu')).toContainText('Another text document')
      await dependsOnSiblingData.locator('.rs__control').click()

      await dependsOnBlockData.locator('.rs__control').click()
      await expect(newBlock.locator('.rs__menu')).toContainText('Seeded text document')
      await expect(newBlock.locator('.rs__menu')).toContainText('Another text document')
      await dependsOnBlockData.locator('.rs__control').click()

      await saveDocAndAssert(page)
    })

    test('ensure block fields with filter options have access to sibling data', async () => {
      const {
        blockGroupTextField,
        blockTextField,
        dependsOnBlockData,
        dependsOnDocData,
        dependsOnSiblingData,
        newBlock,
        topLevelDocTextField,
      } = await setupFilterOptionsTests()

      await assertNetworkRequests(
        page,
        '/admin/collections/lexical-fields',
        async () => {
          await blockGroupTextField.fill('invalid')
        },
        { allowedNumberOfRequests: 2 },
      )

      await dependsOnDocData.locator('.rs__control').click()
      await expect(newBlock.locator('.rs__menu')).toHaveText('No options')
      await dependsOnDocData.locator('.rs__control').click()

      await dependsOnSiblingData.locator('.rs__control').click()
      await expect(newBlock.locator('.rs__menu')).toHaveText('Text Fieldsinvalid')
      await dependsOnSiblingData.locator('.rs__control').click()

      await dependsOnBlockData.locator('.rs__control').click()
      await expect(newBlock.locator('.rs__menu')).toContainText('Seeded text document')
      await expect(newBlock.locator('.rs__menu')).toContainText('Another text document')
      await dependsOnBlockData.locator('.rs__control').click()

      await saveDocAndAssert(page)
    })

    test('ensure block fields with filter options have access to block-level data', async () => {
      const {
        blockGroupTextField,
        blockTextField,
        dependsOnBlockData,
        dependsOnDocData,
        dependsOnSiblingData,
        newBlock,
        topLevelDocTextField,
      } = await setupFilterOptionsTests()

      await assertNetworkRequests(
        page,
        '/admin/collections/lexical-fields',
        async () => {
          await blockTextField.fill('invalid')
        },
        { allowedNumberOfRequests: 2 },
      )

      await dependsOnDocData.locator('.rs__control').click()
      await expect(newBlock.locator('.rs__menu')).toHaveText('No options')
      await dependsOnDocData.locator('.rs__control').click()

      await dependsOnSiblingData.locator('.rs__control').click()
      await expect(newBlock.locator('.rs__menu')).toContainText('Seeded text document')
      await expect(newBlock.locator('.rs__menu')).toContainText('Another text document')
      await dependsOnSiblingData.locator('.rs__control').click()

      await dependsOnBlockData.locator('.rs__control').click()
      await expect(newBlock.locator('.rs__menu')).toHaveText('Text Fieldsinvalid')
      await dependsOnBlockData.locator('.rs__control').click()

      await saveDocAndAssert(page)
    })
  })

  describe('block validation data', () => {
    async function setupValidationTests() {
      const { richTextField } = await navigateToLexicalFields()

      await payload.create({
        collection: 'text-fields',
        data: {
          text: 'invalid',
        },
        depth: 0,
      })

      const lastParagraph = richTextField.locator('p').last()
      await lastParagraph.scrollIntoViewIfNeeded()
      await expect(lastParagraph).toBeVisible()

      await lastParagraph.click()

      await page.keyboard.press('Enter')
      await page.keyboard.press('/')
      await page.keyboard.type('validation')

      // CreateBlock
      const slashMenuPopover = page.locator('#slash-menu .slash-menu-popup')
      await expect(slashMenuPopover).toBeVisible()

      const blockSelectButton = slashMenuPopover.locator('button').first()
      await expect(blockSelectButton).toBeVisible()
      await expect(blockSelectButton).toContainText('Validation Block')
      await blockSelectButton.click()
      await expect(slashMenuPopover).toBeHidden()

      const newBlock = richTextField
        .locator('.lexical-block:not(.lexical-block .lexical-block)')
        .nth(8) // The :not(.lexical-block .lexical-block) makes sure this does not select sub-blocks
      await newBlock.scrollIntoViewIfNeeded()

      await saveDocAndAssert(page)

      const topLevelDocTextField = page.locator('#field-title').first()
      const blockTextField = newBlock.locator('#field-text').first()
      const blockGroupTextField = newBlock.locator('#field-group__groupText').first()

      const dependsOnDocData = newBlock.locator('#field-group__textDependsOnDocData').first()
      const dependsOnSiblingData = newBlock
        .locator('#field-group__textDependsOnSiblingData')
        .first()
      const dependsOnBlockData = newBlock.locator('#field-group__textDependsOnBlockData').first()
      await expect(page.locator('.payload-toast-container .payload-toast-item')).toBeHidden()

      return {
        blockGroupTextField,
        blockTextField,
        dependsOnDocData,
        dependsOnSiblingData,
        dependsOnBlockData,
        topLevelDocTextField,
        newBlock,
      }
    }

    test('ensure block fields with validations have access to document-level data', async () => {
      const { topLevelDocTextField } = await setupValidationTests()

      await topLevelDocTextField.fill('invalid')

      await saveDocAndAssert(page, '#action-save', 'error')

      await assertToastErrors({
        page,
        errors: ['Lexical With Blocks', 'Lexical With Blocks → Group → Text Depends On Doc Data'],
      })

      await expect(page.locator('.payload-toast-container .payload-toast-item')).toBeHidden()

      await assertNetworkRequests(
        page,
        '/admin/collections/lexical-fields',
        async () => {
          await topLevelDocTextField.fill('Rich Text') // Default value
        },
        { allowedNumberOfRequests: 1 },
      )

      await saveDocAndAssert(page)
    })

    test('ensure block fields with validations have access to sibling data', async () => {
      const { blockGroupTextField } = await setupValidationTests()

      await blockGroupTextField.fill('invalid')

      await saveDocAndAssert(page, '#action-save', 'error')
      await assertToastErrors({
        page,
        errors: [
          'Lexical With Blocks',
          'Lexical With Blocks → Group → Text Depends On Sibling Data',
        ],
      })
      await expect(page.locator('.payload-toast-container .payload-toast-item')).toBeHidden()

      await assertNetworkRequests(
        page,
        '/admin/collections/lexical-fields',
        async () => {
          await blockGroupTextField.fill('')
        },
        { allowedNumberOfRequests: 2 },
      )

      await saveDocAndAssert(page)
    })

    test('ensure block fields with validations have access to block-level data', async () => {
      const { blockTextField } = await setupValidationTests()

      await blockTextField.fill('invalid')

      await saveDocAndAssert(page, '#action-save', 'error')
      await assertToastErrors({
        page,
        errors: ['Lexical With Blocks', 'Lexical With Blocks → Group → Text Depends On Block Data'],
      })
      await expect(page.locator('.payload-toast-container .payload-toast-item')).toBeHidden()

      await assertNetworkRequests(
        page,
        '/admin/collections/lexical-fields',
        async () => {
          await blockTextField.fill('')
        },
        { allowedNumberOfRequests: 2 },
      )

      await saveDocAndAssert(page)
    })
  })

  test('ensure async hooks are awaited properly', async () => {
    const { richTextField } = await navigateToLexicalFields()

    const lastParagraph = richTextField.locator('p').last()
    await lastParagraph.scrollIntoViewIfNeeded()
    await expect(lastParagraph).toBeVisible()

    await lastParagraph.click()

    await page.keyboard.press('Enter')
    await page.keyboard.press('/')
    await page.keyboard.type('Async')

    // CreateBlock
    const slashMenuPopover = page.locator('#slash-menu .slash-menu-popup')
    await expect(slashMenuPopover).toBeVisible()

    const asyncHooksBlockSelectButton = slashMenuPopover.locator('button').first()
    await expect(asyncHooksBlockSelectButton).toBeVisible()
    await expect(asyncHooksBlockSelectButton).toContainText('Async Hooks Block')
    await asyncHooksBlockSelectButton.click()
    await expect(slashMenuPopover).toBeHidden()

    const newBlock = richTextField
      .locator('.lexical-block:not(.lexical-block .lexical-block)')
      .nth(8) // The :not(.lexical-block .lexical-block) makes sure this does not select sub-blocks
    await newBlock.scrollIntoViewIfNeeded()
    await newBlock.locator('#field-test1').fill('text1')
    await newBlock.locator('#field-test2').fill('text2')

    await wait(300)

    // save document and assert
    await saveDocAndAssert(page)
    await wait(300)

    // Reload page
    await page.reload()

    await expect(newBlock.locator('#field-test1')).toHaveValue('TEXT1')
    await expect(newBlock.locator('#field-test2')).toHaveValue('TEXT2')
  })

  describe('nested lexical editor in block', () => {
    test('should type and save typed text', async () => {
      const { richTextField } = await navigateToLexicalFields()

      const lexicalBlock = richTextField.locator('.lexical-block').nth(2) // third: "Block Node, with RichText Field, with Relationship Node"
      await lexicalBlock.scrollIntoViewIfNeeded()
      await expect(lexicalBlock).toBeVisible()

      // Find span in contentEditable with text "Some text below relationship node"
      const spanInSubEditor = lexicalBlock
        .locator('span')
        .getByText('Some text below relationship node 1')
        .first()
      await expect(spanInSubEditor).toBeVisible()
      await spanInSubEditor.click() // Use click, because focus does not work

      // Now go to the END of the span
      for (let i = 0; i < 18; i++) {
        await page.keyboard.press('ArrowRight')
      }
      await page.keyboard.type(' inserted text')

      await expect(spanInSubEditor).toHaveText('Some text below relationship node 1 inserted text')
      await saveDocAndAssert(page)

      await assertLexicalDoc({
        fn: ({ lexicalWithBlocks }) => {
          const blockNode: SerializedBlockNode = lexicalWithBlocks.root
            .children[4] as SerializedBlockNode

          const textNodeInBlockNodeRichText =
            blockNode.fields.richTextField.root.children[1].children[0]

          expect(textNodeInBlockNodeRichText.text).toBe(
            'Some text below relationship node 1 inserted text',
          )
        },
      })
    })
    test('should be able to bold text using floating select toolbar', async () => {
      // Reproduces https://github.com/payloadcms/payload/issues/4025
      const { richTextField } = await navigateToLexicalFields()

      const lexicalBlock = richTextField.locator('.lexical-block').nth(2) // third: "Block Node, with RichText Field, with Relationship Node"
      await lexicalBlock.scrollIntoViewIfNeeded()
      await expect(lexicalBlock).toBeVisible()

      // Find span in contentEditable with text "Some text below relationship node"
      const spanInSubEditor = lexicalBlock
        .locator('span')
        .getByText('Some text below relationship node 1')
        .first()
      await expect(spanInSubEditor).toBeVisible()
      await spanInSubEditor.click() // Use click, because focus does not work

      // Now go to the END of the span while selecting the text
      for (let i = 0; i < 18; i++) {
        await page.keyboard.press('Shift+ArrowRight')
      }
      // The following text should now be selectedelationship node 1

      const floatingToolbar_formatSection = page.locator('.inline-toolbar-popup__group-format')

      await expect(floatingToolbar_formatSection).toBeVisible()

      await expect(page.locator('.toolbar-popup__button').first()).toBeVisible()

      const boldButton = floatingToolbar_formatSection.locator('.toolbar-popup__button').first()

      await expect(boldButton).toBeVisible()
      await boldButton.click()

      /**
       * Next test section: check if it worked correctly
       */

      const boldText = lexicalBlock
        .locator('.LexicalEditorTheme__paragraph')
        .first()
        .locator('strong')
      await expect(boldText).toBeVisible()
      await expect(boldText).toHaveText('elationship node 1')

      await saveDocAndAssert(page)

      await assertLexicalDoc({
        fn: ({ lexicalWithBlocks }) => {
          const blockNode: SerializedBlockNode = lexicalWithBlocks.root
            .children[4] as SerializedBlockNode
          const paragraphNodeInBlockNodeRichText = blockNode.fields.richTextField.root.children[1]

          expect(paragraphNodeInBlockNodeRichText.children).toHaveLength(2)

          const textNode1: SerializedTextNode = paragraphNodeInBlockNodeRichText.children[0]
          const boldNode: SerializedTextNode = paragraphNodeInBlockNodeRichText.children[1]

          expect(textNode1.text).toBe('Some text below r')
          expect(textNode1.format).toBe(0)

          expect(boldNode.text).toBe('elationship node 1')
          expect(boldNode.format).toBe(1)
        },
      })
    })

    test('should be able to select text, make it an external link and receive the updated link value', async () => {
      // Reproduces https://github.com/payloadcms/payload/issues/4025
      const { richTextField } = await navigateToLexicalFields()

      // Find span in contentEditable with text "Some text below relationship node"
      const spanInEditor = richTextField.locator('span').getByText('Upload Node:').first()
      await expect(spanInEditor).toBeVisible()
      await spanInEditor.click() // Use click, because focus does not work

      await page.keyboard.press('ArrowRight')
      // Now select some text
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press('Shift+ArrowRight')
      }
      // The following text should now be "Node"

      const floatingToolbar = page.locator('.inline-toolbar-popup')

      await expect(floatingToolbar).toBeVisible()

      const linkButton = floatingToolbar.locator('.toolbar-popup__button-link').first()

      await expect(linkButton).toBeVisible()
      await linkButton.click()

      /**
       * In drawer
       */
      const drawerContent = page.locator('.drawer__content').first()
      await expect(drawerContent).toBeVisible()

      const urlField = drawerContent.locator('input#field-url').first()
      await expect(urlField).toBeVisible()
      await expect(urlField).toHaveValue('https://')
      await wait(1000)
      await urlField.fill('https://www.payloadcms.com')
      await expect(urlField).toHaveValue('https://www.payloadcms.com')
      await drawerContent.locator('.form-submit button').click({ delay: 100 })
      await expect(drawerContent).toBeHidden()

      /**
       * check if it worked correctly
       */

      const linkInEditor = richTextField.locator('a.LexicalEditorTheme__link').first()
      await expect(linkInEditor).toBeVisible()
      await expect(linkInEditor).toHaveAttribute('href', 'https://www.payloadcms.com')

      await saveDocAndAssert(page)

      // Check if it persists after saving
      await expect(linkInEditor).toBeVisible()
      await expect(linkInEditor).toHaveAttribute('href', 'https://www.payloadcms.com')

      // Make sure it's being returned from the API as well
      await assertLexicalDoc({
        fn: ({ lexicalWithBlocks }) => {
          expect(
            (
              (lexicalWithBlocks.root.children[0] as SerializedParagraphNode)
                .children[1] as SerializedLinkNode
            ).fields.url,
          ).toBe('https://www.payloadcms.com')
        },
      })
    })

    test('ensure slash menu is not hidden behind other blocks', async () => {
      // This test makes sure there are no z-index issues here
      const { richTextField } = await navigateToLexicalFields()

      const lexicalBlock = richTextField.locator('.lexical-block').nth(2) // third: "Block Node, with RichText Field, with Relationship Node"
      await lexicalBlock.scrollIntoViewIfNeeded()
      await expect(lexicalBlock).toBeVisible()

      // Find span in contentEditable with text "Some text below relationship node"
      const spanInSubEditor = lexicalBlock
        .locator('span')
        .getByText('Some text below relationship node 1')
        .first()
      await expect(spanInSubEditor).toBeVisible()
      await spanInSubEditor.click() // Use click, because focus does not work

      // Now go to the END of the span
      for (let i = 0; i < 18; i++) {
        await page.keyboard.press('ArrowRight')
      }

      // Now scroll down, so that the following slash menu is positioned below the cursor and not above it
      await page.mouse.wheel(0, 600)

      await page.keyboard.press('Enter')
      await page.keyboard.press('/')

      const popover = page.locator('#slash-menu .slash-menu-popup')
      await expect(popover).toBeVisible()

      const popoverBasicGroup = popover
        .locator('.slash-menu-popup__group.slash-menu-popup__group-basic')
        .first() // Second group ("Basic") in popover
      await expect(popoverBasicGroup).toBeVisible()

      // Heading 2 should be the last, most bottom popover button element which should be initially visible, if not hidden by something (e.g. another block)
      const popoverHeading2Button = popoverBasicGroup
        .locator('button.slash-menu-popup__item-heading-2')
        .first()
      await expect(popoverHeading2Button).toBeVisible()

      // scroll slash menu down
      await popoverHeading2Button.hover()
      await page.mouse.wheel(0, 250)

      await expect(async () => {
        // Make sure that, even though it's "visible", it's not actually covered by something else due to z-index issues
        const popoverHeading2ButtonBoundingBox = await popoverHeading2Button.boundingBox()
        expect(popoverHeading2ButtonBoundingBox).not.toBeNull()
        expect(popoverHeading2ButtonBoundingBox).not.toBeUndefined()
        expect(popoverHeading2ButtonBoundingBox?.height).toBeGreaterThan(0)
        expect(popoverHeading2ButtonBoundingBox?.width).toBeGreaterThan(0)

        // Now click the button to see if it actually works. Simulate an actual mouse click instead of using .click()
        // by using page.mouse and the correct coordinates
        // .isVisible() and .click() might work fine EVEN if the slash menu is not actually visible by humans
        // see: https://github.com/microsoft/playwright/issues/9923
        // This is why we use page.mouse.click() here. It's the most effective way of detecting such a z-index issue
        // and usually the only method which works.

        const x = popoverHeading2ButtonBoundingBox?.x ?? 0
        const y = popoverHeading2ButtonBoundingBox?.y ?? 0

        await page.mouse.click(x, y, { button: 'left' })

        await page.keyboard.type('A Heading')

        const newHeadingInSubEditor = lexicalBlock.locator('p ~ h2').getByText('A Heading').first()

        await expect(newHeadingInSubEditor).toBeVisible()
        await expect(newHeadingInSubEditor).toHaveText('A Heading')
      }).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })
    })
    test('should allow adding new blocks to a sub-blocks field, part of a parent lexical blocks field', async () => {
      const { richTextField } = await navigateToLexicalFields()

      const lexicalBlock = richTextField.locator('.lexical-block').nth(3) // third: "Block Node, with Blocks Field, With RichText Field, With Relationship Node"
      await lexicalBlock.scrollIntoViewIfNeeded()
      await expect(lexicalBlock).toBeVisible()

      /**
       * Create new textarea sub-block
       */
      await lexicalBlock.locator('button').getByText('Add Sub Block').click()

      const drawerContent = page.locator('.drawer__content').first()
      await expect(drawerContent).toBeVisible()

      const textAreaAddBlockButton = drawerContent.locator('button').getByText('Text Area').first()
      await expect(textAreaAddBlockButton).toBeVisible()
      await textAreaAddBlockButton.click()

      /**
       * Check if it was created successfully and
       * fill newly created textarea sub-block with text
       */
      const newSubBlock = lexicalBlock.locator('.blocks-field__rows > div').nth(1)
      await expect(newSubBlock).toBeVisible()

      const newContentTextArea = newSubBlock.locator('textarea').first()
      await expect(newContentTextArea).toBeVisible()

      // Type 'Some text in new sub block content textArea'
      await newContentTextArea.click()
      // Even though we could use newContentTextArea.fill, it's still nice to use .type here,
      // as this also tests that this text area still receives keyboard input events properly. It's more realistic.
      await page.keyboard.type('text123')
      await expect(newContentTextArea).toHaveText('text123')

      await wait(1000)

      await saveDocAndAssert(page)

      await assertLexicalDoc({
        fn: ({ lexicalWithBlocks }) => {
          const blockNode: SerializedBlockNode = lexicalWithBlocks.root
            .children[5] as SerializedBlockNode

          const subBlocks = blockNode.fields.subBlocksLexical

          expect(subBlocks).toHaveLength(2)

          const createdTextAreaBlock = subBlocks[1]

          expect(createdTextAreaBlock.content).toBe('text123')
        },
      })
    })

    // Big test which tests a bunch of things: Creation of blocks via slash commands, creation of deeply nested sub-lexical-block fields via slash commands, properly populated deeply nested fields within those
    test('ensure creation of a lexical, lexical-field-block, which contains another lexical, lexical-and-upload-field-block, works and that the sub-upload field is properly populated', async () => {
      const { richTextField } = await navigateToLexicalFields()

      const lastParagraph = richTextField.locator('p').last()
      await lastParagraph.scrollIntoViewIfNeeded()
      await expect(lastParagraph).toBeVisible()

      /**
       * Create new sub-block
       */
      // type / to open the slash menu
      await lastParagraph.click()
      await page.keyboard.press('/')
      await page.keyboard.type('Rich')

      // Create Rich Text Block
      const slashMenuPopover = page.locator('#slash-menu .slash-menu-popup')
      await expect(slashMenuPopover).toBeVisible()

      // Click 1. Button and ensure it's the Rich Text block creation button (it should be! Otherwise, sorting wouldn't work)
      const richTextBlockSelectButton = slashMenuPopover.locator('button').first()
      await expect(richTextBlockSelectButton).toBeVisible()
      await expect(richTextBlockSelectButton).toContainText('Rich Text')
      await richTextBlockSelectButton.click()
      await expect(slashMenuPopover).toBeHidden()

      const newRichTextBlock = richTextField
        .locator('.lexical-block:not(.lexical-block .lexical-block)')
        .nth(8) // The :not(.lexical-block .lexical-block) makes sure this does not select sub-blocks
      await newRichTextBlock.scrollIntoViewIfNeeded()
      await expect(newRichTextBlock).toBeVisible()

      // Ensure that sub-editor is empty
      const newRichTextEditorParagraph = newRichTextBlock.locator('p').first()
      await expect(newRichTextEditorParagraph).toBeVisible()
      await expect(newRichTextEditorParagraph).toHaveText('')

      await newRichTextEditorParagraph.click()
      await page.keyboard.press('/')
      await page.keyboard.type('Lexical')
      await expect(slashMenuPopover).toBeVisible()
      // Click 1. Button and ensure it's the Lexical And Upload block creation button (it should be! Otherwise, sorting wouldn't work)
      const lexicalAndUploadBlockSelectButton = slashMenuPopover.locator('button').first()
      await expect(lexicalAndUploadBlockSelectButton).toBeVisible()
      await expect(lexicalAndUploadBlockSelectButton).toContainText('Lexical And Upload')
      await lexicalAndUploadBlockSelectButton.click()
      await expect(slashMenuPopover).toBeHidden()

      // Ensure that sub-editor is created
      const newSubLexicalAndUploadBlock = newRichTextBlock.locator('.lexical-block').first()
      await newSubLexicalAndUploadBlock.scrollIntoViewIfNeeded()
      await expect(newSubLexicalAndUploadBlock).toBeVisible()

      // Type in newSubLexicalAndUploadBlock
      const paragraphInSubEditor = newSubLexicalAndUploadBlock.locator('p').first()
      await expect(paragraphInSubEditor).toBeVisible()
      await paragraphInSubEditor.click()
      await page.keyboard.type('Some subText')

      // Upload something
      await expect(async () => {
        const chooseExistingUploadButton = newSubLexicalAndUploadBlock
          .locator('.upload__listToggler')
          .first()
        await wait(300)
        await expect(chooseExistingUploadButton).toBeVisible()
        await wait(300)
        await chooseExistingUploadButton.click()
        await wait(500) // wait for drawer form state to initialize (it's a flake)
        const uploadListDrawer = page.locator('dialog[id^=list-drawer_1_]').first() // IDs starting with list-drawer_1_ (there's some other symbol after the underscore)
        await expect(uploadListDrawer).toBeVisible()
        await wait(300)

        // find button which has a span with text "payload.jpg" and click it in playwright
        const uploadButton = uploadListDrawer.locator('button').getByText('payload.jpg').first()
        await expect(uploadButton).toBeVisible()
        await wait(300)
        await uploadButton.click()
        await wait(300)
        await expect(uploadListDrawer).toBeHidden()
        // Check if the upload is there
        await expect(
          newSubLexicalAndUploadBlock.locator(
            '.field-type.upload .upload-relationship-details__filename a',
          ),
        ).toHaveText('payload.jpg')
      }).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })

      await wait(300)

      // save document and assert
      await saveDocAndAssert(page)
      await wait(300)

      await expect(
        newSubLexicalAndUploadBlock.locator(
          '.field-type.upload .upload-relationship-details__filename a',
        ),
      ).toHaveText('payload.jpg')
      await expect(paragraphInSubEditor).toHaveText('Some subText')
      await wait(300)

      // reload page and assert again
      await page.reload()
      await wait(300)
      await newSubLexicalAndUploadBlock.scrollIntoViewIfNeeded()
      await expect(newSubLexicalAndUploadBlock).toBeVisible()
      await newSubLexicalAndUploadBlock
        .locator('.field-type.upload .upload-relationship-details__filename a')
        .scrollIntoViewIfNeeded()
      await expect(
        newSubLexicalAndUploadBlock.locator(
          '.field-type.upload .upload-relationship-details__filename a',
        ),
      ).toBeVisible()

      await expect(
        newSubLexicalAndUploadBlock.locator(
          '.field-type.upload .upload-relationship-details__filename a',
        ),
      ).toHaveText('payload.jpg')
      await expect(paragraphInSubEditor).toHaveText('Some subText')

      // Check if the API result is populated correctly - Depth 0
      await assertLexicalDoc({
        fn: async ({ lexicalWithBlocks }) => {
          const uploadDoc: Upload = (
            await payload.find({
              collection: 'uploads',
              depth: 0,
              overrideAccess: true,
              where: {
                filename: {
                  equals: 'payload.jpg',
                },
              },
            })
          ).docs[0] as never

          const richTextBlock: SerializedBlockNode = lexicalWithBlocks.root
            .children[13] as SerializedBlockNode
          const subRichTextBlock: SerializedBlockNode = richTextBlock.fields.richTextField.root
            .children[1] as SerializedBlockNode // index 0 and 2 are paragraphs created by default around the block node when a new block is added via slash command

          const subSubRichTextField = subRichTextBlock.fields.subRichTextField
          const subSubUploadField = subRichTextBlock.fields.subUploadField

          expect(subSubRichTextField.root.children[0].children[0].text).toBe('Some subText')
          expect(subSubUploadField).toBe(uploadDoc.id)
        },
      })

      // Check if the API result is populated correctly - Depth 1
      await assertLexicalDoc({
        depth: 1,
        fn: async ({ lexicalWithBlocks }) => {
          const uploadDoc: Upload = (
            await payload.find({
              collection: 'uploads',
              depth: 0,
              overrideAccess: true,
              where: {
                filename: {
                  equals: 'payload.jpg',
                },
              },
            })
          ).docs[0] as never

          const richTextBlock2: SerializedBlockNode = lexicalWithBlocks.root
            .children[13] as SerializedBlockNode
          const subRichTextBlock2: SerializedBlockNode = richTextBlock2.fields.richTextField.root
            .children[1] as SerializedBlockNode // index 0 and 2 are paragraphs created by default around the block node when a new block is added via slash command

          const subSubRichTextField2 = subRichTextBlock2.fields.subRichTextField
          const subSubUploadField2 = subRichTextBlock2.fields.subUploadField

          expect(subSubRichTextField2.root.children[0].children[0].text).toBe('Some subText')
          expect(subSubUploadField2.id).toBe(uploadDoc.id)
          expect(subSubUploadField2.filename).toBe(uploadDoc.filename)
        },
      })
    })

    test('should allow changing values of two different radio button blocks independently', async () => {
      // This test ensures that https://github.com/payloadcms/payload/issues/3911 does not happen again

      const { richTextField } = await navigateToLexicalFields()
      await wait(1000) // Wait for form state requests to be done, to reduce flakes

      const radioButtonBlock1 = richTextField.locator('.lexical-block').nth(5)

      const radioButtonBlock2 = richTextField.locator('.lexical-block').nth(6)
      await radioButtonBlock2.scrollIntoViewIfNeeded()
      await expect(radioButtonBlock1).toBeVisible()
      await expect(radioButtonBlock2).toBeVisible()

      // Click radio button option2 of radioButtonBlock1
      await radioButtonBlock1
        .locator('.radio-input:has-text("Option 2")')
        .first() // This already is an input for some reason
        .click()

      // Ensure radio button option1 of radioButtonBlock2 (the default option) is still selected
      await expect(
        radioButtonBlock2.locator('.radio-input:has-text("Option 1")').first(),
      ).toHaveClass(/radio-input--is-selected/)

      // Click radio button option3 of radioButtonBlock2
      await radioButtonBlock2
        .locator('.radio-input:has-text("Option 3")')
        .first() // This already is an input for some reason
        .click()

      // Ensure previously clicked option2 of radioButtonBlock1 is still selected
      await expect(
        radioButtonBlock1.locator('.radio-input:has-text("Option 2")').first(),
      ).toHaveClass(/radio-input--is-selected/)

      /**
       * Now save and check the actual data. radio button block 1 should have option2 selected and radio button block 2 should have option3 selected
       */

      await saveDocAndAssert(page)

      await assertLexicalDoc({
        fn: ({ lexicalWithBlocks }) => {
          const radio1: SerializedBlockNode = lexicalWithBlocks.root
            .children[8] as SerializedBlockNode
          const radio2: SerializedBlockNode = lexicalWithBlocks.root
            .children[9] as SerializedBlockNode

          expect(radio1.fields.radioButtons).toBe('option2')
          expect(radio2.fields.radioButtons).toBe('option3')
        },
      })
    })

    test('should not lose focus when writing in nested editor', async () => {
      // https://github.com/payloadcms/payload/issues/4108
      // Steps:
      // 1. Focus parent editor
      // 2. Focus nested editor and write something
      // 3. In the issue, after writing one character, the cursor focuses back into the parent editor

      const { richTextField } = await navigateToLexicalFields()

      /**
       * 1. Focus parent editor
       */
      const parentEditorParagraph = richTextField.locator('span').getByText('Upload Node:').first()
      await expect(parentEditorParagraph).toBeVisible()

      await parentEditorParagraph.click() // Click works better than focus

      const blockWithRichTextEditor = richTextField.locator('.lexical-block').nth(2) // third: "Block Node, with Blocks Field, With RichText Field, With Relationship Node"
      await blockWithRichTextEditor.scrollIntoViewIfNeeded()
      await expect(blockWithRichTextEditor).toBeVisible()

      /**
       * 2. Focus nested editor and write something
       */
      const nestedEditorParagraph = blockWithRichTextEditor
        .locator('span')
        .getByText('Some text below relationship node 1')
        .first()
      await expect(nestedEditorParagraph).toBeVisible()
      await nestedEditorParagraph.click() // Click works better than focus

      // Now go to the END of the paragraph
      for (let i = 0; i < 18; i++) {
        await page.keyboard.press('ArrowRight')
      }
      await page.keyboard.type('2345')

      /**
       * 3. In the issue, after writing one character, the cursor focuses back into the parent editor and writes the text there.
       * This checks that this does not happen, and that it writes the text in the correct position (so, in nestedEditorParagraph, NOT in parentEditorParagraph)
       */
      await expect(nestedEditorParagraph).toHaveText('Some text below relationship node 12345')
    })

    const shouldRespectRowRemovalTest = async () => {
      const richTextField = page.locator('.rich-text-lexical').nth(2) // second
      await richTextField.scrollIntoViewIfNeeded()
      await expect(richTextField).toBeVisible()
      await expect(richTextField.locator('.lexical-block')).toHaveCount(10)
      await wait(1000) // Wait for form state requests to be done, to reduce flakes

      const conditionalArrayBlock = richTextField.locator('.lexical-block').nth(7)

      await conditionalArrayBlock.scrollIntoViewIfNeeded()
      await expect(conditionalArrayBlock).toBeVisible()

      const selectField = conditionalArrayBlock.locator('.react-select').first()
      await selectField.click()

      const selectFieldMenu = selectField.locator('.rs__menu').first()
      await selectFieldMenu.locator('.rs__option').nth(1).click() // Select "2" (2 columns / array fields)

      // Make sure the OTHER arrays aren't visible, as their conditions are not fulfilled. Catches a bug where they might not be hidden fully
      await expect(
        conditionalArrayBlock.locator('.btn__label:has-text("Add Columns1")'),
      ).toBeHidden()
      await expect(conditionalArrayBlock.locator('.row-label:has-text("Column 01")')).toBeHidden()
      await expect(
        conditionalArrayBlock.locator('.btn__label:has-text("Add Columns3")'),
      ).toBeHidden()
      await expect(conditionalArrayBlock.locator('.row-label:has-text("Column 03")')).toBeHidden()

      await conditionalArrayBlock.locator('.btn__label:has-text("Add Columns2")').first().click()
      await expect(
        conditionalArrayBlock.locator('.array-field__draggable-rows #columns2-row-0'),
      ).toBeVisible()

      await conditionalArrayBlock.locator('.btn__label:has-text("Add Columns2")').first().click()
      await expect(
        conditionalArrayBlock.locator('.array-field__draggable-rows #columns2-row-1'),
      ).toBeVisible()

      await conditionalArrayBlock
        .locator('.array-field__draggable-rows > div:nth-child(2) .field-type.text input')
        .fill('second input')

      await saveDocAndAssert(page)

      await expect(page.locator('.payload-toast-container')).not.toContainText(
        'Please correct invalid fields.',
      )
    }

    // eslint-disable-next-line playwright/expect-expect
    test('should respect row removal in nested array field', async () => {
      await navigateToLexicalFields()
      await shouldRespectRowRemovalTest()
    })

    test('should respect row removal in nested array field after navigating away from lexical document, then navigating back', async () => {
      // This test verifies an issue where a lexical editor with blocks disappears when navigating away from the lexical document, then navigating back, without a hard refresh
      const { richTextField } = await navigateToLexicalFields()
      await wait(1000) // Wait for form state requests to be done, to reduce flakes

      const conditionalArrayBlock = richTextField.locator('.lexical-block').nth(7)

      await conditionalArrayBlock.scrollIntoViewIfNeeded()
      await expect(conditionalArrayBlock).toBeVisible()

      // navigate to list view
      await page.locator('.step-nav a').nth(1).click()

      await page.waitForURL(/^.*\/lexical-fields(\?.*)?$/)

      // Click on lexical document in list view (navigateToLexicalFields is client-side navigation which is what we need to reproduce the issue here)
      await navigateToLexicalFields(false)

      await shouldRespectRowRemovalTest()
    })

    test('ensure pre-seeded uploads node is visible', async () => {
      // Due to issues with the relationships condition, we had issues with that not being visible. Checking for visibility ensures there is no breakage there again
      const { richTextField } = await navigateToLexicalFields()

      const uploadBlock = richTextField.locator('.ContentEditable__root > div').first() // Check for the first div, as we wanna make sure it's the first div in the editor (1. node is a paragraph, second node is a div which is the upload node)
      await uploadBlock.scrollIntoViewIfNeeded()
      await expect(uploadBlock).toBeVisible()

      await expect(uploadBlock.locator('.lexical-upload__doc-drawer-toggler strong')).toHaveText(
        'payload.jpg',
      )
    })

    test('should respect required error state in deeply nested text field', async () => {
      const { richTextField } = await navigateToLexicalFields()

      await wait(300)

      const conditionalArrayBlock = richTextField.locator('.lexical-block').nth(7)
      await wait(300)

      await conditionalArrayBlock.scrollIntoViewIfNeeded()
      await wait(300)

      await expect(conditionalArrayBlock).toBeVisible()
      await wait(300)

      const addSubArrayButton = conditionalArrayBlock.locator(
        '.btn__label:has-text("Add Sub Array")',
      )
      await addSubArrayButton.scrollIntoViewIfNeeded()
      await wait(300)

      await expect(addSubArrayButton).toBeVisible()
      await wait(300)

      await addSubArrayButton.first().click()
      await wait(300)

      await page.click('#action-save', { delay: 100 })

      await expect(page.locator('.payload-toast-container')).toContainText(
        'The following fields are invalid',
      )
      await wait(300)

      const requiredTooltip = conditionalArrayBlock
        .locator('.tooltip-content:has-text("This field is required.")')
        .first()
      await wait(300)

      await requiredTooltip.scrollIntoViewIfNeeded()
      // Check if error is shown next to field
      await wait(300)

      await expect(requiredTooltip).toBeInViewport() // toBeVisible() doesn't work for some reason
    })

    // Reproduces https://github.com/payloadcms/payload/issues/6631
    test('ensure tabs field within lexical block correctly loads and saves data', async () => {
      const { richTextField } = await navigateToLexicalFields()

      const tabsBlock = richTextField.locator('.lexical-block').nth(8)
      await wait(300)

      await tabsBlock.scrollIntoViewIfNeeded()
      await wait(300)

      await expect(tabsBlock).toBeVisible()
      await wait(300)

      const tab1Text1Field = tabsBlock.locator('#field-tab1__text1')
      await tab1Text1Field.scrollIntoViewIfNeeded()
      await expect(tab1Text1Field).toBeVisible()
      await expect(tab1Text1Field).toHaveValue('Some text1')
      // change text to 'Some text1 changed'
      await tab1Text1Field.fill('Some text1 changed')

      const tab1Button = tabsBlock.locator('.tabs-field__tab-button', { hasText: 'Tab1' })
      const tab2Button = tabsBlock.locator('.tabs-field__tab-button', { hasText: 'Tab2' })

      await tab2Button.click()
      await wait(300)

      const tab2Text1Field = tabsBlock.locator('#field-tab2__text2')
      await tab2Text1Field.scrollIntoViewIfNeeded()
      await expect(tab2Text1Field).toBeVisible()
      await expect(tab2Text1Field).toHaveValue('Some text2')
      // change text to 'Some text2 changed'
      await tab2Text1Field.fill('Some text2 changed')
      await wait(300)

      await saveDocAndAssert(page)
      await wait(300)
      await tabsBlock.scrollIntoViewIfNeeded()
      await wait(300)
      await expect(tabsBlock).toBeVisible()
      await wait(300)

      await tab1Button.click()
      await expect(tab1Text1Field).toHaveValue('Some text1 changed')
      await tab2Button.click()
      await expect(tab2Text1Field).toHaveValue('Some text2 changed')

      await assertLexicalDoc({
        fn: ({ lexicalWithBlocks }) => {
          const tabBlockData: SerializedBlockNode = lexicalWithBlocks.root
            .children[13] as SerializedBlockNode

          expect(tabBlockData.fields.tab1.text1).toBe('Some text1 changed')
          expect(tabBlockData.fields.tab2.text2).toBe('Some text2 changed')
        },
      })
    })

    test('dynamic height of code editor is correctly calculated', async () => {
      await navigateToLexicalFields()

      const codeEditor = page.locator('.code-editor')

      await codeEditor.scrollIntoViewIfNeeded()
      await expect(codeEditor).toBeVisible()

      const height = (await codeEditor.boundingBox())?.height

      await expect(() => {
        expect(height).toBe(56)
      }).toPass()
      await codeEditor.click()
      await page.keyboard.press('Enter')

      const height2 = (await codeEditor.boundingBox())?.height
      await expect(() => {
        expect(height2).toBe(74)
      }).toPass()
    })

    test('ensure nested lexical field displays field label and description', async () => {
      // Previously, we had the issue that nested lexical fields did not display the field label and description, as
      // their client field configs were generated incorrectly on the server.
      await page.goto('http://localhost:3000/admin/collections/LexicalInBlock?limit=10')
      await page.locator('.cell-id a').first().click()
      await page.waitForURL(`**/collections/LexicalInBlock/**`)

      await expect(
        page.locator('.lexical-block-blockInLexical .render-fields label.field-label'),
      ).toHaveText('My Label*')
      await expect(
        page.locator('.lexical-block-blockInLexical .render-fields .required'),
      ).toHaveText('*')
      await expect(
        page.locator(
          '.lexical-block-blockInLexical .render-fields .field-description-lexicalInBlock',
        ),
      ).toHaveText('Some Description')
    })

    test('ensure individual inline blocks in lexical editor within a block have initial state on initial load', async () => {
      await page.goto('http://localhost:3000/admin/collections/LexicalInBlock?limit=10')

      await assertNetworkRequests(
        page,
        '/collections/LexicalInBlock/',
        async () => {
          await page.locator('.cell-id a').first().click()
          await page.waitForURL(`**/collections/LexicalInBlock/**`)

          await expect(
            page.locator('.inline-block:has-text("Inline Block In Lexical")'),
          ).toHaveCount(20)
        },
        { allowedNumberOfRequests: 1 },
      )
    })
  })

  describe('inline blocks', () => {
    test('ensure inline blocks can be created and its values can be mutated from outside their form', async () => {
      const { richTextField } = await navigateToLexicalFields()
      const { inlineBlockDrawer, saveDrawer } = await createInlineBlock({
        name: 'My Inline Block',
        richTextField,
      })

      // Click on react select in drawer, select 'value1'
      await inlineBlockDrawer.locator('.rs__control .value-container').first().click()
      await wait(500)
      await expect(inlineBlockDrawer.locator('.rs__option').first()).toBeVisible()
      await expect(inlineBlockDrawer.locator('.rs__option').first()).toContainText('value1')
      await inlineBlockDrawer.locator('.rs__option').first().click()

      const { inlineBlock, openEditDrawer } = await saveDrawer()
      // Save document
      await saveDocAndAssert(page)
      // Check if the API result is correct
      await assertLexicalDoc({
        fn: ({ lexicalWithBlocks }) => {
          const firstParagraph: SerializedParagraphNode = lexicalWithBlocks.root
            .children[0] as SerializedParagraphNode
          const inlineBlock: SerializedInlineBlockNode = firstParagraph
            .children[1] as SerializedInlineBlockNode

          expect(inlineBlock.fields.key).toBe('value1')
        },
      })

      const { editDrawer } = await openEditDrawer()

      // Expect react select to have value 'value1'
      await expect(editDrawer.locator('.rs__control .value-container')).toHaveText('value1')
      // Close drawer by pressing escape
      await page.keyboard.press('Escape')
      await expect(editDrawer).toBeHidden()

      // Select inline block again
      await inlineBlock.click()
      await wait(500)

      // Press toolbar-popup__button-setKeyToDebug button of richtext editor
      const toolbarPopup = richTextField.locator('.toolbar-popup__button-setKeyToDebug').first()
      // Click it
      await toolbarPopup.click()
      await wait(1000)

      // Open edit drawer, check if value is now value2, then exit
      await inlineBlock.click()
      await openEditDrawer()
      await expect(editDrawer.locator('.rs__control .value-container')).toHaveText('value2')
      await page.keyboard.press('Escape')
      await expect(editDrawer).toBeHidden()

      // Save and check api result
      await saveDocAndAssert(page)
      await assertLexicalDoc({
        fn: ({ lexicalWithBlocks }) => {
          const firstParagraph: SerializedParagraphNode = lexicalWithBlocks.root
            .children[0] as SerializedParagraphNode
          const inlineBlock: SerializedInlineBlockNode = firstParagraph
            .children[1] as SerializedInlineBlockNode

          expect(inlineBlock.fields.key).toBe('value2')
        },
      })
    })

    test('ensure upload fields within inline blocks store and populate correctly', async () => {
      const { richTextField } = await navigateToLexicalFields()
      const { inlineBlockDrawer, saveDrawer } = await createInlineBlock({
        name: 'Avatar Group',
        richTextField,
      })

      // Click button that says Add Avatar
      await inlineBlockDrawer.getByRole('button', { name: 'Add Avatar' }).click()
      await inlineBlockDrawer.getByRole('button', { name: 'Choose from existing' }).click()
      const uploadDrawer = page.locator('dialog[id^=list-drawer_2_]').first()
      await uploadDrawer.getByText('payload.jpg').click()
      await expect(inlineBlockDrawer.locator('.upload-relationship-details__filename')).toHaveText(
        'payload.jpg',
      )
      await saveDrawer()
      await saveDocAndAssert(page)

      await assertLexicalDoc({
        fn: async ({ lexicalWithBlocks }) => {
          const firstParagraph: SerializedParagraphNode = lexicalWithBlocks.root
            .children[0] as SerializedParagraphNode
          const inlineBlock: SerializedInlineBlockNode = firstParagraph
            .children[1] as SerializedInlineBlockNode

          const uploadDoc: Upload = (
            await payload.find({
              collection: 'uploads',
              depth: 0,
              overrideAccess: true,
              where: {
                filename: {
                  equals: 'payload.jpg',
                },
              },
            })
          ).docs[0] as never
          expect(inlineBlock.fields.blockType).toBe('AvatarGroup')
          expect(inlineBlock.fields.avatars?.length).toBe(1)
          expect(inlineBlock.fields.avatars[0].image).toBe(uploadDoc.id)
        },
      })

      await assertLexicalDoc({
        depth: 1,
        fn: async ({ lexicalWithBlocks }) => {
          const firstParagraph: SerializedParagraphNode = lexicalWithBlocks.root
            .children[0] as SerializedParagraphNode
          const inlineBlock: SerializedInlineBlockNode = firstParagraph
            .children[1] as SerializedInlineBlockNode

          const uploadDoc: Upload = (
            await payload.find({
              collection: 'uploads',
              depth: 0,
              overrideAccess: true,
              where: {
                filename: {
                  equals: 'payload.jpg',
                },
              },
            })
          ).docs[0] as never
          expect(inlineBlock.fields.blockType).toBe('AvatarGroup')
          expect(inlineBlock.fields.avatars?.length).toBe(1)
          expect(inlineBlock.fields.avatars[0].image.id).toBe(uploadDoc.id)
          expect(inlineBlock.fields.avatars[0].image.text).toBe(uploadDoc.text)
        },
      })
    })
  })
})
