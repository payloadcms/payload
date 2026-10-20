import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { formatAdminURL } from 'payload/shared'
import { fileURLToPath } from 'url'

import { waitForFormReady } from '../../../__helpers/e2e/helpers.js'
import { waitForAutoSaveToRunAndComplete } from '../../../__helpers/e2e/waitForAutoSaveToRunAndComplete.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { ensureCompilationIsDone } from '../../../__setup/e2e/ensureCompilationIsDone.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { lexicalLinkFeatureAutosaveSlug, lexicalLinkFeatureSlug, uploadsSlug } from '../../slugs.js'
import { LexicalHelpers } from '../utils.js'
const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { afterEach, beforeAll, beforeEach, describe } = test

// Do not reset the shared suite database here. Tests that persist documents must clean them up.
// TODO: Enable parallel mode again when ensureCompilationIsDone is extracted into a playwright hook. Otherwise,
// it runs multiple times in parallel, for each single test, which causes the tests to fail occasionally in CI.
// test.describe.configure({ mode: 'parallel' })

const { serverURL } = await initPayloadE2ENoConfig({
  dirname,
})

describe('Lexical Link Feature', () => {
  const createdAutosaveDocIDs: Array<number | string> = []

  afterEach(async ({ page }) => {
    for (const id of createdAutosaveDocIDs) {
      const response = await page.request.delete(
        formatAdminURL({
          apiRoute: '/api',
          path: `/${lexicalLinkFeatureAutosaveSlug}/${id}`,
          serverURL,
        }),
      )

      await expect(response).toBeOK()
    }

    createdAutosaveDocIDs.length = 0
  })

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    await ensureCompilationIsDone({ browser, serverURL })
  })
  beforeEach(async ({ page }) => {
    const url = new AdminUrlUtil(serverURL, lexicalLinkFeatureSlug)
    const lexical = new LexicalHelpers(page)
    await page.goto(url.create)
    await waitForFormReady(page)
    await expect(lexical.editor.first()).toBeVisible()
    await lexical.editor.first().focus()
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
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
            view: window,
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
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
            view: window,
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
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
            view: window,
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
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
            view: window,
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

  test('should preserve unsaved link fields when resizing with a nested upload drawer open', async ({
    page,
  }) => {
    const finalizedURL = 'https://example.com/nested-link'
    const { lexical, linkDrawer, assetLabelField, selectedFilename, uploadDocumentDrawer } =
      await openNestedUploadDrawer({ page, finalizedURL })

    await page.setViewportSize({ width: 1100, height: 800 })
    await expect(uploadDocumentDrawer).toBeVisible()
    await expect(assetLabelField).toHaveValue('Client asset')
    await expect(selectedFilename).toHaveText(/payload.*\.jpg/)

    await uploadDocumentDrawer.getByRole('button', { name: 'Close' }).first().click()
    await expect(uploadDocumentDrawer).toBeHidden()
    await linkDrawer.getByRole('button', { name: 'Save changes', exact: true }).click()
    await expect(lexical.editor.getByRole('link', { name: 'custom link' })).toHaveAttribute(
      'href',
      finalizedURL,
    )

    const createdLink = lexical.editor.getByRole('link', { name: 'custom link' })

    await createdLink.dispatchEvent('mouseover')
    await page.getByRole('button', { name: 'Edit link', exact: true }).click()
    await expect(assetLabelField).toHaveValue('Client asset')
    await expect(selectedFilename).toHaveText(/payload.*\.jpg/)
    await assetLabelField.fill('Discard this edit')
    await page.keyboard.press('Escape')
    await expect(linkDrawer).toBeHidden()
    await createdLink.dispatchEvent('mouseover')
    await page.getByRole('button', { name: 'Edit link', exact: true }).click()
    await expect(assetLabelField).toHaveValue('Client asset')
    await expect(linkDrawer.locator('#field-url')).toHaveValue(finalizedURL)
  })

  test('should preserve unsaved link fields and the nested upload drawer through parent autosave', async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT_LONG)

    const collectionURL = formatAdminURL({
      apiRoute: '/api',
      path: `/${lexicalLinkFeatureAutosaveSlug}`,
      serverURL,
    })
    const createResponse = await page.request.post(collectionURL, {
      data: { _status: 'published' },
    })

    await expect(createResponse).toBeOK()

    const {
      doc: { id },
    } = await createResponse.json()
    const url = new AdminUrlUtil(serverURL, lexicalLinkFeatureAutosaveSlug)

    createdAutosaveDocIDs.push(id)

    let releaseAutosave: () => void = () => {}
    const autosaveReady = new Promise<void>((resolve) => {
      releaseAutosave = resolve
    })

    // Let autosave finish only after the nested drawer opens, regardless of setup timing.
    await page.route(`${collectionURL}/${id}?**`, async (route) => {
      if (new URL(route.request().url()).searchParams.get('autosave') === 'true') {
        await autosaveReady
      }

      await route.continue()
    })

    try {
      await page.goto(url.edit(id))
      await waitForFormReady(page)

      const finalizedURL = 'https://example.com/autosave-finalized'
      const { lexical, linkDrawer, assetLabelField, selectedFilename, uploadDocumentDrawer } =
        await openNestedUploadDrawer({ page, finalizedURL })

      releaseAutosave()
      await waitForAutoSaveToRunAndComplete(page)
      await expect(uploadDocumentDrawer).toBeVisible()
      await expect(assetLabelField).toHaveValue('Client asset')
      await expect(selectedFilename).toHaveText(/payload.*\.jpg/)

      await uploadDocumentDrawer.getByRole('button', { name: 'Close' }).first().click()
      await expect(uploadDocumentDrawer).toBeHidden()
      await linkDrawer.getByRole('button', { name: 'Save changes', exact: true }).click()
      await expect(lexical.editor.getByRole('link', { name: 'custom link' })).toHaveAttribute(
        'href',
        finalizedURL,
      )
    } finally {
      releaseAutosave()
      await page.unrouteAll({ behavior: 'wait' })
    }
  })
})

