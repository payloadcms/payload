import { screenReaderTest as test } from '@guidepup/playwright'
import { expect } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatAdminURL } from 'payload/shared'

import { openGroupBy } from '../__helpers/e2e/groupBy/index.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { devUser } from '../credentials.js'
import {
  addCollectionQueryWidget,
  captureScreenReader,
  captureScreenReaderOutput,
  gotoFirstPost,
  gotoPostsList,
  navigateScreenReaderTo,
  openDashboardEditor,
  openDragReorderField,
  openNavigationFolders,
  openWidgetDrawer,
  waitForKeyboardDragActivation,
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

  test.beforeEach(async ({ page, screenReader }) => {
    const loginResponse = await page.request.post(
      formatAdminURL({ apiRoute: '/api', path: '/users/login', serverURL }),
      { data: devUser },
    )

    expect(loginResponse.ok()).toBe(true)
    await initPage({ page, serverURL })
    page.removeAllListeners('console')
    await screenReader.navigateToWebContent()
  })

  test.describe('1.3.1 Info and Relationships (A)', () => {
    for (const kind of ['Array', 'Blocks'] as const) {
      test(`should announce relative direction and position while dragging the ${kind} row`, async ({
        page,
        screenReader,
      }) => {
        // PYLD-3626
        const { handle } = await openDragReorderField({ kind, page, postsURL })

        await handle.focus()
        await screenReader.press('Space')
        await expect(handle).toHaveAttribute('aria-pressed', 'true')
        await waitForKeyboardDragActivation({ page })
        try {
          const output = await captureScreenReaderOutput({
            action: () =>
              page.keyboard.press(process.platform === 'darwin' ? 'Meta+ArrowDown' : 'ArrowDown'),
            screenReader,
          })

          expect.soft(output).toMatch(/down|after|below/i)
          expect(output).toMatch(/(?:position|order)(?:\s*:\s*|\s+)2|2 (?:of|out of) 2|second/i)
        } finally {
          await screenReader.press('Escape')
        }
      })
    }

    test(
      'should announce the deletion dialog before background page content',
      { tag: ['@dialogs', '@trash'] },
      async ({ page, screenReader }) => {
        // PYLD-3769
        await gotoFirstPost({ page, postsURL, serverURL })
        await page.locator('.doc-controls__popup .popup__trigger-wrap button').click()
        const trigger = page.getByRole('menuitem', {
          name: 'Delete',
          exact: true,
        })

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
      },
    )
  })
  test.describe('2.1.1 Keyboard (A)', () => {
    for (const kind of ['Array', 'Blocks'] as const) {
      test(`should drop the ${kind} row with the screen reader active`, async ({
        page,
        screenReader,
      }) => {
        // PYLD-3625
        const { handle, rows, values } = await openDragReorderField({
          kind,
          page,
          postsURL,
        })

        const initialSecondTop = (await rows.nth(1).boundingBox())!.y

        await handle.focus()
        try {
          await screenReader.press('Space')
          await expect(handle).toHaveAttribute('aria-pressed', 'true')
          await waitForKeyboardDragActivation({ page })
          await screenReader.press(process.platform === 'darwin' ? 'Meta+ArrowDown' : 'ArrowDown')
          await expect
            .poll(async () => (await rows.nth(1).boundingBox())!.y)
            .toBeLessThan(initialSecondTop)
          await screenReader.press('Space')
          await expect(values.nth(0)).toHaveValue('Second drag row')
          await expect(values.nth(1)).toHaveValue('First drag row')
          await expect(rows.nth(1).getByRole('button', { name: /drag to reorder/i })).toBeFocused()
          await expect(page.locator('body')).not.toHaveClass(/is-dragging/)
        } finally {
          await screenReader.press('Escape')
        }
      })
    }
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
          maxSteps: 8,
          screenReader,
          shouldMoveCursorToKeyboardFocus: true,
          shouldResetCursor: false,
          startAt: widget.locator('.draggable'),
        })
        expect(await screenReader.itemText()).toMatch(/edit.*collection query/i)
        await screenReader.act()
        await expect(page.locator('[id^="widget-editor-"]:visible')).toHaveCount(1)
        await page.keyboard.press('Escape')
        const sizeText = (await widget.locator('.widget-wrapper__size-btn').innerText()).trim()
        await navigateScreenReaderTo({
          matches: /edit.*collection query/i,
          maxSteps: 8,
          screenReader,
          shouldMoveCursorToKeyboardFocus: true,
          shouldResetCursor: false,
          startAt: widget.locator('.draggable'),
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
          maxSteps: 8,
          screenReader,
          shouldMoveCursorToKeyboardFocus: true,
          shouldResetCursor: false,
          startAt: widget.locator('.draggable'),
        })
        expect(await screenReader.itemText()).toMatch(/delete.*collection query/i)
        await screenReader.act()
        await expect(widget).toHaveCount(0)
      })
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

    test(
      'should keep the disabled Group by sort control in screen-reader navigation',
      { tag: ['@admin-navigation'] },
      async ({ page, screenReader }) => {
        // PYLD-3784
        await gotoPostsList({ page, postsURL })
        const { groupByContent } = await openGroupBy(page)

        await expect(
          groupByContent.getByRole('button', { name: 'Sort', exact: true }),
        ).toHaveAttribute('aria-disabled', 'true')
        const output = await navigateScreenReaderTo({
          matches: /sort.*(?:button|pop.?up)|(?:button|pop.?up).*sort/i,
          maxSteps: 12,
          screenReader,
          shouldEnterDialogs: true,
          startAt: groupByContent.getByRole('button', { name: 'Close', exact: true }),
        })

        expect(output).toMatch(/dimmed|disabled|unavailable/i)
      },
    )
  })

  test.describe('4.1.3 Status Messages (AA)', () => {
    test('should announce global API depth changes while focus stays on the stepper', async ({
      page,
      screenReader,
    }) => {
      // PYLD-3618
      await page.goto(
        formatAdminURL({
          adminRoute: '/admin',
          path: '/globals/menu/api',
          serverURL,
        }),
      )
      const depth = page.getByRole('spinbutton', {
        name: 'Depth',
        exact: true,
      })
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

    test(
      'should announce table search result changes without moving focus',
      { tag: ['@collection-navigation', '@admin-navigation'] },
      async ({ page, screenReader }) => {
        // PYLD-3696, PYLD-3773: result-announcement coverage complements the browser search-hint checks.
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
      },
    )

    test(
      'should announce navigation folder search results without moving focus',
      { tag: ['@admin-navigation'] },
      async ({ page, screenReader }) => {
        // PYLD-3582
        const sidebar = await openNavigationFolders({ page, serverURL })
        const search = sidebar.getByRole('textbox')
        const originalURL = page.url()

        await search.fill('Accessibility child folder')
        const capture = await captureScreenReader({
          action: async () => {
            await search.press('Enter')
            await expect(sidebar.locator('.hierarchy-search-results__list')).toContainText(
              'Accessibility child folder',
            )
          },
          screenReader,
        })

        await expect(search).toBeFocused()
        await expect(page).toHaveURL(originalURL)
        expect(capture.spokenPhrase).toMatch(
          /(?:1|one)\s+(?:search\s+)?result|(?:1|one)\s+folder|found\s+(?:1|one)|showing\s+(?:1|one)\s+of\s+(?:1|one)/i,
        )
      },
    )
  })
})
