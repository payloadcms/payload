import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { RESTClient } from '../../../helpers/rest.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../../../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let client: RESTClient
let page: Page
let serverURL: string
// If we want to make this run in parallel: test.describe.configure({ mode: 'parallel' })

describe('Rich Text', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
    }))

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })
  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'fieldsTest',
      uploadsDir: path.resolve(dirname, './collections/Upload/uploads'),
    })

    if (client) {
      await client.logout()
    }
    client = new RESTClient({ defaultSlug: 'users', serverURL })
    await client.login()

    await ensureCompilationIsDone({ page, serverURL })
  })

  async function navigateToRichTextFields() {
    const url: AdminUrlUtil = new AdminUrlUtil(serverURL, 'rich-text-fields')
    await page.goto(url.list)

    const linkToDoc = page.locator('.row-1 .cell-title a').first()
    await expect(() => expect(linkToDoc).toBeTruthy()).toPass({ timeout: POLL_TOPASS_TIMEOUT })
    const linkDocHref = await linkToDoc.getAttribute('href')

    await linkToDoc.click()

    await page.waitForURL(`**${linkDocHref}`)
  }

  describe('cell', () => {
    test('ensure cells are smaller than 300px in height', async () => {
      const url: AdminUrlUtil = new AdminUrlUtil(serverURL, 'rich-text-fields')
      await page.goto(url.list) // Navigate to rich-text list view

      const table = page.locator('.list-controls ~ .table')
      const lexicalCell = table.locator('.cell-lexicalCustomFields').first()
      const lexicalHtmlCell = table.locator('.cell-lexicalCustomFields_html').first()
      const entireRow = table.locator('.row-1').first()

      // Make sure each of the 3 above are no larger than 300px in height:
      await expect
        .poll(async () => (await lexicalCell.boundingBox()).height, {
          timeout: POLL_TOPASS_TIMEOUT,
        })
        .toBeLessThanOrEqual(300)
      await expect
        .poll(async () => (await lexicalHtmlCell.boundingBox()).height, {
          timeout: POLL_TOPASS_TIMEOUT,
        })
        .toBeLessThanOrEqual(300)
      await expect
        .poll(async () => (await entireRow.boundingBox()).height, { timeout: POLL_TOPASS_TIMEOUT })
        .toBeLessThanOrEqual(300)
    })
  })

  describe('toolbar', () => {
    test('should run url validation', async () => {
      await navigateToRichTextFields()

      // Open link drawer
      await page.locator('.rich-text__toolbar button:not([disabled]) .link').first().click()

      // find the drawer
      const editLinkModal = page.locator('[id^=drawer_1_rich-text-link-]')
      await expect(editLinkModal).toBeVisible()

      // Fill values and click Confirm
      await editLinkModal.locator('#field-text').fill('link text')
      await editLinkModal.locator('label[for="field-linkType-custom-2"]').click()
      await editLinkModal.locator('#field-url').fill('')
      await wait(200)
      await editLinkModal.locator('button[type="submit"]').click()
      await wait(400)
      const errorField = page.locator(
        '[id^=drawer_1_rich-text-link-] .render-fields > :nth-child(3)',
      )
      const hasErrorClass = await errorField.evaluate((el) => el.classList.contains('error'))
      expect(hasErrorClass).toBe(true)
    })

    // TODO: Flaky test flakes consistently in CI: https://github.com/payloadcms/payload/actions/runs/8913431889/job/24478995959?pr=6155
    test.skip('should create new url custom link', async () => {
      await navigateToRichTextFields()

      // Open link drawer
      await page.locator('.rich-text__toolbar button:not([disabled]) .link').first().click()

      // find the drawer
      const editLinkModal = page.locator('[id^=drawer_1_rich-text-link-]')
      await expect(editLinkModal).toBeVisible()

      await wait(400)
      // Fill values and click Confirm
      await editLinkModal.locator('#field-text').fill('link text')
      await editLinkModal.locator('label[for="field-linkType-custom-2"]').click()
      await editLinkModal.locator('#field-url').fill('https://payloadcms.com')
      await editLinkModal.locator('button[type="submit"]').click()
      await expect(editLinkModal).toBeHidden()
      await wait(400)
      await saveDocAndAssert(page)

      // Remove link from editor body
      await page.locator('span >> text="link text"').click()
      const popup = page.locator('.popup--active .rich-text-link__popup')
      await expect(popup.locator('.rich-text-link__link-label')).toBeVisible()
      await popup.locator('.rich-text-link__link-close').click()
      await expect(page.locator('span >> text="link text"')).toHaveCount(0)
    })

    // TODO: Flaky test flakes consistently in CI: https://github.com/payloadcms/payload/actions/runs/8913769794/job/24480056251?pr=6155
    test.skip('should create new internal link', async () => {
      await navigateToRichTextFields()

      // Open link drawer
      await page.locator('.rich-text__toolbar button:not([disabled]) .link').first().click()

      // find the drawer
      const editLinkModal = page.locator('[id^=drawer_1_rich-text-link-]')
      await expect(editLinkModal).toBeVisible()
      await wait(400)

      // Fill values and click Confirm
      await editLinkModal.locator('#field-text').fill('link text')
      await editLinkModal.locator('label[for="field-linkType-internal-2"]').click()
      await editLinkModal.locator('#field-doc .rs__control').click()
      await page.keyboard.type('dev@')
      await editLinkModal
        .locator('#field-doc .rs__menu .rs__option:has-text("dev@payloadcms.com")')
        .click()
      // await wait(200);
      await editLinkModal.locator('button[type="submit"]').click()
      await saveDocAndAssert(page)
    })

    test('should not create new url link when read only', async () => {
      await navigateToRichTextFields()
      const modalTrigger = page.locator('.rich-text--read-only .rich-text__toolbar button .link')
      await expect(modalTrigger).toBeDisabled()
    })

    test('should only list RTE enabled upload collections in drawer', async () => {
      await navigateToRichTextFields()
      await wait(1000)

      // Open link drawer
      await page
        .locator('.rich-text__toolbar button:not([disabled]) .upload-rich-text-button')
        .first()
        .click()

      const drawer = page.locator('[id^=list-drawer_1_]')
      await expect(drawer).toBeVisible()

      // open the list select menu
      await page.locator('.list-drawer__select-collection-wrap .rs__control').click()

      const menu = page.locator('.list-drawer__select-collection-wrap .rs__menu')
      // `uploads-3` has enableRichTextRelationship set to false
      await expect(menu).not.toContainText('Uploads3')
    })

    // TODO: this test can't find the selector for the search filter, but functionality works.
    // Need to debug
    test.skip('should search correct useAsTitle field after toggling collection in list drawer', async () => {
      await navigateToRichTextFields()

      // open link drawer
      const field = page.locator('#field-richText')
      const button = field.locator(
        'button.rich-text-relationship__list-drawer-toggler.list-drawer__toggler',
      )
      await button.click()

      // check that the search is on the `name` field of the `text-fields` collection
      const drawer = page.locator('[id^=list-drawer_1_]')

      await expect(drawer.locator('.search-filter__input')).toHaveAttribute(
        'placeholder',
        'Search by Text',
      )

      // change the selected collection to `array-fields`
      await page.locator('.list-drawer_select-collection-wrap .rs__control').click()
      const menu = page.locator('.list-drawer__select-collection-wrap .rs__menu')
      await menu.locator('.rs__option').getByText('Array Field').click()

      // check that `id` is now the default search field
      await expect(drawer.locator('.search-filter__input')).toHaveAttribute(
        'placeholder',
        'Search by ID',
      )
    })

    test('should only list RTE enabled collections in link drawer', async () => {
      await navigateToRichTextFields()
      await wait(1000)

      await page.locator('.rich-text__toolbar button:not([disabled]) .link').first().click()

      const editLinkModal = page.locator('[id^=drawer_1_rich-text-link-]')
      await expect(editLinkModal).toBeVisible()

      await wait(1000)

      await editLinkModal.locator('label[for="field-linkType-internal-2"]').click()
      await editLinkModal.locator('.relationship__wrap .rs__control').click()

      const menu = page.locator('.relationship__wrap .rs__menu')

      // array-fields has enableRichTextLink set to false
      await expect(menu).not.toContainText('Array Fields')
    })

    test('should only list non-upload collections in relationship drawer', async () => {
      await navigateToRichTextFields()
      await wait(1000)

      // Open link drawer
      await page
        .locator('.rich-text__toolbar button:not([disabled]) .relationship-rich-text-button')
        .first()
        .click()

      await wait(1000)

      // open the list select menu
      await page.locator('.list-drawer__select-collection-wrap .rs__control').click()

      const menu = page.locator('.list-drawer__select-collection-wrap .rs__menu')
      const regex = /\bUploads\b/
      await expect(menu).not.toContainText(regex)
    })

    // TODO: Flaky test in CI. Flake: https://github.com/payloadcms/payload/actions/runs/8914532814/job/24482407114
    test.skip('should respect customizing the default fields', async () => {
      const linkText = 'link'
      const value = 'test value'
      await navigateToRichTextFields()
      await wait(1000)

      const field = page.locator('.rich-text', {
        has: page.locator('#field-richTextCustomFields'),
      })
      // open link drawer
      const button = field.locator('button.rich-text__button.link')
      await button.click()
      await wait(1000)

      // fill link fields
      const linkDrawer = page.locator('[id^=drawer_1_rich-text-link-]')
      const fields = linkDrawer.locator('.render-fields > .field-type')
      await fields.locator('#field-text').fill(linkText)
      await fields.locator('#field-url').fill('https://payloadcms.com')
      const input = fields.locator('#field-fields__customLinkField')
      await input.fill(value)

      await wait(1000)

      // submit link closing drawer
      await linkDrawer.locator('button[type="submit"]').click()
      const linkInEditor = field.locator(`.rich-text-link >> text="${linkText}"`)
      await wait(300)

      await saveDocAndAssert(page)

      // open modal again
      await linkInEditor.click()

      const popup = page.locator('.popup--active .rich-text-link__popup')
      await expect(popup).toBeVisible()

      await popup.locator('.rich-text-link__link-edit').click()

      const linkDrawer2 = page.locator('[id^=drawer_1_rich-text-link-]')
      const fields2 = linkDrawer2.locator('.render-fields > .field-type')
      const input2 = fields2.locator('#field-fields__customLinkField')

      await expect(input2).toHaveValue(value)
    })
  })

  describe('editor', () => {
    test('should populate url link', async () => {
      await navigateToRichTextFields()
      await wait(500)

      // Open link popup
      await page.locator('#field-richText span >> text="render links"').click()
      const popup = page.locator('.popup--active .rich-text-link__popup')
      await expect(popup).toBeVisible()
      await expect(popup.locator('a')).toHaveAttribute('href', 'https://payloadcms.com')

      // Open the drawer
      await popup.locator('.rich-text-link__link-edit').click()
      const editLinkModal = page.locator('[id^=drawer_1_rich-text-link-]')
      await expect(editLinkModal).toBeVisible()

      // Check the drawer values
      const textField = editLinkModal.locator('#field-text')
      await expect(textField).toHaveValue('render links')

      await wait(1000)
      // Close the drawer
      await editLinkModal.locator('button[type="submit"]').click()
      await expect(editLinkModal).toBeHidden()
    })

    test('should populate relationship link', async () => {
      await navigateToRichTextFields()

      // Open link popup
      await page.locator('#field-richText span >> text="link to relationships"').click()
      const popup = page.locator('.popup--active .rich-text-link__popup')
      await expect(popup).toBeVisible()
      await expect(popup.locator('a')).toHaveAttribute(
        'href',
        /\/admin\/collections\/array-fields\/.*/,
      )

      // Open the drawer
      await popup.locator('.rich-text-link__link-edit').click()
      const editLinkModal = page.locator('[id^=drawer_1_rich-text-link-]')
      await expect(editLinkModal).toBeVisible()

      // Check the drawer values
      const textField = editLinkModal.locator('#field-text')
      await expect(textField).toHaveValue('link to relationships')
    })

    test('should open upload drawer and render custom relationship fields', async () => {
      await navigateToRichTextFields()
      const field = page.locator('#field-richText')
      const button = field.locator('button.rich-text-upload__upload-drawer-toggler')

      await button.click()

      const documentDrawer = page.locator('[id^=drawer_1_upload-drawer-]')
      await expect(documentDrawer).toBeVisible()
      const caption = documentDrawer.locator('#field-caption')
      await expect(caption).toBeVisible()
    })

    test('should open upload document drawer from read-only field', async () => {
      await navigateToRichTextFields()
      const field = page.locator('#field-richTextReadOnly')
      const button = field.locator(
        'button.rich-text-upload__doc-drawer-toggler.doc-drawer__toggler',
      )

      await button.click()

      const documentDrawer = page.locator('[id^=doc-drawer_uploads_1_]')
      await expect(documentDrawer).toBeVisible()
    })

    test('should open relationship document drawer from read-only field', async () => {
      await navigateToRichTextFields()
      const field = page.locator('#field-richTextReadOnly')
      const button = field.locator(
        'button.rich-text-relationship__doc-drawer-toggler.doc-drawer__toggler',
      )

      await button.click()

      const documentDrawer = page.locator('[id^=doc-drawer_text-fields_1_]')
      await expect(documentDrawer).toBeVisible()
    })

    test('should populate new links', async () => {
      await navigateToRichTextFields()
      await wait(1000)

      // Highlight existing text
      const headingElement = page.locator(
        '#field-richText h1 >> text="Hello, I\'m a rich text field."',
      )
      await headingElement.selectText()

      await wait(500)

      // click the toolbar link button
      await page.locator('.rich-text__toolbar button:not([disabled]) .link').first().click()

      // find the drawer and confirm the values
      const editLinkModal = page.locator('[id^=drawer_1_rich-text-link-]')
      await expect(editLinkModal).toBeVisible()
      const textField = editLinkModal.locator('#field-text')
      await expect(textField).toHaveValue("Hello, I'm a rich text field.")
    })
    test('should not take value from previous block', async () => {
      await navigateToRichTextFields()
      await page.locator('#field-blocks').scrollIntoViewIfNeeded()
      await expect(page.locator('#field-blocks__0__text')).toBeVisible()
      await expect(page.locator('#field-blocks__0__text')).toHaveValue('Regular text')
      await wait(500)
      const editBlock = page.locator('#blocks-row-0 .popup-button')
      await editBlock.click()
      const removeButton = page.locator('#blocks-row-0').getByRole('button', { name: 'Remove' })
      await expect(removeButton).toBeVisible()
      await wait(500)
      await removeButton.click()
      const richTextField = page.locator('#field-blocks__0__text')
      await expect(richTextField).toBeVisible()
      const richTextValue = await richTextField.innerText()
      expect(richTextValue).toContain('Rich text')
    })
  })
})
