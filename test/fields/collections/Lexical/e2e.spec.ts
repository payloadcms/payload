import type { SerializedBlockNode, SerializedLinkNode } from '@payloadcms/richtext-lexical'
import type { Page } from '@playwright/test'
import type { PayloadTestSDK } from 'helpers/sdk/index.js'
import type { SerializedEditorState, SerializedParagraphNode, SerializedTextNode } from 'lexical'

import { expect, test } from '@playwright/test'
import { initPayloadE2ENoConfig } from 'helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from 'helpers/reInit.js'
import path from 'path'
import { wait } from 'payload/utilities'
import { fileURLToPath } from 'url'

import type { Config, LexicalField, Upload } from '../../payload-types.js'

import { initPageConsoleErrorCatch, saveDocAndAssert } from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { RESTClient } from '../../../helpers/rest.js'
import { POLL_TOPASS_TIMEOUT } from '../../../playwright.config.js'
import { lexicalFieldsSlug } from '../../slugs.js'
import { lexicalDocData } from './data.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let client: RESTClient
let page: Page
let serverURL: string

/**
 * Client-side navigation to the lexical editor from list view
 */
async function navigateToLexicalFields(
  navigateToListView: boolean = true,
  localized: boolean = false,
) {
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
}

describe('lexical', () => {
  beforeAll(async ({ browser }) => {
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig({ dirname }))

    const context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)
  })
  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'fieldsLexicalTest',
      uploadsDir: path.resolve(dirname, '../Upload/uploads'),
    })

    if (client) {
      await client.logout()
    }
    client = new RESTClient(null, { defaultSlug: 'rich-text-fields', serverURL })
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
    await expect(page.locator('.leave-without-saving__content').first()).toBeHidden()
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
    await expect(page.locator('.leave-without-saving__content').first()).toBeHidden()
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

    await expect(async () => {
      const lexicalDoc: LexicalField = (
        await payload.find({
          collection: lexicalFieldsSlug,
          depth: 0,
          overrideAccess: true,
          where: {
            title: {
              equals: lexicalDocData.title,
            },
          },
        })
      ).docs[0] as never

      const lexicalField: SerializedEditorState = lexicalDoc.lexicalWithBlocks
      const firstParagraphTextNode: SerializedTextNode = (
        lexicalField.root.children[0] as SerializedParagraphNode
      ).children[0] as SerializedTextNode

      expect(firstParagraphTextNode.text).toBe('Upload Node:moretext')
    }).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
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

    await expect(async () => {
      const lexicalDoc: LexicalField = (
        await payload.find({
          collection: lexicalFieldsSlug,
          depth: 0,
          overrideAccess: true,
          where: {
            title: {
              equals: lexicalDocData.title,
            },
          },
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
    }).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
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

    await expect
      .poll(async () => await contentEditable.textContent(), { timeout: POLL_TOPASS_TIMEOUT })
      .not.toBe('some text')
    await expect
      .poll(async () => await contentEditable.textContent(), { timeout: POLL_TOPASS_TIMEOUT })
      .toBe('')
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

    await expect(async () => {
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
    }).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

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

      await expect(async () => {
        const lexicalDoc: LexicalField = (
          await payload.find({
            collection: lexicalFieldsSlug,
            depth: 0,
            overrideAccess: true,
            where: {
              title: {
                equals: lexicalDocData.title,
              },
            },
          })
        ).docs[0] as never

        const lexicalField: SerializedEditorState = lexicalDoc.lexicalWithBlocks

        const blockNode: SerializedBlockNode = lexicalField.root.children[4] as SerializedBlockNode

        const textNodeInBlockNodeRichText =
          blockNode.fields.richTextField.root.children[1].children[0]

        expect(textNodeInBlockNodeRichText.text).toBe(
          'Some text below relationship node 1 inserted text',
        )
      }).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })
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
      // The following text should now be selectedelationship node 1

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

      await expect(async () => {
        const lexicalDoc: LexicalField = (
          await payload.find({
            collection: lexicalFieldsSlug,
            depth: 0,
            overrideAccess: true,
            where: {
              title: {
                equals: lexicalDocData.title,
              },
            },
          })
        ).docs[0] as never

        const lexicalField: SerializedEditorState = lexicalDoc.lexicalWithBlocks
        const blockNode: SerializedBlockNode = lexicalField.root.children[4] as SerializedBlockNode
        const paragraphNodeInBlockNodeRichText = blockNode.fields.richTextField.root.children[1]

        expect(paragraphNodeInBlockNodeRichText.children).toHaveLength(2)

        const textNode1: SerializedTextNode = paragraphNodeInBlockNodeRichText.children[0]
        const boldNode: SerializedTextNode = paragraphNodeInBlockNodeRichText.children[1]

        expect(textNode1.text).toBe('Some text below r')
        expect(textNode1.format).toBe(0)

        expect(boldNode.text).toBe('elationship node 1')
        expect(boldNode.format).toBe(1)
      }).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })
    })

    test('should be able to select text, make it an external link and receive the updated link value', async () => {
      // Reproduces https://github.com/payloadcms/payload/issues/4025
      await navigateToLexicalFields()
      const richTextField = page.locator('.rich-text-lexical').nth(1) // second
      await richTextField.scrollIntoViewIfNeeded()
      await expect(richTextField).toBeVisible()

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

      const floatingToolbar = page.locator('.floating-select-toolbar-popup')

      await expect(floatingToolbar).toBeVisible()

      const linkButton = floatingToolbar
        .locator('.floating-select-toolbar-popup__button-link')
        .first()

      await expect(linkButton).toBeVisible()
      await linkButton.click()

      /**
       * In drawer
       */
      const drawerContent = page.locator('.drawer__content').first()
      await expect(drawerContent).toBeVisible()

      const urlField = drawerContent.locator('input#field-fields__url').first()
      await expect(urlField).toBeVisible()
      // Fill with https://www.payloadcms.com
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
      await expect(async () => {
        const lexicalDoc: LexicalField = (
          await payload.find({
            collection: lexicalFieldsSlug,
            depth: 0,
            overrideAccess: true,
            where: {
              title: {
                equals: lexicalDocData.title,
              },
            },
          })
        ).docs[0] as never

        const lexicalField: SerializedEditorState = lexicalDoc.lexicalWithBlocks

        expect(
          (
            (lexicalField.root.children[0] as SerializedParagraphNode)
              .children[1] as SerializedLinkNode
          ).fields.url,
        ).toBe('https://www.payloadcms.com')
      }).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })
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

      await expect(async () => {
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
      }).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })
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

      await expect(async () => {
        /**
         * Using the local API, check if the data was saved correctly and
         * can be retrieved correctly
         */

        const lexicalDoc: LexicalField = (
          await payload.find({
            collection: lexicalFieldsSlug,
            depth: 0,
            overrideAccess: true,
            where: {
              title: {
                equals: lexicalDocData.title,
              },
            },
          })
        ).docs[0] as never

        const lexicalField: SerializedEditorState = lexicalDoc.lexicalWithBlocks
        const blockNode: SerializedBlockNode = lexicalField.root.children[5] as SerializedBlockNode
        const subBlocks = blockNode.fields.subBlocks

        expect(subBlocks).toHaveLength(2)

        const createdTextAreaBlock = subBlocks[1]

        expect(createdTextAreaBlock.content).toBe('text123')
      }).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })
    })

    // Big test which tests a bunch of things: Creation of blocks via slash commands, creation of deeply nested sub-lexical-block fields via slash commands, properly populated deeply nested fields within those
    test('ensure creation of a lexical, lexical-field-block, which contains another lexical, lexical-and-upload-field-block, works and that the sub-upload field is properly populated', async () => {
      await navigateToLexicalFields()
      const richTextField = page.locator('.rich-text-lexical').nth(1) // second
      await richTextField.scrollIntoViewIfNeeded()
      await expect(richTextField).toBeVisible()

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
        .last() // The :not(.lexical-block .lexical-block) makes sure this does not select sub-blocks
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
      const chooseExistingUploadButton = newSubLexicalAndUploadBlock
        .locator('.upload__toggler.list-drawer__toggler')
        .first()
      await expect(chooseExistingUploadButton).toBeVisible()
      await chooseExistingUploadButton.click()
      await wait(500) // wait for drawer form state to initialize (it's a flake)
      const uploadListDrawer = page.locator('dialog[id^=list-drawer_1_]').first() // IDs starting with list-drawer_1_ (there's some other symbol after the underscore)
      await expect(uploadListDrawer).toBeVisible()
      // find button which has a span with text "payload.jpg" and click it in playwright
      const uploadButton = uploadListDrawer.locator('button').getByText('payload.jpg').first()
      await expect(uploadButton).toBeVisible()
      await uploadButton.click()
      await expect(uploadListDrawer).toBeHidden()
      // Check if the upload is there
      await expect(
        newSubLexicalAndUploadBlock.locator('.field-type.upload .file-meta__url a'),
      ).toHaveText('payload.jpg')
      // save document and assert
      await saveDocAndAssert(page)
      await expect(
        newSubLexicalAndUploadBlock.locator('.field-type.upload .file-meta__url a'),
      ).toHaveText('payload.jpg')
      await expect(paragraphInSubEditor).toHaveText('Some subText')

      // reload page and assert again
      await page.reload()
      await expect(
        newSubLexicalAndUploadBlock.locator('.field-type.upload .file-meta__url a'),
      ).toHaveText('payload.jpg')
      await expect(paragraphInSubEditor).toHaveText('Some subText')

      // Check if the API result is populated correctly - Depth 0
      await expect(async () => {
        const lexicalDoc: LexicalField = (
          await payload.find({
            collection: lexicalFieldsSlug,
            depth: 0,
            overrideAccess: true,
            where: {
              title: {
                equals: lexicalDocData.title,
              },
            },
          })
        ).docs[0] as never

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

        const lexicalField: SerializedEditorState = lexicalDoc.lexicalWithBlocks
        const richTextBlock: SerializedBlockNode = lexicalField.root
          .children[12] as SerializedBlockNode
        const subRichTextBlock: SerializedBlockNode = richTextBlock.fields.richTextField.root
          .children[1] as SerializedBlockNode // index 0 and 2 are paragraphs created by default around the block node when a new block is added via slash command

        const subSubRichTextField = subRichTextBlock.fields.subRichTextField
        const subSubUploadField = subRichTextBlock.fields.subUploadField

        expect(subSubRichTextField.root.children[0].children[0].text).toBe('Some subText')
        expect(subSubUploadField).toBe(uploadDoc.id)
      }).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })

      // Check if the API result is populated correctly - Depth 1
      await expect(async () => {
        // Now with depth 1
        const lexicalDocDepth1: LexicalField = (
          await payload.find({
            collection: lexicalFieldsSlug,
            depth: 1,
            overrideAccess: true,
            where: {
              title: {
                equals: lexicalDocData.title,
              },
            },
          })
        ).docs[0] as never

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

        const lexicalField2: SerializedEditorState = lexicalDocDepth1.lexicalWithBlocks
        const richTextBlock2: SerializedBlockNode = lexicalField2.root
          .children[12] as SerializedBlockNode
        const subRichTextBlock2: SerializedBlockNode = richTextBlock2.fields.richTextField.root
          .children[1] as SerializedBlockNode // index 0 and 2 are paragraphs created by default around the block node when a new block is added via slash command

        const subSubRichTextField2 = subRichTextBlock2.fields.subRichTextField
        const subSubUploadField2 = subRichTextBlock2.fields.subUploadField

        expect(subSubRichTextField2.root.children[0].children[0].text).toBe('Some subText')
        expect(subSubUploadField2.id).toBe(uploadDoc.id)
        expect(subSubUploadField2.filename).toBe(uploadDoc.filename)
      }).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })
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

      await expect(async () => {
        const lexicalDoc: LexicalField = (
          await payload.find({
            collection: lexicalFieldsSlug,
            depth: 0,
            overrideAccess: true,
            where: {
              title: {
                equals: lexicalDocData.title,
              },
            },
          })
        ).docs[0] as never

        const lexicalField: SerializedEditorState = lexicalDoc.lexicalWithBlocks
        const radio1: SerializedBlockNode = lexicalField.root.children[8] as SerializedBlockNode
        const radio2: SerializedBlockNode = lexicalField.root.children[9] as SerializedBlockNode

        expect(radio1.fields.radioButtons).toBe('option2')
        expect(radio2.fields.radioButtons).toBe('option3')
      }).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })
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

    const shouldRespectRowRemovalTest = async () => {
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

      await expect(page.locator('.Toastify')).not.toContainText('Please correct invalid fields.')
    }

    // eslint-disable-next-line playwright/expect-expect
    test('should respect row removal in nested array field', async () => {
      await navigateToLexicalFields()
      await shouldRespectRowRemovalTest()
    })

    test('should respect row removal in nested array field after navigating away from lexical document, then navigating back', async () => {
      // This test verifies an issue where a lexical editor with blocks disappears when navigating away from the lexical document, then navigating back, without a hard refresh
      await navigateToLexicalFields()

      // Wait for lexical to be loaded up fully
      const richTextField = page.locator('.rich-text-lexical').nth(1) // second
      await richTextField.scrollIntoViewIfNeeded()
      await expect(richTextField).toBeVisible()

      const conditionalArrayBlock = richTextField.locator('.lexical-block').nth(7)

      await conditionalArrayBlock.scrollIntoViewIfNeeded()
      await expect(conditionalArrayBlock).toBeVisible()

      // navigate to list view
      await page.locator('.step-nav a').nth(1).click()
      await page.waitForURL('**/lexical-fields?limit=10')

      // Click on lexical document in list view (navigateToLexicalFields is client-side navigation which is what we need to reproduce the issue here)
      await navigateToLexicalFields(false)

      await shouldRespectRowRemovalTest()
    })

    test('ensure pre-seeded uploads node is visible', async () => {
      // Due to issues with the relationships condition, we had issues with that not being visible. Checking for visibility ensures there is no breakage there again
      await navigateToLexicalFields()
      const richTextField = page.locator('.rich-text-lexical').nth(1) // second
      await richTextField.scrollIntoViewIfNeeded()
      await expect(richTextField).toBeVisible()

      const uploadBlock = richTextField.locator('.ContentEditable__root > div').first() // Check for the first div, as we wanna make sure it's the first div in the editor (1. node is a paragraph, second node is a div which is the upload node)
      await uploadBlock.scrollIntoViewIfNeeded()
      await expect(uploadBlock).toBeVisible()

      await expect(uploadBlock.locator('.lexical-upload__doc-drawer-toggler strong')).toHaveText(
        'payload.jpg',
      )
    })

    test('should respect required error state in deeply nested text field', async () => {
      await navigateToLexicalFields()
      const richTextField = page.locator('.rich-text-lexical').nth(1) // second
      await richTextField.scrollIntoViewIfNeeded()
      await expect(richTextField).toBeVisible()

      const conditionalArrayBlock = richTextField.locator('.lexical-block').nth(7)

      await conditionalArrayBlock.scrollIntoViewIfNeeded()
      await expect(conditionalArrayBlock).toBeVisible()

      await conditionalArrayBlock.locator('.btn__label:has-text("Add Sub Array")').first().click()

      await page.click('#action-save', { delay: 100 })
      await expect(page.locator('.Toastify')).toContainText('The following field is invalid')

      const requiredTooltip = conditionalArrayBlock
        .locator('.tooltip-content:has-text("This field is required.")')
        .first()
      await requiredTooltip.scrollIntoViewIfNeeded()
      // Check if error is shown next to field
      await expect(requiredTooltip).toBeInViewport() // toBeVisible() doesn't work for some reason
    })
  })

  describe('localization', () => {
    test.skip('ensure simple localized lexical field works', async () => {
      await navigateToLexicalFields(true, true)
    })
  })
})
