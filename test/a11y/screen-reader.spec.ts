import type { ScreenReaderPlaywright } from '@guidepup/playwright'
import type { Locator } from '@playwright/test'

import { NVDAKeyCodeCommands } from '@guidepup/guidepup'
import { screenReaderTest as test } from '@guidepup/playwright'
import { expect } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatAdminURL } from 'payload/shared'

import { openGroupBy } from '../__helpers/e2e/groupBy/index.js'
import { openNav } from '../__helpers/e2e/toggleNav.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { devUser } from '../credentials.js'
import {
  addCollectionQueryWidget,
  addTextBlock,
  captureScreenReader,
  captureScreenReaderOutput,
  cleanupModalMedia,
  expectPopupCursorToMove,
  gotoCreatePost,
  gotoFirstPost,
  gotoLabelTestLogin,
  gotoPostsList,
  insertTextBlockWithKeyboard,
  navigateScreenReaderTo,
  openBulkEditFieldSelect,
  openBulkUploadDialog,
  openCopyToLocaleDrawer,
  openDashboardEditor,
  openDrawerFilters,
  openEditImageDialog,
  openFirstBlockActions,
  openFolderCreationLocation,
  openLivePreview,
  openLocaleOptions,
  openPostsFilter,
  openRichTextRelationshipDrawer,
  openRichTextUploadDrawer,
  openVersionComparison,
  openVersionsList,
  openWidgetDrawer,
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
    const loginResponse = await page.request.post(
      formatAdminURL({ apiRoute: '/api', path: '/users/login', serverURL }),
      { data: devUser },
    )

    expect(loginResponse.ok()).toBe(true)
    await initPage({ page, serverURL })
    page.removeAllListeners('console')
  })

  test.afterEach(async ({ page }) => {
    await cleanupModalMedia({ page })
  })
  test.describe('1.1.1 Non-text Content (A)', () => {
    test('should expose the login logo to the screen-reader cursor as Payload', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3609
      await page.context().clearCookies()
      await page.setExtraHTTPHeaders({ DisableAutologin: 'true' })
      await page.goto(formatAdminURL({ adminRoute: '/admin', path: '/login', serverURL }))
      await expect(page.locator('.login__brand .graphic-logo')).toBeVisible()
      const output = await navigateScreenReaderTo({
        matches: /Payload.*(?:image|graphic)|(?:image|graphic).*Payload/i,
        screenReader,
      })

      expect(output).toMatch(/Payload/i)
    })
  })

  test.describe('1.1.1 Non-text Content (A)', () => {
    test('should announce required state instead of the asterisk', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3579
      await page.goto(
        formatAdminURL({ adminRoute: '/admin', path: '/collections/media/create', serverURL }),
      )
      const alt = page.locator('#field-alt')

      await expect(alt).toBeVisible()
      const capture = await captureScreenReader({ action: () => alt.focus(), screenReader })

      expect(capture.spokenPhrase).toMatch(/alt/i)
      expect(capture.spokenPhrase).toMatch(/required/i)
      expect(capture.spokenPhrase).not.toMatch(/star|asterisk/i)
    })
  })

  test.describe('1.3.1 Info and Relationships (A)', () => {
    test.describe('Safari and VoiceOver report', () => {
      test.skip(process.platform !== 'darwin', 'Safari and VoiceOver report')

      test('should announce the visible Collection Query bullet text when its card receives focus', async ({
        page,
        screenReader,
      }) => {
        // PYLD-3572
        await openDashboardEditor({ page, serverURL })
        const widget = await addCollectionQueryWidget({ page })
        const bullets = await widget
          .locator('.collection-query-widget__error-list li')
          .allTextContents()

        expect(bullets.length).toBeGreaterThan(0)
        await expect(widget.locator('.draggable')).toBeFocused()
        await widget.getByRole('button', { name: 'Drag to reorder', exact: true }).focus()
        const capture = await captureScreenReader({
          action: () => page.keyboard.press('Shift+Tab'),
          screenReader,
        })
        for (const bullet of bullets) {
          expect.soft(capture.spokenPhrase).toContain(bullet.trim())
        }
      })
    })

    test('should announce table cell text once without conflicting sort commands', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3750
      // PYLD-3596
      await gotoPostsList({ page, postsURL })
      const title = 'Example post two'
      const output = await navigateScreenReaderTo({
        matches: /^(?!.*select).*Example post two/i,
        screenReader,
      })
      const spoken = await screenReader.lastSpokenPhrase()

      expect(output).toContain(title)
      expect(spoken.match(/Example post two/gi) || []).toHaveLength(1)
      expect(spoken).not.toMatch(/ascending.*descending|descending.*ascending/i)
      expect(spoken).not.toMatch(/sort by|\{\{label\}\}/i)
    })

    test('should communicate removed version text while browsing the comparison', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3722
      await openVersionComparison({ page, postsURL, serverURL, versionIndex: 0 })
      const removed = page.locator('.text-diff [data-match-type="delete"]').first()

      await expect(removed).toBeVisible()
      await expect(removed).toHaveCSS('text-decoration-line', 'line-through')
      const removedText = (await removed.innerText()).trim()

      expect(removedText).not.toBe('')
      const oldGroup = await navigateScreenReaderTo({
        matches: /Comparing against.*group|group.*Comparing against/i,
        screenReader,
      })

      expect(oldGroup).toMatch(/Comparing against/i)
      const capture = await captureScreenReader({
        action: async () => {
          for (let index = 0; index < 30; index++) {
            await screenReader.next()
            const item = await screenReader.itemText()

            if (item.includes(removedText)) {
              return
            }
          }
          throw new Error(`Did not reach removed text: ${removedText}`)
        },
        screenReader,
      })

      expect(capture.spokenPhrase).toContain(removedText)
      expect(capture.spokenPhrase).toMatch(/deleted|deletion|removed|strikethrough|strike through/i)
      const newGroup = await navigateScreenReaderTo({
        matches: /^(?!.*Previous Version)(?:Version.*group|group.*Version)/i,
        screenReader,
      })

      expect(newGroup).not.toMatch(/Comparing against/i)
    })

    test('should announce the Copy to combobox label once on focus', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3689
      const drawer = await openCopyToLocaleDrawer({ page, postsURL, serverURL })
      const combobox = drawer.locator('#field-toLocale input[role="combobox"]')

      // Start within the drawer so this captures field focus, not the dialog opening.
      await drawer.getByRole('checkbox', { name: 'Overwrite existing field data' }).focus()
      const capture = await captureScreenReader({
        action: () => combobox.focus(),
        screenReader,
      })

      await expect(combobox).toBeFocused()
      // Count the field label, excluding the dialog name "Copy to locale".
      expect(capture.spokenPhrase.match(/\bcopy to\b(?!\s+locale\b)/gi) || []).toHaveLength(1)
    })

    test('should announce the deletion dialog before background page content', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3769
      await gotoFirstPost({ page, postsURL, serverURL })
      await page.locator('.doc-controls__popup .popup__trigger-wrap button').click()
      const trigger = page.getByRole('menuitem', { name: 'Delete', exact: true })

      await trigger.focus()
      const capture = await captureScreenReader({
        action: () => trigger.press('Enter'),
        screenReader,
      })

      await expect(
        page.locator('[id^="delete-"]').filter({ has: page.locator('.dialog') }),
      ).toBeVisible()
      expect(capture.spokenPhrase).toMatch(
        /(delete|trash|confirm).*dialog|dialog.*(delete|trash|confirm)/i,
      )
      expect(capture.spokenPhrase).not.toMatch(
        /skip to content|navigation landmark|dashboard|subtitle/i,
      )
    })

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
  test.describe('2.1.1 Keyboard (A)', () => {
    test.describe('Requires Windows and NVDA', () => {
      test.skip(process.platform !== 'win32', 'Requires Windows and NVDA')

      test('should lift a dashboard widget with Space while NVDA is active', async ({
        page,
        screenReader,
      }) => {
        // PYLD-3642
        await openDashboardEditor({ page, serverURL })
        const widget = await addCollectionQueryWidget({ page })

        await widget.getByRole('button', { name: 'Drag to reorder', exact: true }).focus()
        const output = await captureScreenReaderOutput({
          action: () => screenReader.press('Space'),
          screenReader,
        })
        await expect(page.locator('.drag-overlay')).toBeVisible()
        await expect(page.locator('[id^="widget-editor-"]:visible')).toHaveCount(0)
        expect(output).toMatch(/picked up|lifted|dragging/i)
        await screenReader.press('Escape')
        await expect(page.locator('.drag-overlay')).toHaveCount(0)
      })
    })
  })

  test.describe('2.4.3 Focus Order (A)', () => {
    test.describe('Safari and VoiceOver report', () => {
      test.skip(process.platform !== 'darwin', 'Safari and VoiceOver report')

      test('should reach widget edit size and remove controls with the VoiceOver cursor', async ({
        page,
        screenReader,
      }) => {
        // PYLD-3573
        await openDashboardEditor({ page, serverURL })
        const widget = await addCollectionQueryWidget({ page })
        await widget.locator('.draggable').focus()
        await navigateScreenReaderTo({
          matches: /edit.*collection query/i,
          screenReader,
        })
        await screenReader.act()
        await expect(page.locator('[id^="widget-editor-"]:visible')).toHaveCount(1)
        await page.keyboard.press('Escape')
        const sizeText = (await widget.locator('.widget-wrapper__size-btn').innerText()).trim()
        await navigateScreenReaderTo({
          matches: /edit.*collection query/i,
          screenReader,
        })
        let hasReachedSize = false
        for (let index = 0; index < 8; index++) {
          await screenReader.next()
          const output = await screenReader.itemText()
          if (
            output.toLowerCase().includes(sizeText.toLowerCase()) &&
            /resize.*collection query/i.test(output) &&
            /button/i.test(output)
          ) {
            hasReachedSize = true
            break
          }
          if (/delete.*collection query/i.test(output)) {
            break
          }
        }
        expect(hasReachedSize).toBe(true)
        await screenReader.act()
        await expect(widget.locator('.widget-wrapper__size-btn')).toHaveAttribute(
          'aria-expanded',
          'true',
        )
        await page.keyboard.press('Escape')
        await navigateScreenReaderTo({
          matches: /delete.*collection query/i,
          screenReader,
        })
        await screenReader.act()
        await expect(widget).toHaveCount(0)
      })
    })

    test.describe('Requires NVDA browse mode', () => {
      test.skip(process.platform !== 'win32', 'Requires NVDA browse mode')

      test('should not expose an invisible loading object after relationship drawer content', async ({
        page,
        screenReader,
      }) => {
        // PYLD-3650
        await gotoCreatePost({ page, postsURL })
        await page.locator('#relatedPost-add-new button').press('Enter')
        const drawer = page.locator('.doc-drawer:visible')

        await expect(drawer.locator('[data-form-ready="true"]').first()).toBeVisible()
        // Place a browse-cursor boundary after the overlay without relying on wrapping to the header.
        await drawer.evaluate((element) => {
          const boundary = document.createElement('p')

          boundary.textContent = 'End of relationship drawer'
          element.append(boundary)
        })
        await navigateScreenReaderTo({ matches: /featured image/i, screenReader })
        const outputs: string[] = []
        let hasReachedEnd = false
        for (let index = 0; index < 50; index++) {
          await screenReader.next()
          const output = await screenReader.itemText()
          outputs.push(output)
          if (/end of relationship drawer/i.test(output)) {
            hasReachedEnd = true
            break
          }
        }
        expect(hasReachedEnd, outputs.join('\n')).toBe(true)
        expect(outputs.join(' ')).not.toMatch(/loading|unknown|unlabeled/i)
      })
    })

    test.describe('Requires NVDA browse mode', () => {
      test.skip(process.platform !== 'win32', 'Requires NVDA browse mode')

      test('should allow the NVDA browse cursor to exit Lexical editors in both directions', async ({
        page,
        screenReader,
      }) => {
        // PYLD-3741
        await gotoCreatePost({ page, postsURL })
        await insertTextBlockWithKeyboard({ page })
        for (const field of ['content', 'layout.0.body']) {
          const editor = page.locator(`[data-field-path="${field}"] [contenteditable="true"]`)
          const text = `Screen reader exit ${field}`

          await editor.fill(text)
          await screenReader.perform(NVDAKeyCodeCommands.exitFocusMode)
          for (const direction of ['next', 'previous'] as const) {
            await navigateScreenReaderTo({ matches: new RegExp(text), screenReader })
            const boundary =
              field === 'content'
                ? direction === 'next'
                  ? /add item/i
                  : /published on/i
                : direction === 'next'
                  ? /^text(?:$| .*?(?:edit|text field))/i
                  : /block name/i
            const outputs: string[] = []
            let hasReachedOutsideContent = false
            for (let index = 0; index < 40; index++) {
              await screenReader[direction]()
              const output = await screenReader.itemText()
              outputs.push(output)
              if (boundary.test(output)) {
                hasReachedOutsideContent = true
                break
              }
            }
            expect(hasReachedOutsideContent, outputs.join('\n')).toBe(true)
          }
        }
      })
    })

    test('should omit hidden Lexical controls from screen-reader navigation', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3789
      await gotoCreatePost({ page, postsURL })
      await insertTextBlockWithKeyboard({ page })
      for (const field of ['content', 'layout.0.body']) {
        const editor = page.locator(`[data-field-path="${field}"] [contenteditable="true"]`)
        const text = `Screen reader hidden controls ${field}`

        await editor.fill(text)
        await page.mouse.move(0, 0)
        await navigateScreenReaderTo({ matches: new RegExp(text), screenReader })
        let hasExitedEditor = false
        const outputs: string[] = []
        for (let index = 0; index < 40; index++) {
          await screenReader.next()
          const output = await screenReader.itemText()
          outputs.push(output)
          if (
            field === 'content'
              ? /add item/i.test(output)
              : /text.*(?:edit|text field)/i.test(output)
          ) {
            hasExitedEditor = true
            break
          }
        }
        expect(hasExitedEditor, outputs.join('\n')).toBe(true)
        expect(outputs.join(' ')).not.toMatch(/drag to move|add block|edit link|remove link/i)
      }
    })
    for (const form of ['document', 'login'] as const) {
      test.describe(`${form} form`, () => {
        test('should expose validation errors next to their fields', async ({
          page,
          screenReader,
        }) => {
          // PYLD-3581; login also covers the reading-order behavior of PYLD-3613.
          if (form === 'login') {
            await gotoLabelTestLogin({ page, serverURL })
            await page.locator('input[name="email"]').fill('dev@payloadcms.com')
            await page.getByRole('button', { name: 'Login', exact: true }).click()
          } else {
            await gotoCreatePost({ page, postsURL })
            await page.getByRole('button', { name: /^Publish(?: in English)?$/ }).click()
          }

          const field = page.locator(form === 'login' ? 'input[name="password"]' : '#field-title')
          const error = page
            .locator('.field-error')
            .filter({ hasText: /required/i })
            .first()

          await expect(error).toBeVisible()
          await expectAdjacentValidationError({ error, field, screenReader })
        })
      })
    }

    test('should announce password errors after submission', async ({ page, screenReader }) => {
      // PYLD-3613
      await gotoLabelTestLogin({ page, serverURL })
      await page.locator('input[name="email"]').fill('dev@payloadcms.com')
      const password = page.locator('input[name="password"]')

      await password.fill('temporary')
      await password.fill('')
      await password.press('Tab')
      const error = page.locator('.field-error').filter({ hasText: /required/i })
      const capture = await captureScreenReader({
        action: async () => {
          await page.getByRole('button', { name: 'Login', exact: true }).click()
          await expect(error).toBeVisible()
        },
        screenReader,
      })

      expect.soft(capture.spokenPhrase).toContain((await error.innerText()).trim())
    })

    test('should contain screen-reader traversal in bulk-upload and image-edit dialogs', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3575
      for (const open of [openBulkUploadDialog, openEditImageDialog]) {
        const dialog = await open({ page, serverURL })

        await dialog.getByRole('button', { name: 'Close', exact: true }).focus()
        const stops = await collectModalCursorStops({ screenReader })
        expect(stops.join('\n')).not.toMatch(
          /dashboard|navigation|collections|create new|\bmedia\b|\bposts\b|\busers\b|file name|save draft/i,
        )
        expect(stops.join('\n')).toMatch(/add files|crop|focal point|choose files|browse files/i)
      }
    })

    test('should contain screen-reader traversal in the nested folder-location modal', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3587
      const modal = await openFolderCreationLocation({ page, serverURL })

      await modal.getByRole('button', { name: 'Cancel', exact: true }).focus()
      const stops = await collectModalCursorStops({ screenReader })
      expect(stops.join('\n')).not.toMatch(
        /dashboard|navigation|collections|creating new folder|untitled|save draft/i,
      )
      expect(stops.join('\n')).toMatch(/accessibility folder/i)
    })

    test('should move the screen-reader cursor into the add-widget drawer upon opening', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3644
      const { drawer, trigger } = await openWidgetDrawer({ page, serverURL })

      await trigger.focus()
      const capture = await captureScreenReader({
        action: () => trigger.press('Enter'),
        screenReader,
      })

      await expect(drawer).toBeVisible()
      expect(capture.itemText).toMatch(/close|add widget|search widgets/i)
      expect(capture.spokenPhrase).not.toMatch(/editing dashboard|save changes/i)
    })

    test('should move the screen-reader cursor into Copy to locale from the overflow menu', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3682
      await gotoFirstPost({ page, postsURL, serverURL })
      await page.locator('.doc-controls__popup .popup__trigger-wrap button').click()
      const trigger = page.locator('#copy-locale-data__button')

      await trigger.focus()
      const capture = await captureScreenReader({
        action: () => trigger.press('Enter'),
        screenReader,
      })

      await expect(page.locator('#copy-locale')).toBeVisible()
      expect(capture.itemText).toMatch(
        /close|copy to locale.*dialog|dialog.*copy to locale|copy to.*(combo|pop)/i,
      )
      expect(capture.itemText).not.toMatch(/skip to content|dashboard|more options/i)
    })

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
      await openNav(page)
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

  test.describe('2.4.6 Headings and Labels (AA)', () => {
    test('should announce Welcome and the signed-in account as a heading', async ({
      page,
      screenReader,
    }) => {
      await page.goto(`${serverURL}/admin`)
      await expect(page.getByRole('heading', { name: /^Welcome, /, level: 1 })).toBeVisible()

      const output = await navigateScreenReaderTo({ matches: /Welcome, /i, screenReader })

      expect(output).toMatch(/heading/i)
    })
  })

  test.describe('3.2.2 On Input (A)', () => {
    test('should announce automatic search and collection results', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3773
      for (const isColumnSearch of [false, true]) {
        await gotoPostsList({ page, postsURL })
        if (isColumnSearch) {
          await page.locator('.columns-button__button').click()
        }
        const search = isColumnSearch
          ? page
              .getByRole('dialog', { name: /columns/i })
              .getByRole('textbox', { name: /search columns/i })
          : page.locator('#search-filter-input')
        const focusCapture = await captureScreenReader({
          action: () => search.focus(),
          screenReader,
        })
        const resultsCapture = await captureScreenReader({
          action: async () => {
            await search.fill('no-matching-accessibility-result')
            if (isColumnSearch) {
              await expect(
                page.getByText('No matches found for this search', { exact: true }),
              ).toBeVisible()
            } else {
              await expect(page.locator('tbody tr')).toHaveCount(0)
              await expect(page.locator('.no-results__title')).toHaveText('No Results.')
            }
          },
          screenReader,
        })

        await expect(search).toBeFocused()
        expect
          .soft(
            (isColumnSearch &&
              /automatic|as you type|while you type/i.test(focusCapture.spokenPhrase)) ||
              /results found for.*(?:0|zero)|no (?:matches|results|posts)/i.test(
                resultsCapture.spokenPhrase,
              ),
            JSON.stringify({
              focus: focusCapture.spokenPhrase,
              isColumnSearch,
              results: resultsCapture.spokenPhrase,
            }),
          )
          .toBe(true)
      }
    })
  })

  test.describe('4.1.2 Name, Role, Value (A)', () => {
    test('should announce rich-text upload and relationship filter options in NVDA browse mode', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3662
      test.skip(
        screenReader.name !== 'NVDA',
        'The report concerns NVDA browse mode; VoiceOver is not equivalent evidence.',
      )
      for (const open of [openRichTextUploadDrawer, openRichTextRelationshipDrawer]) {
        for (const index of [0, 1]) {
          // Reopen for each control: Escape currently dismisses the containing drawer too.
          const drawer = await open({ page, postsURL })
          const comboboxes = await openDrawerFilters({
            collectionLabel: open === openRichTextRelationshipDrawer ? 'Post' : undefined,
            drawer,
          })
          const combobox = comboboxes.nth(index)

          await combobox.focus()
          await combobox.press('ArrowDown')
          const options = page.getByRole('option')

          await expect(options.first()).toBeVisible()
          const optionNames = await options.allTextContents()
          const stops: string[] = []

          // The focused editable combobox enters NVDA focus mode. Switch to browse mode
          // without Escape, which would also dismiss the option list.
          await screenReader.perform(NVDAKeyCodeCommands.toggleBetweenBrowseAndFocusMode)
          await expect(options.first()).toBeVisible()
          // NVDA's next command sends Down Arrow through its browse cursor.
          for (let step = 0; step < optionNames.length + 8; step++) {
            await screenReader.next()
            stops.push(await screenReader.itemText())
          }
          for (const name of optionNames) {
            expect(
              stops.some((stop) => stop.toLowerCase().includes(name.trim().toLowerCase())),
            ).toBe(true)
          }
          expect(stops.join('\n')).not.toMatch(/\bblank\b/i)
        }
      }
    })

    test('should announce the selected state of the active Theme option', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3645
      await page.goto(`${serverURL}/admin`)
      await openNav(page)
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
  test.describe('4.1.3 Status Messages (AA)', () => {
    test('should announce the unsaved Copy to locale toast without its close button', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3669
      await gotoFirstPost({ page, postsURL, serverURL })
      await screenReader.navigateToWebContent()
      await page.locator('#field-title').fill('Unsaved toast announcement regression')
      await page.locator('.doc-controls__popup .popup__trigger-wrap button').click()
      const capture = await captureScreenReader({
        action: async () => {
          await page.locator('#copy-locale-data__button').click()
          await expect(
            page.locator('[data-sonner-toast]').filter({ hasText: /unsaved/i }),
          ).toBeVisible()
        },
        screenReader,
      })

      expect(capture.spokenPhrase).toMatch(/unsaved/i)
      expect(capture.spokenPhrase).not.toMatch(/close toast/i)
    })

    test('should retain the trash toast while the screen-reader cursor reads it', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3580
      const apiURL = formatAdminURL({ apiRoute: '/api', path: '/posts', serverURL })
      const response = await page.request.post(apiURL, {
        data: { title: 'Toast cursor persistence regression' },
      })
      expect(response.ok()).toBe(true)
      const { doc } = await response.json()

      try {
        await gotoPostsList({ page, postsURL })
        const row = page
          .locator('tbody tr')
          .filter({ hasText: 'Toast cursor persistence regression' })
        await row.locator('.cell-_select input').check()
        await page.locator('.list-selection__button[aria-label="Delete"]').click()
        await page.locator('#confirm-delete-many-docs [data-dialog-action="confirm"]').click()
        const toast = page.locator('[data-sonner-toast]').filter({ hasText: /moved to trash/i })
        await expect(toast).toBeVisible()
        await screenReader.navigateToWebContent()
        for (let step = 0; step < 150; step++) {
          if (/moved to trash/i.test(await screenReader.itemText())) {
            break
          }
          await screenReader.next()
        }
        expect(
          await screenReader.itemText(),
          'The virtual cursor must reach the toast before testing persistence',
        ).toMatch(/moved to trash/i)
        // Real elapsed time matters: virtual cursor focus is not DOM focus or hover.
        await page.waitForTimeout(5000)
        await expect(toast).toBeVisible()
        expect(await screenReader.itemText()).toMatch(/moved to trash/i)
      } finally {
        const cleanup = await page.request.delete(`${apiURL}/${doc.id}?trash=true`)
        expect(cleanup.ok()).toBe(true)
      }
    })

    test('should announce global API depth changes while focus stays on the stepper', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3618
      await page.goto(
        formatAdminURL({ adminRoute: '/admin', path: '/globals/menu/api', serverURL }),
      )
      const depth = page.getByRole('spinbutton', { name: 'Depth', exact: true })
      await expect(depth).toBeVisible()
      await screenReader.navigateToWebContent()
      const initialDepth = Number(await depth.inputValue())
      const field = page.locator('.field-type.number').filter({ has: depth })

      for (const { name, value } of [
        { name: 'Increment', value: initialDepth + 1 },
        { name: 'Decrement', value: initialDepth },
      ]) {
        const stepper = field.getByRole('button', { name, exact: true })
        await stepper.focus()
        const capture = await captureScreenReader({
          action: async () => {
            await stepper.press('Enter')
            await expect(depth).toHaveValue(String(value))
          },
          screenReader,
        })
        await expect(stepper).toBeFocused()
        expect.soft(capture.spokenPhrase).toMatch(new RegExp(`\\b${value}\\b`))
      }
    })

    test('should announce table search result changes without moving focus', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3696
      test.setTimeout(60000)
      await gotoPostsList({ page, postsURL })
      const search = page.getByRole('textbox', { name: /search/i }).first()

      await search.focus()
      for (const { count, query, speech } of [
        {
          count: 1,
          query: 'Example post two',
          speech: /results found for.*(?:1|one)/i,
        },
        {
          count: 1,
          query: 'Example post three',
          speech: /results found for.*(?:1|one)/i,
        },
        {
          count: 0,
          query: 'no-such-accessibility-post',
          speech: /results found for.*(?:0|zero)/i,
        },
      ]) {
        const capture = await captureScreenReader({
          action: async () => {
            await search.fill(query)
            await expect(page.locator('tbody tr')).toHaveCount(count)
            await expect(page.getByRole('status').filter({ hasText: query })).toContainText(
              String(count),
            )
          },
          screenReader,
        })

        await expect(search).toBeFocused()
        expect(capture.spokenPhrase).toMatch(speech)
      }
    })
  })
})

