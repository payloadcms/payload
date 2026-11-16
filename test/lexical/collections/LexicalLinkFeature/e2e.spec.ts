import { expect, test } from '@playwright/test'
import {
  lexicalLinkFeatureAutosaveSlug,
  lexicalLinkFeatureSlug,
  uploadsSlug,
} from 'lexical/slugs.js'
import path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, waitForFormReady } from '../../../__helpers/e2e/helpers.js'
import { waitForAutoSaveToRunAndComplete } from '../../../__helpers/e2e/waitForAutoSaveToRunAndComplete.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { LexicalHelpers } from '../utils.js'
const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { afterEach, beforeAll, beforeEach, describe } = test

// Unlike the other suites, this one runs in parallel, as they run on the `lexical-fully-featured/create` URL and are "pure" tests
// PLEASE do not reset the database or perform any operations that modify it in this file.
// TODO: Enable parallel mode again when ensureCompilationIsDone is extracted into a playwright hook. Otherwise,
// it runs multiple times in parallel, for each single test, which causes the tests to fail occasionally in CI.
// test.describe.configure({ mode: 'parallel' })

const { serverURL } = await initPayloadE2ENoConfig({
  dirname,
})

describe('Lexical Link Feature', () => {
  const createdAutosaveDocIDs: Array<number | string> = []

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit

    await ensureCompilationIsDone({ browser, serverURL })
  })
  beforeEach(async ({ page }) => {
    const url = new AdminUrlUtil(serverURL, lexicalLinkFeatureSlug)
    const lexical = new LexicalHelpers(page)
    await page.goto(url.create)
    await waitForFormReady(page)
    await lexical.editor.first().focus()
  })

  afterEach(async ({ page }) => {
    for (const id of createdAutosaveDocIDs) {
      await page.request.delete(`${serverURL}/api/${lexicalLinkFeatureAutosaveSlug}/${id}`)
    }

    createdAutosaveDocIDs.length = 0
  })

  test('can add new custom fields in link feature modal', async ({ page }) => {
    const lexical = new LexicalHelpers(page)

    await lexical.editor.fill('link')
    await lexical.editor.selectText()

    const linkButtonClass = `.rich-text-lexical__wrap .fixed-toolbar .toolbar-popup__button-link`
    const linkButton = page.locator(linkButtonClass).first()

    await linkButton.click()

    const customField = lexical.drawer.locator('#field-someText')

    await expect(customField).toBeVisible()
  })

  test('can set default value of newTab checkbox to checked', async ({ page }) => {
    const lexical = new LexicalHelpers(page)

    await lexical.editor.fill('link')
    await lexical.editor.selectText()

    const linkButtonClass = `.rich-text-lexical__wrap .fixed-toolbar .toolbar-popup__button-link`
    const linkButton = page.locator(linkButtonClass).first()

    await linkButton.click()

    const checkboxField = lexical.drawer.locator(`[id^="field-newTab"]`)

    await expect(checkboxField).toBeChecked()
  })

  test('long link on right stays within editor bounds', async ({ page }) => {
    const lexical = new LexicalHelpers(page)

    // Create a long paragraph to push link to the right
    const longText =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad '
    await lexical.editor.fill(longText + 'link')

    // Select the word 'link' at the end
    await page.keyboard.press('End')
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Shift+ArrowLeft')
    }

    const linkButton = page
      .locator('.rich-text-lexical__wrap .fixed-toolbar .toolbar-popup__button-link')
      .first()
    await linkButton.click()

    const longUrl =
      'https://example.com/some/very/long/path/that/should/cause/the/tooltip/to/overflow/when/displayed/in/the/editor/with/many/more/segments/to/make/it/even/longer'
    const urlField = lexical.drawer.locator('#field-url')
    await urlField.click()
    await urlField.clear()
    await urlField.pressSequentially(longUrl)
    await lexical.save('drawer')

    const linkElement = lexical.editor.locator('a').first()
    await expect(linkElement).toBeVisible()

    // Trigger tooltip by dispatching mouseover event
    await page.evaluate(() => {
      const link = document.querySelector('a')
      if (link) {
        const rect = link.getBoundingClientRect()
        link.dispatchEvent(
          new MouseEvent('mouseover', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
          }),
        )
      }
    })

    const tooltip = page.locator('.link-editor')
    await expect(tooltip).toBeVisible()

    // Assert tooltip stays within editor bounds
    await expect
      .poll(async () => {
        const editorRect = await lexical.editor.evaluate((el) => {
          const parent = el.parentElement
          if (!parent) {
            throw new Error('Editor parent not found')
          }
          return parent.getBoundingClientRect()
        })

        const tooltipRect = await tooltip.evaluate((el) => el.getBoundingClientRect())

        return {
          leftInBounds: tooltipRect.left >= editorRect.left - 10,
          rightInBounds: tooltipRect.right <= editorRect.right + 10,
          topInBounds: tooltipRect.top >= editorRect.top - 100,
        }
      })
      .toEqual({
        leftInBounds: true,
        rightInBounds: true,
        topInBounds: true,
      })
  })

  test('long link on left stays within editor bounds', async ({ page }) => {
    const lexical = new LexicalHelpers(page)

    await lexical.editor.fill('link')
    await lexical.editor.selectText()

    const linkButton = page
      .locator('.rich-text-lexical__wrap .fixed-toolbar .toolbar-popup__button-link')
      .first()
    await linkButton.click()

    const longUrl =
      'https://example.com/some/very/long/path/that/should/cause/the/tooltip/to/overflow/when/displayed/in/the/editor/with/many/more/segments/to/make/it/even/longer'
    const urlField = lexical.drawer.locator('#field-url')
    await urlField.click()
    await urlField.clear()
    await urlField.pressSequentially(longUrl)
    await lexical.save('drawer')

    const linkElement = lexical.editor.locator('a').first()
    await expect(linkElement).toBeVisible()

    // Trigger tooltip by dispatching mouseover event
    await page.evaluate(() => {
      const link = document.querySelector('a')
      if (link) {
        const rect = link.getBoundingClientRect()
        link.dispatchEvent(
          new MouseEvent('mouseover', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
          }),
        )
      }
    })

    const tooltip = page.locator('.link-editor')
    await expect(tooltip).toBeVisible()

    // Assert tooltip stays within editor bounds
    await expect
      .poll(async () => {
        const editorRect = await lexical.editor.evaluate((el) => {
          const parent = el.parentElement
          if (!parent) {
            throw new Error('Editor parent not found')
          }
          return parent.getBoundingClientRect()
        })

        const tooltipRect = await tooltip.evaluate((el) => el.getBoundingClientRect())

        return {
          leftInBounds: tooltipRect.left >= editorRect.left - 10,
          rightInBounds: tooltipRect.right <= editorRect.right + 10,
        }
      })
      .toEqual({
        leftInBounds: true,
        rightInBounds: true,
      })
  })

  test('short link on left uses natural width', async ({ page }) => {
    const lexical = new LexicalHelpers(page)

    await lexical.editor.fill('link')
    await lexical.editor.selectText()

    const linkButton = page
      .locator('.rich-text-lexical__wrap .fixed-toolbar .toolbar-popup__button-link')
      .first()
    await linkButton.click()

    const shortUrl = 'https://google.com'
    const urlField = lexical.drawer.locator('#field-url')
    await urlField.click()
    await urlField.clear()
    await urlField.pressSequentially(shortUrl)
    await lexical.save('drawer')

    const linkElement = lexical.editor.locator('a').first()
    await expect(linkElement).toBeVisible()

    // Trigger tooltip
    await page.evaluate(() => {
      const link = document.querySelector('a')
      if (link) {
        const rect = link.getBoundingClientRect()
        link.dispatchEvent(
          new MouseEvent('mouseover', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
          }),
        )
      }
    })

    const tooltip = page.locator('.link-editor')
    await expect(tooltip).toBeVisible()

    // Assert tooltip is not spanning full width
    await expect
      .poll(async () => {
        const editorRect = await lexical.editor.evaluate((el) => {
          const parent = el.parentElement
          if (!parent) {
            throw new Error('Editor parent not found')
          }
          return parent.getBoundingClientRect()
        })

        const tooltipRect = await tooltip.evaluate((el) => el.getBoundingClientRect())
        const editorWidth = editorRect.right - editorRect.left

        // Tooltip should be much smaller than full editor width
        return tooltipRect.width < editorWidth * 0.5
      })
      .toBe(true)
  })

  test('short link on right uses natural width', async ({ page }) => {
    const lexical = new LexicalHelpers(page)

    // Push link to right side
    const longText =
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad '
    await lexical.editor.fill(longText + 'link')

    await page.keyboard.press('End')
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Shift+ArrowLeft')
    }

    const linkButton = page
      .locator('.rich-text-lexical__wrap .fixed-toolbar .toolbar-popup__button-link')
      .first()
    await linkButton.click()

    const shortUrl = 'https://google.com'
    const urlField = lexical.drawer.locator('#field-url')
    await urlField.click()
    await urlField.clear()
    await urlField.pressSequentially(shortUrl)
    await lexical.save('drawer')

    const linkElement = lexical.editor.locator('a').last()
    await expect(linkElement).toBeVisible()

    // Trigger tooltip
    await page.evaluate(() => {
      const links = document.querySelectorAll('a')
      const link = links[links.length - 1]
      if (link) {
        const rect = link.getBoundingClientRect()
        link.dispatchEvent(
          new MouseEvent('mouseover', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
          }),
        )
      }
    })

    const tooltip = page.locator('.link-editor')
    await expect(tooltip).toBeVisible()

    // Assert tooltip is not spanning full width
    await expect
      .poll(async () => {
        const editorRect = await lexical.editor.evaluate((el) => {
          const parent = el.parentElement
          if (!parent) {
            throw new Error('Editor parent not found')
          }
          return parent.getBoundingClientRect()
        })

        const tooltipRect = await tooltip.evaluate((el) => el.getBoundingClientRect())
        const editorWidth = editorRect.right - editorRect.left

        // Tooltip should be much smaller than full editor width
        return tooltipRect.width < editorWidth * 0.5
      })
      .toBe(true)
  })

  test('should preserve link form state while editing a nested upload document', async ({
    page,
  }) => {
    const lexical = new LexicalHelpers(page)

    await lexical.editor.fill('custom link')
    await lexical.editor.selectText()
    await lexical.inlineToolbar.locator('.toolbar-popup__button-link').click()

    const linkDrawer = page.locator('.lexical-link-edit-drawer')
    const assetLabelField = linkDrawer.locator('#field-hyperlink__0__label')
    const finalizedURL = 'https://example.com/finalized'

    await linkDrawer.locator('#field-url').fill(finalizedURL)
    await linkDrawer.getByRole('button', { name: 'Add Hyperlink' }).click()
    await page.locator('.blocks-drawer__block').filter({ hasText: 'Asset Link Block' }).click()
    await assetLabelField.fill('Client asset')
    await linkDrawer.getByRole('button', { name: 'Choose from existing' }).click()

    const uploadListDrawer = page.locator('dialog[id^=list-drawer_2_]').first()

    await uploadListDrawer
      .getByText(/payload(?:-\d+)?\.jpg/)
      .first()
      .click()

    const selectedFilename = linkDrawer.locator('.upload-relationship-details__filename')

    await expect(selectedFilename).toHaveText(/payload(?:-\d+)?\.jpg/)

    await linkDrawer.locator('.upload-relationship-details__edit').click()

    const uploadDocumentDrawer = page.locator(`dialog[id^=doc-drawer_${uploadsSlug}_2_]`).first()

    await expect(uploadDocumentDrawer).toBeVisible()
    await expect(uploadDocumentDrawer.locator('#field-text')).toBeVisible()
    await expect(linkDrawer.locator('.blocks-field__row')).toHaveCount(1)
    await expect(assetLabelField).toHaveValue('Client asset')
    await expect(selectedFilename).toHaveText(/payload(?:-\d+)?\.jpg/)

    await uploadDocumentDrawer.getByRole('button', { name: 'Close' }).first().click()
    await expect(uploadDocumentDrawer).toBeHidden()
    await lexical.save('drawer')

    const createdLink = lexical.editor.getByRole('link', { name: 'custom link' })

    await expect(createdLink).toHaveAttribute('href', finalizedURL)
    await createdLink.dispatchEvent('mouseover')
    await page.locator('.link-edit').click()
    await expect(linkDrawer).toBeVisible()
    await expect(linkDrawer.locator('.blocks-field__row')).toHaveCount(1)
    await expect(assetLabelField).toHaveValue('Client asset')
    await expect(selectedFilename).toHaveText(/payload(?:-\d+)?\.jpg/)
  })

  test('should preserve an open nested upload drawer and unsaved link fields through parent autosave', async ({
    page,
  }) => {
    const createResponse = await page.request.post(
      `${serverURL}/api/${lexicalLinkFeatureAutosaveSlug}`,
      {
        data: {
          _status: 'published',
        },
      },
    )

    expect(createResponse.ok()).toBe(true)

    const {
      doc: { id },
    } = await createResponse.json()
    const url = new AdminUrlUtil(serverURL, lexicalLinkFeatureAutosaveSlug)

    createdAutosaveDocIDs.push(id)
    await page.goto(url.edit(id))
    await waitForFormReady(page)

    const lexical = new LexicalHelpers(page)

    await lexical.editor.fill('custom link')
    await lexical.editor.selectText()
    await lexical.inlineToolbar.locator('.toolbar-popup__button-link').click()

    const linkDrawer = page.locator('.lexical-link-edit-drawer')
    const assetLabelField = linkDrawer.locator('#field-hyperlink__0__label')
    const finalizedURL = 'https://example.com/autosave-finalized'

    await linkDrawer.locator('#field-url').fill(finalizedURL)
    await linkDrawer.getByRole('button', { name: 'Add Hyperlink' }).click()
    await page.locator('.blocks-drawer__block').filter({ hasText: 'Asset Link Block' }).click()
    await assetLabelField.fill('Client asset')
    await linkDrawer.getByRole('button', { name: 'Choose from existing' }).click()

    const uploadListDrawer = page.locator('dialog[id^=list-drawer_2_]').first()

    await uploadListDrawer
      .getByText(/payload(?:-\d+)?\.jpg/)
      .first()
      .click()

    const selectedFilename = linkDrawer.locator('.upload-relationship-details__filename')

    await expect(selectedFilename).toHaveText(/payload(?:-\d+)?\.jpg/)
    await linkDrawer.locator('.upload-relationship-details__edit').click()

    const uploadDocumentDrawer = page.locator(`dialog[id^=doc-drawer_${uploadsSlug}_2_]`).first()

    await expect(uploadDocumentDrawer).toBeVisible()
    await waitForAutoSaveToRunAndComplete(page)
    await expect(uploadDocumentDrawer).toBeVisible()
    await expect(linkDrawer.locator('.blocks-field__row')).toHaveCount(1)
    await expect(assetLabelField).toHaveValue('Client asset')
    await expect(selectedFilename).toHaveText(/payload(?:-\d+)?\.jpg/)

    await uploadDocumentDrawer.getByRole('button', { name: 'Close' }).first().click()
    await expect(uploadDocumentDrawer).toBeHidden()
    await lexical.save('drawer')

    const createdLink = lexical.editor.getByRole('link', { name: 'custom link' })

    await expect(createdLink).toHaveAttribute('href', finalizedURL)
  })
})
