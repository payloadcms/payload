import { screenReaderTest as test } from '@guidepup/playwright'
import { expect } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { openGroupBy } from '../__helpers/e2e/groupBy/index.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import {
  addTextBlock,
  captureScreenReader,
  captureScreenReaderOutput,
  expectPopupCursorToMove,
  gotoCreatePost,
  gotoPostsList,
  navigateScreenReaderTo,
  openBulkEditFieldSelect,
  openCopyToLocaleDrawer,
  openFirstBlockActions,
  openFolderCreationLocation,
  openLivePreview,
  openLocaleOptions,
  openPostsFilter,
  openRichTextRelationshipDrawer,
  openVersionsList,
} from './helpers.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

test.describe('WCAG 2.2 Level AA — Screen readers', () => {
  let postsURL: AdminUrlUtil
  let serverURL: string

  test.use({ screenReaderStartOptions: { capture: true } })

  test.beforeAll(async ({ browser: _browser }) => {
    ;({ serverURL } = await initPayloadE2ENoConfig({ dirname }))
    postsURL = new AdminUrlUtil(serverURL, 'posts')
  })

  test.beforeEach(async ({ page }) => {
    await initPage({ page, serverURL })
    page.removeAllListeners('console')
  })

  test.describe('1.3.1 Info and Relationships (A)', () => {
    test('should announce the active sort direction on rich-text relationship table headers', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3660
      const drawer = await openRichTextRelationshipDrawer({ page, postsURL })
      const sortableHeader = drawer.locator('th:has(.sort-column)').first()
      const columnName = (await sortableHeader.locator('.sort-column__label').innerText()).trim()
      const sortButton = sortableHeader.getByRole('button', { name: /ascending/i })

      await sortButton.click()
      await sortButton.evaluate((element) => element.blur())
      const output = await captureScreenReaderOutput({
        action: () => sortButton.focus(),
        screenReader,
      })

      await expect(sortableHeader).toHaveAccessibleName(columnName)
      await expect(sortableHeader).toHaveAttribute('aria-sort', 'ascending')
      await expect(sortButton).toHaveAttribute('aria-pressed', 'true')
      expect(output).toMatch(new RegExp(columnName, 'i'))
      expect(output).toMatch(/ascending/i)
      expect(output).toMatch(/pressed|selected/i)
    })

    test('should announce the selected folder location by name and state', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3585
      const modal = await openFolderCreationLocation({ page, serverURL })
      const folder = modal.locator('.hierarchy-column-item', {
        hasText: 'Accessibility folder',
      })
      const selectionControl = folder.getByRole('checkbox')
      await selectionControl.click()
      const output = await captureScreenReaderOutput({
        action: () => folder.focus(),
        screenReader,
      })

      await expect(selectionControl).toBeChecked()
      expect(output).toMatch(/Accessibility folder/i)
      expect(output).toMatch(/checked|current|selected/i)
    })

    test('should announce a selected locale as one grouped item with its state', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3699
      // PYLD-3700
      // PYLD-3730
      const options = await openLocaleOptions({ page, postsURL })
      const selectedOption = options.filter({ hasText: 'English' })

      await expect(selectedOption).toHaveRole('menuitemradio')
      await expect(selectedOption).toHaveAttribute('aria-checked', 'true')
      await expect(selectedOption).not.toHaveAttribute('aria-disabled', 'true')

      const capture = await captureScreenReader({
        action: () => selectedOption.focus(),
        screenReader,
      })

      expect(capture.spokenPhrase).toMatch(/English/i)
      expect(capture.spokenPhrase).toMatch(/checked|selected/i)
      expect(capture.spokenPhrase).not.toMatch(/dimmed|disabled|unavailable/i)
      expect(capture.spokenPhrase.match(/English/gi)).toHaveLength(1)
    })
  })

  test.describe('2.4.3 Focus Order (A)', () => {
    test('should expose one screen-reader stop for the Copy to locale select', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3680
      const drawer = await openCopyToLocaleDrawer({ page, postsURL, serverURL })
      const combobox = drawer.locator('#field-toLocale input[role="combobox"]')

      const firstStop = await captureScreenReader({
        action: () => combobox.focus(),
        screenReader,
      })
      const selectStops = [firstStop.itemText]
      let hasReachedNextField = false

      for (let index = 0; index < 8; index++) {
        await screenReader.next()
        const itemText = await screenReader.itemText()

        if (/overwrite existing data/i.test(itemText)) {
          hasReachedNextField = true
          break
        }
        selectStops.push(itemText)
      }

      expect(hasReachedNextField, `Screen-reader stops: ${JSON.stringify(selectStops)}`).toBe(true)
      expect(selectStops, `Screen-reader stops: ${JSON.stringify(selectStops)}`).toHaveLength(1)
    })

    test('should move the screen-reader cursor into every shared popup', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3697
      // PYLD-3701
      await page.goto(`${serverURL}/admin`)
      await expectPopupCursorToMove({
        expectedItem: /account|preferences|logout/i,
        screenReader,
        trigger: page.locator('.user-menu__trigger'),
      })

      await gotoCreatePost({ page, postsURL })
      await expectPopupCursorToMove({
        expectedItem: /English|Spanish/i,
        screenReader,
        trigger: page.locator('.localizer .popup__trigger-wrap button'),
      })

      await gotoPostsList({ page, postsURL })
      await expectPopupCursorToMove({
        expectedItem: /field|sort/i,
        screenReader,
        trigger: page.locator('#toggle-group-by'),
      })

      await gotoPostsList({ page, postsURL })
      await expectPopupCursorToMove({
        expectedItem: /title|updated|created/i,
        screenReader,
        trigger: page.locator('.columns-button__button'),
      })

      await addTextBlock({ page, postsURL })
      await expectPopupCursorToMove({
        expectedItem: /duplicate|remove|paste/i,
        screenReader,
        trigger: page.locator('#field-layout .array-actions__button').first(),
      })
    })

    test('should expose disabled row-menu actions to screen-reader navigation', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3745
      await openFirstBlockActions({ page, postsURL })
      const output = await navigateScreenReaderTo({
        matches: /paste|replace/i,
        screenReader,
      })

      expect(output).toMatch(/dimmed|disabled|unavailable/i)
    })

    test('should keep the disabled Group by sort control in screen-reader navigation', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3784
      await gotoPostsList({ page, postsURL })
      await openGroupBy(page)
      const output = await navigateScreenReaderTo({ matches: /sort/i, screenReader })

      expect(output).toMatch(/dimmed|disabled|unavailable/i)
    })
  })

  test.describe('4.1.2 Name, Role, Value (A)', () => {
    test('should announce the selected state of the active Theme option', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3645
      await page.goto(`${serverURL}/admin`)
      await page.locator('.user-menu__trigger').click()
      await page.getByRole('button', { name: 'Theme' }).click()
      const selectedTheme = page.locator('.popup-button-list__button--selected').last()
      const output = await captureScreenReaderOutput({
        action: () => selectedTheme.focus(),
        screenReader,
      })

      expect(output).toMatch(/selected|checked/i)
    })

    test('should expose relationship option names in NVDA browse mode', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3656
      // Requires manual confirmation with NVDA browse mode.
      test.skip(
        screenReader.name !== 'NVDA',
        'The original report is specific to NVDA browse mode.',
      )
      await gotoCreatePost({ page, postsURL })
      const combobox = page.locator('#field-relatedPost input[role="combobox"]')
      await combobox.focus()
      await combobox.press('ArrowDown')
      await expect(page.locator('.rs__option').first()).toBeVisible()

      const output = await navigateScreenReaderTo({
        matches: /Example post/i,
        screenReader,
      })

      expect(output).not.toMatch(/blank/i)
    })

    test('should announce the selected locale and collapsed state on version pages', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3704
      await openVersionsList({ page, postsURL, serverURL })
      const localeButton = page.locator('.localizer .popup__trigger-wrap button')
      const output = await captureScreenReaderOutput({
        action: () => localeButton.focus(),
        screenReader,
      })

      expect(output).toMatch(/locale.+English.+\ben\b/i)
      expect(output).toMatch(/collapsed/i)
    })

    test('should announce Paste as a disabled button', async ({ page, screenReader }) => {
      // PYLD-3743
      await openFirstBlockActions({ page, postsURL })
      const output = await navigateScreenReaderTo({
        matches: /paste|replace/i,
        screenReader,
      })

      expect(output).toMatch(/button/i)
      expect(output).toMatch(/dimmed|disabled|unavailable/i)
    })

    test('should announce filter and bulk-edit options by name', async ({ page, screenReader }) => {
      // PYLD-3752
      const whereBuilder = await openPostsFilter({ page, postsURL })
      const filterComboboxes = whereBuilder.locator('input[role="combobox"]')

      expect(await filterComboboxes.count()).toBeGreaterThan(0)
      for (let index = 0; index < (await filterComboboxes.count()); index++) {
        await filterComboboxes.nth(index).focus()
        await filterComboboxes.nth(index).press('ArrowDown')
        await filterComboboxes.nth(index).press('ArrowDown')
        const optionName = (await page.locator('.rs__option--is-focused').innerText()).trim()
        await page.keyboard.press('Escape')
        await filterComboboxes.nth(index).focus()
        const output = await captureScreenReaderOutput({
          action: async () => {
            await filterComboboxes.nth(index).press('ArrowDown')
            await filterComboboxes.nth(index).press('ArrowDown')
          },
          screenReader,
        })

        expect(output.toLocaleLowerCase()).toContain(optionName.toLocaleLowerCase())
        expect(output).not.toMatch(/\bblank\b/i)
        expect(output).not.toContain('[object Object]')
        await page.keyboard.press('Escape')
      }

      const fieldSelect = await openBulkEditFieldSelect({ page, postsURL })
      const bulkEditCombobox = fieldSelect.locator('input[role="combobox"]')
      await bulkEditCombobox.focus()
      await bulkEditCombobox.press('ArrowDown')
      await bulkEditCombobox.press('ArrowDown')
      const optionName = (await page.locator('.rs__option--is-focused').innerText()).trim()
      await page.keyboard.press('Escape')
      await bulkEditCombobox.focus()
      const output = await captureScreenReaderOutput({
        action: async () => {
          await bulkEditCombobox.press('ArrowDown')
          await bulkEditCombobox.press('ArrowDown')
        },
        screenReader,
      })

      expect(output.toLocaleLowerCase()).toContain(optionName.toLocaleLowerCase())
      expect(output).not.toMatch(/\bblank\b/i)
      expect(output).not.toContain('[object Object]')
    })

    test('should announce the selected per-page option on the versions table', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3713
      await openVersionsList({ page, postsURL, serverURL })
      await page.locator('.per-page .popup__trigger-wrap button').click()
      const selected = page.locator('.popup-button-list__button--selected').last()
      const output = await captureScreenReaderOutput({
        action: () => selected.focus(),
        screenReader,
      })

      expect(output).toMatch(/checked|selected/i)
    })

    test('should announce the selected live-preview zoom option', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3723
      await openLivePreview({ page, postsURL, serverURL })
      await page.locator('.live-preview-toolbar-controls__zoom button').click()
      const selected = page.locator('.popup-button-list__button--selected').last()
      const output = await captureScreenReaderOutput({
        action: () => selected.focus(),
        screenReader,
      })

      expect(output).toMatch(/checked|selected/i)
    })

    test('should announce the live-preview zoom name and collapsed state', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3725
      await openLivePreview({ page, postsURL, serverURL })
      const zoom = page.locator('.live-preview-toolbar-controls__zoom button')
      const output = await captureScreenReaderOutput({
        action: () => zoom.focus(),
        screenReader,
      })

      expect(output).toMatch(/zoom/i)
      expect(output).toMatch(/collapsed/i)
    })

    test('should announce the selected state of the active Add Blocks option', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3623
      // PYLD-3735
      await gotoCreatePost({ page, postsURL })
      await page.locator('#field-layout > .blocks-field__drawer-toggler').click()
      const option = page.locator('button.thumbnail-card[title="Text block"]')
      const output = await captureScreenReaderOutput({
        action: () => option.click(),
        screenReader,
      })

      expect(output).toMatch(/Text block/i)
      expect(output).toMatch(/checked|selected/i)
    })
  })
})
