import type { Page } from '@playwright/test'
import type { SerializedEditorState, SerializedParagraphNode, SerializedTextNode } from 'lexical'

import { expect, test } from '@playwright/test'

import type { SerializedBlockNode } from '../../packages/richtext-lexical/src'
import type { LexicalField } from './payload-types'

import payload from '../../packages/payload/src'
import { initPageConsoleErrorCatch, saveDocAndAssert } from '../helpers'
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    initPageConsoleErrorCatch(page)
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

  test('should not warn about unsaved changes when navigating to lexical editor with blocks node and then leaving the page after making a change and saving', async () => {
    // Relevant issue: https://github.com/payloadcms/payload/issues/4115
    await navigateToLexicalFields()
    const thirdBlock = page.locator('.rich-text-lexical').nth(1).locator('.lexical-block').nth(2)
    await thirdBlock.scrollIntoViewIfNeeded()
    await expect(thirdBlock).toBeVisible()

    const spanInBlock = thirdBlock
      .locator('span')
      .getByText('Some text below relationship node 1')
      .first()
    await spanInBlock.scrollIntoViewIfNeeded()
    await expect(spanInBlock).toBeVisible()

    await spanInBlock.click() // Click works better than focus

    await page.keyboard.type('moretext')
    const newSpanInBlock = thirdBlock
      .locator('span')
      .getByText('Some text below rmoretextelationship node 1')
      .first()
    await expect(newSpanInBlock).toBeVisible()
    await expect(newSpanInBlock).toHaveText('Some text below rmoretextelationship node 1')

    // Save
    await saveDocAndAssert(page)
    await expect(newSpanInBlock).toHaveText('Some text below rmoretextelationship node 1')

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

    const lexicalDoc: LexicalField = (
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
    const firstParagraphTextNode: SerializedTextNode = (
      lexicalField.root.children[0] as SerializedParagraphNode
    ).children[0] as SerializedTextNode

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

    const lexicalDoc: LexicalField = (
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
    const firstParagraph: SerializedParagraphNode = lexicalField.root
      .children[0] as SerializedParagraphNode
    expect(firstParagraph.children).toHaveLength(3)

    const textNode1: SerializedTextNode = firstParagraph.children[0] as SerializedTextNode
    const boldNode: SerializedTextNode = firstParagraph.children[1] as SerializedTextNode
    const textNode2: SerializedTextNode = firstParagraph.children[2] as SerializedTextNode

    expect(textNode1.text).toBe('Upload ')
    expect(textNode1.format).toBe(0)

    expect(boldNode.text).toBe('Node')
    expect(boldNode.format).toBe(1)

    expect(textNode2.text).toBe(':')
    expect(textNode2.format).toBe(0)
  })

  test('Make sure highly specific issue does not occur when two richText fields share the same editor prop', async () => {
    // Reproduces https://github.com/payloadcms/payload/issues/4282
    const url: AdminUrlUtil = new AdminUrlUtil(serverURL, 'tabsWithRichText')
    await page.goto(url.global('tabsWithRichText'))
    const richTextField = page.locator('.rich-text-lexical').first()
    await richTextField.scrollIntoViewIfNeeded()
    await expect(richTextField).toBeVisible()
    await richTextField.click() // Use click, because focus does not work
    await page.keyboard.type('some text')

    await page.locator('.tabs-field__tabs').first().getByText('en tab2').first().click()
    await richTextField.scrollIntoViewIfNeeded()
    await expect(richTextField).toBeVisible()

    const contentEditable = richTextField.locator('.ContentEditable__root').first()
    const textContent = await contentEditable.textContent()

    expect(textContent).not.toBe('some text')
    expect(textContent).toBe('')
  })

  test('ensure blocks content is not hidden behind components outside of the editor', async () => {
    // This test expects there to be a TreeView below the editor

    // This test makes sure there are no z-index issues here
    await navigateToLexicalFields()
    const richTextField = page.locator('.rich-text-lexical').first()
    await richTextField.scrollIntoViewIfNeeded()
    await expect(richTextField).toBeVisible()

    // Find span in contentEditable with text "Some text below relationship node"
    const contentEditable = richTextField.locator('.ContentEditable__root').first()
    await expect(contentEditable).toBeVisible()
    await contentEditable.click() // Use click, because focus does not work

    await page.keyboard.press('/')

    const slashMenuPopover = page.locator('#slash-menu .slash-menu-popup')
    await expect(slashMenuPopover).toBeVisible()

    // Heading 2 should be the last, most bottom popover button element which should be initially visible, if not hidden by something (e.g. another block)
    const popoverSelectButton = slashMenuPopover
      .locator('button.slash-menu-popup__item-block-select')
      .first()
    await expect(popoverSelectButton).toBeVisible()
    await popoverSelectButton.click()

    const newSelectBlock = richTextField.locator('.lexical-block').first()
    await newSelectBlock.scrollIntoViewIfNeeded()
    await expect(newSelectBlock).toBeVisible()

    await page.mouse.wheel(0, 300) // Scroll down so that the future react-select menu popover is displayed below and not above

    const reactSelect = newSelectBlock.locator('.rs__control').first()
    await reactSelect.click()

    const popover = page.locator('.rs__menu').first()
    const popoverOption3 = popover.locator('.rs__option').nth(2)

    const popoverOption3BoundingBox = await popoverOption3.boundingBox()
    expect(popoverOption3BoundingBox).not.toBeNull()
    expect(popoverOption3BoundingBox).not.toBeUndefined()
    expect(popoverOption3BoundingBox.height).toBeGreaterThan(0)
    expect(popoverOption3BoundingBox.width).toBeGreaterThan(0)

    // Now click the button to see if it actually works. Simulate an actual mouse click instead of using .click()
    // by using page.mouse and the correct coordinates
    // .isVisible() and .click() might work fine EVEN if the slash menu is not actually visible by humans
    // see: https://github.com/microsoft/playwright/issues/9923
    // This is why we use page.mouse.click() here. It's the most effective way of detecting such a z-index issue
    // and usually the only method which works.

    const x = popoverOption3BoundingBox.x
    const y = popoverOption3BoundingBox.y

    await page.mouse.click(x, y, { button: 'left' })

    await expect(reactSelect.locator('.rs__value-container').first()).toHaveText('Option 3')
  })

  describe('nested lexical editor in block', () => {
    test('should type and save typed text', async () => {
      await navigateToLexicalFields()
      const richTextField = page.locator('.rich-text-lexical').nth(1) // second
      await richTextField.scrollIntoViewIfNeeded()
      await expect(richTextField).toBeVisible()

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

      const lexicalDoc: LexicalField = (
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
      const blockNode: SerializedBlockNode = lexicalField.root.children[4] as SerializedBlockNode
      const textNodeInBlockNodeRichText = blockNode.fields.richText.root.children[1].children[0]

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

      const lexicalDoc: LexicalField = (
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
      const blockNode: SerializedBlockNode = lexicalField.root.children[4] as SerializedBlockNode
      const paragraphNodeInBlockNodeRichText = blockNode.fields.richText.root.children[1]

      expect(paragraphNodeInBlockNodeRichText.children).toHaveLength(2)

      const textNode1: SerializedTextNode = paragraphNodeInBlockNodeRichText.children[0]
      const boldNode: SerializedTextNode = paragraphNodeInBlockNodeRichText.children[1]

      expect(textNode1.text).toBe('Some text below r')
      expect(textNode1.format).toBe(0)

      expect(boldNode.text).toBe('elationship node 1')
      expect(boldNode.format).toBe(1)
    })
    test('ensure slash menu is not hidden behind other blocks', async () => {
      // This test makes sure there are no z-index issues here
      await navigateToLexicalFields()
      const richTextField = page.locator('.rich-text-lexical').nth(1) // second
      await richTextField.scrollIntoViewIfNeeded()
      await expect(richTextField).toBeVisible()

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

      // Make sure that, even though it's "visible", it's not actually covered by something else due to z-index issues
      const popoverHeading2ButtonBoundingBox = await popoverHeading2Button.boundingBox()
      expect(popoverHeading2ButtonBoundingBox).not.toBeNull()
      expect(popoverHeading2ButtonBoundingBox).not.toBeUndefined()
      expect(popoverHeading2ButtonBoundingBox.height).toBeGreaterThan(0)
      expect(popoverHeading2ButtonBoundingBox.width).toBeGreaterThan(0)

      // Now click the button to see if it actually works. Simulate an actual mouse click instead of using .click()
      // by using page.mouse and the correct coordinates
      // .isVisible() and .click() might work fine EVEN if the slash menu is not actually visible by humans
      // see: https://github.com/microsoft/playwright/issues/9923
      // This is why we use page.mouse.click() here. It's the most effective way of detecting such a z-index issue
      // and usually the only method which works.

      const x = popoverHeading2ButtonBoundingBox.x
      const y = popoverHeading2ButtonBoundingBox.y

      await page.mouse.click(x, y, { button: 'left' })

      await page.keyboard.type('A Heading')

      const newHeadingInSubEditor = lexicalBlock.locator('p ~ h2').getByText('A Heading').first()

      await expect(newHeadingInSubEditor).toBeVisible()
      await expect(newHeadingInSubEditor).toHaveText('A Heading')
    })
    test('should allow adding new blocks to a sub-blocks field, part of a parent lexical blocks field', async () => {
      await navigateToLexicalFields()
      const richTextField = page.locator('.rich-text-lexical').nth(1) // second
      await richTextField.scrollIntoViewIfNeeded()
      await expect(richTextField).toBeVisible()

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

      await saveDocAndAssert(page)

      /**
       * Using the local API, check if the data was saved correctly and
       * can be retrieved correctly
       */

      const lexicalDoc: LexicalField = (
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
      const blockNode: SerializedBlockNode = lexicalField.root.children[5] as SerializedBlockNode
      const subBlocks = blockNode.fields.subBlocks

      expect(subBlocks).toHaveLength(2)

      const createdTextAreaBlock = subBlocks[1]

      expect(createdTextAreaBlock.content).toBe('text123')
    })

    test('should allow changing values of two different radio button blocks independently', async () => {
      // This test ensures that https://github.com/payloadcms/payload/issues/3911 does not happen again

      await navigateToLexicalFields()
      const richTextField = page.locator('.rich-text-lexical').nth(1) // second
      await richTextField.scrollIntoViewIfNeeded()
      await expect(richTextField).toBeVisible()

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
      ).toBeChecked()

      // Click radio button option3 of radioButtonBlock2
      await radioButtonBlock2
        .locator('.radio-input:has-text("Option 3")')
        .first() // This already is an input for some reason
        .click()

      // Ensure previously clicked option2 of radioButtonBlock1 is still selected
      await expect(
        radioButtonBlock1.locator('.radio-input:has-text("Option 2")').first(),
      ).toBeChecked()

      /**
       * Now save and check the actual data. radio button block 1 should have option2 selected and radio button block 2 should have option3 selected
       */

      await saveDocAndAssert(page)

      const lexicalDoc: LexicalField = (
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
      const radio1: SerializedBlockNode = lexicalField.root.children[8] as SerializedBlockNode
      const radio2: SerializedBlockNode = lexicalField.root.children[9] as SerializedBlockNode

      expect(radio1.fields.radioButtons).toBe('option2')
      expect(radio2.fields.radioButtons).toBe('option3')
    })

    test('should not lose focus when writing in nested editor', async () => {
      // https://github.com/payloadcms/payload/issues/4108
      // Steps:
      // 1. Focus parent editor
      // 2. Focus nested editor and write something
      // 3. In the issue, after writing one character, the cursor focuses back into the parent editor

      await navigateToLexicalFields()
      const richTextField = page.locator('.rich-text-lexical').nth(1) // second
      await richTextField.scrollIntoViewIfNeeded()
      await expect(richTextField).toBeVisible()

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

    test('should respect row removal in nested array field', async () => {
      await navigateToLexicalFields()
      const richTextField = page.locator('.rich-text-lexical').nth(1) // second
      await richTextField.scrollIntoViewIfNeeded()
      await expect(richTextField).toBeVisible()

      const conditionalArrayBlock = richTextField.locator('.lexical-block').nth(7)

      await conditionalArrayBlock.scrollIntoViewIfNeeded()
      await expect(conditionalArrayBlock).toBeVisible()

      const selectField = conditionalArrayBlock.locator('.react-select').first()
      await selectField.click()

      const selectFieldMenu = selectField.locator('.rs__menu').first()
      await selectFieldMenu.locator('.rs__option').nth(1).click() // Select "2" (2 columns / array fields)

      await conditionalArrayBlock.locator('.btn__label:has-text("Add Columns2")').first().click()
      await conditionalArrayBlock.locator('.btn__label:has-text("Add Columns2")').first().click()

      await conditionalArrayBlock
        .locator('.array-field__draggable-rows > div:nth-child(2) .input-wrapper input')
        .fill('second input')

      await saveDocAndAssert(page)

      await expect(page.locator('.Toastify')).not.toContainText('Please correct invalid fields.')
    })
  })
})