async function collectModalCursorStops({ screenReader }: { screenReader: ScreenReaderPlaywright }) {
  const stops: string[] = []

  for (const direction of ['next', 'previous'] as const) {
    for (let step = 0; step < 40; step++) {
      await screenReader[direction]()
      stops.push(await screenReader.itemText())
    }
  }
  return stops
}

async function expectAdjacentValidationError({
  error,
  field,
  screenReader,
}: {
  error: Locator
  field: Locator
  screenReader: ScreenReaderPlaywright
}) {
  const message = (await error.innerText()).replace(/\s+/g, ' ').trim()
  const stops: string[] = []
  let hasAdjacentError = false

  // Permit the label and field wrapper between the input and its error, in either direction.
  for (const direction of ['previous', 'next'] as const) {
    await field.blur()
    await field.focus()
    for (let index = 0; index < 3; index++) {
      await screenReader[direction]()
      const text = (await screenReader.itemText()).replace(/\s+/g, ' ').trim()

      stops.push(text)
      if (text.includes(message)) {
        hasAdjacentError = true
        break
      }
      if (/dashboard|navigation|publish|save draft/i.test(text)) {
        break
      }
    }
    if (hasAdjacentError) {
      break
    }
  }
  expect(hasAdjacentError, JSON.stringify({ message, stops })).toBe(true)
}