async function openNestedUploadDrawer({
  page,
  finalizedURL,
}: {
  finalizedURL: string
  page: Page
}) {
  const lexical = new LexicalHelpers(page)

  await lexical.editor.fill('custom link')
  await lexical.editor.selectText()
  await lexical.inlineToolbar.getByRole('button', { name: 'Link', exact: true }).click()

  const linkDrawer = page.locator('.lexical-link-edit-drawer')
  const assetLabelField = linkDrawer.locator('#field-hyperlink__0__label')

  await linkDrawer.locator('#field-url').fill(finalizedURL)
  await linkDrawer.getByRole('button', { name: 'Add Hyperlink' }).click()
  const blockDrawer = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Add Hyperlink' }) })

  await blockDrawer.getByRole('button', { name: 'Asset Link Block', exact: true }).click()
  await blockDrawer.getByRole('button', { name: 'Insert', exact: true }).click()
  await assetLabelField.fill('Client asset')
  await linkDrawer.getByRole('button', { name: 'Choose from existing' }).click()

  const uploadListDrawer = page.locator('dialog[id^=list-drawer_2_]').first()

  await uploadListDrawer
    .getByText(/payload.*\.jpg/)
    .first()
    .click()

  const selectedFilename = linkDrawer.locator('.upload-relationship-details__filename')

  await expect(selectedFilename).toHaveText(/payload.*\.jpg/)
  await linkDrawer
    .locator('.upload-relationship-details')
    .getByRole('button', { name: 'Edit', exact: true })
    .click()

  const uploadDocumentDrawer = page.locator(`dialog[id^=doc-drawer_${uploadsSlug}_2_]`).first()

  await expect(uploadDocumentDrawer).toBeVisible()
  return { lexical, linkDrawer, assetLabelField, selectedFilename, uploadDocumentDrawer }
}
