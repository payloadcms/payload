import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import type { SerializedBlockNode } from '../../packages/richtext-lexical/src'
import type { RichTextField } from './payload-types'

import payload from '../../packages/payload/src'
import { saveDocAndAssert } from '../helpers'
import { AdminUrlUtil } from '../helpers/adminUrlUtil'
import { initPayloadE2E } from '../helpers/configHelpers'
import { RESTClient } from '../helpers/rest'
import { lexicalDocData } from './collections/Lexical/data'
import { clearAndSeedEverything } from './seed'
import { lexicalFieldsSlug } from './slugs'

const { beforeAll, describe, beforeEach } = test

let client: RESTClient
let page: Page
let serverURL: string

async function navigateToRichTextFields() {
  const url: AdminUrlUtil = new AdminUrlUtil(serverURL, 'rich-text-fields')
  await page.goto(url.list)
  await page.locator('.row-1 .cell-title a').click()
}
async function navigateToLexicalFields() {
  const url: AdminUrlUtil = new AdminUrlUtil(serverURL, 'lexical-fields')
  await page.goto(url.list)
  await page.locator('.row-1 .cell-title a').click()
}

describe('lexical', () => {
  beforeAll(async ({ browser }) => {
    const config = await initPayloadE2E(__dirname)
    serverURL = config.serverURL
    client = new RESTClient(null, { serverURL, defaultSlug: 'rich-text-fields' })
    await client.login()

    const context = await browser.newContext()
    page = await context.newPage()
  })
  beforeEach(async () => {
    await clearAndSeedEverything(payload)
    await client.logout()
    client = new RESTClient(null, { serverURL, defaultSlug: 'rich-text-fields' })
    await client.login()
  })

  test('should not warn about unsaved changes when navigating to lexical editor with blocks node and then leaving the page without actually changing anything', async () => {
    // This used to be an issue in the past, due to the node.setFields function in the blocks node being called unnecessarily when it's initialized after opening the document
    // Other than the annoying unsaved changed prompt, this can also cause unnecessary auto-saves, when drafts & autosave is enabled

    await navigateToLexicalFields()
    await expect(
      page.locator('.rich-text-lexical').nth(1).locator('.lexical-block').first(),
    ).toBeVisible()

    // Navigate to some different page, away from the current document
    await page.locator('.app-header__step-nav').first().locator('a').first().click()

    // Make sure .leave-without-saving__content (the "Leave without saving") is not visible
    await expect(page.locator('.leave-without-saving__content').first()).not.toBeVisible()
  })

  test('should type and save typed text', async () => {
    await navigateToLexicalFields()
    const richTextField = page.locator('.rich-text-lexical').nth(1) // second
    await richTextField.scrollIntoViewIfNeeded()
    await expect(richTextField).toBeVisible()

    const spanInEditor = richTextField.locator('span').getByText('Upload Node:').first()
    await expect(spanInEditor).toBeVisible()

    await spanInEditor.click() // Click works better than focus
    // Now go to the END of the span
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('ArrowRight')
    }

    await page.keyboard.type('moretext')
    await expect(spanInEditor).toHaveText('Upload Node:moretext')

    await saveDocAndAssert(page)

    const lexicalDoc: RichTextField = (
      await payload.find({
        collection: lexicalFieldsSlug,
        where: {
          title: {
            equals: lexicalDocData.title,
          },
        },
        depth: 0,
      })
    ).docs[0] as never

    const lexicalField: SerializedEditorState = lexicalDoc.lexicalWithBlocks
    const firstParagraphTextNode: SerializedTextNode = lexicalField.root.children[0].children[0]

    expect(firstParagraphTextNode.text).toBe('Upload Node:moretext')
  })
  test('should be able to bold text using floating select toolbar', async () => {
    await navigateToLexicalFields()
    const richTextField = page.locator('.rich-text-lexical').nth(1) // second
    await richTextField.scrollIntoViewIfNeeded()
    await expect(richTextField).toBeVisible()

    const spanInEditor = richTextField.locator('span').getByText('Upload Node:').first()
    await expect(spanInEditor).toBeVisible()

    await spanInEditor.click() // Click works better than focus
    await page.keyboard.press('ArrowRight')

    // Now select the text 'Node' (the .click() makes it click in the middle of the span)
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Shift+ArrowRight')
    }
    // The following text should now be selected: Node

    const floatingToolbar_formatSection = page.locator(
      '.floating-select-toolbar-popup__section-format',
    )

    await expect(floatingToolbar_formatSection).toBeVisible()

    await expect(page.locator('.floating-select-toolbar-popup__button').first()).toBeVisible()

    const boldButton = floatingToolbar_formatSection
      .locator('.floating-select-toolbar-popup__button')
      .first()

    await expect(boldButton).toBeVisible()
    await boldButton.click()

    /**
     * Next test section: check if it worked correctly
     */

    const boldText = richTextField
      .locator('.LexicalEditorTheme__paragraph')
      .first()
      .locator('strong')
    await expect(boldText).toBeVisible()
    await expect(boldText).toHaveText('Node')

    await saveDocAndAssert(page)

    const lexicalDoc: RichTextField = (
      await payload.find({
        collection: lexicalFieldsSlug,
        where: {
          title: {
            equals: lexicalDocData.title,
          },
        },
        depth: 0,
      })
    ).docs[0] as never

    const lexicalField: SerializedEditorState = lexicalDoc.lexicalWithBlocks
    const firstParagraph: SerializeParagrapbNode = lexicalField.root.children[0]
    expect(firstParagraph.children).toHaveLength(3)

    const textNode1: SerializedTextNode = firstParagraph.children[0]
    const boldNode: SerializedTextNode = firstParagraph.children[1]
    const textNode2: SerializedTextNode = firstParagraph.children[2]

    expect(textNode1.text).toBe('Upload ')
    expect(textNode1.format).toBe(0)

    expect(boldNode.text).toBe('Node')
    expect(boldNode.format).toBe(1)

    expect(textNode2.text).toBe(':')
    expect(textNode2.format).toBe(0)
  })

  describe('nested lexical editor in block', () => {
    test('should type and save typed text', async () => {
      await navigateToLexicalFields()
      const richTextField = page.locator('.rich-text-lexical').nth(1) // second
      await richTextField.scrollIntoViewIfNeeded()
      await expect(richTextField).toBeVisible()

      const lexicalBlock = richTextField.locator('.lexical-block').nth(1) // second
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

      const lexicalDoc: RichTextField = (
        await payload.find({
          collection: lexicalFieldsSlug,
          where: {
            title: {
              equals: lexicalDocData.title,
            },
          },
          depth: 0,
        })
      ).docs[0] as never

      const lexicalField: SerializedEditorState = lexicalDoc.lexicalWithBlocks
      const blockNode: SerializedBlockNode = lexicalField.root.children[3]
      const textNodeInBlockNodeRichText =
        blockNode.fields.data.richText.root.children[1].children[0]

      expect(textNodeInBlockNodeRichText.text).toBe(
        'Some text below relationship node 1 inserted text',
      )
    })
    test('should be able to bold text using floating select toolbar', async () => {
      // Reproduces https://github.com/payloadcms/payload/issues/4025
      await navigateToLexicalFields()
      const richTextField = page.locator('.rich-text-lexical').nth(1) // second
      await richTextField.scrollIntoViewIfNeeded()
      await expect(richTextField).toBeVisible()

      const lexicalBlock = richTextField.locator('.lexical-block').nth(1) // second
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
      // The following text should now be selected: elationship node 1

      const floatingToolbar_formatSection = page.locator(
        '.floating-select-toolbar-popup__section-format',
      )

      await expect(floatingToolbar_formatSection).toBeVisible()

      await expect(page.locator('.floating-select-toolbar-popup__button').first()).toBeVisible()

      const boldButton = floatingToolbar_formatSection
        .locator('.floating-select-toolbar-popup__button')
        .first()

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

      const lexicalDoc: RichTextField = (
        await payload.find({
          collection: lexicalFieldsSlug,
          where: {
            title: {
              equals: lexicalDocData.title,
            },
          },
          depth: 0,
        })
      ).docs[0] as never

      const lexicalField: SerializedEditorState = lexicalDoc.lexicalWithBlocks
      const blockNode: SerializedBlockNode = lexicalField.root.children[3]
      const paragraphNodeInBlockNodeRichText = blockNode.fields.data.richText.root.children[1]

      expect(paragraphNodeInBlockNodeRichText.children).toHaveLength(2)

      const textNode1: SerializedTextNode = paragraphNodeInBlockNodeRichText.children[0]
      const boldNode: SerializedTextNode = paragraphNodeInBlockNodeRichText.children[1]

      expect(textNode1.text).toBe('Some text below r')
      expect(textNode1.format).toBe(0)

      expect(boldNode.text).toBe('elationship node 1')
      expect(boldNode.format).toBe(1)
    })
  })
})
