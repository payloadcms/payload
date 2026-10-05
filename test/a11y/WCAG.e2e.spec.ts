import type { Locator, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { formatAdminURL } from 'payload/shared'

import type { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'

import { addGroupBy, clearGroupBy, openGroupBy } from '../__helpers/e2e/groupBy/index.js'
import { runAxeScan } from '../__helpers/e2e/runAxeScan.js'
import { getSelectMenu, selectInput } from '../__helpers/e2e/selectInput.js'
import { initPage } from '../__setup/e2e/initPage.js'
import {
  addCollectionQueryWidget,
  addTextBlock,
  cleanupModalMedia,
  expectFocusInside,
  expectOptionsToHaveAccessibleNames,
  expectPaintedFocus,
  getFocusIndicatorStyle,
  gotoCreatePost,
  gotoFirstPost,
  gotoPostsList,
  hasRenderedFocusIndicator,
  insertTextBlockWithKeyboard,
  openAccessibilityTestPage,
  openAPIKeyDialog,
  openBlockDatePicker,
  openBulkEditFieldSelect,
  openBulkUploadDialog,
  openCopyToLocaleDrawer,
  openDashboardEditor,
  openDrawerFilters,
  openEditImageDialog,
  openFirstBlockActions,
  openFolderCreationLocation,
  openGlobalAPI,
  openLivePreview,
  openLocaleOptions,
  openNavigation,
  openNavigationFolders,
  openPopupWithKeyboard,
  openPostsFilter,
  openRelationshipCreationDrawer,
  openRichTextRelationshipDrawer,
  openRichTextUploadDrawer,
  openTableColumns,
  openTableVersionHistory,
  openVersionComparison,
  openWidgetDrawer,
} from './helpers.js'

const openNavigationForUserMenu = async ({ page }: { page: Page }): Promise<void> => {
  const openNavigation = page.locator('.app-header--nav-open')

  if ((await openNavigation.count()) === 0) {
    await page.getByRole('button', { name: /open menu/i }).click()
    await expect(openNavigation).toHaveCount(1)
  }

  await expect(page.locator('.user-menu__trigger')).toBeVisible()
}

test.describe('WCAG 2.2 Level AA', () => {
  let page: Page
  let postsURL: AdminUrlUtil
  let serverURL: string

  test.beforeAll(async ({ browser }, testInfo) => {
    ;({ page, postsURL, serverURL } = await openAccessibilityTestPage({
      browser,
      testInfo,
    }))
  })

  test.afterEach(async () => {
    await cleanupModalMedia({ page })
  })

  test.afterAll(async () => {
    await page.context().close()
  })

  test.describe('1.1.1 Non-text Content (A)', () => {
    test('should expose the default login logo as an image named Payload', async ({ browser }) => {
      // PYLD-3609: expose the static logo without adding a keyboard Tab stop.
      const loginPage = await browser.newPage({
        extraHTTPHeaders: { DisableAutologin: 'true' },
      })

      try {
        await loginPage.goto(formatAdminURL({ adminRoute: '/admin', path: '/login', serverURL }))
        const logo = loginPage.getByRole('img', { name: 'Payload', exact: true })

        await expect(logo).toBeVisible()
        expect(await logo.evaluate((element) => element.tabIndex)).toBe(-1)
      } finally {
        await loginPage.close()
      }
    })
  })

  test.describe('1.3.1 Info and Relationships (A)', () => {
    test('should associate top-level, array, and block date-picker labels with their inputs', async () => {
      // PYLD-3819
      test.setTimeout(60000)
      await prepareBlockDateField({ page, postsURL })
      await page.locator('#field-items .array-field__add-row').click()
      const fields = page.locator('.date-time-field')

      await expect(fields).toHaveCount(3)
      for (const field of await fields.all()) {
        const label = field.locator('label.field-label').first()
        const input = field.getByRole('textbox')

        await expect(input).toBeVisible()
        expect
          .soft(await label.evaluate((element: HTMLLabelElement) => element.control?.tagName))
          .toBe('INPUT')
        await label.click()
        await expect.soft(input).toBeFocused()
        await page.keyboard.press('Escape')
      }
    })

    test('should expose the rich-text callout first toggle state through collapse and return', async () => {
      // PYLD-3667
      test.slow()
      await gotoCreatePost({ page, postsURL })
      const callout = getCallouts({ container: page.locator('main') }).first()
      const toggle = callout.locator('.collapsible__toggle')
      const content = callout.locator('.collapsible__content')

      await expect(content).toBeVisible()
      await toggle.focus()
      await expect.soft(toggle).toHaveAttribute('aria-expanded', 'true')
      await toggle.press('Enter')
      await expect(content).toBeHidden()
      await toggle.press('Tab')
      await page.keyboard.press('Shift+Tab')
      await expect(toggle).toBeFocused()
      await expect.soft(toggle).toHaveAttribute('aria-expanded', 'false')
      await toggle.press('Space')
      await expect(content).toBeVisible()
      await expect.soft(toggle).toHaveAttribute('aria-expanded', 'true')
    })

    test('should associate bulk collapse and show commands with their Array and Blocks labels', async () => {
      // PYLD-3629
      test.slow()
      await addTextBlock({ page, postsURL })
      await page.locator('#field-items .array-field__add-row').click()

      for (const [selector, name] of [
        ['#field-items', /items/i],
        ['#field-layout', /layout/i],
      ] as const) {
        const field = page.locator(selector)

        for (const command of [/collapse all/i, /show all/i]) {
          const button = field.getByRole('button', { name: command })

          await expect(button).toBeVisible()
          await expect.soft(button).toHaveAccessibleName(name)
        }
      }
    })

    test('should identify the navigation create-folder action before opening it', async () => {
      const sidebar = await openNavigationFolders({ page, serverURL })
      const create = sidebar.locator('.tree__create-button')

      await expect(create).toHaveAccessibleName(/create.*folder/i)
      await create.press('Enter')
      await expect(page.locator('dialog[id^="tree-create-"]')).toBeVisible()
    })

    test('should expose folder names and hierarchy during keyboard navigation', async () => {
      const sidebar = await openNavigationFolders({ page, serverURL })
      const parent = sidebar.getByRole('treeitem', { name: 'Accessibility folder', exact: true })
      const toggle = parent.locator(':scope > .tree-node__content-wrapper .tree-node__toggle')

      await expect(parent).toHaveAccessibleName('Accessibility folder')
      await expect(toggle).toHaveAccessibleName(/accessibility folder/i)
      await parent.focus()
      await parent.press('ArrowRight')
      const children = parent.getByRole('group').getByRole('treeitem')

      await expect(parent).toHaveAttribute('aria-level', '1')
      await expect(parent).toHaveAttribute('aria-expanded', 'true')
      await expect(parent).toHaveAccessibleName('Accessibility folder')
      await expect(toggle).toHaveAccessibleName(/accessibility folder/i)
      await expect(children).toHaveCount(2)
      await expect(children.first()).toHaveAttribute('aria-level', '2')
      await expect(children.first()).toHaveAccessibleName('Accessibility child folder')
      for (const child of await children.all()) {
        await page.keyboard.press('ArrowDown')
        await expect(child).toBeFocused()
      }
      await page.keyboard.press('ArrowDown')
      await expect(children.last()).toBeFocused()
      await page.keyboard.press('ArrowUp')
      await expect(children.first()).toBeFocused()
      await page.keyboard.press('ArrowUp')
      await expect(parent).toBeFocused()
      await children.first().focus()
      await expect(children.first()).toBeFocused()
      await toggle.click()
      await expect(children).toHaveCount(0)
      await expect(sidebar.locator('[role=treeitem][tabindex="0"]')).toHaveCount(1)
      await sidebar.locator('.tree__create-button').focus()
      await page.keyboard.press('Shift+Tab')
      const all = sidebar.getByRole('treeitem', { name: /all.*folders/i })

      await expect(all).toBeFocused()
      await all.press('ArrowDown')
      await expect(parent).toBeFocused()
      await parent.press('ArrowRight')
      await expect(children).toHaveCount(2)
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
      await expect(children.last()).toHaveAttribute('aria-selected', 'true')
      await expect(page).toHaveURL(/_h_payload-folders=/)
      await expect(
        page.getByRole('heading', { name: 'Accessibility final child folder', exact: true }),
      ).toBeVisible()
    })

    test('should expose column editor headings and named toggles', async () => {
      test.setTimeout(60000)
      const columns = await openTableColumns({ page, postsURL })

      await test.step('should expose table column editor titles as headings', async () => {
        // PYLD-3749

        for (const name of ['Edit Columns', 'Shown in table', 'Not shown in table']) {
          await expect
            .soft(columns.getByRole('heading', { name: new RegExp(`^${name}$`, 'i') }))
            .toBeVisible()
        }
      })

      await test.step('should name each table column toggle after its visible column label', async () => {
        // PYLD-3748
        const items = columns.locator('.column-selector__item')

        await expect(items.first()).toBeVisible()
        for (const item of await items.all()) {
          const label = (await item.locator('.column-selector__item-label').innerText()).trim()

          const snapshot = await item.getByRole('checkbox').ariaSnapshot()

          expect.soft(snapshot.match(/^- checkbox "(.*?)"/)?.[1]).toBe(label)
        }
      })
    })

    test('should give collection and version counts context', async () => {
      test.setTimeout(120000)
      await test.step('should give table item counts document context', async () => {
        // PYLD-3693
        await gotoPostsList({ page, postsURL })
        const count = page.locator('.page-controls__page-info')

        await expect(count).toBeVisible()
        expect(await count.ariaSnapshot()).toMatch(/posts|documents|items|results/i)
      })

      await test.step('should give version table counts version context', async () => {
        // PYLD-3711
        for (const kind of ['collection', 'global'] as const) {
          const view = await openTableVersionHistory({ kind, page, postsURL, serverURL })
          const count = view.locator('.page-controls__page-info')

          await expect(count).toBeVisible()
          expect.soft(await count.ariaSnapshot(), kind).toMatch(/versions/i)
        }
      })
    })

    test('should associate table page input and total with their table', async () => {
      // PYLD-3694
      test.setTimeout(60000)
      try {
        await page.goto(`${postsURL.list}?limit=1`)
        const table = page.locator('table').first()
        const paginator = page.locator('.paginator')
        const input = paginator.getByRole('textbox')

        await expect(table.locator('tbody tr')).toHaveCount(1)
        await expect(input).toHaveAccessibleName('Go to table page')
        await expect(table).toHaveAttribute('id', /\S/)
        const tableID = await table.getAttribute('id')

        await expect(input).toHaveAttribute('aria-controls', tableID!)
        await expect(input).toHaveAccessibleDescription('Enter a page number from 1 to 3.')
      } finally {
        await page.goto(`${postsURL.list}?limit=10`)
      }
    })

    test('should keep rich-text drawer table header names free of sort commands', async () => {
      // PYLD-3659
      test.setTimeout(60000)
      for (const openDrawer of [openRichTextRelationshipDrawer, openRichTextUploadDrawer]) {
        if (openDrawer === openRichTextUploadDrawer) {
          await openEditImageDialog({ page, serverURL })
        }
        const drawer = await openDrawer({ page, postsURL })
        const headers = drawer.locator('th:has(.sort-column__button)')

        await expect(drawer.getByRole('main')).toHaveCount(0)

        await expect(headers.first()).toBeVisible()
        for (const header of await headers.all()) {
          const label = (await header.locator('.sort-column__label').innerText()).trim()

          await expect.soft(header).toHaveAccessibleName(label)
        }
      }
    })

    test('should associate coordinate labels with their inputs', async () => {
      // PYLD-3824, PYLD-3607
      await gotoCreatePost({ page, postsURL })
      for (const coordinate of ['Longitude', 'Latitude']) {
        const label = page.locator('.point label').filter({ hasText: `Location - ${coordinate}` })
        const input = page.locator(`input[name="location.${coordinate.toLowerCase()}"]`)

        await expect(label).toBeVisible()
        await expect(input).toBeVisible()
        await expect.soft(input).toHaveAccessibleName(new RegExp(`Location.*${coordinate}`, 'i'))
        await label.click()
        await expect.soft(input).toBeFocused()
        expect
          .soft(await label.evaluate((element: HTMLLabelElement) => element.control?.id))
          .toBe(await input.getAttribute('id'))
      }
    })

    test('should associate JSON and Code labels with their editors', async () => {
      // PYLD-3822
      test.setTimeout(60000)
      await gotoCreatePost({ page, postsURL })
      for (const [field, labelText] of [
        ['settings', 'Settings'],
        ['source', 'Source'],
      ] as const) {
        const wrapper = page.locator(`#field-${field}`)
        const input = wrapper.getByRole('textbox')
        const label = page.locator('.field-label').filter({ hasText: new RegExp(`^${labelText}$`) })

        await wrapper.scrollIntoViewIfNeeded()
        await expect(input).toBeAttached()
        await label.click()
        await expect.soft(input).toBeFocused()
        await expect.soft(input).toHaveAccessibleName(new RegExp(labelText, 'i'))
      }
      for (const field of ['unlabelledSettings', 'unlabelledSource']) {
        const wrapper = page.locator(`#field-${field}`)

        await wrapper.scrollIntoViewIfNeeded()
        await expect.soft(wrapper.getByRole('textbox')).toHaveAccessibleName('Editor content')
      }
    })

    test('should focus select inputs when their labels are clicked', async () => {
      // PYLD-3814
      await gotoCreatePost({ page, postsURL })
      for (const name of ['Accessibility Select', 'Required Tags']) {
        const label = page.locator('label').filter({ hasText: name })
        const field = page.locator('.field-type').filter({ has: label })
        const input = field.getByRole('combobox')

        await expect(input).toHaveAccessibleName(name)
        await label.click()
        await expect(input).toBeFocused()
        expect(await label.evaluate((element: HTMLLabelElement) => element.control?.id)).toBe(
          await input.getAttribute('id'),
        )
      }
    })

    test('should associate rich-text toolbars with their fields', async () => {
      // PYLD-3788, PYLD-3780, PYLD-3742
      await addTextBlock({ page, postsURL })
      for (const [selector, name] of [
        ['[data-field-path="content"]', 'Content'],
        ['[data-field-path="layout.0.body"]', 'Body'],
      ] as const) {
        const field = page.locator(selector)
        const toolbar = field.locator('.fixed-toolbar')
        const editor = field.locator('[contenteditable="true"]').first()

        await expect(editor).toBeVisible()
        await expect(editor).toHaveAccessibleName(name)

        await expect(toolbar).toBeVisible()
        await expect(toolbar.getByRole('button').first()).toBeVisible()
        const namedContainer = page
          .getByRole('group', { name: new RegExp(name, 'i') })
          .or(page.getByRole('toolbar', { name: new RegExp(name, 'i') }))
          .or(page.getByRole('region', { name: new RegExp(name, 'i') }))

        for (const button of await toolbar.getByRole('button').all()) {
          await expect.soft(namedContainer.getByRole('button').and(button)).toHaveCount(1)
        }
      }
    })

    test('should name and operate collection and version sort controls', async () => {
      test.setTimeout(120000)
      await test.step('should name table sort controls with the column and direction', async () => {
        // PYLD-3597
        await page.goto(`${postsURL.list}?sort=-updatedAt`)
        const headers = page.locator('th:has(.sort-column__button)')

        await expect(headers.first()).toBeVisible()
        for (const header of await headers.all()) {
          const label = (await header.locator('.sort-column__label').innerText()).trim()

          await expect(header.locator('.sort-column__button')).toHaveCount(2)
          for (const direction of ['ascending', 'descending']) {
            const button = header.getByRole('button', { name: new RegExp(direction, 'i') })

            await expect(button).toHaveAccessibleName(
              new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
            )
          }
        }

        const header = page.locator('#heading-title')
        const descending = header.getByRole('button', { name: /descending/i })
        const ascending = header.getByRole('button', { name: /ascending/i })

        await page.getByRole('grid').locator('thead').getByRole('checkbox').focus()
        await page.keyboard.press('ArrowRight')
        await expect(descending).toBeFocused()
        await expect(header).toHaveRole('columnheader')
        await expect(header.getByRole('button')).toHaveCount(2)
        await page.keyboard.press('ArrowRight')
        await expect(ascending).toBeFocused()
        await page.keyboard.press('ArrowRight')
        await expect(
          page.locator('#heading-accessibilitySelect').getByRole('button', { name: /descending/i }),
        ).toBeFocused()
        await page.keyboard.press('ArrowLeft')
        await expect(ascending).toBeFocused()
        await page.keyboard.press('Enter')
        await expect(header).toHaveAttribute('aria-sort', 'ascending')
        await expect(ascending).toBeFocused()
        await page.keyboard.press('ArrowLeft')
        await expect(descending).toBeFocused()
        await page.keyboard.press('Enter')
        await expect(header).toHaveAttribute('aria-sort', 'descending')
        await expect(descending).toBeFocused()
        await page.keyboard.press('Escape')
        await expect(descending).toBeFocused()
        await page.keyboard.press('ArrowDown')
        await expect(
          page.getByRole('grid').locator('tbody tr').first().locator('.cell-title'),
        ).toBeFocused()
        await page.keyboard.press('ArrowUp')
        await expect(descending).toBeFocused()
        await page.keyboard.press('ArrowRight')
        await expect(ascending).toBeFocused()
        await page.keyboard.press('Tab')
        await expect
          .poll(() =>
            page.getByRole('grid').evaluate((grid) => grid.contains(document.activeElement)),
          )
          .toBe(false)
      })

      await test.step('should resolve version table sort labels before any sort selection', async () => {
        // PYLD-3709
        for (const kind of ['collection', 'global'] as const) {
          const view = await openTableVersionHistory({ kind, page, postsURL, serverURL })
          const headers = view.locator('th:has(.sort-column__button)')

          await expect(headers.first()).toBeVisible()
          for (const header of await headers.all()) {
            const label = (await header.locator('.sort-column__label').innerText()).trim()

            for (const button of await header.getByRole('button').all()) {
              const snapshot = await button.ariaSnapshot()

              expect.soft(snapshot).not.toMatch(/\{\{|undefined|object Object/i)
              expect.soft(snapshot).toContain(label)
            }
          }
        }
      })
    })

    test('should expose image-edit section titles as headings', async () => {
      // PYLD-3576
      const dialog = await openEditImageDialog({ page, serverURL })

      await expect.soft(dialog.getByRole('heading', { name: 'Crop', exact: true })).toBeVisible()
      await expect
        .soft(dialog.getByRole('heading', { name: 'Focal Point', exact: true }))
        .toBeVisible()
    })

    test('should preserve image-edit title typography when changing spans to headings', async () => {
      const dialog = await openEditImageDialog({ page, serverURL })

      await page.evaluate(() => document.fonts.ready)
      for (const name of ['Crop', 'Focal Point']) {
        const heading = dialog.getByRole('heading', { name, exact: true })

        await expect(heading).toBeVisible()
        const comparison = await compareHeadingWithOriginalSpan({
          heading,
          originalStyle: `
            font-family: var(--text-body-medium-strong-font-family);
            font-size: var(--text-body-medium-strong-font-size);
            font-weight: var(--text-body-medium-strong-font-weight);
            line-height: var(--text-body-medium-strong-line-height);
            color: var(--color-text);
          `,
        })

        await test.info().attach(`${name}-typography-before-after`, {
          body: JSON.stringify(comparison, null, 2),
          contentType: 'application/json',
        })
        expect.soft(comparison.after, name).toEqual(comparison.before)
      }
    })

    test('should expose the folder location column title as a heading', async () => {
      // PYLD-3586
      const modal = await openFolderCreationLocation({ page, serverURL })

      await expect(modal.getByRole('heading', { name: 'All', exact: true })).toBeVisible()
    })

    test('should preserve folder column title typography when changing span to heading', async () => {
      const modal = await openFolderCreationLocation({ page, serverURL })
      const heading = modal.getByRole('heading', { name: 'All', exact: true })

      await expect(heading).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      const comparison = await compareHeadingWithOriginalSpan({
        heading,
        originalStyle: `
          display: flex; align-items: center; gap: var(--spacer-2);
          font-weight: 500; color: var(--color-text); white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        `,
      })

      await test.info().attach('title-typography-before-after', {
        body: JSON.stringify(comparison, null, 2),
        contentType: 'application/json',
      })
      expect(comparison.after).toEqual(comparison.before)
    })

    test('should preserve the meaning and semantic emphasis of API-key replacement warnings', async () => {
      // PYLD-3616
      const dialog = await openAPIKeyDialog({ page, serverURL })

      // The current UI emphasizes the affected key suffix, rather than the word "invalidate".
      await expect(dialog).toContainText(/invalidate.*1234/i)
      await expect(dialog.locator('strong')).toHaveText('1234')
      // Spoken emphasis depends on screen-reader verbosity; confirm manually with VoiceOver.
    })

    test('should expose the add-widget title as a heading', async () => {
      // PYLD-3648
      const { drawer, trigger } = await openWidgetDrawer({ page, serverURL })

      await trigger.press('Enter')
      await expect(drawer.getByRole('heading', { name: /add widget/i })).toBeVisible()
    })

    test('should expose the relationship creation panel title as a heading', async () => {
      // PYLD-3653
      const drawer = await openRelationshipCreationDrawer({ page, postsURL })

      await expect(drawer.getByRole('heading', { name: /creating new post/i })).toBeVisible()
    })

    test('should give the Copy to locale combobox an accessible name', async () => {
      // PYLD-3687
      const drawer = await openCopyToLocaleDrawer({ page, postsURL, serverURL })
      const combobox = drawer.locator('#field-toLocale input[role="combobox"]')

      await expect(combobox).toHaveAccessibleName(/copy to/i)
    })

    test('should associate the per-page control with the related table', async () => {
      // PYLD-3692
      await gotoPostsList({ page, postsURL })
      const perPageButton = page.locator('.per-page .popup__trigger-wrap button')

      await expect(perPageButton).toHaveAccessibleName(/per page/i)
      await expect(perPageButton).toHaveAttribute('aria-haspopup', /true|menu/)
      const controlledIds = (await perPageButton.getAttribute('aria-controls'))?.split(' ') || []
      const tableId = controlledIds.find((controlledId) =>
        controlledId.startsWith('payload-table-'),
      )

      expect(tableId).toBeTruthy()
      await expect(page.locator(`#${tableId}`)).toHaveCount(1)
    })

    test('should give every grouped table a unique ID and group-specific name', async () => {
      // Additional coverage for PYLD-3692.
      await gotoPostsList({ page, postsURL })
      await addGroupBy(page, {
        fieldLabel: 'Accessibility Select',
        fieldPath: 'accessibilitySelect',
      })
      try {
        await expect
          .poll(() => page.locator('table[id^="payload-table-"]').count())
          .toBeGreaterThan(1)
        const tableIds = await page
          .locator('table[id^="payload-table-"]')
          .evaluateAll((tables) => tables.map((table) => table.id))

        expect(tableIds.length).toBeGreaterThan(1)
        expect(new Set(tableIds).size).toBe(tableIds.length)
        await expect(
          page.getByRole('grid', { name: 'Posts: Value One', exact: true }),
        ).toBeVisible()
        await expect(
          page.getByRole('grid', { name: 'Posts: Value Two', exact: true }),
        ).toBeVisible()
      } finally {
        await clearGroupBy(page)
        await expect(page.locator('table')).toHaveCount(1)
      }
    })

    test('should expose the active sort direction on relationship table headers and buttons', async () => {
      // Additional coverage for PYLD-3660.
      const drawer = await openRichTextRelationshipDrawer({ page, postsURL })
      const header = drawer.locator('th:has(.sort-column)').first()
      const label = (await header.locator('.sort-column__label').innerText()).trim()
      const ascendingButton = header.locator('.sort-column__asc')
      const descendingButton = header.locator('.sort-column__desc')

      await expect(header).not.toHaveAttribute('aria-sort', /.+/)

      await ascendingButton.click()
      await expect(header).toHaveAccessibleName(label)
      await expect(header).toHaveAttribute('aria-sort', 'ascending')
      await expect(ascendingButton).toHaveAttribute('aria-pressed', 'true')
      await expect(descendingButton).toHaveAttribute('aria-pressed', 'false')

      await descendingButton.click()
      await expect(header).toHaveAttribute('aria-sort', 'descending')
      await expect(ascendingButton).toHaveAttribute('aria-pressed', 'false')
      await expect(descendingButton).toHaveAttribute('aria-pressed', 'true')
    })
  })

  test.describe('1.4.10 Reflow (AA)', () => {
    test('should truncate a long account label without obscuring the menu icon', async () => {
      await page.goto(`${serverURL}/admin`)
      await openNavigationForUserMenu({ page })

      const navHeader = page.locator('.nav__header')
      const trigger = page.locator('.user-menu__trigger')
      const label = trigger.locator('.btn__label')
      const icon = trigger.locator('.btn__icon')

      await label.evaluate((element) => {
        element.textContent = 'devthisismynameandiloveit@payloadcms.com'
      })

      const [headerBox, triggerBox, labelBox, iconBox] = await Promise.all([
        navHeader.boundingBox(),
        trigger.boundingBox(),
        label.boundingBox(),
        icon.boundingBox(),
      ])
      const labelMetrics = await label.evaluate((element) => ({
        clientWidth: element.clientWidth,
        overflow: getComputedStyle(element).overflow,
        scrollWidth: element.scrollWidth,
        textOverflow: getComputedStyle(element).textOverflow,
      }))

      expect(headerBox).not.toBeNull()
      expect(triggerBox).not.toBeNull()
      expect(labelBox).not.toBeNull()
      expect(iconBox).not.toBeNull()
      expect(triggerBox!.x + triggerBox!.width).toBeLessThanOrEqual(headerBox!.x + headerBox!.width)
      expect(labelBox!.x + labelBox!.width).toBeLessThanOrEqual(iconBox!.x)
      expect(iconBox!.x + iconBox!.width).toBeLessThanOrEqual(triggerBox!.x + triggerBox!.width)
      expect(labelMetrics).toMatchObject({
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      })
      expect(labelMetrics.scrollWidth).toBeGreaterThan(labelMetrics.clientWidth)
    })

    test('should keep collection cards within a 320px viewport', async () => {
      const previousViewport = page.viewportSize()

      try {
        await page.setViewportSize({ height: 720, width: 320 })
        await page.goto(`${serverURL}/admin`)

        const cards = page.locator('.collections__card-list .card')

        expect(await cards.count()).toBeGreaterThan(0)
        for (const card of await cards.all()) {
          const box = await card.boundingBox()

          expect(box).not.toBeNull()
          expect(box!.x).toBeGreaterThanOrEqual(0)
          expect(box!.x + box!.width).toBeLessThanOrEqual(320)
        }
      } finally {
        if (previousViewport) {
          await page.setViewportSize(previousViewport)
        }
      }
    })

    test('should ellipsize long selected values without obscuring their remove control', async () => {
      // Additional coverage for PYLD-3811.
      const fieldSelect = await openBulkEditFieldSelect({ page, postsURL })
      await selectInput({
        multiSelect: false,
        option: 'Accessibility Sortable Select',
        page,
        selectLocator: fieldSelect,
      })
      const selectedValue = fieldSelect
        .locator('.rs__multi-value')
        .filter({ hasText: 'Accessibility Sortable Select' })
      const labelWrapper = selectedValue.locator('.multi-value-label')
      const label = selectedValue.locator('.multi-value-label__text')
      const renderedLabel = label.locator(':scope > span')
      const removeButton = selectedValue.locator('.multi-value-remove')
      const [labelWrapperBox, labelBox, removeButtonBox] = await Promise.all([
        labelWrapper.boundingBox(),
        label.boundingBox(),
        removeButton.boundingBox(),
      ])

      expect(labelWrapperBox).not.toBeNull()
      expect(labelBox).not.toBeNull()
      expect(removeButtonBox).not.toBeNull()
      expect(labelBox!.width).toBeLessThanOrEqual(labelWrapperBox!.width)
      expect(labelBox!.x + labelBox!.width).toBeLessThanOrEqual(removeButtonBox!.x)
      const labelMetrics = await label.evaluate((element) => ({
        overflow: getComputedStyle(element).overflow,
        textOverflow: getComputedStyle(element).textOverflow,
      }))
      const wrapperOverflow = await labelWrapper.evaluate(
        (element) => getComputedStyle(element).overflow,
      )
      const renderedLabelMetrics = await renderedLabel.evaluate((element) => ({
        clientWidth: element.clientWidth,
        overflow: getComputedStyle(element).overflow,
        scrollWidth: element.scrollWidth,
        textOverflow: getComputedStyle(element).textOverflow,
      }))

      expect(labelMetrics).toMatchObject({
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      })
      expect(wrapperOverflow).toBe('hidden')
      expect(renderedLabelMetrics).toMatchObject({
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      })
      expect(renderedLabelMetrics.scrollWidth).toBeGreaterThan(renderedLabelMetrics.clientWidth)
      const centers = await selectedValue.evaluate((element) => {
        const chipRect = element.getBoundingClientRect()
        const centerY = (selector: string) => {
          const target = element.querySelector(selector)
          if (!target) {
            return null
          }
          const { height, y } = target.getBoundingClientRect()
          return y + height / 2
        }

        return {
          chip: chipRect.y + chipRect.height / 2,
          icon: centerY('.multi-value-remove__icon'),
          text: centerY('.multi-value-label__text > span'),
        }
      })

      if (centers.icon === null || centers.text === null) {
        throw new Error('Expected the multi-value chip to contain its icon and text')
      }
      expect(Math.abs(centers.text - centers.chip)).toBeLessThanOrEqual(0.5)
      expect(Math.abs(centers.icon - centers.chip)).toBeLessThanOrEqual(0.5)
      await expect(removeButton).toBeVisible()
    })
  })

  test.describe('2.1.1 Keyboard (A)', () => {
    test('should open the upload dropzone modal from its button with the keyboard', async () => {
      // PYLD-4166
      await page.goto(`${serverURL}/admin`)

      const widget = page.locator('.upload-dropzone-widget')
      const button = widget.getByRole('button', { name: 'Upload files' })
      const dropzone = widget.locator('.upload-dropzone-widget__dropzone')

      await expect(button).toBeVisible()
      await expect(dropzone).not.toHaveAttribute('tabindex', '0')
      await button.focus()
      await expect(button).toBeFocused()
      await button.press('Enter')

      const modal = page.locator('#bulk-upload-modal-slug-1')
      await expect(modal).toBeVisible()
      await expect(modal.locator('.bulk-upload--add-files')).toBeVisible()
      await modal.getByRole('button', { name: 'Close' }).click()
      await expect(button).toBeFocused()
    })

    test('should choose the upload collection from the dropzone modal with the keyboard', async () => {
      await page.goto(`${serverURL}/admin`)
      await page
        .locator('.upload-dropzone-widget')
        .getByRole('button', { name: 'Upload files' })
        .click()

      const modal = page.locator('#bulk-upload-modal-slug-1')
      const collection = modal.getByRole('combobox', { name: 'Collection' })
      await expect(collection).toBeVisible()
      await collection.focus()
      await collection.pressSequentially('Media Alt')
      await collection.press('Enter')

      await expect(modal.locator('.bulk-upload--add-files__collectionSelect')).toContainText(
        'Media Alt',
      )
    })

    test('should keep incompatible upload destinations visible and skip them with the keyboard', async () => {
      await page.goto(`${serverURL}/admin`)
      await page
        .locator('.upload-dropzone-widget')
        .getByRole('button', { name: 'Upload files' })
        .click()

      const modal = page.locator('#bulk-upload-modal-slug-1')

      await selectInput({
        multiSelect: false,
        option: 'Media Alt',
        page,
        selectLocator: modal.locator('.bulk-upload--add-files__collectionSelect'),
      })
      await modal.locator('.dropzone input[type="file"]').setInputFiles({
        name: 'keyboard.pdf',
        buffer: Buffer.from('pdf'),
        mimeType: 'application/pdf',
      })

      const destination = modal.locator('.file-selections__collectionSelect')
      const input = destination.getByRole('combobox', { name: 'Collection', exact: true })

      await expect(input).toBeVisible()
      await input.focus()
      await input.press('ArrowDown')
      await expect(
        getSelectMenu({ page }).getByRole('option', {
          name: 'Media (Accepts: image/*)',
          exact: true,
        }),
      ).toHaveAttribute('aria-disabled', 'true')
      await input.press('Home')
      await input.press('Enter')
      await expect(destination.locator('.react-select--single-value')).toHaveText('Media Alt')
      await expect(input).toBeFocused()

      await modal.locator('.file-selections__remove--overlay').click()

      const addFilesDestination = modal.locator('.bulk-upload--add-files__collectionSelect')
      const addFilesInput = addFilesDestination.getByRole('combobox', {
        name: 'Collection',
        exact: true,
      })

      await addFilesInput.focus()
      await addFilesInput.press('ArrowDown')
      await expect(
        getSelectMenu({ page }).getByRole('option', { name: 'Media', exact: true }),
      ).not.toHaveAttribute('aria-disabled', 'true')
      await addFilesInput.press('Home')
      await addFilesInput.press('Enter')
      await expect(addFilesDestination.locator('.react-select--single-value')).toHaveText('Media')
    })

    test('should navigate and select collection grid rows without trapping keyboard focus', async () => {
      await gotoPostsList({ page, postsURL })
      const grid = page.getByRole('grid', { name: 'Posts', exact: true })
      const rows = grid.locator('tbody tr')
      const originalDirection = await page.locator('html').getAttribute('dir')

      await expect(rows.nth(0)).toHaveAccessibleName('1')
      await rows.nth(0).locator('.cell-title').focus()
      await page.keyboard.press('ArrowDown')
      await expect(rows.nth(1).locator('.cell-title')).toBeFocused()
      await page.keyboard.press('ArrowRight')
      await expect(rows.nth(1).locator('.cell-accessibilitySelect')).toBeFocused()
      await page.keyboard.press('ArrowUp')
      await expect(rows.nth(0).locator('.cell-accessibilitySelect')).toBeFocused()
      await page.keyboard.press('Home')
      const checkbox = rows.nth(0).getByRole('checkbox')

      await expect(checkbox).toBeFocused()
      const title = await rows.nth(0).locator('.cell-title').innerText()

      await expect(checkbox).toHaveAccessibleName(`Select ${title}, Row 1`)
      await expect(checkbox).not.toBeChecked()
      await page.keyboard.press('Space')
      await expect(rows.nth(0)).toHaveAttribute('aria-selected', 'true')
      await page.keyboard.press('Space')
      await expect(rows.nth(0)).toHaveAttribute('aria-selected', 'false')
      await page.keyboard.press('End')
      await expect(rows.nth(0).locator('td').last()).toBeFocused()
      await page.keyboard.press('Tab')
      await expect
        .poll(() => grid.evaluate((element) => element.contains(document.activeElement)))
        .toBe(false)
      await page.keyboard.press('Shift+Tab')
      await expect(rows.nth(0).locator('td').last()).toBeFocused()

      try {
        await page.locator('html').evaluate((element) => element.setAttribute('dir', 'rtl'))
        await rows.nth(0).locator('.cell-title').focus()
        await page.keyboard.press('ArrowLeft')
        await expect(rows.nth(0).locator('.cell-accessibilitySelect')).toBeFocused()
        await page.keyboard.press('Control+Home')
        await expect(grid.locator('thead').getByRole('checkbox')).toBeFocused()
        await page.keyboard.press('ArrowUp')
        await expect(grid.locator('thead').getByRole('checkbox')).toBeFocused()
        await page.keyboard.press('Control+End')
        await expect(rows.last().locator('td').last()).toBeFocused()
        await page.keyboard.press('ArrowDown')
        await expect(rows.last().locator('td').last()).toBeFocused()
      } finally {
        await page.locator('html').evaluate((element, direction) => {
          if (direction === null) {
            element.removeAttribute('dir')
          } else {
            element.setAttribute('dir', direction)
          }
        }, originalDirection)
      }

      await grid
        .locator('#heading-title')
        .getByRole('button', { name: /ascending/i })
        .click()
      await rows.nth(0).getByRole('checkbox').click()
      await page.keyboard.press('ArrowDown')
      await expect(rows.nth(1).getByRole('checkbox')).toBeFocused()
      await rows.nth(0).getByRole('checkbox').uncheck()
    })

    test('should enter and leave custom collection grid controls while respecting their keys', async () => {
      const columns = encodeURIComponent(JSON.stringify(['title', 'subtitle']))

      try {
        await page.goto(`${postsURL.list}?columns=${columns}&limit=10`)
        const grid = page.getByRole('grid', { name: 'Posts', exact: true })
        const row = grid.locator('tbody tr').first()
        const cell = row.locator('.cell-subtitle')
        const input = cell.getByRole('textbox', { name: 'Cell note' })
        const listbox = cell.getByRole('listbox', { name: 'Cell choices' })

        await expect(listbox).toHaveAttribute('tabindex', '-1')
        await cell.focus()
        await page.keyboard.press('F2')
        await expect(input).toBeFocused()
        await input.evaluate((element: HTMLInputElement) => {
          element.disabled = true
        })
        await expect(cell).toBeFocused()
        await expect(cell).toHaveAttribute('tabindex', '0')
        await input.evaluate((element: HTMLInputElement) => {
          element.disabled = false
        })
        await cell.evaluate((element: HTMLElement) => {
          element.hidden = true
        })
        await expect(row.locator('.cell-title')).toBeFocused()
        await cell.evaluate((element: HTMLElement) => {
          element.hidden = false
        })
        await cell.focus()
        await page.keyboard.press('F2')
        await expect(input).toBeFocused()
        await page.keyboard.press('ArrowLeft')
        await expect(input).toBeFocused()
        await input.fill('Unsaved edit')
        await page.keyboard.press('Escape')
        await expect(input).toHaveValue('Example note')
        await expect(input).toBeFocused()
        await page.keyboard.press('Escape')
        await expect(cell).toBeFocused()
        await page.keyboard.press('Enter')
        await page.keyboard.press('Shift+Tab')
        await expect
          .poll(() => grid.evaluate((element) => element.contains(document.activeElement)))
          .toBe(false)
        await cell.focus()
        await page.keyboard.press('F2')
        await page.keyboard.press('Tab')
        await expect(cell.getByRole('button', { name: 'Clear note', exact: true })).toBeFocused()
        await page.keyboard.press('Enter')
        await expect(input).toHaveValue('')
        await page.keyboard.press('Tab')
        await expect(listbox).toBeFocused()
        await page.keyboard.press('Tab')
        const firstAction = cell.getByRole('button', { name: 'First action', exact: true })
        const secondAction = cell.getByRole('button', { name: 'Second action', exact: true })

        await expect(firstAction).toBeFocused()
        await page.keyboard.press('ArrowRight')
        await expect(secondAction).toBeFocused()
        await expect(firstAction).toHaveAttribute('tabindex', '-1')
        await expect(secondAction).toHaveAttribute('tabindex', '0')
        await page.keyboard.press('Escape')
        await expect(cell).toBeFocused()
        await page.keyboard.press('F2')
        await page.keyboard.press('Tab')
        await page.keyboard.press('Tab')
        await page.keyboard.press('Tab')
        await expect(secondAction).toBeFocused()
        await page.keyboard.press('Tab')
        await expect
          .poll(() => grid.evaluate((element) => element.contains(document.activeElement)))
          .toBe(false)
      } finally {
        const defaults = encodeURIComponent(
          JSON.stringify(['title', 'accessibilitySelect', 'updatedAt']),
        )

        await page.goto(`${postsURL.list}?columns=${defaults}&limit=10`)
      }
    })

    test('should reset grid entry after record navigation and retain it through column changes', async () => {
      await gotoPostsList({ page, postsURL })
      const grid = page.getByRole('grid', { name: 'Posts', exact: true })
      const title = grid.getByRole('link', { name: 'Example post two', exact: true })
      const defaults = encodeURIComponent(
        JSON.stringify(['title', 'accessibilitySelect', 'updatedAt']),
      )

      try {
        await title.focus()
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(/\/posts\/[^/?]+$/)
        await expect(page.locator('#field-title')).toHaveValue('Example post two')
        await page.locator('.step-nav').getByRole('link', { name: 'Posts', exact: true }).click()
        const firstCell = grid.locator('tbody .cell--linked').first()

        await expect(firstCell).toHaveAttribute('tabindex', '0')
        await page.getByRole('link', { name: 'Create New', exact: true }).focus()
        await page.keyboard.press('Tab')
        await expect(firstCell).toBeFocused()
        const target = grid.locator('tbody tr').first().locator('.cell-updatedAt')

        await target.focus()
        await page.getByRole('button', { name: 'Columns', exact: true }).click()
        await page
          .locator('.column-selector')
          .getByRole('checkbox', { name: 'Title', exact: true })
          .uncheck()
        await expect(grid.locator('#heading-title')).toHaveCount(0)
        await page.keyboard.press('Escape')
        await page.getByRole('link', { name: 'Create New', exact: true }).focus()
        await page.keyboard.press('Tab')
        await expect(target).toBeFocused()
      } finally {
        await page.goto(`${postsURL.list}?columns=${defaults}&limit=10`)
      }
    })

    test('should toggle table columns off and on with the keyboard', async () => {
      // PYLD-3772
      test.setTimeout(60000)
      const columns = await openTableColumns({ page, postsURL })
      await expect(columns.locator('[role="button"] input')).toHaveCount(0)
      const dragHandle = columns.getByRole('button', { name: /^Drag to reorder: Title$/i })

      await page.keyboard.press('Tab')
      await dragHandle.focus()
      await expect(dragHandle).toBeFocused()
      await expect(dragHandle).toHaveCSS('opacity', '1')
      await page.keyboard.press('Space')
      await expect(page.locator('body')).toHaveClass(/is-dragging/)
      await expect(dragHandle).toHaveAttribute('aria-pressed', 'true')
      await page.keyboard.press('Space')
      await expect(page.locator('body')).not.toHaveClass(/is-dragging/)
      await expect(dragHandle).toBeFocused()
      const toggle = columns
        .locator('.column-selector__item')
        .filter({
          has: page.locator('.column-selector__item-label', { hasText: /^Title$/ }),
        })
        .getByRole('checkbox')
      const titleHeader = page
        .locator('th')
        .filter({ has: page.locator('.sort-column__label', { hasText: /^Title$/ }) })

      await expect(toggle).toBeChecked()
      try {
        await toggle.focus()
        await toggle.press('Space')
        await expect(toggle).not.toBeChecked()
        await expect(titleHeader).toHaveCount(0)
        await toggle.press('Space')
        await expect(toggle).toBeChecked()
        await expect(titleHeader).toBeVisible()
      } finally {
        if (!(await toggle.isChecked())) {
          await toggle.check()
        }
      }
    })

    test('should move the focal-point handle with arrow keys and clamp it to the image', async () => {
      const dialog = await openEditImageDialog({ page, serverURL })
      const handle = dialog.getByRole('button', { name: 'Set focal point', exact: true })
      const x = dialog.getByRole('spinbutton', { name: 'Focal Point X', exact: true })
      const y = dialog.getByRole('spinbutton', { name: 'Focal Point Y', exact: true })

      await handle.focus()
      await handle.press('ArrowRight')
      await expect(x).toHaveValue('51')
      await handle.press('ArrowDown')
      await expect(y).toHaveValue('51')
      await handle.press('ArrowLeft')
      await handle.press('ArrowUp')
      await expect(x).toHaveValue('50')
      await expect(y).toHaveValue('50')
      await expect(handle).toBeFocused()

      await x.fill('99')
      await y.fill('1')
      await handle.focus()
      await handle.press('Shift+ArrowRight')
      await handle.press('Shift+ArrowUp')
      await expect(x).toHaveValue('100')
      await expect(y).toHaveValue('0')
      await handle.press('ArrowRight')
      await handle.press('ArrowUp')
      await expect(x).toHaveValue('100')
      await expect(y).toHaveValue('0')
      await handle.press('Shift+ArrowLeft')
      await handle.press('Shift+ArrowDown')
      await expect(x).toHaveValue('90')
      await expect(y).toHaveValue('10')
      await expect(handle).toBeFocused()
      await handle.press('Tab')
      await expect(handle).not.toBeFocused()
    })

    test('should reorder rich-text callouts using the keyboard on the page and creation panel', async () => {
      // PYLD-3666
      test.setTimeout(60000)
      for (const context of ['page', 'relationship panel'] as const) {
        await test.step(context, async () => {
          const container = await openRichTextContext({
            isDrawer: context === 'relationship panel',
            page,
            postsURL,
          })
          const callouts = getCallouts({ container })

          await expect(callouts).toHaveCount(2)
          const handle = callouts.first().getByRole('button', { name: /drag to reorder/i })

          const paragraph = container.locator('[contenteditable="true"] > p').last()

          await paragraph.click()
          await page.keyboard.press('Tab')
          await expect(paragraph).toHaveCSS('padding-inline-start', '40px')
          await page.keyboard.press('Shift+Tab')
          await expect(paragraph).toHaveCSS('padding-inline-start', '0px')
          await callouts.first().locator('.collapsible__toggle').focus()
          await page.keyboard.press('Tab')
          await expect(handle).toBeFocused()
          await page.keyboard.press('Shift+Tab')
          await expect(callouts.first().locator('.collapsible__toggle')).toBeFocused()
          await page.keyboard.press('Tab')
          await expect(handle).toBeFocused()
          const initialTop = (await callouts.first().boundingBox())!.y

          await page.keyboard.press('Space')
          await page.keyboard.press('ArrowDown')
          await expect
            .poll(async () => (await callouts.first().boundingBox())!.y)
            .toBeGreaterThan(initialTop)
          await expect(handle).toBeFocused()
          await page.keyboard.press('Space')
          await expect
            .soft(callouts.first().locator('input[value$="callout"]'))
            .toHaveValue('Second callout')
          await expect
            .soft(callouts.nth(1).locator('input[value$="callout"]'))
            .toHaveValue('First callout')
          await expect(paragraph).toHaveText('')
          await expect(paragraph).toHaveCSS('padding-inline-start', '0px')
          if (context === 'page') {
            await callouts
              .nth(1)
              .getByRole('button', { name: /drag to reorder/i })
              .focus()
            const modifier = await page.evaluate(() =>
              navigator.userAgent.includes('Mac OS X') ? 'Meta' : 'Control',
            )

            await page.keyboard.press(`${modifier}+k`)
            await expect(page.locator('#command-palette')).toBeVisible()
            await page.keyboard.press('Escape')
          }
        })
      }
    })

    test('should move rich-text lines with keyboard shortcuts in both editor contexts', async () => {
      // Additional coverage for PYLD-3666 beyond block-object handles.
      for (const isDrawer of [false, true]) {
        const container = await openRichTextContext({ isDrawer, page, postsURL })
        const editor = container.locator('[contenteditable="true"]').first()

        await editor.locator('p').last().click()
        await page.keyboard.insertText('First line')
        await page.keyboard.press('Enter')
        await page.keyboard.insertText('Second line')
        await page.keyboard.press('Alt+Shift+ArrowUp')
        await expect(editor.locator('p')).toHaveText(['Second line', 'First line'])
        await page.keyboard.press('Alt+Shift+ArrowDown')
        await expect(editor.locator('p')).toHaveText(['First line', 'Second line'])
      }
    })

    test('should cancel block reordering and retain focus at the first boundary', async () => {
      // Additional coverage for PYLD-3666.
      const drawer = await openRelationshipCreationDrawer({ page, postsURL })
      const callouts = getCallouts({ container: drawer })
      let handle = callouts.first().getByRole('button', { name: /drag to reorder/i })

      await handle.focus()
      const initialTop = (await callouts.first().boundingBox())!.y

      await handle.press('Space')
      await page.keyboard.press('ArrowDown')
      await expect
        .poll(async () => (await callouts.first().boundingBox())!.y)
        .toBeGreaterThan(initialTop)
      await page.keyboard.press('ArrowUp')
      await expect.poll(async () => (await callouts.first().boundingBox())!.y).toBe(initialTop)
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Escape')
      await expect.poll(async () => (await callouts.first().boundingBox())!.y).toBe(initialTop)
      await expect(drawer).toBeVisible()
      await expect(callouts.first().locator('input[value$="callout"]')).toHaveValue('First callout')
      await expect(handle).toBeFocused()
      await handle.press('Space')
      await page.keyboard.press('ArrowUp')
      await page.keyboard.press('Space')
      handle = callouts.first().getByRole('button', { name: /drag to reorder/i })
      await expect(handle).toBeFocused()
      await expect(callouts.first().locator('input[value$="callout"]')).toHaveValue('First callout')
    })

    test('should expose reorder feedback when a callout is collapsed', async () => {
      // Additional coverage for PYLD-3666 and 4.1.3 Status Messages (AA).
      await gotoCreatePost({ page, postsURL })
      const callout = page.locator('.rich-text-lexical .collapsible').first()
      await callout.getByRole('button', { name: 'Collapse', exact: true }).click()
      const handle = callout.getByRole('button', { name: /drag to reorder/i })

      await handle.focus()
      await handle.press('Space')
      await handle.press('ArrowDown')
      await expect(callout.getByRole('status')).toHaveText(/Order: 2/)
      await handle.press('Escape')
    })

    test('should operate callout menus and collapse controls with a pointer', async () => {
      // Additional coverage for PYLD-3666 and 2.5.7 Dragging Movements (AA).
      await gotoCreatePost({ page, postsURL })
      const callouts = getCallouts({ container: page.locator('main') })

      await callouts.first().locator('.section-title__input').fill('Edited block')
      const handle = callouts.first().getByRole('button', { name: /drag to reorder/i })

      await handle.focus()
      await handle.press('Space')
      await handle.press('ArrowDown')
      const collapse = callouts.first().getByRole('button', { name: 'Collapse', exact: true })
      const background = await collapse.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      )

      await collapse.hover()
      await expect(collapse).not.toHaveCSS('background-color', background)
      await collapse.click({ delay: 150 })
      await expect(callouts.first().locator('input[value="First callout"]')).toBeHidden()
      await callouts
        .first()
        .getByRole('button', { name: 'Expand', exact: true })
        .click({ delay: 150 })
      await expect(callouts.first().locator('input[value="First callout"]')).toBeVisible()
      await handle.focus()
      await handle.press('Space')
      await handle.press('ArrowDown')
      await callouts
        .first()
        .locator('.collapsible__actions .popup__trigger-wrap button')
        .click({ delay: 150 })
      await page.getByRole('menuitem', { name: 'Move Down', exact: true }).click({ delay: 150 })
      await expect(callouts.first().locator('input[value$="callout"]')).toHaveValue(
        'Second callout',
      )
      await callouts
        .nth(1)
        .locator('.collapsible__actions .popup__trigger-wrap button')
        .click({ delay: 150 })
      await page.getByRole('menuitem', { name: 'Move Up', exact: true }).click({ delay: 150 })
      await expect(callouts.first().locator('input[value$="callout"]')).toHaveValue('First callout')
      await callouts
        .first()
        .locator('.collapsible__actions .popup__trigger-wrap button')
        .click({ delay: 150 })
      await page.getByRole('menuitem', { name: 'Remove', exact: true }).click({ delay: 150 })
      await expect(callouts).toHaveCount(1)
      await expect(callouts.first().locator('input[value$="callout"]')).toHaveValue(
        'Second callout',
      )
    })

    test('should operate the Copy to locale select with the keyboard', async () => {
      // PYLD-3688
      const drawer = await openCopyToLocaleDrawer({ page, postsURL, serverURL })
      const combobox = drawer.locator('#field-toLocale input[role="combobox"]')

      await combobox.focus()
      await combobox.press('ArrowDown')
      const activeOption = page.locator('.rs__option').first()
      await expect(activeOption).toHaveClass(/rs__option--is-focused/)
      await combobox.press('Enter')
      await expect(drawer.locator('#field-toLocale .rs__single-value')).not.toBeEmpty()
    })

    test('should not activate or close disabled row-menu actions', async () => {
      // Additional coverage for PYLD-3743 and PYLD-3745; canonical ticket coverage is in screen-reader.spec.ts.
      const menu = await openFirstBlockActions({ page, postsURL })
      const disabledAction = menu.getByRole('menuitem', { name: /replace row/i })
      const blockRows = page.locator('#field-layout .blocks-field__row')
      const initialBlockRowCount = await blockRows.count()

      await expect(disabledAction).toHaveAttribute('aria-disabled', 'true')
      for (const activate of [
        () => disabledAction.click({ force: true }),
        async () => {
          await disabledAction.focus()
          await disabledAction.press('Enter')
        },
        async () => {
          await disabledAction.focus()
          await disabledAction.press('Space')
        },
      ]) {
        await activate()
        await expect(blockRows).toHaveCount(initialBlockRowCount)
        await expect(menu).toBeVisible()
      }
    })

    test('should expose only one menu item at a time in the tab order', async () => {
      // Additional coverage for PYLD-3745.
      const menu = await openFirstBlockActions({ page, postsURL })
      const menuItems = menu.getByRole('menuitem')
      const tabIndexes = await menuItems.evaluateAll((items) => items.map((item) => item.tabIndex))

      expect(tabIndexes.filter((tabIndex) => tabIndex === 0)).toHaveLength(1)
      expect(tabIndexes.filter((tabIndex) => tabIndex === -1)).toHaveLength(tabIndexes.length - 1)
    })

    test('should position a popup against its trigger inside a transformed drawer', async () => {
      // Additional coverage for PYLD-3697 and PYLD-3701.
      const drawer = await openRichTextRelationshipDrawer({ page, postsURL })
      await drawer.evaluate((element) => {
        element.style.transform = 'translateX(-40px)'
      })
      const trigger = drawer.locator('.per-page .popup__trigger-wrap button')

      await trigger.click()
      const popup = drawer.locator('.per-page .popup__content')
      const [triggerBox, popupBox] = await Promise.all([trigger.boundingBox(), popup.boundingBox()])

      expect(triggerBox).not.toBeNull()
      expect(popupBox).not.toBeNull()
      const triggerRight = triggerBox!.x + triggerBox!.width
      const popupRight = popupBox!.x + popupBox!.width
      const verticalGap = Math.min(
        Math.abs(popupBox!.y - (triggerBox!.y + triggerBox!.height)),
        Math.abs(triggerBox!.y - (popupBox!.y + popupBox!.height)),
      )

      expect(Math.abs(popupRight - triggerRight)).toBeLessThanOrEqual(1)
      expect(verticalGap).toBeLessThanOrEqual(8)
      await expect(drawer).not.toHaveCSS('transform', 'none')
      await expect(popup).toHaveCSS('position', 'fixed')
    })

    test('should keep an oversized popup within the viewport', async () => {
      // Additional coverage for PYLD-3697 and PYLD-3701.
      try {
        await page.setViewportSize({ height: 180, width: 320 })
        await page.goto(`${serverURL}/admin`)
        await openNavigationForUserMenu({ page })
        await page.locator('.user-menu__trigger').click()
        const popup = page.locator('.user-menu > .popup__content')
        const popupBox = await popup.boundingBox()

        expect(popupBox).not.toBeNull()
        expect(popupBox!.x).toBeGreaterThanOrEqual(0)
        expect(popupBox!.y).toBeGreaterThanOrEqual(0)
        expect(popupBox!.x + popupBox!.width).toBeLessThanOrEqual(320)
        expect(popupBox!.y + popupBox!.height).toBeLessThanOrEqual(180)
      } finally {
        await page.setViewportSize({ height: 720, width: 1280 })
      }
    })

    test('should keep a side submenu within the viewport', async () => {
      // Additional coverage for PYLD-3697 and PYLD-3701.
      try {
        await page.setViewportSize({ height: 720, width: 800 })
        await page.goto(`${serverURL}/admin`)
        await openNavigationForUserMenu({ page })
        await page.locator('.user-menu__trigger').click()
        await page.getByRole('menuitem', { name: /theme/i }).click()
        const submenu = page.locator('.user-menu .popup__content').last()
        const submenuBox = await submenu.boundingBox()

        expect(submenuBox).not.toBeNull()
        expect(submenuBox!.x).toBeGreaterThanOrEqual(0)
        expect(submenuBox!.x + submenuBox!.width).toBeLessThanOrEqual(800)
      } finally {
        await page.setViewportSize({ height: 720, width: 1280 })
      }
    })

    test('should keep a rich-text dropdown attached while its container scrolls', async () => {
      // Additional coverage for PYLD-3679.
      await gotoCreatePost({ page, postsURL })
      const trigger = page.locator('.rich-text-lexical .toolbar-popup__dropdown-add')

      await trigger.scrollIntoViewIfNeeded()
      await trigger.click()
      const menu = page.locator('.toolbar-popup__dropdown-items[data-dropdown-key="add"]')
      const beforeTriggerBox = await trigger.boundingBox()
      const beforeMenuBox = await menu.boundingBox()

      expect(beforeTriggerBox).not.toBeNull()
      expect(beforeMenuBox).not.toBeNull()
      const didMove = await trigger.evaluate((element) => {
        const richText = element.closest<HTMLElement>('.rich-text-lexical')
        if (richText) {
          richText.style.transform = 'translateY(-40px)'
          window.dispatchEvent(new Event('scroll'))
        }
        return Boolean(richText)
      })

      expect(didMove).toBe(true)
      await expect
        .poll(async () => {
          const [triggerBox, menuBox] = await Promise.all([
            trigger.boundingBox(),
            menu.boundingBox(),
          ])
          return Math.abs(menuBox!.y - (triggerBox!.y + triggerBox!.height))
        })
        .toBeLessThanOrEqual(6)
    })

    test('should keep a rich-text dropdown within the bottom viewport edge', async () => {
      // Additional coverage for PYLD-3679.
      await gotoCreatePost({ page, postsURL })
      const trigger = page.locator('.rich-text-lexical .toolbar-popup__dropdown-add')

      await trigger.scrollIntoViewIfNeeded()
      await trigger.evaluate((element) => {
        const richText = element.closest<HTMLElement>('.rich-text-lexical')
        if (richText) {
          const triggerBottom = element.getBoundingClientRect().bottom
          richText.style.transform = `translateY(${window.innerHeight - triggerBottom - 4}px)`
        }
      })
      await trigger.press('Enter')
      const menu = page.locator('.toolbar-popup__dropdown-items[data-dropdown-key="add"]')
      const menuBox = await menu.boundingBox()

      expect(menuBox).not.toBeNull()
      expect(menuBox!.y).toBeGreaterThanOrEqual(0)
      expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(720)
    })

    test('should remove a selected value with Space', async () => {
      // Additional coverage for PYLD-3768.
      await gotoCreatePost({ page, postsURL })
      const select = page.locator('#field-accessibilitySortableSelect')
      const removeButton = select.locator('.multi-value-remove').first()

      await expect(select.locator('.rs__multi-value')).toHaveCount(2)
      await removeButton.focus()
      await page.keyboard.press('Space')

      await expect(select.locator('.rs__multi-value')).toHaveCount(1)
      await expect(page.locator('.rs__menu')).toBeHidden()
    })

    test('should clear a select value with Space', async () => {
      // Additional coverage for PYLD-3755.
      await gotoCreatePost({ page, postsURL })
      const select = page.locator('#field-accessibilitySelect')
      const clearButton = select.locator('.clear-indicator')

      await expect(select.locator('.rs__single-value')).toContainText('Value One')
      await clearButton.focus()
      await page.keyboard.press('Space')

      await expect(select.locator('.rs__single-value')).toHaveCount(0)
      await expect(page.locator('.rs__menu')).toBeHidden()
    })
  })

  test.describe('2.1.2 No Keyboard Trap (A)', () => {
    test('should only intercept Escape while a non-dismissible dialog is open', async () => {
      await page.goto(
        formatAdminURL({ adminRoute: '/admin', path: '/custom-modal-ids', serverURL }),
      )
      const parent = page.getByTestId('parent')
      const locked = page.getByRole('dialog', { name: 'Locked title', exact: true })

      await page.getByRole('button', { name: 'Open parent', exact: true }).click()
      await expect(parent).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(parent).toBeHidden()
      await page.getByRole('button', { name: 'Open locked dialog', exact: true }).click()
      await expect(locked).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(locked).toBeVisible()
      await locked.getByRole('button', { name: 'Open child', exact: true }).click()
      const child = page.getByTestId('child')

      await expect(child).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(child).toBeHidden()
      await expect(locked).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(locked).toBeVisible()
      await locked.getByRole('button', { name: 'Close locked dialog', exact: true }).click()
      await expect(locked).toBeHidden()
      await page.getByRole('button', { name: 'Open parent', exact: true }).click()
      await expect(parent).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(parent).toBeHidden()
    })

    test('should exit Lexical editors with Escape then Tab or Shift+Tab', async () => {
      await gotoCreatePost({ page, postsURL })
      await insertTextBlockWithKeyboard({ page })
      for (const field of ['content', 'layout.0.body']) {
        const editor = page.locator(`[data-field-path="${field}"] [contenteditable="true"]`)

        await editor.fill('')
        await expect(
          page.locator(`[data-field-path="${field}"] .ContentEditable__keyboard-hint`),
        ).toBeVisible()
        await editor.fill('Editor escape regression')
        await expect(editor).toHaveAccessibleDescription(/Press Escape, then Tab or Shift\+Tab/)
        await expect(
          page
            .getByText('Press Escape, then Tab or Shift+Tab to move focus out of the editor.', {
              exact: true,
            })
            .filter({ visible: true }),
        ).toBeVisible()
        for (let attempt = 0; attempt < 3; attempt++) {
          await editor.click()
          await page.keyboard.press('Tab')
          await expect(editor).toBeFocused()
          for (const key of ['Tab', 'Shift+Tab']) {
            await editor.click()
            await page.keyboard.press('Escape')
            await page.keyboard.press(key)
            await page.evaluate(
              () =>
                new Promise<void>((resolve) =>
                  requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
                ),
            )
            await expect(
              page.locator(`[data-field-path="${field}"] .editor-container :focus`),
              `${field}: Escape then ${key}, attempt ${attempt + 1}`,
            ).toHaveCount(0)
          }
        }
      }
    })
  })

  test.describe('2.1.4 Character Key Shortcuts (A)', () => {
    test('should close only the top popup when Escape is pressed in a rich-text flyout', async () => {
      // PYLD-3661
      const drawer = await openRichTextRelationshipDrawer({ page, postsURL })
      const { groupByContent: groupByPopup } = await openGroupBy(page)

      await groupByPopup.locator('.group-by-control__select-trigger').first().click()
      const nestedOption = page.locator('.popup__content').last().getByRole('menuitemradio').first()
      await expect(nestedOption).toBeVisible()
      await nestedOption.focus()
      await page.keyboard.press('Escape')

      await expect(drawer).toBeVisible()
      await expect(groupByPopup).toBeVisible()
      await expect(nestedOption).toBeHidden()
    })
  })

  test.describe('2.4.1 Bypass Blocks (A)', () => {
    test('should skip navigation on collection, dashboard, and mobile views', async () => {
      for (const view of ['collection', 'dashboard', 'mobile'] as const) {
        try {
          if (view === 'mobile') {
            await page.setViewportSize({ height: 844, width: 390 })
            await openMainNavigation({ page, postsURL })
          } else if (view === 'dashboard') {
            await page.goto(formatAdminURL({ adminRoute: '/admin', serverURL }))
            await expect(page.locator('.dashboard')).toBeVisible()
          } else {
            await gotoPostsList({ page, postsURL })
          }
          const skip = page.getByRole('link', { name: /skip to content/i })

          if (view === 'mobile') {
            await skip.focus()
          } else {
            await page.keyboard.press('Tab')
          }
          await expect(skip).toBeFocused()
          await expect(skip).toBeInViewport()
          await skip.press('Enter')
          if (view === 'dashboard') {
            await expect(page.locator('#payload-main-content')).toBeFocused()
          } else {
            await expect(page.getByRole('main')).toBeFocused()
          }
          if (view === 'mobile') {
            await expect(page.locator('aside.nav')).not.toHaveClass(/nav--nav-open/)
          }
          await page.keyboard.press('Tab')
          await expectFocusInside({
            container: view === 'dashboard' ? page.locator('.dashboard') : page.getByRole('main'),
            page,
          })
          await expect(page.locator(':focus')).toBeInViewport()
        } finally {
          await page.setViewportSize({ height: 720, width: 1280 })
        }
      }
    })

    test('should include grouped pagination in the main landmark', async () => {
      await page.goto(`${postsURL.list}?groupBy=accessibilitySelect&limit=1`)
      try {
        const pagination = page.getByRole('button', { name: 'Next table page', exact: true })

        await expect(pagination).toBeVisible()
        await expect(
          page.getByRole('main').getByRole('button', { name: 'Next table page', exact: true }),
        ).toBeVisible()
      } finally {
        await page.goto(`${postsURL.list}?groupBy=&limit=10`)
        await expect(page.locator('tbody tr')).toHaveCount(3)
      }
    })
  })

  test.describe('2.4.3 Focus Order (A)', () => {
    test('should focus the block date-picker calendar when opened with the keyboard', async () => {
      // PYLD-3791
      try {
        for (const day of [15, 14]) {
          await page.clock.setFixedTime(new Date(2026, 8, day, 12))
          const { calendar, field, input } = await prepareBlockDateField({ page, postsURL })
          const precedingText = field
            .locator('..')
            .getByRole('textbox', { name: 'Text', exact: true })

          await precedingText.focus()
          await page.keyboard.press('Tab')
          await expect(input).toBeFocused()
          await expect(calendar).toBeHidden()

          for (const key of ['ArrowDown', 'ArrowUp', 'Enter']) {
            await page.keyboard.press(key)
            await expect(calendar).toBeVisible()
            await expectFocusInside({ container: calendar, page })
            if (day === 14) {
              await expect(
                calendar.locator(
                  '.react-datepicker__day--014:not(.react-datepicker__day--outside-month)',
                ),
              ).toHaveAttribute('aria-disabled', 'true')
              await expect(calendar.getByRole('button', { name: 'Previous Month' })).toBeFocused()
            }
            await page.keyboard.press('Escape')
            await expect(calendar).toBeHidden()
            await expect(input).toBeFocused()
          }
        }
      } finally {
        await page.clock.setSystemTime(new Date())
      }
    })

    test('should move focus between named block date-picker days with arrow keys', async () => {
      // PYLD-3739
      await page.clock.setFixedTime(new Date(2026, 8, 15, 12))

      try {
        const { calendar, input } = await prepareBlockDateField({ page, postsURL })

        await input.focus()
        await page.keyboard.press('ArrowDown')
        await expect(calendar).toBeVisible()
        const day = calendar.locator('.react-datepicker__day:focus')

        await expect(day).toHaveAccessibleName(/September 15.*2026/i)
        await page.keyboard.press('ArrowRight')
        await expect(day).toHaveAccessibleName(/September 16.*2026/i)
        await page.keyboard.press('ArrowLeft')
        await expect(day).toHaveAccessibleName(/September 15.*2026/i)
        await page.keyboard.press('PageDown')
        await expect(day).toHaveAccessibleName(/October 15.*2026/i)
        await page.keyboard.press('PageUp')
        await expect(day).toHaveAccessibleName(/September 15.*2026/i)
        await page.keyboard.press('Enter')
        await expect(input).toHaveValue('09/15/2026')
        await page.keyboard.press('Escape')
        await expect(input).toBeFocused()
      } finally {
        await page.clock.setSystemTime(new Date())
      }
    })

    test('should return focus to each list-options trigger after its Close button', async () => {
      for (const [selector, name] of [
        ['#toggle-group-by', /group by/i],
        ['.columns-button__button', /columns/i],
      ] as const) {
        await gotoPostsList({ page, postsURL })
        const trigger = page.locator(selector)

        await trigger.press('Enter')
        const dialog = page.getByRole('dialog', { name })
        const close = dialog.getByRole('button', { name: /close/i })

        await expect(close).toBeFocused()
        await page.keyboard.press('Enter')
        await expect(dialog).toBeHidden()
        await expect.soft(trigger).toBeFocused()
      }
    })

    test('should reorder widgets using the dedicated keyboard drag control', async () => {
      // PYLD-3642: browser coverage complements the NVDA regression.
      await openDashboardEditor({ page, serverURL })
      const widgets = page.locator('.modular-dashboard .widget[data-slug]')

      const linkedWidget = widgets.filter({ has: page.locator('.widget-content a[href]') }).first()
      const linkedDrag = linkedWidget.getByRole('button', { name: 'Drag to reorder', exact: true })

      await linkedDrag.focus()
      await page.keyboard.press('Space')
      const overlay = page.locator('.drag-overlay')

      await expect(overlay).toBeVisible()
      expect(await overlay.ariaSnapshot()).toBe('')
      expect(await linkedWidget.ariaSnapshot()).toContain('link')
      await overlay.locator('a[href]').first().focus()
      await expect(linkedDrag).toBeFocused()
      await page.keyboard.press('Space')
      await expect(overlay).toHaveCount(0)

      while ((await widgets.count()) > 0) {
        await widgets.last().locator('.widget-wrapper__delete-btn').click()
      }
      await addCollectionQueryWidget({ page })
      await addCollectionQueryWidget({ page })
      const firstID = await widgets.first().getAttribute('data-slug')
      const lastID = await widgets.last().getAttribute('data-slug')
      const drag = widgets.last().getByRole('button', { name: 'Drag to reorder', exact: true })

      await drag.focus()
      await page.keyboard.press('Space')
      await expect(page.locator('.drag-overlay')).toBeVisible()
      await expect(
        page.getByRole('status').filter({ hasText: 'Picked up draggable item' }),
      ).toHaveCount(1)
      await page.keyboard.press('ArrowLeft')
      const overFirstWidget = page.getByRole('status').filter({ hasText: firstID! })

      await expect(overFirstWidget).toContainText(new RegExp(`${firstID}-(before|after)`))
      if ((await overFirstWidget.innerText()).includes(`${firstID}-after`)) {
        await page.keyboard.press('ArrowLeft')
      }
      await expect(overFirstWidget).toContainText(`${firstID}-before`)
      await page.keyboard.press('Space')
      await expect(widgets.first()).toHaveAttribute('data-slug', lastID!)
      await expect(widgets.last()).toHaveAttribute('data-slug', firstID!)
      await expect(page.locator('.drag-overlay')).toHaveCount(0)
    })

    test('should preserve dashboard focus and expose widget content and independent actions while editing', async () => {
      // PYLD-3632: retain header focus when entering edit mode.
      // PYLD-3592: focus each newly added widget.
      // PYLD-3634: visit the size control once in each direction.
      const header = await openDashboardEditor({ page, serverURL })

      await expectFocusInside({ container: header, page })
      await test.step('Read widget content before its named actions', async () => {
        const widget = page.locator('.widget[data-slug^="upload-dropzone-"]')
        const card = widget.locator('.draggable')
        const drag = widget.getByRole('button', { name: 'Drag to reorder', exact: true })

        await expect(
          widget
            .getByRole('region', { name: 'Upload files' })
            .getByText('Upload from your computer via drag-and-drop, or click the button below'),
        ).toBeVisible()
        await card.focus()
        await page.keyboard.press('Shift+Tab')
        await page.keyboard.press('Tab')
        await expect(card).toBeFocused()
        await expect(card).toHaveAccessibleName('Upload files')
        await expect(drag).toHaveAccessibleDescription(/Upload files/)
        await page.keyboard.press('Tab')
        await expect(drag).toBeFocused()
        await page.keyboard.press('Tab')
        await expect(
          widget.getByRole('button', { name: 'Edit Upload files', exact: true }),
        ).toBeFocused()
        await page.keyboard.press('Tab')
        await expect(
          widget.getByRole('button', { name: /^Resize Upload files, current size: small$/ }),
        ).toBeFocused()
        await page.keyboard.press('Tab')
        await expect(
          widget.getByRole('button', { name: 'Delete Upload files', exact: true }),
        ).toBeFocused()
      })
      const widget = await addCollectionQueryWidget({ page })

      await test.step('Expose the added widget content and structure', async () => {
        const card = widget.locator('.draggable')
        const bullets = await widget
          .locator('.collection-query-widget__error-list li')
          .allTextContents()

        expect(bullets.length).toBeGreaterThan(0)
        for (const bullet of bullets) {
          await expect(card).toHaveAccessibleName(new RegExp(bullet.trim()))
          await expect(
            widget.getByRole('button', { name: 'Drag to reorder', exact: true }),
          ).toHaveAccessibleDescription(new RegExp(bullet.trim()))
        }
        await expect(widget.getByRole('listitem')).toHaveCount(bullets.length)
        await expect(card).toHaveRole('group')
        await expect(widget.getByRole('button', { name: /^edit /i })).toHaveCount(1)
      })
      const drag = widget.getByRole('button', { name: 'Drag to reorder', exact: true })

      await expect(widget.locator('.draggable')).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(drag).toBeFocused()
      await page.keyboard.press('Space')
      await expect(page.locator('.drag-overlay')).toBeVisible()
      await expect(drag).toHaveAttribute('aria-pressed', 'true')
      await expect(
        page.getByRole('status').filter({ hasText: (await widget.getAttribute('data-slug'))! }),
      ).toHaveCount(1)
      await expect(page.locator('[id^="widget-editor-"]:visible')).toHaveCount(0)
      await page.keyboard.press('Escape')
      await expect(page.locator('.drag-overlay')).toHaveCount(0)
      await expect(drag).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(widget.locator('.widget-wrapper__edit-btn')).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(page.locator('[id^="widget-editor-"]:visible')).toHaveCount(1)
      await page.keyboard.press('Escape')
      await expect(page.locator('[id^="widget-editor-"]:visible')).toHaveCount(0)
      await expect(widget.locator('.widget-wrapper__edit-btn')).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(widget.locator('.widget-wrapper__size-btn')).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(widget.locator('.widget-wrapper__delete-btn')).toBeFocused()
      await page.keyboard.press('Shift+Tab')
      await expect(widget.locator('.widget-wrapper__size-btn')).toBeFocused()
      await page.keyboard.press('Shift+Tab')
      await expect(widget.locator('.widget-wrapper__edit-btn')).toBeFocused()
    })

    test('should omit a finished relationship loading indicator from the accessibility tree', async () => {
      const drawer = await openRelationshipCreationDrawer({ page, postsURL })

      await expect(drawer.locator('[data-form-ready="true"]').first()).toBeVisible()
      expect(await drawer.ariaSnapshot()).not.toMatch(/Loading/i)
    })

    test('should focus inserted Array and Block rows on the page and in the active document drawer', async () => {
      // PYLD-3630
      await gotoCreatePost({ page, postsURL })
      await page.locator('#field-items .array-field__add-row').press('Enter')
      const arrayRow = page.locator('#field-items .array-field__row').last()

      await expect(arrayRow).toContainText('Label')
      await expectFocusInside({ container: arrayRow, page })
      const blockRow = await insertTextBlockWithKeyboard({ page })

      await expectFocusInside({ container: blockRow, page })
      await expect(page.locator(':focus')).toBeInViewport()
      await page.locator('#relatedPost-add-new button').press('Enter')
      const drawer = page.locator('dialog[id^="doc-drawer_posts_"]')

      await expect(drawer.locator('#field-title')).toBeVisible()
      await drawer.locator('#field-items .array-field__add-row').press('Enter')
      await expectFocusInside({ container: drawer.locator('.array-field__row').last(), page })
      await expect(page.locator(':focus')).toBeInViewport()

      await drawer.locator('#field-layout > .blocks-field__drawer-toggler').press('Enter')
      const picker = page.locator('[id^="drawer_2_blocks-drawer-"]')

      await picker.getByRole('button', { name: 'Text block', exact: true }).press('Enter')
      await picker.getByRole('button', { name: 'Insert', exact: true }).press('Enter')
      await expect(picker).toBeHidden()
      await expectFocusInside({ container: drawer.locator('.blocks-field__row').last(), page })
      await expect(page.locator(':focus')).toBeInViewport()
    })

    test('should visit every theme option with arrow keys including the middle option', async () => {
      // PYLD-3636
      await page.goto(formatAdminURL({ adminRoute: '/admin', serverURL }))
      await openNavigationForUserMenu({ page })
      await page.locator('.user-menu__trigger').press('Enter')
      await page.getByRole('menuitem', { name: /theme/i }).press('Enter')
      const options = page.getByRole('menuitemradio')

      await expect(options).toHaveCount(3)
      await page.keyboard.press('Home')
      await expect(options.nth(0)).toBeFocused()
      await page.keyboard.press('ArrowDown')
      await expect(options.nth(1)).toBeFocused()
      await page.keyboard.press('ArrowDown')
      await expect(options.nth(2)).toBeFocused()
      await page.keyboard.press('ArrowUp')
      await expect(options.nth(1)).toBeFocused()
      await page.keyboard.press('Escape')
    })

    test('should move focus into the Add Block drawer when opened by keyboard', async () => {
      // PYLD-3624
      await gotoCreatePost({ page, postsURL })
      await page.locator('#field-layout > .blocks-field__drawer-toggler').press('Enter')
      const drawer = page.locator('[id^="drawer_1_blocks-drawer-"]')

      await expect(drawer).toBeVisible()
      await expectFocusInside({ container: drawer, page })
    })

    test('should keep focus visible when tabbing backwards into a Lexical editor inside a block field', async () => {
      // PYLD-3790
      await gotoCreatePost({ page, postsURL })
      const row = await insertTextBlockWithKeyboard({ page })
      const editor = row.locator('[contenteditable="true"]')
      const followingField = row.locator('input[name="layout.0.text"]')

      await editor.fill('Block body focus order')
      await page.mouse.move(0, 0)
      await followingField.focus()
      let hasReachedEditor = false
      for (let index = 0; index < 30; index++) {
        await page.keyboard.press('Shift+Tab')
        await expectPaintedFocus({ page })
        if (await editor.evaluate((element) => element === document.activeElement)) {
          hasReachedEditor = true
          break
        }
      }
      expect(hasReachedEditor).toBe(true)
    })

    test('should not tab through invisible Lexical drag and add handles', async () => {
      // PYLD-3830
      await gotoCreatePost({ page, postsURL })
      const editor = page.locator('[data-field-path="content"] [contenteditable="true"]')

      await editor.fill('Keyboard handle visibility')
      await editor.locator('p').hover()
      const field = page.locator('[data-field-path="content"]')

      await expect(field.getByRole('button', { name: 'Add block', exact: true })).toBeVisible()
      await expect(field.getByRole('button', { name: 'Drag to move', exact: true })).toBeVisible()
      await page.mouse.move(0, 0)
      await expect(field.getByRole('button', { name: 'Add block', exact: true })).toHaveCount(0)
      await expect(field.getByRole('button', { name: 'Drag to move', exact: true })).toHaveCount(0)
      const nextField = page.locator('#field-items .array-field__add-row')
      await nextField.focus()
      let hasReachedEditor = false
      for (let index = 0; index < 30; index++) {
        await page.keyboard.press('Shift+Tab')
        const focusedName = await page.locator(':focus').getAttribute('aria-label')
        if (focusedName === 'Drag to move' || focusedName === 'Add block') {
          await expectPaintedFocus({ page })
        }
        if (await editor.evaluate((element) => element === document.activeElement)) {
          hasReachedEditor = true
          break
        }
      }
      expect(hasReachedEditor).toBe(true)
      await editor.locator('p').hover()
      await field.getByRole('button', { name: 'Add block', exact: true }).click()
      await page.getByRole('option', { name: 'Callout', exact: true }).click()
      await expect(editor.locator('.LexicalEditorTheme__block')).toHaveCount(1)
    })
    test('should keep arrow-key navigation inside a Lexical block actions menu', async () => {
      await gotoCreatePost({ page, postsURL })
      const editor = page.locator('[data-field-path="content"] [contenteditable="true"]').first()
      const trigger = editor.locator('.LexicalEditorTheme__block__actions-button').first()
      const menu = page.getByRole('menu')

      await editor.focus()
      await trigger.focus()
      await page.keyboard.press('Enter')
      await expect(menu.getByRole('menuitem', { name: 'Move Up', exact: true })).toBeFocused()

      for (const [key, name] of [
        ['ArrowDown', 'Move Down'],
        ['ArrowDown', 'Remove'],
        ['ArrowDown', 'Move Up'],
        ['ArrowUp', 'Remove'],
        ['Home', 'Move Up'],
        ['End', 'Remove'],
      ] as const) {
        await page.keyboard.press(key)
        await expect(menu.getByRole('menuitem', { name, exact: true })).toBeFocused()
      }

      await page.keyboard.press('Escape')
      await expect(menu).toHaveCount(0)
      await expect(trigger).toBeFocused()
    })

    test('should move keyboard focus into the table column editor', async () => {
      // PYLD-3771
      test.setTimeout(60000)
      await gotoPostsList({ page, postsURL })
      const trigger = page.getByRole('button', { name: 'Columns', exact: true })

      await openPopupWithKeyboard({ page, popup: page.locator('.column-selector'), trigger })
      await page.keyboard.press('Escape')
      await expect(trigger).toBeFocused()
    })
    for (const form of ['document', 'login'] as const) {
      test(`should associate ${form} errors with their fields and focus order`, async () => {
        // PYLD-3581, PYLD-3613, PYLD-3611
        const context = await page.context().browser()!.newContext()
        const { page: formPage } = await initPage({ context, serverURL })

        try {
          if (form === 'login') {
            await context.clearCookies()
            await context.route(
              (url) => url.origin === new URL(serverURL).origin,
              async (route) => {
                await route.continue({
                  headers: { ...route.request().headers(), DisableAutologin: 'true' },
                })
              },
            )
            await formPage.goto(formatAdminURL({ adminRoute: '/admin', path: '/login', serverURL }))
            await formPage.locator('input[name="email"]').fill('dev@payloadcms.com')
            const password = formPage.locator('input[name="password"]')

            await expectRequiredState({ input: password })
            await password.fill('temporary')
            await password.fill('')
            await password.press('Tab')
            await formPage.getByRole('button', { name: 'Login', exact: true }).click()
          } else {
            await gotoCreatePost({ page: formPage, postsURL })
            await formPage.getByRole('button', { name: /^Publish(?: in English)?$/ }).click()
          }

          const input = formPage.locator(
            form === 'login' ? 'input[name="password"]' : '#field-title',
          )
          const error = formPage.locator('.field-type').filter({ has: input }).getByRole('alert')

          await expect(error).toHaveCount(1)
          await expect(error).toBeVisible()
          await expect(error).not.toHaveAttribute('aria-hidden', 'true')
          await expect(input).toHaveAccessibleDescription((await error.innerText()).trim())
          await expectErrorTabOrder({ error, input })
          const originalMessage = await error.locator('.tooltip-content').textContent()

          try {
            await error.locator('.tooltip-content').evaluate((element) => {
              element.textContent =
                'Please enter a valid value for this required field before saving your changes. ' +
                'A'.repeat(100)
            })
            for (const width of [390, 1280]) {
              await formPage.setViewportSize({ height: 900, width })
              await input.scrollIntoViewIfNeeded()
              await expect(error).toBeVisible()
              await expect
                .poll(async () => {
                  const box = await error.boundingBox()

                  return box && box.x >= 0 && box.x + box.width <= width
                })
                .toBe(true)
              expect(
                await error.evaluate((element) => element.scrollWidth <= element.clientWidth),
              ).toBe(true)
              await expectErrorTabOrder({ error, input })
            }
          } finally {
            await error.locator('.tooltip-content').evaluate((element, message) => {
              element.textContent = message
            }, originalMessage)
          }
        } finally {
          await context.close()
        }
      })
    }

    for (const key of ['Enter', 'Space']) {
      test(`should retain focus after moving a rich-text block without a drag handle using ${key}`, async () => {
        await gotoCreatePost({ page, postsURL })
        await page.locator('[contenteditable="true"]').first().locator('p').last().click()
        await page.keyboard.type('/nohandle')
        await page
          .locator('#slash-menu')
          .getByRole('option', { name: /no handle block/i })
          .click()
        const block = page.locator('.LexicalEditorTheme__block-noHandle')
        const trigger = block.locator('.LexicalEditorTheme__block__actions-button')

        const header = block.locator('.collapsible__toggle-wrap').first()
        const nestedHandle = block.locator('.collapsible__drag')

        await expect(header.locator('.collapsible__drag')).toHaveCount(0)
        await expect(nestedHandle).toBeVisible()
        await expect(block.locator('.LexicalEditorTheme__block__block-number')).toHaveText('03')
        const paragraphs = page.locator('[contenteditable="true"]').first().locator(':scope > p')
        const paragraphCount = await paragraphs.count()

        await trigger.press(key)
        await page.getByRole('menuitem', { name: 'Move Up', exact: true }).press(key)
        await expect(block.locator('.LexicalEditorTheme__block__block-number')).toHaveText('02')
        await expect(trigger).toBeFocused()
        await header.getByRole('button', { name: 'Collapse', exact: true }).click()
        await expect(nestedHandle).toBeHidden()
        await trigger.press(key)
        await page.getByRole('menuitem', { name: 'Move Down', exact: true }).press(key)
        await expect(block.locator('.LexicalEditorTheme__block__block-number')).toHaveText('03')
        await expect(trigger).toBeFocused()
        await expect(paragraphs).toHaveCount(paragraphCount)
        await page.keyboard.press(key)
        await page.getByRole('menuitem', { name: 'Remove', exact: true }).press(key)
        await expect(block).toHaveCount(0)
        await expect(paragraphs).toHaveCount(paragraphCount)
      })
    }

    test('should focus and isolate nested modals with custom IDs', async () => {
      await page.goto(
        formatAdminURL({ adminRoute: '/admin', path: '/custom-modal-ids', serverURL }),
      )
      await page.getByRole('button', { name: 'Open parent' }).click()
      await expect(page.getByRole('dialog', { name: 'Parent title' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Parent title' })).toBeFocused()
      await page.getByRole('button', { name: 'Open child' }).click()
      await expect(page.getByRole('dialog', { name: 'Child title' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Child title' })).toBeFocused()
      await expect(page.getByTestId('parent')).toHaveAttribute('inert', '')
      await expect(page.getByTestId('child')).not.toHaveAttribute('inert')
      await page.getByRole('button', { name: 'Close child' }).click()
      await expect(page.getByTestId('parent')).not.toHaveAttribute('inert')
      await expect(page.getByRole('button', { name: 'Open child' })).toBeFocused()
      await page.getByRole('button', { name: 'Close parent' }).click()
      await expect(page.getByRole('button', { name: 'Open parent' })).toBeFocused()
    })

    test('should contain keyboard focus in media and nested folder modals', async () => {
      // Additional coverage for PYLD-3575 and PYLD-3587; browse-cursor coverage is in screen-reader.spec.ts.
      test.setTimeout(60000)
      for (const open of [openBulkUploadDialog, openEditImageDialog, openFolderCreationLocation]) {
        const modal = await open({ page, serverURL })
        const firstButton = modal.getByRole('button').first()

        await firstButton.focus()
        const stopCount = await modal.locator('button, input, a[href], [tabindex="0"]').count()

        for (const key of ['Tab', 'Shift+Tab']) {
          for (let step = 0; step < stopCount + 2; step++) {
            await page.keyboard.press(key)
            expect
              .soft(await modal.evaluate((element) => element.contains(document.activeElement)))
              .toBe(true)
          }
        }
      }
    })

    test('should isolate modal content and restore focus after nested dismissal', async () => {
      // Additional coverage for PYLD-3575, PYLD-3587, PYLD-3644 and PYLD-3682.
      const { drawer, trigger } = await openWidgetDrawer({ page, serverURL })

      await trigger.press('Enter')
      await expect(drawer).toBeVisible()
      await expect(page.getByRole('main')).toHaveCount(0)
      await expect(drawer).toHaveAccessibleName(/add widget/i)
      await page.keyboard.press('Escape')
      await expect(drawer).toBeHidden()
      await expect(trigger).toBeFocused()
      await expect(page.getByRole('navigation').first()).toBeVisible()

      const modal = await openFolderCreationLocation({ page, serverURL })
      const parent = page.locator('dialog.drawer[open]')

      await expect(parent.getByRole('textbox')).toHaveCount(0)
      await page.keyboard.press('Escape')
      await expect(modal).toBeHidden()
      await expect(parent).toBeVisible()
      await expect
        .poll(() => parent.evaluate((element) => element.contains(document.activeElement)))
        .toBe(true)
      await expect(parent.getByRole('textbox').first()).toBeVisible()
    })

    test('should keep drawer filter options inside the active modal accessibility tree', async () => {
      // Additional coverage for PYLD-3662; synthesized speech still needs NVDA.
      const drawer = await openRichTextUploadDrawer({ page, postsURL })
      const controls = await openDrawerFilters({ drawer })

      await controls.nth(0).click()
      await expect(drawer.getByRole('option').first()).toBeVisible()
      await expect(page.getByRole('main')).toHaveCount(0)
    })

    test('should keep table actions and resize handles operable inside a creation drawer', async () => {
      // Additional coverage for portals owned by the active modal.
      const drawer = await openRelationshipCreationDrawer({ page, postsURL })
      await drawer.locator('[contenteditable="true"] p').last().click()
      await drawer.locator('.toolbar-popup__dropdown-add').click()
      await drawer.locator('.toolbar-popup__dropdown-item[data-item-key="table"]').click()
      await drawer.getByRole('button', { name: '2 columns, 2 rows', exact: true }).click()
      const table = drawer.locator('[contenteditable="true"] table')
      await expect(table.locator('tr')).toHaveCount(2)
      const cell = table.locator('th, td').first()
      await cell.click()
      await cell.hover()
      await expect(drawer.locator('.TableCellResizer__ui')).toHaveCount(2)
      const width = (await cell.boundingBox())?.width ?? 0
      const resize = await drawer.locator('.TableCellResizer__ui').first().boundingBox()

      if (!resize) {
        throw new Error('Expected a visible table resize handle')
      }
      await page.mouse.move(resize.x + resize.width / 2, resize.y + resize.height / 2)
      await page.mouse.down()
      await page.mouse.move(resize.x + resize.width / 2 + 40, resize.y + resize.height / 2, {
        steps: 5,
      })
      await page.mouse.up()
      await expect
        .poll(async () => (await cell.boundingBox())?.width ?? 0)
        .toBeGreaterThan(width + 20)
      await cell.click()
      await drawer.locator('.table-cell-action-button').click()
      await drawer.locator('[data-test-id="table-insert-row-below"]').click()
      await expect(table.locator('tr')).toHaveCount(3)
    })

    test('should keep calendar controls operable inside a creation drawer', async () => {
      // Additional coverage for modal isolation and nested popovers.
      const drawer = await openRelationshipCreationDrawer({ page, postsURL })
      await drawer.locator('#field-publishedOn input').click()
      const calendar = drawer.locator('.react-datepicker')

      await expect(calendar).toBeVisible()
      await calendar.getByRole('combobox', { name: /month/i }).selectOption('0')
      await expect(calendar.getByRole('combobox', { name: /month/i })).toHaveValue('0')
      await calendar
        .locator('.react-datepicker__day:not(.react-datepicker__day--outside-month)')
        .first()
        .click()
      await expect(drawer.locator('#field-publishedOn input')).not.toHaveValue('')
    })

    test('should move focus into rich-text insertion and relationship creation panels', async () => {
      // PYLD-3676
      test.setTimeout(60000)
      const softExpect = expect.configure({ soft: true })

      for (const open of [
        openRichTextUploadDrawer,
        openRichTextRelationshipDrawer,
        openRelationshipCreationDrawer,
      ]) {
        const drawer = await open({ page, postsURL })

        await softExpect
          .poll(() => drawer.evaluate((element) => element.contains(document.activeElement)))
          .toBe(true)
      }
    })

    test('should keep active link editing available on the page and in a drawer', async () => {
      // Additional coverage for PYLD-3665.
      for (const isDrawer of [false, true]) {
        const container = await openRichTextContext({ isDrawer, page, postsURL })
        const editor = container.locator('[contenteditable="true"]').first()

        await editor.locator('p').last().click()
        await page.keyboard.insertText('https://example.com')
        await page.keyboard.press('Space')
        await page.keyboard.press('ArrowLeft')
        await page.keyboard.press('ArrowLeft')
        const edit = container.getByRole('button', { name: 'Edit link', exact: true })

        await expect(edit).toBeVisible()
        await edit.focus()
        await edit.press('Enter')
        const linkDrawer = page.locator('dialog.lexical-link-edit-drawer')
        await expect(linkDrawer).toBeVisible()
        await expect(linkDrawer.locator('#field-url')).toHaveValue('https://example.com')
      }
    })

    test('should keep inactive link controls out of keyboard navigation on the page and creation panel', async () => {
      // PYLD-3665
      test.setTimeout(60000)
      for (const isDrawer of [false, true]) {
        const container = await openRichTextContext({ isDrawer, page, postsURL })
        const editor = container.locator('[contenteditable="true"]').first()

        await editor.locator('p').last().click()
        await page.keyboard.insertText('Plain text without a link')
        for (let step = 0; step < 12; step++) {
          await page.keyboard.press('Tab')
          const focus = page.locator(':focus')

          await expect.soft(focus).not.toHaveAccessibleName(/^(edit|remove) link$/i)
        }
        const controls = container.locator('.link-edit, .link-trash')

        for (const control of await controls.all()) {
          const canReceiveTab = await control.evaluate((element) => {
            const node = element as HTMLElement
            return (
              node.tabIndex >= 0 &&
              node.getClientRects().length > 0 &&
              !node.closest('[inert]') &&
              getComputedStyle(node).visibility !== 'hidden'
            )
          })

          expect
            .soft(canReceiveTab, 'Inactive floating link controls must not receive Tab')
            .toBe(false)
        }
      }
    })

    test('should navigate User menu items without entering hidden submenus', async () => {
      // Additional coverage for PYLD-3645 and PYLD-3697.
      await page.goto(`${serverURL}/admin`)
      await openNavigationForUserMenu({ page })
      const trigger = page.locator('.user-menu__trigger')

      await trigger.focus()
      await trigger.press('Enter')

      const account = page.getByRole('menuitem', { name: /dev@payloadcms\.com/i })
      const theme = page.getByRole('menuitem', { name: /theme/i })
      const language = page.getByRole('menuitem', { name: /language/i })
      const logout = page.getByRole('menuitem', { name: /log out/i })

      await expect(account).toBeFocused()
      await page.keyboard.press('ArrowDown')
      await expect(theme).toBeFocused()
      await page.keyboard.press('ArrowDown')
      await expect(language).toBeFocused()
      await page.keyboard.press('ArrowDown')
      await expect(logout).toBeFocused()

      await language.focus()
      await language.press('Enter')
      const languageOption = page.getByRole('menuitemradio').first()
      await expect(languageOption).toBeFocused()
      await languageOption.press('Escape')
      await expect(language).toBeFocused()
    })

    test('should close the full User menu chain when tabbing from a nested menu', async () => {
      // Additional coverage for PYLD-3645 and PYLD-3697.
      await page.goto(`${serverURL}/admin`)
      await openNavigationForUserMenu({ page })
      const trigger = page.locator('.user-menu__trigger')

      await trigger.focus()
      await trigger.press('Enter')
      const language = page.getByRole('menuitem', { name: /language/i })
      await language.focus()
      await language.press('Enter')
      const languageOption = page.getByRole('menuitemradio').first()
      await expect(languageOption).toBeFocused()

      await page.keyboard.press('Tab')

      await expect(languageOption).toBeHidden()
      await expect(language).toBeHidden()
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    test('should restore visible focus when shift-tabbing from a nested User menu', async () => {
      // Additional coverage for PYLD-3645 and PYLD-3697.
      await page.goto(`${serverURL}/admin`)
      await openNavigationForUserMenu({ page })
      const trigger = page.locator('.user-menu__trigger')

      await trigger.focus()
      await trigger.press('Enter')
      const language = page.getByRole('menuitem', { name: /language/i })
      await language.focus()
      await language.press('Enter')
      const languageOption = page.getByRole('menuitemradio').first()
      await expect(languageOption).toBeFocused()

      await page.keyboard.press('Shift+Tab')

      await expect(languageOption).toBeHidden()
      await expect(language).toBeHidden()
      await expect(trigger).toBeFocused()
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    test('should move focus into a mobile User menu submenu', async () => {
      // Additional coverage for PYLD-3645 and PYLD-3697.
      await page.setViewportSize({ height: 720, width: 320 })
      await page.goto(`${serverURL}/admin`)
      await openNavigationForUserMenu({ page })
      const trigger = page.locator('.user-menu__trigger')

      await trigger.focus()
      await trigger.press('Enter')
      const language = page.getByRole('menuitem', { name: /language/i })
      await expect(language).not.toHaveAttribute('aria-haspopup')
      await language.focus()
      await language.press('Enter')

      const back = page.getByRole('menuitem', { name: 'Language', exact: true })
      await expect(back).toBeFocused()
      await page.keyboard.press('ArrowDown')
      await expect(page.getByRole('menuitemradio').first()).toBeFocused()
      await page.setViewportSize({ height: 720, width: 1280 })
    })

    test('should move keyboard focus into and through the Group by dialog', async () => {
      // Additional coverage for PYLD-3782 and PYLD-3783.
      await gotoPostsList({ page, postsURL })
      const trigger = page.locator('#toggle-group-by')

      await trigger.focus()
      await trigger.press('Enter')

      const dialog = page.getByRole('dialog', { name: /group by/i })
      const close = dialog.getByRole('button', { name: /close/i })
      const field = dialog.getByRole('button', { name: /field/i })

      await expect(close).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(field).toBeFocused()
      await expect(dialog).toBeVisible()
    })

    test('should move keyboard focus into and through the Columns dialog', async () => {
      // Additional coverage for PYLD-3701.
      await gotoPostsList({ page, postsURL })
      const trigger = page.locator('.columns-button__button')

      await trigger.focus()
      await trigger.press('Enter')

      const dialog = page.getByRole('dialog', { name: /columns/i })
      const close = dialog.getByRole('button', { name: /close/i })
      const search = dialog.getByRole('textbox', { name: /search columns/i })

      await expect(close).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(search).toBeFocused()
      await expect(dialog).toBeVisible()
    })

    test('should place a dashboard popup immediately after its trigger in the DOM', async () => {
      // PYLD-3639
      await page.goto(`${serverURL}/admin`)
      const trigger = page.locator('.dashboard-breadcrumb-dropdown .popup__trigger-wrap button')
      await trigger.click()
      const popup = page.locator('.popup__content').last()

      await expect(popup).toBeVisible()
      expect(
        await trigger.evaluate(
          (element, popupElement) =>
            element.closest('.popup')?.querySelector(':scope > .popup__content') === popupElement,
          await popup.elementHandle(),
        ),
      ).toBe(true)
    })

    test('should move keyboard focus into dropdowns in rich-text relationship flyouts', async () => {
      // PYLD-3664
      await openRichTextRelationshipDrawer({ page, postsURL })
      const { groupByContent: groupByPopup } = await openGroupBy(page)
      const fieldTrigger = groupByPopup.locator('.group-by-control__select-trigger').first()

      await fieldTrigger.focus()
      await fieldTrigger.press('Enter')
      await expect(page.locator('.popup__content').last().locator('button').first()).toBeFocused()
    })

    test('should leave a rich-text toolbar dropdown in normal Tab order', async () => {
      // Additional coverage for PYLD-3664 and PYLD-3679.
      await gotoCreatePost({ page, postsURL })
      const trigger = page.locator('.rich-text-lexical .toolbar-popup__dropdown-add')

      await trigger.focus()
      await trigger.press('Enter')
      const menu = page.locator('.toolbar-popup__dropdown-items[data-dropdown-key="add"]')
      const menuItem = menu.locator('[role^="menuitem"]').first()
      await expect(menuItem).toBeFocused()
      await expect(menuItem).toHaveAttribute('tabindex', '-1')
      await page.keyboard.press('Tab')

      await expect(menu).toBeHidden()
      await expect(trigger).not.toBeFocused()
    })

    test('should place rich-text dropdown content next to its trigger in logical DOM order', async () => {
      // PYLD-3679
      await gotoCreatePost({ page, postsURL })
      const trigger = page.locator('.rich-text-lexical .toolbar-popup__dropdown-add')
      await trigger.click()
      const menu = page.locator('.toolbar-popup__dropdown-items[data-dropdown-key="add"]')

      await expect(menu).toBeVisible()
      expect(
        await trigger.evaluate(
          (element, menuElement) => element.nextElementSibling === menuElement,
          await menu.elementHandle(),
        ),
      ).toBe(true)
    })

    test('should return focus to the row-menu trigger after an action', async () => {
      // PYLD-3746
      const menu = await openFirstBlockActions({ page, postsURL })
      const trigger = page.locator('#field-layout .array-actions__button').first()

      await menu.getByRole('menuitem', { name: /duplicate/i }).click()
      await expect(trigger).toBeFocused()
    })

    test('should move focus into a row menu opened from the keyboard', async () => {
      // PYLD-3747
      await addTextBlock({ page, postsURL })
      await page.locator('#field-items .array-field__add-row').click()

      for (const trigger of [
        page.locator('#field-layout .array-actions__button').first(),
        page.locator('#field-items .array-actions__button').first(),
      ]) {
        const popup = page.locator('.popup__content').last()

        await openPopupWithKeyboard({
          page,
          popup,
          trigger,
        })
        await expect(popup.locator(':focus')).toBeVisible()
        await page.keyboard.press('Escape')
      }

      await gotoFirstPost({ page, postsURL, serverURL })
      const documentControlsPopup = page.locator('.popup__content').last()

      await openPopupWithKeyboard({
        page,
        popup: documentControlsPopup,
        trigger: page.locator('.doc-controls__popup .popup__trigger-wrap button'),
      })
      await expect(documentControlsPopup.locator(':focus')).toBeVisible()
    })

    test('should expose only one focus target for each filter combobox', async () => {
      // PYLD-3753
      const whereBuilder = await openPostsFilter({ page, postsURL })
      const fieldSelect = whereBuilder.locator('.condition__field')

      const indicator = fieldSelect.locator('.dropdown-indicator')
      await expect(indicator).toHaveAttribute('aria-hidden', 'true')
      expect(await indicator.evaluate((element) => element.tagName)).toBe('DIV')
    })

    test('should keyboard-focus every Group by field option', async () => {
      // PYLD-3782
      await gotoPostsList({ page, postsURL })
      const { groupByContent: groupByPopup } = await openGroupBy(page)
      const fieldTrigger = groupByPopup.locator('.group-by-control__select-trigger').first()
      await fieldTrigger.press('Enter')
      const items = page.locator('.popup__content').last().locator('button')
      const itemCount = await items.count()

      expect(itemCount).toBeGreaterThan(2)
      for (let index = 0; index < itemCount; index++) {
        if (index > 0) {
          await page.keyboard.press('ArrowDown')
        }
        await expect(items.nth(index)).toBeFocused()
      }
    })

    test('should focus each row label before its More options control', async () => {
      // PYLD-3787
      await addTextBlock({ page, postsURL })
      await page.locator('#field-items .array-field__add-row').click()

      for (const row of [
        page.locator('#field-layout .blocks-field__row').first(),
        page.locator('#field-items .array-field__row').first(),
      ]) {
        const label = row.locator('.collapsible__toggle')
        const moreOptions = row.locator('.array-actions__button')

        expect(
          await label.evaluate(
            (element, action) =>
              Boolean(
                element.compareDocumentPosition(action as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
              ),
            await moreOptions.elementHandle(),
          ),
        ).toBe(true)

        await label.focus()
        let reachedMoreOptions = false
        for (let tab = 0; tab < 4; tab++) {
          await page.keyboard.press('Tab')
          if (await moreOptions.evaluate((element) => document.activeElement === element)) {
            reachedMoreOptions = true
            break
          }
        }
        expect(reachedMoreOptions).toBe(true)
      }
    })

    test('sortable value labels provide a dedicated keyboard drag control', async () => {
      // PYLD-3810
      await gotoCreatePost({ page, postsURL })
      const select = page.locator('#field-accessibilitySortableSelect')
      const draggableValue = select.locator('.rs__multi-value').first()
      const dragLabel = draggableValue.getByRole('button', {
        name: /drag to reorder.*value one/i,
      })
      const removeButton = draggableValue.locator('.multi-value-remove')

      await expect(draggableValue).toBeVisible()
      await expect(draggableValue).not.toHaveAttribute('role', 'button')
      await expect(draggableValue.locator('button')).toHaveCount(2)
      await expect(dragLabel).toHaveClass(/multi-value-label__drag-button/)
      await expect(dragLabel).toBeVisible()
      await expect(dragLabel).toContainText('Value One')
      await expect(dragLabel.locator('svg')).toHaveCount(0)
      await expect(dragLabel).toHaveAccessibleName(/1 of 2/i)
      await removeButton.focus()
      await expect(removeButton).toBeFocused()

      const labelsBefore = await select.locator('.multi-value-label').allTextContents()
      await dragLabel.focus()
      await expect
        .poll(() => draggableValue.evaluate((element) => getComputedStyle(element).outlineStyle))
        .not.toBe('none')
      await page.keyboard.press('Space')
      await expect(page.locator('body')).toHaveClass(/is-dragging/)
      await expect(dragLabel).toBeFocused()
      const dragStatus = page.getByRole('status').filter({ hasText: /draggable item one/i })
      await expect(dragStatus).toContainText(/droppable area one/i)
      await dragLabel.press('ArrowRight')
      await expect(dragStatus).toContainText(/droppable area two/i)
      await page.keyboard.press('Space')
      await expect(page.locator('body')).not.toHaveClass(/is-dragging/)
      await expect
        .poll(() => select.locator('.multi-value-label').allTextContents())
        .toEqual([labelsBefore[1], labelsBefore[0]])

      const reorderedLabels = select.getByRole('button', { name: /drag to reorder/i })
      const sourceBox = await reorderedLabels.nth(0).boundingBox()
      const targetBox = await select.locator('.rs__multi-value').nth(1).boundingBox()
      expect(sourceBox).not.toBeNull()
      expect(targetBox).not.toBeNull()
      await page.mouse.move(
        sourceBox!.x + sourceBox!.width / 2,
        sourceBox!.y + sourceBox!.height / 2,
      )
      await page.mouse.down()
      await page.mouse.move(
        sourceBox!.x + sourceBox!.width + 8,
        sourceBox!.y + sourceBox!.height / 2,
        {
          steps: 5,
        },
      )
      await page.mouse.move(
        targetBox!.x + targetBox!.width / 2,
        targetBox!.y + targetBox!.height / 2,
        {
          steps: 10,
        },
      )
      await page.mouse.up()
      await expect
        .poll(() => select.locator('.multi-value-label').allTextContents())
        .toEqual(labelsBefore)
    })

    test('disabled select indicators cannot receive focus', async () => {
      // PYLD-3813
      await gotoCreatePost({ page, postsURL })
      const indicator = page.locator('#field-accessibilityDisabledSelect .dropdown-indicator')

      await expect(indicator).toBeVisible()
      expect(
        await indicator.evaluate((element) => {
          ;(element as HTMLElement).focus()
          return document.activeElement === element
        }),
      ).toBe(false)
    })
  })

  test.describe('2.4.6 Headings and Labels (AA)', () => {
    test('should include the visible version count in the table history link name', async () => {
      // PYLD-3707
      test.setTimeout(60000)
      for (const kind of ['collection', 'global'] as const) {
        if (kind === 'collection') {
          await gotoFirstPost({ page, postsURL, serverURL })
        } else {
          await page.goto(
            formatAdminURL({ adminRoute: '/admin', path: '/globals/menu', serverURL }),
          )
        }
        const tab = page.locator('.doc-tab', { hasText: 'Versions' })
        const count = (await tab.innerText()).match(/\d+/)?.[0]

        expect(count).toBeTruthy()
        await expect.soft(tab).toHaveAccessibleName(new RegExp(`Versions.*${count}`, 'i'))
      }
    })

    test('should distinguish new-folder actions by their destination column', async () => {
      // PYLD-3584
      // No criterion was supplied in the report; 2.4.6 is the best-fit classification.
      const modal = await openFolderCreationLocation({ page, serverURL })

      await modal
        .locator('.hierarchy-column-item')
        .filter({ hasText: /^Accessibility folder$/ })
        .press('Enter')
      const columns = modal.locator('.hierarchy-column')

      await expect(columns).toHaveCount(2)
      await expect
        .soft(columns.nth(0).getByRole('button', { name: /new folder/i }))
        .toHaveAccessibleName(/new folder.*all/i)
      await expect
        .soft(columns.nth(1).getByRole('button', { name: /new folder/i }))
        .toHaveAccessibleName(/new folder.*accessibility folder/i)
    })

    test('should name the API-key confirmation close control without an internal identifier', async () => {
      // PYLD-3617
      const dialog = await openAPIKeyDialog({ page, serverURL })

      await expect(dialog.locator('.dialog__header-end button')).toHaveAccessibleName('Close')
    })

    test('should name the live-preview unpublish confirmation close control clearly', async () => {
      // PYLD-3727
      await openLivePreview({ page, postsURL, serverURL })
      await page.locator('.doc-controls__popup .popup__trigger-wrap button').click()
      await page.locator('#action-unpublish').click()
      const dialog = page.locator('.dialog').filter({ hasText: /confirm unpublish/i })

      await expect(dialog).toBeVisible()
      await expect(dialog.locator('.dialog__header-end button')).toHaveAccessibleName('Close')
    })

    test('should give each bulk-edit remove control a unique field-specific label', async () => {
      // PYLD-3768
      const fieldSelect = await openBulkEditFieldSelect({ page, postsURL })
      await selectInput({ multiSelect: false, option: 'Title', page, selectLocator: fieldSelect })
      await selectInput({
        multiSelect: false,
        option: 'Accessibility Select',
        page,
        selectLocator: fieldSelect,
      })
      const removeButtons = fieldSelect.locator('.multi-value-remove')

      await expect(removeButtons.nth(0)).toHaveAccessibleName(/remove.*title/i)
      await expect(removeButtons.nth(1)).toHaveAccessibleName(/remove.*accessibility select/i)
    })
  })

  test.describe('2.4.7 Focus Visible (AA)', () => {
    test('should reveal the collection card create action and its focus indicator by keyboard', async ({
      browser: _browser,
    }, testInfo) => {
      await page.goto(`${serverURL}/admin`)
      await page.mouse.move(0, 0)

      const scan = await runAxeScan({ include: ['.collections'], page, testInfo })
      const card = page.locator('.collections__card-list .card').first()
      const createLink = card.locator('.card__actions a')
      const actions = card.locator('.card__actions')
      const unfocusedStyle = await getFocusIndicatorStyle(createLink)

      expect(scan.violations).toHaveLength(0)
      await expect(actions).toHaveCSS('opacity', '0')
      await card.locator('.card__click').focus()
      await page.keyboard.press('Tab')

      await expect(createLink).toBeFocused()
      await expect(actions).toHaveCSS('opacity', '1')
      expect(
        hasRenderedFocusIndicator({
          focusedStyle: await getFocusIndicatorStyle(createLink),
          unfocusedStyle,
        }),
      ).toBe(true)
    })

    test('should paint a keyboard focus indicator on the dashboard Add button', async () => {
      // PYLD-3631
      const header = await openDashboardEditor({ page, serverURL })
      const add = header.getByRole('button', { name: 'Add +', exact: true })
      await header.getByRole('button', { name: 'Save changes', exact: true }).focus()
      const unfocusedStyle = await getFocusIndicatorStyle(add)

      await page.keyboard.press('Shift+Tab')
      await expect(add).toBeFocused()
      await expect
        .poll(async () =>
          hasRenderedFocusIndicator({
            focusedStyle: await getFocusIndicatorStyle(add),
            unfocusedStyle,
          }),
        )
        .toBe(true)
    })

    test('should reveal the insert-paragraph indicator on keyboard focus', async () => {
      // PYLD-3828
      await gotoCreatePost({ page, postsURL })
      const editor = page.locator('[data-field-path="content"] [contenteditable="true"]')
      const insert = page.locator('[data-field-path="content"] .insert-paragraph-at-end')

      await editor.fill('Insert paragraph keyboard focus')
      await page.mouse.move(0, 0)
      await page.locator('#field-items .array-field__add-row').focus()
      let hasReachedInsert = false
      for (let index = 0; index < 30; index++) {
        await page.keyboard.press('Shift+Tab')
        if (await insert.evaluate((element) => element === document.activeElement)) {
          hasReachedInsert = true
          break
        }
      }
      expect(hasReachedInsert).toBe(true)
      await expect(insert.locator('.insert-paragraph-at-end-inside')).toHaveCSS('opacity', '1')
    })
    test('should not tab to an invisible widget drawer dismissal region', async () => {
      // PYLD-3633
      const { drawer, trigger } = await openWidgetDrawer({ page, serverURL })

      await trigger.press('Enter')
      await expect(drawer).toBeVisible()
      const dismissal = drawer.locator(':scope > .drawer__close')
      const unfocusedStyle = await getFocusIndicatorStyle(dismissal)
      const stopCount = await drawer.locator('button, input, a[href], [tabindex="0"]').count()

      for (let step = 0; step <= stopCount + 1; step++) {
        await page.keyboard.press('Tab')
        if (await dismissal.evaluate((element) => element === document.activeElement)) {
          const focusedStyle = await getFocusIndicatorStyle(dismissal)

          expect.soft(hasRenderedFocusIndicator({ focusedStyle, unfocusedStyle })).toBe(true)
        }
      }
    })

    test('should render a visible focus indicator on date-picker month and year selects', async () => {
      // PYLD-3738
      const { monthSelect, yearSelect } = await openBlockDatePicker({ page, postsURL })

      for (const select of [monthSelect, yearSelect]) {
        const unfocusedStyle = await getFocusIndicatorStyle(select)
        await select.focus()
        await expect(select).toBeFocused()
        await expect
          .poll(async () =>
            hasRenderedFocusIndicator({
              focusedStyle: await getFocusIndicatorStyle(select),
              unfocusedStyle,
            }),
          )
          .toBe(true)
      }
    })
  })

  test.describe('2.5.8 Target Size (Minimum) (AA)', () => {
    test('selected-value remove controls only dim their icon on hover', async () => {
      // Additional coverage for PYLD-3811.
      await gotoCreatePost({ page, postsURL })
      const removeButton = page
        .locator('#field-accessibilitySortableSelect .multi-value-remove')
        .first()
      const removeIcon = removeButton.locator('.multi-value-remove__icon')
      const defaultIconOpacity = Number.parseFloat(await removeIcon.evaluate(getComputedOpacity))

      await removeButton.hover()

      await expect
        .poll(async () => Number.parseFloat(await removeIcon.evaluate(getComputedOpacity)))
        .toBeLessThan(defaultIconOpacity)
      expect(await removeButton.evaluate(getComputedBackgroundColor)).toBe('rgba(0, 0, 0, 0)')
      expect(await removeButton.evaluate(getPseudoBackgroundColor)).toBe('rgba(0, 0, 0, 0)')
    })

    test('selected-value controls provide invisible 24px targets without enlarging the chip', async () => {
      // PYLD-3811
      // Additional coverage for PYLD-3810.
      await gotoCreatePost({ page, postsURL })
      const select = page.locator('#field-accessibilitySortableSelect')
      const chip = select.locator('.rs__multi-value').first()
      const controls = [
        chip.locator('.multi-value-label__drag-button'),
        chip.locator('.multi-value-remove'),
      ]

      for (const control of controls) {
        await expect(control).toBeVisible()
        const [chipBox, controlBox] = await Promise.all([chip.boundingBox(), control.boundingBox()])

        expect(chipBox).not.toBeNull()
        expect(controlBox).not.toBeNull()
        expect(controlBox!.width).toBeGreaterThanOrEqual(24)
        expect(controlBox!.height).toBeGreaterThanOrEqual(24)
        expect(chipBox!.height).toBe(20)
      }

      expect(
        await chip
          .locator('.multi-value-remove')
          .evaluate((element) => Number.parseFloat(getComputedStyle(element, '::before').height)),
      ).toBe(24)
      expect(
        await chip
          .locator('.multi-value-remove')
          .evaluate((element) => Number.parseFloat(getComputedStyle(element, '::before').width)),
      ).toBe(24)

      const targetRects = await select
        .locator('.multi-value-label__drag-button, .multi-value-remove')
        .evaluateAll((elements) =>
          elements.map((element) => {
            const { bottom, left, right, top } = element.getBoundingClientRect()
            return { bottom, left, right, top }
          }),
        )

      for (const [index, rect] of targetRects.entries()) {
        for (const otherRect of targetRects.slice(index + 1)) {
          const overlaps =
            rect.left < otherRect.right &&
            rect.right > otherRect.left &&
            rect.top < otherRect.bottom &&
            rect.bottom > otherRect.top
          expect(overlaps).toBe(false)
        }
      }
    })
  })

  test.describe('3.2.1 On Focus (A)', () => {
    test('should retain keyboard focus on Global API toolbar controls without activating them', async () => {
      // PYLD-3621
      await openGlobalAPI({ page, serverURL })
      const apiURL = page.getByRole('textbox', { name: 'API URL', exact: true })
      const initialURL = page.url()
      const initialPageCount = page.context().pages().length

      await apiURL.focus()
      for (const control of [
        page.getByRole('link', { name: 'Open in new window', exact: true }),
        page.getByRole('button', { name: 'toggle fullscreen', exact: true }),
      ]) {
        await page.keyboard.press('Tab')
        await expect(control).toBeFocused()
        // Observe delayed editor focus effects without retrying away a transient focus loss.
        const retainedFocus = await control.evaluate(async (element) => {
          let hasLostFocus = document.activeElement !== element
          const onFocus = () => {
            hasLostFocus ||= document.activeElement !== element
          }

          document.addEventListener('focusin', onFocus)
          await new Promise((resolve) => setTimeout(resolve, 500))
          document.removeEventListener('focusin', onFocus)
          return !hasLostFocus && document.activeElement === element
        })

        expect(retainedFocus).toBe(true)
        await expect(page.locator('.query-inspector')).not.toHaveClass(
          /query-inspector--fullscreen/,
        )
        expect(page.url()).toBe(initialURL)
        expect(page.context().pages()).toHaveLength(initialPageCount)
      }
    })
  })

  test.describe('3.2.2 On Input (A)', () => {
    test('should retain focus during automatic search', async () => {
      // Additional coverage for PYLD-3773.
      for (const isColumnSearch of [false, true]) {
        await page.goto(`${postsURL.list}?search=`)
        if (isColumnSearch) {
          await page.locator('.columns-button__button').click()
        }
        const search = isColumnSearch
          ? page
              .getByRole('dialog', { name: /columns/i })
              .getByRole('textbox', { name: /search columns/i })
          : page.locator('#search-filter-input')

        await expect(search).toHaveAccessibleDescription(/automatically as you type/i)
        await search.fill('no-matching-accessibility-result')
        if (isColumnSearch) {
          await expect(
            page.getByText('No matches found for this search', { exact: true }),
          ).toBeVisible()
        } else {
          await expect(page.locator('tbody tr')).toHaveCount(0)
          await expect(page.locator('.no-results__title')).toHaveText('No Results.')
        }
        await expect(search).toBeFocused()
      }
    })
  })

  test.describe('3.3.2 Labels or Instructions (A)', () => {
    test('should expose required state without naming the asterisk', async () => {
      // PYLD-3579, PYLD-3779, PYLD-3715
      for (const { name, collection, field, localized } of [
        { name: 'Alt', collection: 'media', field: 'alt', localized: false },
        { name: 'Title', collection: 'posts', field: 'title', localized: true },
      ]) {
        await page.goto(
          formatAdminURL({
            adminRoute: '/admin',
            path: `/collections/${collection}/create`,
            serverURL,
          }),
        )
        const input = page.locator(`#field-${field}`)

        await expect(input).toBeVisible()
        await expect(input).toHaveAccessibleName(new RegExp(name))
        await expect(input).not.toHaveAccessibleName(/\*/)
        await expectRequiredState({ input })
        if (localized) {
          await expect(page.locator('label').filter({ hasText: /^Title/ })).toContainText('English')
        }
      }
    })

    test('should expose select requirements and validation errors', async () => {
      await gotoCreatePost({ page, postsURL })
      const select = page.locator('#field-accessibilitySelect')
      const tags = page
        .locator('.field-type.text')
        .filter({ has: page.locator('.field-requiredTags') })

      const selectInput = select.getByRole('combobox')

      await selectInput.focus()
      await expect(selectInput).toHaveAttribute('aria-describedby', /live-region/)
      await expect(selectInput).toHaveAttribute('aria-required', 'true')
      await select.locator('.clear-indicator').click()
      await tags.locator('.multi-value-remove').click()
      await page.getByRole('button', { name: /^Publish(?: in English)?$/ }).click()

      for (const field of [select, tags]) {
        const input = field.getByRole('combobox')
        const error = field.locator('.field-error[role="alert"]')

        await expect(error).toContainText(/require/i)
        await expect(input).toHaveAttribute('aria-required', 'true')
        await expect(input).toHaveAttribute('aria-invalid', 'true')
        await expect(input).toHaveAccessibleDescription(
          new RegExp((await error.textContent())!.trim()),
        )
        await expect(field.locator('input[required]')).toHaveCount(0)
        await expect(input).toHaveAttribute('aria-describedby', /placeholder/)
        await input.focus()
        await expect(input).toHaveAccessibleDescription(/require/i)
      }
    })

    test('should update accessibility states on non-searchable selects', async () => {
      await gotoCreatePost({ page, postsURL })
      const input = page.getByRole('combobox', { name: 'Non-searchable required select' })

      await expect(input).toHaveAttribute('aria-required', 'true')
      await expect(input).toHaveAttribute('aria-invalid', 'true')
      await expect(input).toHaveAccessibleDescription('Choose an option An option is required.')
      await input.focus()
      await expect(input).toHaveAccessibleDescription('Choose an option An option is required.')
      await expect(input.locator('..').locator('input[required]')).toHaveCount(0)
      await page.getByRole('button', { name: 'Clear select requirements' }).click()
      await expect(input).not.toHaveAttribute('aria-required', 'true')
      await expect(input).not.toHaveAttribute('aria-invalid', 'true')
      await expect(input).toHaveAccessibleDescription('Choose an option')
    })

    test('should open and dismiss required-field help', async () => {
      // PYLD-3778
      await gotoCreatePost({ page, postsURL })
      const message = 'Fields marked with * are required.'
      const trigger = page.getByRole('button', { name: message, exact: true })
      const explanation = page.getByText(message, { exact: true })

      await expect(trigger).toBeVisible()
      await expect(trigger).toHaveText('')
      const spacing = await trigger.evaluate((button) => {
        const icon = button.closest('.required-fields-info')!
        const parent = icon.parentElement!
        const next = icon.nextSibling
        const fields = parent.querySelector('.document-fields__fields')!
        const before = fields.getBoundingClientRect().top

        icon.remove()
        const after = fields.getBoundingClientRect().top

        parent.insertBefore(icon, next)
        return { after, before }
      })

      expect(spacing.after).toBe(spacing.before)
      await expect(explanation).toBeHidden()
      await trigger.hover()
      await expect(explanation).toBeVisible()
      await explanation.hover()
      await expect(explanation).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(explanation).toBeHidden()
      await page.locator('#field-title').focus()
      await trigger.focus()
      await expect(explanation).toBeVisible()
      await trigger.press('Escape')
      await expect(explanation).toBeHidden()
      await trigger.press('Enter')
      await expect(explanation).toBeVisible()
      await page.locator('#field-title').click()
      await expect(explanation).toBeHidden()
      await trigger.click()
      await expect(explanation).toBeVisible()
      const box = await trigger.boundingBox()

      expect(box?.width).toBeGreaterThanOrEqual(24)
      expect(box?.height).toBeGreaterThanOrEqual(24)
      await trigger.press('Escape')
      await page.locator('#relatedPost-add-new button').click()
      const drawer = page.locator('dialog[id^="doc-drawer_posts_"]')
      const drawerTrigger = drawer.getByRole('button', { name: message, exact: true })
      const drawerExplanation = drawer.getByText(message, { exact: true })

      await drawerTrigger.focus()
      await expect(drawerExplanation).toBeVisible()
      await drawerTrigger.press('Escape')
      await expect(drawerExplanation).toBeHidden()
      await expect(drawer).toBeVisible()
    })
  })

  test.describe('4.1.2 Name, Role, Value (A)', () => {
    test('should expose a labelled region for expanded collapsible field content', async () => {
      // PYLD-3818
      await gotoCreatePost({ page, postsURL })
      const field = page.locator('.collapsible-field').filter({ hasText: 'Publishing details' })
      const toggle = field.locator('.collapsible__toggle')
      const input = field.getByRole('textbox', { name: 'Publishing Note', exact: true })
      const region = field.getByRole('region', { name: /publishing details/i })

      await expect(input).toBeVisible()
      await expect(region).toBeVisible()
      await expect(
        region.getByRole('textbox', { name: 'Publishing Note', exact: true }),
      ).toBeVisible()
      await expect(toggle).toHaveAttribute('aria-labelledby', /\S/)
      await expect(region).toHaveAttribute('id', /\S/)
      const regionID = await region.getAttribute('id')
      await expect(toggle).toHaveAccessibleName('Publishing details Toggle block')
      await expect(region).toHaveAccessibleName('Publishing details')
      await expect(region).toHaveAttribute('aria-labelledby', /\S/)
      await expect(toggle).toHaveAttribute('aria-controls', regionID!)
      await toggle.press('Enter')
      await expect(region).toBeHidden()
      await toggle.press('Space')
      await expect(region).toBeVisible()
    })

    test('should name a collapsible region from its custom Label without a config label', async () => {
      await gotoCreatePost({ page, postsURL })
      const field = page.locator('.collapsible-field').filter({ hasText: 'Editorial details' })
      const region = field.getByRole('region', { name: 'Editorial details', exact: true })
      const toggle = field.locator('.collapsible__toggle')

      await expect(field.getByText('Editorial details', { exact: true })).toBeVisible()
      await expect(region).toBeVisible()
      await expect(
        region.getByRole('textbox', { name: 'Custom Label Note', exact: true }),
      ).toBeVisible()
      await expect(toggle).toHaveAccessibleName('Editorial details Toggle block')
      await expect(region).toHaveAttribute('id', /\S/)
      const regionID = await region.getAttribute('id')

      await expect(toggle).toHaveAttribute('aria-controls', regionID!)
      await toggle.press('Enter')
      await expect(region).toBeHidden()
      await expect(toggle).toHaveAttribute('aria-expanded', 'false')
      await toggle.press('Space')
      await expect(region).toBeVisible()
      await expect(toggle).toHaveAttribute('aria-expanded', 'true')
      await expect(region).toHaveAccessibleName('Editorial details')
    })

    test('should name Block and Collapsible group toggles and expose their current state', async () => {
      // PYLD-3792
      test.setTimeout(90000)
      await addTextBlock({ page, postsURL })
      const fields = [
        { name: /text block/i, container: page.locator('#field-layout .collapsible').first() },
        {
          name: /publishing details/i,
          container: page.locator('.collapsible-field').filter({ hasText: 'Publishing details' }),
        },
      ]

      for (const { name, container } of fields) {
        const toggle = container.locator('.collapsible__toggle')
        const content = container.locator('.collapsible__content').first()

        await expect(content).toBeVisible()
        await expect.soft(toggle).toHaveAccessibleName(name)
        await expect.soft(toggle).toHaveAttribute('aria-expanded', 'true')
        await toggle.press('Enter')
        await expect(content).toBeHidden()
        await expect.soft(toggle).toHaveAttribute('aria-expanded', 'false')
        await toggle.press('Space')
        await expect(content).toBeVisible()
        await expect.soft(toggle).toHaveAttribute('aria-expanded', 'true')
      }
    })

    test('should expose bulk collapse and show state for multiple Array and Blocks rows', async () => {
      // PYLD-3786
      test.setTimeout(120000)
      await addTextBlock({ page, postsURL })
      await page.locator('#field-layout .array-actions__button').first().click()
      await page.getByRole('menuitem', { name: /duplicate/i }).click()
      await page.locator('#field-items .array-field__add-row').click()
      await page.locator('#field-items .array-field__add-row').click()

      for (const selector of ['#field-items', '#field-layout']) {
        const field = page.locator(selector)
        const contents = field.locator('.collapsible__content')
        const collapse = field.getByRole('button', { name: /collapse all/i })
        const show = field.getByRole('button', { name: /show all/i })

        await expect(contents).toHaveCount(2)
        await expect(field.getByRole('region')).toHaveCount(0)
        for (const content of await contents.all()) {
          await expect(content).toBeVisible()
        }
        for (const command of [collapse, show]) {
          await expect.soft(command).toHaveAttribute('aria-expanded', 'true')
        }
        const rows = field.locator('.array-field__draggable-rows, .blocks-field__rows')
        await expect(rows).toHaveAttribute('id', /\S/)
        const rowsID = await rows.getAttribute('id')
        for (const command of [collapse, show]) {
          await expect(command).toHaveAttribute('aria-controls', rowsID!)
        }
        await field.locator('.collapsible__toggle').first().press('Enter')
        await expect(contents.first()).toBeHidden()
        await expect(contents.nth(1)).toBeVisible()
        for (const command of [collapse, show]) {
          await expect(command).toHaveAttribute('aria-expanded', 'true')
        }
        await collapse.press('Enter')
        for (const content of await contents.all()) {
          await expect(content).toBeHidden()
        }
        for (const command of [collapse, show]) {
          await expect.soft(command).toHaveAttribute('aria-expanded', 'false')
        }
        await show.press('Space')
        for (const content of await contents.all()) {
          await expect(content).toBeVisible()
        }
        for (const command of [collapse, show]) {
          await expect.soft(command).toHaveAttribute('aria-expanded', 'true')
        }
      }
    })

    test('should expose navigation disclosure state while opening and closing the menu', async () => {
      // PYLD-3803
      test.slow()
      const originalViewport = page.viewportSize()

      try {
        await page.setViewportSize({ height: 900, width: 768 })
        await gotoPostsList({ page, postsURL })
        const toggle = page.locator('.app-header__sidebar-toggle')
        const close = page.getByRole('button', { name: 'Hide sidebar', exact: true })
        const nav = page
          .locator('aside')
          .filter({ has: page.getByRole('navigation', { includeHidden: true }) })

        await expect(nav).toHaveClass(/nav-hydrated/)
        await expect(toggle).toHaveAccessibleName(/open menu/i)
        await expect.soft(toggle).toHaveAttribute('aria-expanded', 'false')
        await toggle.press('Enter')
        await expect(toggle).toBeHidden()
        await expect(close).toBeVisible()
        await expect(close).toHaveAttribute('aria-expanded', 'true')
        await expect(nav).not.toHaveAttribute('inert', '')
        await expect.soft(toggle).toHaveAttribute('aria-expanded', 'true')
        await close.press('Space')
        await expect(toggle).toHaveAccessibleName(/open menu/i)
        await expect(nav).toHaveAttribute('inert', '')
        await expect.soft(toggle).toHaveAttribute('aria-expanded', 'false')
      } finally {
        if (originalViewport) {
          await page.setViewportSize(originalViewport)
        }
      }
    })

    test('should expose the initial and changed More options state on versioned document creation', async () => {
      // PYLD-3714
      test.slow()
      await gotoCreatePost({ page, postsURL })
      const toggle = page
        .locator('.doc-controls')
        .getByRole('button', { name: 'More options', exact: true })

      await expect(toggle).toHaveAccessibleName('More options')
      await expect.soft(toggle).toHaveAttribute('aria-expanded', 'false')
      await toggle.press('Enter')
      await expect(page.getByRole('menu')).toBeVisible()
      await expect.soft(toggle).toHaveAttribute('aria-expanded', 'true')
      await page.keyboard.press('Escape')
      await expect(page.getByRole('menu')).toBeHidden()
      await expect(toggle).toBeFocused()
      await expect.soft(toggle).toHaveAttribute('aria-expanded', 'false')
    })

    test('should expose the Global API fullscreen toggle state through both transitions', async () => {
      // PYLD-3622
      test.slow()
      await openGlobalAPI({ page, serverURL })
      const toggle = page.getByRole('button', { name: 'toggle fullscreen', exact: true })
      const view = page.locator('.query-inspector')

      await expect(view).not.toHaveClass(/query-inspector--fullscreen/)
      await expect.soft(toggle).toHaveAttribute('aria-pressed', 'false')
      await toggle.press('Enter')
      await expect(view).toHaveClass(/query-inspector--fullscreen/)
      await expect.soft(toggle).toHaveAttribute('aria-pressed', 'true')
      await toggle.press('Space')
      await expect(view).not.toHaveClass(/query-inspector--fullscreen/)
      await expect.soft(toggle).toHaveAttribute('aria-pressed', 'false')
    })

    test('should expose and operate the All Folders navigation item by keyboard', async () => {
      const sidebar = await openNavigationFolders({ page, serverURL })
      const all = sidebar.getByRole('treeitem', { name: /all.*folders/i })
      const parent = sidebar.getByRole('treeitem', { name: 'Accessibility folder', exact: true })

      await expect(sidebar.locator('[role=treeitem][tabindex="0"]')).toHaveCount(1)
      await all.focus()
      await all.press('ArrowDown')
      await expect(parent).toBeFocused()
      await parent.press('ArrowUp')
      await expect(all).toBeFocused()
      await expect(sidebar.locator('[role=treeitem][tabindex="0"]')).toHaveCount(1)
      await all.press('Enter')
      await expect(page).toHaveURL(/collections\/payload-folders\/hierarchy/)
      await expect(page.locator('.hierarchy-list')).toBeVisible()
    })

    test('should identify all navigation routes and preserve keyboard access', async () => {
      test.setTimeout(60_000)
      await openMainNavigation({ page, postsURL })
      const selected = page.locator('#nav-posts')

      await expect(selected).toHaveAttribute('aria-current', 'page')
      await expect(selected).toHaveAccessibleName('Posts')
      await expect(page.locator('#nav-users')).not.toHaveAttribute('aria-current', 'page')
      const group = page.locator('.nav-group').filter({ has: selected })

      await group.locator('.nav-group__toggle').focus()
      let hasReachedSelected = false

      for (let index = 0; index < 30; index++) {
        await page.keyboard.press('Tab')
        if (await selected.evaluate((element) => element === document.activeElement)) {
          hasReachedSelected = true
          break
        }
      }
      expect(hasReachedSelected).toBe(true)
      for (const view of ['create', 'edit', 'versions'] as const) {
        if (view === 'create') {
          await gotoCreatePost({ page, postsURL })
        } else if (view === 'edit') {
          await gotoFirstPost({ page, postsURL, serverURL })
        } else {
          await openTableVersionHistory({ kind: 'collection', page, postsURL, serverURL })
        }
        await openNavigation({ page })
        await expect(page.locator('#nav-posts')).toHaveAttribute('aria-current', 'location')
      }
      const toggle = page.locator('.nav-group__toggle').filter({ hasText: /^Collections$/ })

      await expect(toggle).toHaveAttribute('aria-expanded', 'true')
      await toggle.press('Enter')
      await expect(selected).toBeHidden()
      await expect(toggle).toHaveAttribute('aria-expanded', 'false')
      await toggle.press('Enter')
      await expect(selected).toBeVisible()
      await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    })

    test('should expose the upload dropzone without detectable accessibility violations', async ({
      browser: _browser,
    }, testInfo) => {
      // PYLD-4166
      await page.goto(`${serverURL}/admin`)
      await expect(page.locator('.upload-dropzone-widget')).toBeVisible()

      const results = await runAxeScan({
        include: ['.upload-dropzone-widget'],
        page,
        testInfo,
      })

      expect(results.violations).toEqual([])
    })

    test('should give the navigation close control an accessible name', async () => {
      await page.goto(`${serverURL}/admin`)
      await openNavigationForUserMenu({ page })

      await expect(page.locator('.nav__close')).toHaveAccessibleName(/hide sidebar/i)
    })

    test('should expose the block date-picker input with its visible Date label', async () => {
      // PYLD-3740
      const { field, input } = await prepareBlockDateField({ page, postsURL })

      await expect(field.locator('label.field-label')).toHaveText('Date')
      await expect(input).toHaveAccessibleName('Date')
    })

    test('should expose the block date-picker calendar as a descriptively named dialog', async () => {
      // PYLD-3736
      const { calendar, input } = await prepareBlockDateField({ page, postsURL })

      await input.click()
      await expect(calendar).toBeVisible()
      await expect(calendar).toHaveRole('dialog')
      await expect(calendar).toHaveAccessibleName(/date|calendar|month.*year/i)
    })

    test('should expose table Columns and Group By expansion states', async () => {
      // PYLD-3781
      // PYLD-3705
      test.setTimeout(60000)
      await gotoPostsList({ page, postsURL })
      for (const name of [/^Columns$/, /^Group by(?: |$)/]) {
        const trigger = page.getByRole('button', { name, exact: true })

        await expect(trigger).toHaveAttribute('aria-expanded', 'false')
        await trigger.click()
        await expect(trigger).toHaveAttribute('aria-expanded', 'true')
        await page.keyboard.press('Escape')
        await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      }
    })

    test('should give collection and global version tables descriptive names', async () => {
      // PYLD-3708
      test.setTimeout(60000)
      for (const kind of ['collection', 'global'] as const) {
        const view = await openTableVersionHistory({ kind, page, postsURL, serverURL })

        const grid = view.getByRole('grid', { name: /versions/i })

        await expect(grid).toBeVisible()
        const row = grid.locator('tbody tr').first()

        await expect(row).toHaveAccessibleName('1')
        await row.locator('td').first().focus()
        const cells = row.locator('td')

        for (let columnIndex = 1; columnIndex < (await cells.count()); columnIndex++) {
          await page.keyboard.press('ArrowRight')
          await expect(cells.nth(columnIndex)).toBeFocused()
        }
        await page.keyboard.press('Home')
        await expect(row.locator('td').first()).toBeFocused()
        await page.keyboard.press('Tab')
        await expect
          .poll(() => grid.evaluate((element) => element.contains(document.activeElement)))
          .toBe(false)
      }
    })

    test('should name version table per-page controls with their value and purpose', async () => {
      // PYLD-3712
      test.setTimeout(60000)
      for (const kind of ['collection', 'global'] as const) {
        const view = await openTableVersionHistory({ kind, page, postsURL, serverURL })
        const button = view.locator('.per-page').getByRole('button')
        const value = (await button.innerText()).trim()

        await expect.soft(button).toHaveAccessibleName(`Per Page: ${value}`)
      }
    })

    test('should name pagination arrows in collection, version, and drawer tables', async () => {
      test.setTimeout(120000)
      await test.step('should name both version table pagination arrows', async () => {
        // PYLD-3710
        for (const kind of ['collection', 'global'] as const) {
          await openTableVersionHistory({ kind, page, postsURL, serverURL })
          const url = new URL(page.url())

          try {
            url.searchParams.set('limit', '1')
            await page.goto(url.toString())
            await expect(page.locator('main.versions tbody tr')).toHaveCount(1)
            await expect
              .soft(page.locator('.paginator .clickable-arrow--left'))
              .toHaveAccessibleName('Previous table page')
            await expect
              .soft(page.locator('.paginator .clickable-arrow--right'))
              .toHaveAccessibleName('Next table page')
          } finally {
            url.searchParams.set('limit', '10')
            await page.goto(url.toString())
            await expect(page.locator('main.versions tbody tr')).toHaveCount(3)
          }
        }
      })

      await test.step('should name both collection table pagination arrows', async () => {
        // PYLD-3695
        try {
          await page.goto(`${postsURL.list}?limit=1`)
          await expect(page.locator('tbody tr')).toHaveCount(1)
          await expect
            .soft(page.locator('.paginator .clickable-arrow--left'))
            .toHaveAccessibleName('Previous table page')
          await expect
            .soft(page.locator('.paginator .clickable-arrow--right'))
            .toHaveAccessibleName('Next table page')
        } finally {
          await page.goto(`${postsURL.list}?limit=10`)
          await expect(page.locator('tbody tr')).toHaveCount(3)
        }
      })

      await test.step('should name rich-text selection table pagination arrows', async () => {
        // PYLD-3658
        for (const openDrawer of [openRichTextRelationshipDrawer, openRichTextUploadDrawer]) {
          if (openDrawer === openRichTextUploadDrawer) {
            await openEditImageDialog({ page, serverURL })
          }
          const drawer = await openDrawer({ page, postsURL })

          await expect
            .soft(drawer.locator('.paginator .clickable-arrow--left'))
            .toHaveAccessibleName('Previous table page')
          await expect
            .soft(drawer.locator('.paginator .clickable-arrow--right'))
            .toHaveAccessibleName('Next table page')
        }
      })
    })

    test('should expose required authentication fields and their errors', async () => {
      await page.goto(
        formatAdminURL({ adminRoute: '/admin', path: '/collections/users/create', serverURL }),
      )
      const fields = [
        { name: 'Email', selector: 'input[name="email"]' },
        { name: 'New Password', selector: 'input[name="password"]' },
        { name: 'Confirm Password', selector: 'input[name="confirm-password"]' },
      ]

      for (const { name, selector } of fields) {
        const input = page.locator(selector)

        await expect(input).toHaveAccessibleName(name)
        await expectRequiredState({ input })
        await expect(input).not.toHaveAttribute('aria-invalid', 'true')
        await expect(input).toHaveAccessibleDescription('')
      }

      await page.getByRole('button', { name: 'Save', exact: true }).click()

      for (const { name, selector } of fields) {
        const input = page.locator(selector)
        const error = page.locator('.field-type').filter({ has: input }).getByRole('alert')

        await expect(error).toBeVisible()
        await expect(input).toHaveAccessibleName(name)
        await expect(input).toHaveAttribute('aria-invalid', 'true')
        await expect(input).toHaveAccessibleDescription((await error.innerText()).trim())
        await expectErrorTabOrder({ error, input })
      }
    })

    for (const { label, open } of [
      { label: 'upload', open: openRichTextUploadDrawer },
      { label: 'relationship', open: openRichTextRelationshipDrawer },
    ]) {
      for (const [index, control] of ['field', 'operator'].entries()) {
        test(`should expose named ${control} filter options in the rich-text ${label} drawer`, async () => {
          // Additional coverage for PYLD-3662; NVDA browse-mode output is checked in screen-reader.spec.ts.
          const drawer = await open({ page, postsURL })
          const comboboxes = await openDrawerFilters({
            collectionLabel: label === 'relationship' ? 'Post' : undefined,
            drawer,
          })
          const combobox = comboboxes.nth(index)

          await combobox.focus()
          await combobox.press('ArrowDown')
          await expect(page.getByRole('option').first()).toBeVisible()
          await expectOptionsToHaveAccessibleNames(page.getByRole('option'))
        })
      }
    }

    test('should name the image focal-point control by its purpose', async () => {
      // PYLD-3577
      const dialog = await openEditImageDialog({ page, serverURL })

      await expect(dialog.locator('.edit-upload__focalPoint')).toHaveAccessibleName(/focal point/i)
    })

    test('should expose the active locale as selected rather than disabled', async () => {
      // Additional coverage for PYLD-3699.
      // Additional coverage for PYLD-3700.
      // Additional coverage for PYLD-3730.
      const options = await openLocaleOptions({ page, postsURL })
      const selectedOption = options.filter({ hasText: 'English' })

      await expect(selectedOption).toHaveRole('menuitemradio')
      await expect(selectedOption).toHaveAttribute('aria-checked', 'true')
      await expect(selectedOption).not.toHaveAttribute('aria-disabled', 'true')
    })

    test('should expose the current locale and popup state on the locale selector', async () => {
      // Additional coverage for PYLD-3704.
      await gotoPostsList({ page, postsURL })
      const trigger = page.locator('.localizer .popup__trigger-wrap button')

      await expect(trigger).toHaveAccessibleName('Locale: English (en)')
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    test('should expose menu semantics and state on the Dashboard menu button', async () => {
      // PYLD-3638
      await page.goto(`${serverURL}/admin`)
      const trigger = page.locator('.dashboard-breadcrumb-dropdown .popup__trigger-wrap button')

      await expect(trigger).toHaveAccessibleName('Dashboard')
      await expect(trigger).toHaveAttribute('aria-haspopup', /true|menu/)
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await trigger.click()
      const controlledPopupId = await trigger.getAttribute('aria-controls')
      const menu = page.locator(`#${controlledPopupId}`)
      await expect(menu).toBeVisible()
      await expect(menu).toHaveAttribute('role', 'menu')
      await expect(menu.getByRole('menu')).toHaveCount(0)
      expect(await menu.getByRole('menuitem').count()).toBeGreaterThan(0)
    })

    test('should expose nested User menu triggers as items in one menu', async () => {
      // Additional coverage for PYLD-3645 and PYLD-3697.
      await page.goto(`${serverURL}/admin`)
      await openNavigationForUserMenu({ page })
      const trigger = page.locator('.user-menu__trigger')

      await trigger.press('Enter')
      const controlledPopupId = await trigger.getAttribute('aria-controls')
      const menu = page.locator(`#${controlledPopupId}`)

      await expect(menu).toHaveAttribute('role', 'menu')
      await expect(menu.getByRole('menu')).toHaveCount(0)
      await expect(menu.getByRole('menuitem', { name: /theme/i })).toHaveCount(1)
      await expect(menu.getByRole('menuitem', { name: /language/i })).toHaveCount(1)
    })

    test('should give the rich-text relationship per-page control an accessible name', async () => {
      // PYLD-3657
      const drawer = await openRichTextRelationshipDrawer({ page, postsURL })
      await expect(drawer.locator('.per-page .popup__trigger-wrap button')).toHaveAccessibleName(
        /per page/i,
      )
    })

    test('should expose the selected state of active rich-text format buttons', async () => {
      // PYLD-3670
      await gotoCreatePost({ page, postsURL })
      const editor = page.locator('.rich-text-lexical [contenteditable="true"]')
      await editor.fill('Accessible text')
      await editor.selectText()
      const boldButton = page.locator('.toolbar-popup__button-bold').first()
      await boldButton.click()

      await expect(boldButton).toHaveAttribute('aria-pressed', 'true')
    })

    test('should expose the selected state of active rich-text alignment options', async () => {
      // PYLD-3673
      await gotoCreatePost({ page, postsURL })
      const alignmentTrigger = page.locator('.toolbar-popup__dropdown-align').first()
      await alignmentTrigger.click()
      const center = page.locator('.toolbar-popup__dropdown-item-alignCenter')
      await center.click()
      await alignmentTrigger.click()

      const selectedCenter = page.locator('.toolbar-popup__dropdown-item-alignCenter')
      await expect(selectedCenter).toHaveAttribute('role', 'menuitemcheckbox')
      await expect(selectedCenter).toHaveAttribute('aria-checked', 'true')
    })

    test('should expose the selected folder as the current creation location', async () => {
      // Additional coverage for PYLD-3585.
      const modal = await openFolderCreationLocation({ page, serverURL })
      const folder = modal.locator('.hierarchy-column-item', {
        hasText: 'Accessibility folder',
      })

      await folder.getByRole('checkbox').click()

      await expect(folder).toHaveAttribute('aria-current', 'location')
    })

    test('should expose expanded state on rich-text dropdown buttons', async () => {
      // PYLD-3677
      await gotoCreatePost({ page, postsURL })
      const addDropdown = page.locator('.rich-text-lexical .toolbar-popup__dropdown-add')
      await addDropdown.click()

      await expect(addDropdown).toHaveAttribute('aria-expanded', 'true')
    })

    test('should expose names, selected states, and expansion state for comparison controls', async () => {
      // PYLD-3719
      // PYLD-3720
      // PYLD-3721
      const trigger = page.locator('.view-version__toggle-locales')

      await openVersionComparison({ page, postsURL, serverURL })
      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await trigger.click()
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
      const selected = page.locator('.popup-button-list__button--selected').last()
      await expect(selected).toHaveAttribute('aria-checked', 'true')

      const select = page.locator('.compare-version .rs__control').first()
      await select.click()
      const options = page.locator('.rs__option')
      const accessibleNames = await expectOptionsToHaveAccessibleNames(options, { areUnique: true })

      await expect(
        page.getByRole('option', { name: /^Previous Version .+ \d{4}, \d{1,2}:\d{2} [AP]M$/ }),
      ).toBeVisible()
      expect(accessibleNames).toContain('More versions...')
    })

    test('should give date-picker month and year selects accessible names', async () => {
      // PYLD-3737
      const { monthSelect, yearSelect } = await openBlockDatePicker({ page, postsURL })

      await expect(monthSelect).toHaveAccessibleName(/month/i)
      await expect(yearSelect).toHaveAccessibleName(/year/i)
    })

    test('should give Array and Blocks More options controls unique names and menu state', async () => {
      // PYLD-3744
      await addTextBlock({ page, postsURL })
      await page.locator('#field-items .array-field__add-row').click()
      const blocksButton = page.locator('#field-layout .array-actions__button').first()
      const arrayButton = page.locator('#field-items .array-actions__button').first()

      await expect(blocksButton).toHaveAccessibleName(/layout|text block/i)
      await expect(arrayButton).toHaveAccessibleName(/item/i)
      await expect(arrayButton).toHaveAttribute('aria-label', /\S/)
      const arrayLabel = await arrayButton.getAttribute('aria-label')

      await expect(blocksButton).not.toHaveAttribute('aria-label', arrayLabel!)
      await expect(blocksButton).toHaveAttribute('aria-haspopup', /true|menu/)
      await expect(arrayButton).toHaveAttribute('aria-haspopup', /true|menu/)
    })

    test('should give filter and bulk-edit controls and options meaningful accessible names', async () => {
      // PYLD-3751
      // PYLD-3754
      test.slow()
      const whereBuilder = await openPostsFilter({ page, postsURL })
      const filterComboboxes = whereBuilder.getByRole('combobox')

      await expect(filterComboboxes.first()).toBeVisible()
      await expect
        .soft(whereBuilder.locator('.condition__field').getByRole('combobox'))
        .toHaveAccessibleName(/where|field/i)
      for (let index = 0; index < (await filterComboboxes.count()); index++) {
        await expect.soft(filterComboboxes.nth(index)).toHaveAccessibleName(/\S/)
      }

      await whereBuilder.locator('.condition__field .rs__control').click()
      await expectOptionsToHaveAccessibleNames(page.locator('.rs__option'))

      const fieldSelect = await openBulkEditFieldSelect({ page, postsURL })
      const bulkEditCombobox = fieldSelect.locator('input[role="combobox"]')
      await expect.soft(bulkEditCombobox).toHaveAccessibleName(/select fields to edit/i)
      await bulkEditCombobox.focus()
      await bulkEditCombobox.press('ArrowDown')
      await bulkEditCombobox.press('ArrowDown')
      const bulkEditOptions = page.locator('.rs__option')
      await expectOptionsToHaveAccessibleNames(bulkEditOptions)
    })

    test('should give the bulk-edit clear control an accessible name', async () => {
      // PYLD-3755
      const fieldSelect = await openBulkEditFieldSelect({ page, postsURL })
      await selectInput({ multiSelect: false, option: 'Title', page, selectLocator: fieldSelect })

      await expect(fieldSelect.locator('.clear-indicator')).toHaveAccessibleName(
        /clear.*select fields to edit/i,
      )
    })

    test('should expose names, menu roles, and state on Group by controls', async () => {
      // PYLD-3783
      await gotoPostsList({ page, postsURL })
      const { groupByContent: groupByPopup } = await openGroupBy(page)
      const field = groupByPopup.locator('.group-by-control__select-trigger').first()
      const sort = groupByPopup.locator('.group-by-control__select-trigger').nth(1)

      await expect(page.getByRole('dialog', { name: /group by/i })).toBeVisible()
      await expect(field).toHaveAccessibleName(/field/i)
      await expect(field).toHaveAttribute('aria-haspopup', /true|menu/)
      await expect(field).toHaveAttribute('aria-expanded', 'false')
      await expect(sort).toHaveAccessibleName(/sort/i)
    })

    test('aria-hidden dropdown indicators are not keyboard-focusable', async () => {
      // PYLD-3812
      await gotoCreatePost({ page, postsURL })
      const indicator = page.locator('#field-accessibilitySelect .dropdown-indicator')

      await expect(indicator).toBeVisible()
      const isHiddenAndFocusable = await indicator.evaluate((element: HTMLButtonElement) => {
        return (
          element.getAttribute('aria-hidden') === 'true' &&
          !element.disabled &&
          element.tabIndex >= 0
        )
      })

      expect(isHiddenAndFocusable).toBe(false)
    })
  })
  test.describe('4.1.3 Status Messages (AA)', () => {
    test('should announce folder search results and clear status without moving focus', async () => {
      const sidebar = await openNavigationFolders({ page, serverURL })
      const search = sidebar.getByRole('textbox')
      const status = sidebar.getByRole('status')

      await expect(status).toBeEmpty()
      await search.fill('no-such-navigation-folder')
      await search.press('Enter')
      await expect(status).toContainText('No results for "no-such-navigation-folder"')
      await expect(search).toBeFocused()
      await search.fill('Accessibility child folder')
      await expect(status).toContainText('No results for "no-such-navigation-folder"')
      const originalURL = page.url()

      await search.press('Enter')
      await expect(status).toHaveText('Found 1')
      await expect(sidebar.locator('.hierarchy-search-results__list')).toContainText(
        'Accessibility child folder',
      )
      await expect(search).toBeFocused()
      await expect(page).toHaveURL(originalURL)
      await sidebar.getByRole('button', { name: 'Clear', exact: true }).click()
      await expect(status).toBeEmpty()
      await expect(sidebar.getByRole('tree')).toBeVisible()
    })

    test('should announce completed collection searches', async () => {
      await page.clock.install()
      await page.goto(`${postsURL.list}?groupBy=&search=`)
      const search = page.locator('#search-filter-input')
      const status = page.locator('.collection-list__search-status')

      await expect(status).toHaveAttribute('role', 'status')
      await expect(status).toBeEmpty()
      await search.fill('no-matching-accessibility-result')
      await expect(status).toHaveText('Results found for “no-matching-accessibility-result”: 0.')
      await expect(search).toBeFocused()
      const previousMessage = await status.locator('span').elementHandle()

      let releaseResponse!: () => void
      const responseGate = new Promise<void>((resolve) => {
        releaseResponse = resolve
      })
      let hasPendingRequest = false
      const routePattern = (url: URL) =>
        url.pathname === new URL(postsURL.list).pathname ||
        (url.pathname.startsWith('/_serverFn/') &&
          Boolean(url.searchParams.get('payload')?.includes('"collections/posts"')))

      await page.route(routePattern, async (route) => {
        hasPendingRequest = true
        await responseGate
        await route.continue()
      })
      try {
        await page.clock.pauseAt(new Date())
        await search.fill('another-no-matching-accessibility-result')
        await expect(status).toBeEmpty()
        await page.clock.resume()
        await expect.poll(() => hasPendingRequest).toBe(true)
        await expect(status).toBeEmpty()
        releaseResponse()
        await expect(status).toHaveText(
          'Results found for “another-no-matching-accessibility-result”: 0.',
        )
        expect(await previousMessage.evaluate((element) => element.isConnected)).toBe(false)
      } finally {
        await page.clock.resume()
        releaseResponse()
        await page.unrouteAll({ behavior: 'wait' })
      }
      await search.fill('')
      await expect(status).toHaveText('Search cleared.')
      await expect(search).toBeFocused()
      await addGroupBy(page, {
        fieldLabel: 'Accessibility Select',
        fieldPath: 'accessibilitySelect',
      })
      await expect(status).toHaveText(/^\d+ Posts?$/)
      await page.keyboard.press('Escape')
      await clearGroupBy(page)
      await expect(status).toHaveText(/^\d+ Posts?$/)
      await page.keyboard.press('Escape')
      try {
        await search.fill('third version')
        await expect(status).toHaveText('Results found for “third version”: 1.')
        await expect(page.getByRole('status').filter({ hasText: /\S/ })).toHaveCount(1)
        await expect(search).toBeFocused()
        await search.fill('Example')
        await expect(status).toHaveText(/Results found for “Example”: \d+\./)
        for (const groupBy of ['accessibilitySelect', '']) {
          let releaseGrouping!: () => void
          let isGroupingPending = false
          const groupingGate = new Promise<void>((resolve) => {
            releaseGrouping = resolve
          })
          await page.route(routePattern, async (route) => {
            isGroupingPending = true
            await groupingGate
            await route.continue()
          })
          try {
            const { groupByContent } = await openGroupBy(page)
            if (groupBy) {
              await groupByContent.locator('.group-by-control__select-trigger').first().click()
              await page
                .locator('.popup-button-list .popup-button-list__button')
                .filter({ hasText: /^Accessibility Select$/ })
                .click()
            } else {
              await groupByContent.getByRole('button', { name: 'Clear', exact: true }).click()
            }
            await expect.poll(() => isGroupingPending).toBe(true)
            await expect(status).toBeEmpty()
            releaseGrouping()
            await expect(status).toHaveText(/^\d+ Posts?$/)
          } finally {
            releaseGrouping()
            await page.unrouteAll({ behavior: 'wait' })
          }
          await page.keyboard.press('Escape')
        }
      } finally {
        await page.goto(`${postsURL.list}?groupBy=&search=`)
        await expect(search).toHaveValue('')
      }
    })

    test('should expose and dismiss a failed drawer submission notification', async () => {
      const drawer = await openRelationshipCreationDrawer({ page, postsURL })

      await page.route('**/api/posts*', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            body: JSON.stringify({ errors: [{ message: 'Review the document before saving.' }] }),
            contentType: 'application/json',
            status: 400,
          })
        } else {
          await route.continue()
        }
      })
      try {
        await drawer.getByRole('button', { name: /publish in english/i }).click()
        const notification = page.locator('[data-sonner-toast]').filter({
          hasText: 'Review the document before saving.',
        })

        await expect(notification).toBeVisible()
        await expect(drawer).toBeVisible()
        await expect(notification.getByRole('button', { name: /close toast/i })).toBeVisible()
        const close = notification.getByRole('button', { name: /close toast/i })

        await close.focus()
        await expect(close).toBeFocused()
        await close.press('Enter')
        await expect(notification).toBeHidden()
        await expect(drawer).toBeVisible()
      } finally {
        await page.unrouteAll({ behavior: 'wait' })
      }
    })
  })
})

function getComputedBackgroundColor(element: HTMLElement): string {
  return getComputedStyle(element).backgroundColor
}

function getComputedOpacity(element: HTMLElement): string {
  return getComputedStyle(element).opacity
}

function getPseudoBackgroundColor(element: HTMLElement): string {
  return getComputedStyle(element, '::before').backgroundColor
}

async function compareHeadingWithOriginalSpan({
  heading,
  originalStyle,
}: {
  heading: Locator
  originalStyle: string
}) {
  return heading.evaluate((element, styleText) => {
    const measure = (node: Element) => {
      const style = getComputedStyle(node)
      const bounds = node.getBoundingClientRect()

      return {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        height: bounds.height,
        lineHeight: style.lineHeight,
        margin: style.margin,
        width: bounds.width,
      }
    }
    const after = measure(element)
    const beforeElement = document.createElement('span')

    beforeElement.textContent = element.textContent
    // Keep the baseline independent of the current heading class.
    beforeElement.style.cssText = styleText
    element.replaceWith(beforeElement)
    try {
      return { after, before: measure(beforeElement) }
    } finally {
      beforeElement.replaceWith(element)
    }
  }, originalStyle)
}

function getCallouts({ container }: { container: Locator }) {
  return container.locator('.rich-text-lexical .collapsible').filter({
    has: container.page().locator('input[value$="callout"]'),
  })
}

async function openRichTextContext({
  isDrawer,
  page,
  postsURL,
}: {
  isDrawer: boolean
  page: Page
  postsURL: AdminUrlUtil
}) {
  if (isDrawer) {
    return openRelationshipCreationDrawer({ page, postsURL })
  }
  await gotoCreatePost({ page, postsURL })
  return page.locator('main')
}

async function expectErrorTabOrder({ error, input }: { error: Locator; input: Locator }) {
  await input.focus()
  await input.press('Shift+Tab')
  await expect(error).toBeFocused()
  await expect(error).toHaveCSS('outline-style', 'solid')
  await error.press('Tab')
  await expect(input).toBeFocused()
}

async function expectRequiredState({ input }: { input: Locator }) {
  expect(
    await input.evaluate(
      (element: HTMLInputElement) =>
        element.required || element.getAttribute('aria-required') === 'true',
    ),
  ).toBe(true)
}

async function prepareBlockDateField({ page, postsURL }: { page: Page; postsURL: AdminUrlUtil }) {
  await addTextBlock({ page, postsURL })
  const field = page.locator('#field-layout .blocks-field__row .date-time-field').first()
  const input = field.getByRole('textbox')

  await expect(input).toBeVisible()
  return { calendar: page.locator('.react-datepicker'), field, input }
}

async function openMainNavigation({ page, postsURL }: { page: Page; postsURL: AdminUrlUtil }) {
  await gotoPostsList({ page, postsURL })
  await openNavigation({ page })
  await page.getByRole('tab', { name: /collections/i }).click()
  const group = page.locator('.nav-group').filter({ has: page.locator('#nav-posts') })

  if (!(await page.locator('#nav-posts').isVisible())) {
    await page.locator('.nav-group__toggle').filter({ hasText: 'Collections' }).click()
  }
  await expect(group).toBeVisible()
  await expect(page.locator('#nav-posts')).toBeVisible()
}
