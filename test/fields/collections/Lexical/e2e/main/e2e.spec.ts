import type { SerializedLinkNode, SerializedUploadNode } from '@payloadcms/richtext-lexical'
import type { BrowserContext, Page } from '@playwright/test'
import type { SerializedEditorState, SerializedParagraphNode, SerializedTextNode } from 'lexical'

import { expect, test } from '@playwright/test'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../../../helpers/sdk/index.js'
import type { Config, LexicalField } from '../../../../payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../../../../../helpers.js'
import { AdminUrlUtil } from '../../../../../helpers/adminUrlUtil.js'
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

describe('lexicalMain', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig({ dirname }))

    context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)
    await reInitializeDB({
      serverURL,
      snapshotKey: 'fieldsLexicalMainTest',
      uploadsDir: path.resolve(dirname, './collections/Upload/uploads'),
    })
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
      snapshotKey: 'fieldsLexicalMainTest',
      uploadsDir: [
        path.resolve(dirname, './collections/Upload/uploads'),
        path.resolve(dirname, './collections/Upload2/uploads2'),
      ],
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
      page.locator('.rich-text-lexical').nth(2).locator('.lexical-block').first(),
    ).toBeVisible()

    // Navigate to some different page, away from the current document
    await page.locator('.app-header__step-nav').first().locator('a').first().click()

    // Make sure .leave-without-saving__content (the "Leave without saving") is not visible
    await expect(page.locator('.leave-without-saving__content').first()).toBeHidden()
  })

  test('should not warn about unsaved changes when navigating to lexical editor with blocks node and then leaving the page after making a change and saving', async () => {
    // Relevant issue: https://github.com/payloadcms/payload/issues/4115
    await navigateToLexicalFields()
    const thirdBlock = page.locator('.rich-text-lexical').nth(2).locator('.lexical-block').nth(2)
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
    const richTextField = page.locator('.rich-text-lexical').nth(2) // second
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
    const richTextField = page.locator('.rich-text-lexical').nth(2) // second
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

    const floatingToolbar_formatSection = page.locator('.inline-toolbar-popup__group-format')

    await expect(floatingToolbar_formatSection).toBeVisible()

    await expect(page.locator('.toolbar-popup__button').first()).toBeVisible()

    const boldButton = floatingToolbar_formatSection.locator('.toolbar-popup__button').first()

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
    const richTextField = page.locator('.rich-text-lexical').nth(1)
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

  // This reproduces an issue where if you create an upload node, the document drawer opens, you select a collection other than the default one, create a NEW upload document and save, it throws a lexical error
  test('ensure creation of new upload document within upload node works', async () => {
    await navigateToLexicalFields()
    const richTextField = page.locator('.rich-text-lexical').nth(2) // second
    await richTextField.scrollIntoViewIfNeeded()
    await expect(richTextField).toBeVisible()

    const lastParagraph = richTextField.locator('p').last()
    await lastParagraph.scrollIntoViewIfNeeded()
    await expect(lastParagraph).toBeVisible()

    /**
     * Create new upload node
     */
    // type / to open the slash menu
    await lastParagraph.click()
    await page.keyboard.press('/')
    await page.keyboard.type('Upload')

    // Create Upload node
    const slashMenuPopover = page.locator('#slash-menu .slash-menu-popup')
    await expect(slashMenuPopover).toBeVisible()

    const uploadSelectButton = slashMenuPopover.locator('button').nth(1)
    await expect(uploadSelectButton).toBeVisible()
    await expect(uploadSelectButton).toContainText('Upload')
    await uploadSelectButton.click()
    await expect(slashMenuPopover).toBeHidden()

    await wait(500) // wait for drawer form state to initialize (it's a flake)
    const uploadListDrawer = page.locator('dialog[id^=list-drawer_1_]').first() // IDs starting with list-drawer_1_ (there's some other symbol after the underscore)
    await expect(uploadListDrawer).toBeVisible()
    await wait(500)

    await uploadListDrawer.locator('.rs__control .value-container').first().click()
    await wait(500)
    await expect(uploadListDrawer.locator('.rs__option').nth(1)).toBeVisible()
    await expect(uploadListDrawer.locator('.rs__option').nth(1)).toContainText('Upload 2')
    await uploadListDrawer.locator('.rs__option').nth(1).click()

    // wait till the text appears in uploadListDrawer: "No Uploads 2 found. Either no Uploads 2 exist yet or none match the filters you've specified above."
    await expect(
      uploadListDrawer.getByText(
        "No Uploads 2 found. Either no Uploads 2 exist yet or none match the filters you've specified above.",
      ),
    ).toBeVisible()

    await uploadListDrawer.getByText('Create New').first().click()
    const createUploadDrawer = page.locator('dialog[id^=doc-drawer_uploads2_]').first() // IDs starting with list-drawer_1_ (there's some other symbol after the underscore)
    await expect(createUploadDrawer).toBeVisible()
    await wait(500)

    const input = createUploadDrawer.locator('.file-field__upload input[type="file"]').first()
    await expect(input).toBeAttached()

    await input.setInputFiles(path.resolve(dirname, './collections/Upload/payload.jpg'))
    await expect(createUploadDrawer.locator('.file-field .file-field__filename')).toHaveValue(
      'payload.jpg',
    )
    await wait(500)
    await createUploadDrawer.getByText('Save').first().click()
    await expect(createUploadDrawer).toBeHidden()
    await expect(uploadListDrawer).toBeHidden()
    await wait(500)
    await saveDocAndAssert(page)

    // second one should be the newly created one
    const secondUploadNode = richTextField.locator('.lexical-upload').nth(1)
    await secondUploadNode.scrollIntoViewIfNeeded()
    await expect(secondUploadNode).toBeVisible()

    await expect(secondUploadNode.locator('.lexical-upload__bottomRow')).toContainText(
      'payload.jpg',
    )
    await expect(secondUploadNode.locator('.lexical-upload__collectionLabel')).toContainText(
      'Upload 2',
    )
  })

  // This reproduces https://github.com/payloadcms/payload/issues/7128
  test('ensure newly created upload node has fields, saves them, and loads them correctly', async () => {
    await navigateToLexicalFields()
    const richTextField = page.locator('.rich-text-lexical').nth(2) // second
    await richTextField.scrollIntoViewIfNeeded()
    await expect(richTextField).toBeVisible()

    // Wait until there at least 10 blocks visible in that richtext field - thus wait for it to be fully loaded
    await expect(richTextField.locator('.lexical-block')).toHaveCount(10)

    const lastParagraph = richTextField.locator('p').last()
    await lastParagraph.scrollIntoViewIfNeeded()
    await expect(lastParagraph).toBeVisible()

    /**
     * Create new upload node
     */
    // type / to open the slash menu
    await lastParagraph.click()
    await page.keyboard.press('/')
    await page.keyboard.type('Upload')

    // Create Upload node
    const slashMenuPopover = page.locator('#slash-menu .slash-menu-popup')
    await expect(slashMenuPopover).toBeVisible()

    const uploadSelectButton = slashMenuPopover.locator('button').nth(1)
    await expect(uploadSelectButton).toBeVisible()
    await expect(uploadSelectButton).toContainText('Upload')
    await uploadSelectButton.click()
    await expect(slashMenuPopover).toBeHidden()

    await wait(500) // wait for drawer form state to initialize (it's a flake)
    const uploadListDrawer = page.locator('dialog[id^=list-drawer_1_]').first() // IDs starting with list-drawer_1_ (there's some other symbol after the underscore)
    await expect(uploadListDrawer).toBeVisible()
    await wait(500)

    await uploadListDrawer.locator('button').getByText('payload.jpg').first().click()
    await expect(uploadListDrawer).toBeHidden()

    const newUploadNode = richTextField.locator('.lexical-upload').nth(1)
    await newUploadNode.scrollIntoViewIfNeeded()
    await expect(newUploadNode).toBeVisible()

    await expect(newUploadNode.locator('.lexical-upload__bottomRow')).toContainText('payload.jpg')

    // Click on button with class lexical-upload__upload-drawer-toggler
    await newUploadNode.locator('.lexical-upload__upload-drawer-toggler').first().click()

    const uploadExtraFieldsDrawer = page
      .locator('dialog[id^=drawer_1_lexical-upload-drawer-]')
      .first()
    await expect(uploadExtraFieldsDrawer).toBeVisible()
    await wait(500)

    // Expect ContentEditable__root to be visible in the drawer
    await expect(uploadExtraFieldsDrawer.locator('.ContentEditable__root')).toBeVisible()
    // Type "Hello" in the content editable
    await uploadExtraFieldsDrawer.locator('.ContentEditable__root').first().click()
    await page.keyboard.type('Hello')
    // Save
    await uploadExtraFieldsDrawer.locator('button').getByText('Save').first().click()
    await expect(uploadExtraFieldsDrawer).toBeHidden()
    await wait(500)
    await saveDocAndAssert(page)
    // Reload page, open the extra fields drawer again and check if the text is still there
    await page.reload()
    await wait(300)
    const reloadedUploadNode = page
      .locator('.rich-text-lexical')
      .nth(2)
      .locator('.lexical-upload')
      .nth(1)
    await reloadedUploadNode.scrollIntoViewIfNeeded()
    await expect(reloadedUploadNode).toBeVisible()
    await reloadedUploadNode.locator('.lexical-upload__upload-drawer-toggler').first().click()
    const reloadedUploadExtraFieldsDrawer = page
      .locator('dialog[id^=drawer_1_lexical-upload-drawer-]')
      .first()
    await expect(reloadedUploadExtraFieldsDrawer).toBeVisible()
    await wait(500)
    await expect(reloadedUploadExtraFieldsDrawer.locator('.ContentEditable__root')).toHaveText(
      'Hello',
    )
  })

  // https://github.com/payloadcms/payload/issues/7379
  test('enabledCollections and disabledCollections should work with RelationshipFeature', async () => {
    const url: AdminUrlUtil = new AdminUrlUtil(serverURL, 'lexical-relationship-fields')
    await page.goto(url.list)
    const linkToDoc = page.locator('tbody tr:first-child a').first()

    await expect(() => expect(linkToDoc).toBeTruthy()).toPass({ timeout: POLL_TOPASS_TIMEOUT })
    const linkDocHref = await linkToDoc.getAttribute('href')
    await linkToDoc.click()
    await page.waitForURL(`**${linkDocHref}`)
    const richTextField = page.locator('.rich-text-lexical').nth(0)

    const lastParagraph = richTextField.locator('p').last()
    await lastParagraph.scrollIntoViewIfNeeded()
    await expect(lastParagraph).toBeVisible()

    // Create relationship node with slash menu
    await lastParagraph.click()
    await page.keyboard.press('Enter')
    await page.keyboard.press('/')
    await page.keyboard.type('Relationship')
    const slashMenuPopover = page.locator('#slash-menu .slash-menu-popup')
    await expect(slashMenuPopover).toBeVisible()

    const relationshipSelectButton = slashMenuPopover.locator('button').nth(0)
    await expect(relationshipSelectButton).toBeVisible()
    await expect(relationshipSelectButton).toContainText('Relationship')
    await relationshipSelectButton.click()
    await expect(slashMenuPopover).toBeHidden()

    const relationshipListDrawer = page.locator('.list-drawer__header-text')
    await expect(relationshipListDrawer).toHaveText('Array Fields')
  })

  test('ensure navigation to collection that used to cause admin panel freeze due to object references bug is possible', async () => {
    const url: AdminUrlUtil = new AdminUrlUtil(serverURL, 'lexicalObjectReferenceBug')
    await page.goto(url.create)

    await expect(page.locator('.rich-text-lexical').nth(0)).toBeVisible()
    await expect(page.locator('.rich-text-lexical').nth(1)).toBeVisible()
  })

  /**
   * There was a bug where the inline toolbar inside a lexical editor in a drawer was not shown
   */
  test('ensure lexical editor within drawer within relationship within lexical field has fully-functioning inline toolbar', async () => {
    await navigateToLexicalFields()
    const richTextField = page.locator('.rich-text-lexical').first()
    await richTextField.scrollIntoViewIfNeeded()
    await expect(richTextField).toBeVisible()

    const paragraph = richTextField.locator('.LexicalEditorTheme__paragraph').first()
    await paragraph.scrollIntoViewIfNeeded()
    await expect(paragraph).toBeVisible()

    /**
     * Create new relationship node
     */
    // type / to open the slash menu
    await paragraph.click()
    await page.keyboard.press('/')
    await page.keyboard.type('Relationship')

    // Create Relationship node
    const slashMenuPopover = page.locator('#slash-menu .slash-menu-popup')
    await expect(slashMenuPopover).toBeVisible()

    const relationshipSelectButton = slashMenuPopover.locator('button').first()
    await expect(relationshipSelectButton).toBeVisible()
    await expect(relationshipSelectButton).toHaveText('Relationship')
    await relationshipSelectButton.click()
    await expect(slashMenuPopover).toBeHidden()

    await wait(500) // wait for drawer form state to initialize (it's a flake)
    const relationshipListDrawer = page.locator('dialog[id^=list-drawer_1_]').first() // IDs starting with list-drawer_1_ (there's some other symbol after the underscore)
    await expect(relationshipListDrawer).toBeVisible()
    await wait(500)

    await expect(relationshipListDrawer.locator('.rs__single-value')).toHaveText('Lexical Field')

    await relationshipListDrawer.locator('button').getByText('Rich Text').first().click()
    await expect(relationshipListDrawer).toBeHidden()

    const newRelationshipNode = richTextField.locator('.lexical-relationship').first()
    await newRelationshipNode.scrollIntoViewIfNeeded()
    await expect(newRelationshipNode).toBeVisible()

    await newRelationshipNode.locator('.doc-drawer__toggler').first().click()
    await wait(500) // wait for drawer form state to initialize (it's a flake)

    /**
     * Now we are inside the doc drawer containing the richtext field.
     * Let's test if its inline toolbar works
     */
    const docDrawer = page.locator('dialog[id^=doc-drawer_lexical-fields_1_]').first() // IDs starting with list-drawer_1_ (there's some other symbol after the underscore)
    await expect(docDrawer).toBeVisible()
    await wait(500)

    const docRichTextField = docDrawer.locator('.rich-text-lexical').first()
    await docRichTextField.scrollIntoViewIfNeeded()
    await expect(docRichTextField).toBeVisible()

    const docParagraph = docRichTextField.locator('.LexicalEditorTheme__paragraph').first()
    await docParagraph.scrollIntoViewIfNeeded()
    await expect(docParagraph).toBeVisible()
    await docParagraph.click()
    await page.keyboard.type('Some text')
    // Select "text" by pressing shift + arrow left
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Shift+ArrowLeft')
    }
    // Ensure inline toolbar appeared
    const inlineToolbar = docRichTextField.locator('.inline-toolbar-popup')
    await expect(inlineToolbar).toBeVisible()

    const boldButton = inlineToolbar.locator('.toolbar-popup__button-bold')
    await expect(boldButton).toBeVisible()

    // make text bold
    await boldButton.click()

    // Save drawer
    await docDrawer.locator('button').getByText('Save').first().click()
    await expect(docDrawer).toBeHidden()
    await wait(1500) // Ensure doc is saved in the database

    // Do not save the main page, as it will still have the stale, previous data. // TODO: This should eventually be fixed. It's a separate issue than what this test is about though.

    // Check if the text is bold. It's a self-relationship, so no need to follow relationship
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

      const lexicalField: SerializedEditorState = lexicalDoc.lexicalRootEditor
      const firstParagraph: SerializedParagraphNode = lexicalField.root
        .children[0] as SerializedParagraphNode

      expect(firstParagraph.children).toHaveLength(2)

      const textNode: SerializedTextNode = firstParagraph.children[0] as SerializedTextNode
      const boldNode: SerializedTextNode = firstParagraph.children[1] as SerializedTextNode

      expect(textNode.text).toBe('Some ')
      expect(textNode.format).toBe(0)

      expect(boldNode.text).toBe('text')
      expect(boldNode.format).toBe(1)
    }).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  })

  test('creating a link, then clicking in the link drawer, then saving the link, should preserve cursor position and not move cursor to beginning of richtext field', async () => {
    await navigateToLexicalFields()
    const richTextField = page.locator('.rich-text-lexical').first()
    await richTextField.scrollIntoViewIfNeeded()
    await expect(richTextField).toBeVisible()

    const paragraph = richTextField.locator('.LexicalEditorTheme__paragraph').first()
    await paragraph.scrollIntoViewIfNeeded()
    await expect(paragraph).toBeVisible()

    /**
     * Type some text
     */
    await paragraph.click()
    await page.keyboard.type('Some Text')

    await page.keyboard.press('Enter')
    await page.keyboard.type('Hello there')

    // Select "there" by pressing shift + arrow left
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Shift+ArrowLeft')
    }
    // Ensure inline toolbar appeared
    const inlineToolbar = page.locator('.inline-toolbar-popup')
    await expect(inlineToolbar).toBeVisible()

    const linkButton = inlineToolbar.locator('.toolbar-popup__button-link')
    await expect(linkButton).toBeVisible()
    await linkButton.click()

    /**
     * Link Drawer
     */

    const linkDrawer = page.locator('dialog[id^=drawer_1_lexical-rich-text-link-]').first() // IDs starting with drawer_1_lexical-rich-text-link- (there's some other symbol after the underscore)
    await expect(linkDrawer).toBeVisible()
    await wait(500)

    const urlInput = linkDrawer.locator('#field-url').first()
    // Click on the input to focus it
    await urlInput.click()
    // should be https:// value
    await expect(urlInput).toHaveValue('https://')
    // Change it to https://google.com
    await urlInput.fill('https://google.com')

    // Save drawer
    await linkDrawer.locator('button').getByText('Save').first().click()
    await expect(linkDrawer).toBeHidden()
    await wait(1500)

    // The entire link should be selected now => press arrow right to move cursor to the end of the link node before we type
    await page.keyboard.press('ArrowRight')
    // Just keep typing - the cursor should not have moved to the beginning of the richtext field
    await page.keyboard.type(' xxx')

    await saveDocAndAssert(page)

    // Check if the text is bold. It's a self-relationship, so no need to follow relationship
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

      const lexicalField: SerializedEditorState = lexicalDoc.lexicalRootEditor

      const firstParagraph: SerializedParagraphNode = lexicalField.root
        .children[0] as SerializedParagraphNode
      const secondParagraph: SerializedParagraphNode = lexicalField.root
        .children[1] as SerializedParagraphNode

      expect(firstParagraph.children).toHaveLength(1)
      expect((firstParagraph.children[0] as SerializedTextNode).text).toBe('Some Text')

      expect(secondParagraph.children).toHaveLength(3)
      expect((secondParagraph.children[0] as SerializedTextNode).text).toBe('Hello ')
      expect((secondParagraph.children[1] as SerializedLinkNode).type).toBe('link')
      expect((secondParagraph.children[1] as SerializedLinkNode).children).toHaveLength(1)
      expect(
        ((secondParagraph.children[1] as SerializedLinkNode).children[0] as SerializedTextNode)
          .text,
      ).toBe('there')
      expect((secondParagraph.children[2] as SerializedTextNode).text).toBe(' xxx')
    }).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  })

  test('lexical cursor / selection should be preserved when swapping upload field and clicking within with its list drawer', async () => {
    await navigateToLexicalFields()
    const richTextField = page.locator('.rich-text-lexical').first()
    await richTextField.scrollIntoViewIfNeeded()
    await expect(richTextField).toBeVisible()

    const paragraph = richTextField.locator('.LexicalEditorTheme__paragraph').first()
    await paragraph.scrollIntoViewIfNeeded()
    await expect(paragraph).toBeVisible()

    /**
     * Type some text
     */
    await paragraph.click()
    await page.keyboard.type('Some Text')

    await page.keyboard.press('Enter')

    await page.keyboard.press('/')
    await page.keyboard.type('Upload')

    // Create Upload node
    const slashMenuPopover = page.locator('#slash-menu .slash-menu-popup')
    await expect(slashMenuPopover).toBeVisible()

    const uploadSelectButton = slashMenuPopover.locator('button').first()
    await expect(uploadSelectButton).toBeVisible()
    await expect(uploadSelectButton).toContainText('Upload')
    await uploadSelectButton.click()
    await expect(slashMenuPopover).toBeHidden()

    await wait(500) // wait for drawer form state to initialize (it's a flake)
    const uploadListDrawer = page.locator('dialog[id^=list-drawer_1_]').first() // IDs starting with list-drawer_1_ (there's some other symbol after the underscore)
    await expect(uploadListDrawer).toBeVisible()
    await wait(500)

    await uploadListDrawer.locator('button').getByText('payload.png').first().click()
    await expect(uploadListDrawer).toBeHidden()

    const newUploadNode = richTextField.locator('.lexical-upload').first()
    await newUploadNode.scrollIntoViewIfNeeded()
    await expect(newUploadNode).toBeVisible()

    await expect(newUploadNode.locator('.lexical-upload__bottomRow')).toContainText('payload.png')

    await page.keyboard.press('ArrowLeft')
    // Select "there" by pressing shift + arrow left
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Shift+ArrowLeft')
    }

    await newUploadNode.locator('.lexical-upload__swap-drawer-toggler').first().click()

    const uploadSwapDrawer = page.locator('dialog[id^=list-drawer_1_]').first()
    await expect(uploadSwapDrawer).toBeVisible()
    await wait(500)

    // Click anywhere in the drawer to make sure the cursor position is preserved
    await uploadSwapDrawer.locator('.drawer__content').first().click()

    // click button with text content "payload.jpg"
    await uploadSwapDrawer.locator('button').getByText('payload.jpg').first().click()

    await expect(uploadSwapDrawer).toBeHidden()
    await wait(500)

    // press ctrl+B to bold the text previously selected (assuming it is still selected now, which it should be)
    await page.keyboard.press('Meta+B')
    // In case this is mac or windows
    await page.keyboard.press('Control+B')

    await wait(500)

    await saveDocAndAssert(page)

    // Check if the text is bold. It's a self-relationship, so no need to follow relationship
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

      const lexicalField: SerializedEditorState = lexicalDoc.lexicalRootEditor

      const firstParagraph: SerializedParagraphNode = lexicalField.root
        .children[0] as SerializedParagraphNode
      const secondParagraph: SerializedParagraphNode = lexicalField.root
        .children[1] as SerializedParagraphNode
      const uploadNode: SerializedUploadNode = lexicalField.root.children[2] as SerializedUploadNode

      expect(firstParagraph.children).toHaveLength(2)
      expect((firstParagraph.children[0] as SerializedTextNode).text).toBe('Some ')
      expect((firstParagraph.children[0] as SerializedTextNode).format).toBe(0)
      expect((firstParagraph.children[1] as SerializedTextNode).text).toBe('Text')
      expect((firstParagraph.children[1] as SerializedTextNode).format).toBe(1)

      expect(secondParagraph.children).toHaveLength(0)

      expect(uploadNode.relationTo).toBe('uploads')
    }).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  })

  describe('localization', () => {
    test.skip('ensure simple localized lexical field works', async () => {
      await navigateToLexicalFields(true, true)
    })
  })
})
