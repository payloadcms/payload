import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import type { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'

import { addGroupBy, clearGroupBy, openGroupBy } from '../__helpers/e2e/groupBy/index.js'
import { selectInput } from '../__helpers/e2e/selectInput.js'
import {
  addTextBlock,
  expectOptionsToHaveAccessibleNames,
  getFocusIndicatorStyle,
  gotoCreatePost,
  gotoFirstPost,
  gotoPostsList,
  hasRenderedFocusIndicator,
  openAccessibilityTestPage,
  openBlockDatePicker,
  openBulkEditFieldSelect,
  openCopyToLocaleDrawer,
  openFirstBlockActions,
  openFolderCreationLocation,
  openLocaleOptions,
  openPopupWithKeyboard,
  openPostsFilter,
  openRichTextRelationshipDrawer,
  openVersionComparison,
} from './helpers.js'

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

  test.afterAll(async () => {
    await page.context().close()
  })

  test.describe('1.3.1 Info and Relationships (A)', () => {
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

    test('should give every grouped table a unique ID', async () => {
      // Additional coverage for PYLD-3692.
      await gotoPostsList({ page, postsURL })
      await addGroupBy(page, {
        fieldLabel: 'Accessibility Select',
        fieldPath: 'accessibilitySelect',
      })
      const tableIds = await page
        .locator('table[id^="payload-table-"]')
        .evaluateAll((tables) => tables.map((table) => table.id))

      expect(tableIds.length).toBeGreaterThan(1)
      expect(new Set(tableIds).size).toBe(tableIds.length)
      await clearGroupBy(page)
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

      expect(centers.chip).not.toBeNull()
      expect(centers.icon).not.toBeNull()
      expect(centers.text).not.toBeNull()
      expect(Math.abs(centers.text - centers.chip)).toBeLessThanOrEqual(0.5)
      expect(Math.abs(centers.icon - centers.chip)).toBeLessThanOrEqual(0.5)
      await expect(removeButton).toBeVisible()
    })
  })

  test.describe('2.1.1 Keyboard (A)', () => {
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
      await trigger.click()
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

  test.describe('2.4.3 Focus Order (A)', () => {
    test('should navigate User menu items without entering hidden submenus', async () => {
      // Additional coverage for PYLD-3645 and PYLD-3697.
      await page.goto(`${serverURL}/admin`)
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

  test.describe('4.1.2 Name, Role, Value (A)', () => {
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

      expect(accessibleNames[0]).toMatch(/^Previous Version .+ \d{4}, \d{1,2}:\d{2} [AP]M$/)
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
      await expect(blocksButton).not.toHaveAttribute(
        'aria-label',
        await arrayButton.getAttribute('aria-label'),
      )
      await expect(blocksButton).toHaveAttribute('aria-haspopup', /true|menu/)
      await expect(arrayButton).toHaveAttribute('aria-haspopup', /true|menu/)
    })

    test('should give filter and bulk-edit controls and options meaningful accessible names', async () => {
      // PYLD-3751
      // PYLD-3754
      test.slow()
      const whereBuilder = await openPostsFilter({ page, postsURL })
      const filterComboboxes = whereBuilder.locator('input[role="combobox"]')

      expect(await filterComboboxes.count()).toBeGreaterThan(0)
      await expect
        .soft(whereBuilder.locator('.condition__field input[role="combobox"]'))
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
