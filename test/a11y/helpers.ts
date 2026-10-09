import type { ScreenReaderPlaywright } from '@guidepup/playwright'
import type { Browser, Locator, Page, TestInfo } from '@playwright/test'

import { expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatAdminURL, instructionsCollectionSlug } from 'payload/shared'

import { addBlock } from '../__helpers/e2e/fields/blocks/index.js'
import { openListFilters } from '../__helpers/e2e/filters/index.js'
import {
  openLocaleSelector,
  waitForFormReady,
  waitForLexicalReady,
} from '../__helpers/e2e/helpers.js'
import { toggleLivePreview } from '../__helpers/e2e/live-preview/toggleLivePreview.js'
import { selectInput } from '../__helpers/e2e/selectInput.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { devUser } from '../credentials.js'
import { DashboardHelper } from '../dashboard/utils.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export async function openAccessibilityTestPage({
  browser,
  testInfo,
}: {
  browser: Browser
  testInfo: TestInfo
}): Promise<{
  page: Page
  postsURL: AdminUrlUtil
  serverURL: string
}> {
  testInfo.setTimeout(TEST_TIMEOUT_LONG)

  const { serverURL } = await initPayloadE2ENoConfig({ dirname })
  const postsURL = new AdminUrlUtil(serverURL, 'posts')
  const context = await browser.newContext()
  const loginResponse = await context.request.post(
    formatAdminURL({ apiRoute: '/api', path: '/users/login', serverURL }),
    { data: devUser },
  )

  expect(loginResponse.ok()).toBe(true)
  const { page } = await initPage({ context, serverURL })
  page.removeAllListeners('console')

  return { page, postsURL, serverURL }
}

export async function waitForFocusRestoration({ page }: { page: Page }) {
  // Modal traps restore focus in a deferred task after the drawer becomes hidden.
  await page.evaluate(() => new Promise<void>((resolve) => setTimeout(resolve, 0)))
}

export async function waitForKeyboardDragActivation({ page }: { page: Page }) {
  // dnd-kit registers keyboard listeners after activation and measures targets on the next frame.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 0))),
      ),
  )
}

export async function expectFocusInside({ container, page }: { container: Locator; page: Page }) {
  await expect(container).toBeVisible()
  await expect
    .poll(() =>
      container.evaluate((element) => element.contains(element.ownerDocument.activeElement)),
    )
    .toBe(true)
  await expect(page.locator(':focus')).toBeVisible()
}

export async function openPopupWithKeyboard({
  page,
  popup,
  trigger,
}: {
  page: Page
  popup: Locator
  trigger: Locator
}) {
  await trigger.focus()
  await trigger.press('Enter')
  await expectFocusInside({ container: popup, page })
}

export async function expectOptionsToHaveAccessibleNames(
  options: Locator,
  { areUnique = false }: { areUnique?: boolean } = {},
) {
  const count = await options.count()

  expect(count).toBeGreaterThan(0)
  const accessibleNames: string[] = []

  for (let index = 0; index < count; index++) {
    const option = options.nth(index)
    const accessibilityTree = await option.ariaSnapshot()
    const accessibleName = accessibilityTree.match(/^- option "(.+?)"(?: \[.*\])?$/m)?.[1]

    await expect.soft(option).toHaveRole('option')
    await expect.soft(option).toHaveAccessibleName(/\S/)
    expect.soft(accessibilityTree).not.toContain('[object Object]')
    expect.soft(accessibleName).toBeTruthy()
    accessibleNames.push(accessibleName!)
  }

  if (areUnique) {
    expect.soft(new Set(accessibleNames).size).toBe(accessibleNames.length)
  }

  return accessibleNames
}

export async function getFocusIndicatorStyle(element: Locator) {
  return element.evaluate((node) => {
    const style = getComputedStyle(node)

    return {
      backgroundColor: style.backgroundColor,
      borderBottomColor: style.borderBottomColor,
      borderBottomWidth: style.borderBottomWidth,
      borderLeftColor: style.borderLeftColor,
      borderLeftWidth: style.borderLeftWidth,
      borderRightColor: style.borderRightColor,
      borderRightWidth: style.borderRightWidth,
      borderTopColor: style.borderTopColor,
      borderTopWidth: style.borderTopWidth,
      boxShadow: style.boxShadow,
      outlineColor: style.outlineColor,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
    }
  })
}

type FocusIndicatorStyle = Awaited<ReturnType<typeof getFocusIndicatorStyle>>

export function hasRenderedFocusIndicator({
  focusedStyle,
  unfocusedStyle,
}: {
  focusedStyle: FocusIndicatorStyle
  unfocusedStyle: FocusIndicatorStyle
}) {
  const hasOutline =
    focusedStyle.outlineStyle !== 'none' &&
    Number.parseFloat(focusedStyle.outlineWidth) > 0 &&
    isPaintedColor(focusedStyle.outlineColor)
  const hasChangedBoxShadow =
    focusedStyle.boxShadow !== 'none' && focusedStyle.boxShadow !== unfocusedStyle.boxShadow
  const hasChangedBackground =
    focusedStyle.backgroundColor !== unfocusedStyle.backgroundColor &&
    isPaintedColor(focusedStyle.backgroundColor)
  const hasChangedBorder = (
    [
      ['borderTopColor', 'borderTopWidth'],
      ['borderRightColor', 'borderRightWidth'],
      ['borderBottomColor', 'borderBottomWidth'],
      ['borderLeftColor', 'borderLeftWidth'],
    ] as const
  ).some(
    ([colorProperty, widthProperty]) =>
      focusedStyle[colorProperty] !== unfocusedStyle[colorProperty] &&
      Number.parseFloat(focusedStyle[widthProperty]) > 0 &&
      isPaintedColor(focusedStyle[colorProperty]),
  )

  return hasOutline || hasChangedBoxShadow || hasChangedBackground || hasChangedBorder
}

function isPaintedColor(color: string) {
  return color !== 'transparent' && !/rgba\([^)]*,\s*0\)$/.test(color)
}

export async function gotoCreatePost({ page, postsURL }: { page: Page; postsURL: AdminUrlUtil }) {
  await page.goto(postsURL.create)
  await expect(page.locator('[data-form-ready="true"]').first()).toBeVisible()
  await waitForFormReady(page)
}

export async function gotoLabelTestLogin({ page, serverURL }: { page: Page; serverURL: string }) {
  await page.context().clearCookies()
  await page.setExtraHTTPHeaders({ DisableAutologin: 'true' })
  await page.goto(formatAdminURL({ adminRoute: '/admin', path: '/login', serverURL }))
  await expect(page.locator('input[name="password"]')).toBeVisible()
}

export async function gotoPostsList({ page, postsURL }: { page: Page; postsURL: AdminUrlUtil }) {
  await page.goto(postsURL.list)
  await expect(page.locator('tbody tr').first()).toBeVisible()
}

export async function openFolderCreationLocation({
  page,
  serverURL,
}: {
  page: Page
  serverURL: string
}) {
  const foldersURL = new AdminUrlUtil(serverURL, 'payload-folders')

  await page.goto(foldersURL.hierarchy)
  await page
    .locator('.hierarchy-list__controls')
    .getByRole('button', { name: 'Create New' })
    .first()
    .click()
  await page.getByRole('menuitem', { name: 'Folder', exact: true }).click()

  const drawer = page.locator('.drawer__content')
  await expect(drawer).toBeVisible()
  await drawer.locator('button.hierarchy-button').click()

  const modal = page.locator('.hierarchy-modal')
  await expect(modal).toBeVisible()
  return modal
}

export async function gotoFirstPost({
  page,
  postsURL,
  serverURL,
}: {
  page: Page
  postsURL: AdminUrlUtil
  serverURL: string
}) {
  await gotoPostsList({ page, postsURL })
  const postLink = page.locator('tbody tr .cell-title a', { hasText: 'Example post one' })
  await expect(postLink).toHaveAttribute('href')
  const href = await postLink.getAttribute('href')

  await page.goto(new URL(href!, serverURL).toString())
  await waitForFormReady(page)
}

export async function openCopyToLocaleDrawer({
  page,
  postsURL,
  serverURL,
}: {
  page: Page
  postsURL: AdminUrlUtil
  serverURL: string
}) {
  await gotoFirstPost({ page, postsURL, serverURL })
  await page.locator('.doc-controls__popup .popup__trigger-wrap button').click()
  await page.locator('#copy-locale-data__button').click()
  const drawer = page.locator('#copy-locale')
  await expect(drawer).toBeVisible()
  return drawer
}

export async function openRichTextRelationshipDrawer({
  page,
  postsURL,
}: {
  page: Page
  postsURL: AdminUrlUtil
}) {
  await gotoCreatePost({ page, postsURL })
  await page.locator('.rich-text-lexical .toolbar-popup__dropdown-add').click()
  await page.locator('.toolbar-popup__dropdown-item[data-item-key="relationship"]').click()
  const drawer = page.locator('dialog[id^="list-drawer_1_"]')
  await expect(drawer).toBeVisible()
  return drawer
}

export async function addTextBlock({ page, postsURL }: { page: Page; postsURL: AdminUrlUtil }) {
  await gotoCreatePost({ page, postsURL })
  await addBlock({ blockToSelect: 'Text block', fieldName: 'layout', page })
  await expect(page.locator('#field-layout .blocks-field__row').first()).toBeVisible()
}

export async function openFirstBlockActions({
  page,
  postsURL,
}: {
  page: Page
  postsURL: AdminUrlUtil
}) {
  await addTextBlock({ page, postsURL })
  await page.locator('#field-layout .array-actions__button').first().click()
  const menu = page.locator('.popup__content').last()
  await expect(menu).toBeVisible()
  return menu
}

export async function openPostsFilter({ page, postsURL }: { page: Page; postsURL: AdminUrlUtil }) {
  await gotoPostsList({ page, postsURL })
  const { filterContainer } = await openListFilters(page, {})
  return filterContainer
}

export async function openBulkEditFieldSelect({
  page,
  postsURL,
}: {
  page: Page
  postsURL: AdminUrlUtil
}) {
  await gotoPostsList({ page, postsURL })
  await page.locator('tbody tr .cell-_select input').nth(0).check()
  await page.locator('tbody tr .cell-_select input').nth(1).check()
  await page.locator('.edit-many__toggle button').click()
  const fieldSelect = page.locator('#edit-posts .field-select .react-select')
  await expect(fieldSelect).toBeVisible()
  return fieldSelect
}

export async function openBlockDatePicker({
  page,
  postsURL,
}: {
  page: Page
  postsURL: AdminUrlUtil
}) {
  await addTextBlock({ page, postsURL })
  await page.locator('#field-layout__0__date input').click()
  const monthSelect = page.locator('.react-datepicker__month-select')
  const yearSelect = page.locator('.react-datepicker__year-select')
  await expect(monthSelect).toBeVisible()
  await expect(yearSelect).toBeVisible()
  return { monthSelect, yearSelect }
}

export async function openVersionsList({
  page,
  postsURL,
  serverURL,
}: {
  page: Page
  postsURL: AdminUrlUtil
  serverURL: string
}) {
  await gotoFirstPost({ page, postsURL, serverURL })
  const versionsTab = page.locator('.doc-tab', { hasText: 'Versions' })
  await expect(versionsTab).toBeVisible()
  await versionsTab.click()
  await expect(page.locator('main.versions table')).toBeVisible()
}

export async function openVersionComparison({
  page,
  postsURL,
  serverURL,
  versionIndex = 1,
}: {
  page: Page
  postsURL: AdminUrlUtil
  serverURL: string
  versionIndex?: number
}) {
  await openVersionsList({ page, postsURL, serverURL })
  const versionLink = page.locator('main.versions table tbody tr td a').nth(versionIndex)
  await expect(versionLink).toBeVisible()
  await versionLink.click()
  await expect(page.locator('.view-version')).toBeVisible()
}

export async function openTableColumns({ page, postsURL }: { page: Page; postsURL: AdminUrlUtil }) {
  await gotoPostsList({ page, postsURL })
  await page.getByRole('button', { name: 'Columns', exact: true }).click()
  const columns = page.locator('.column-selector')

  await expect(columns).toBeVisible()
  return columns
}

export async function openTableVersionHistory({
  kind,
  page,
  postsURL,
  serverURL,
}: {
  kind: 'collection' | 'global'
  page: Page
  postsURL: AdminUrlUtil
  serverURL: string
}) {
  if (kind === 'collection') {
    await openVersionsList({ page, postsURL, serverURL })
  } else {
    await page.goto(
      formatAdminURL({ adminRoute: '/admin', path: '/globals/menu/versions', serverURL }),
    )
    await expect(page.locator('main.versions table tbody tr').first()).toBeVisible()
  }
  return page.locator('main.versions')
}

export async function openLocaleOptions({
  page,
  postsURL,
}: {
  page: Page
  postsURL: AdminUrlUtil
}) {
  await gotoCreatePost({ page, postsURL })
  await openLocaleSelector(page)
  const options = page.locator('.popup__content').last().locator('.popup-button-list__button')
  await expect(options.first()).toBeVisible()
  return options
}

export async function openLivePreview({
  page,
  postsURL,
  serverURL,
}: {
  page: Page
  postsURL: AdminUrlUtil
  serverURL: string
}) {
  await gotoFirstPost({ page, postsURL, serverURL })
  await toggleLivePreview(page, { targetState: 'on' })
  await expect(page.locator('.live-preview-toolbar-controls')).toBeVisible()
}

export async function captureScreenReader({
  action,
  screenReader,
}: {
  action: () => Promise<unknown>
  screenReader: ScreenReaderPlaywright
}) {
  await screenReader.clearItemTextLog()
  await screenReader.clearSpokenPhraseLog()
  return screenReader.capture(action)
}

export async function captureScreenReaderOutput({
  action,
  screenReader,
}: {
  action: () => Promise<unknown>
  screenReader: ScreenReaderPlaywright
}) {
  const capture = await captureScreenReader({ action, screenReader })
  return `${capture.itemText} ${capture.spokenPhrase}`.replace(/\s+/g, ' ').trim()
}

export async function navigateScreenReaderTo({
  matches,
  screenReader,
}: {
  matches: RegExp
  screenReader: ScreenReaderPlaywright
}) {
  await screenReader.clearItemTextLog()
  await screenReader.clearSpokenPhraseLog()
  await screenReader.navigateToWebContent()

  for (let index = 0; index < 150; index++) {
    const output = `${await screenReader.itemText()} ${await screenReader.lastSpokenPhrase()}`
      .replace(/\s+/g, ' ')
      .trim()

    matches.lastIndex = 0
    if (matches.test(output)) {
      return output
    }
    await screenReader.next()
  }

  throw new Error(
    `Screen reader did not reach ${matches}. Visited: ${JSON.stringify(await screenReader.itemTextLog())}`,
  )
}

export async function expectPopupCursorToMove({
  expectedItem,
  screenReader,
  trigger,
}: {
  expectedItem: RegExp
  screenReader: ScreenReaderPlaywright
  trigger: Locator
}) {
  await trigger.focus()
  const capture = await captureScreenReader({
    action: () => trigger.press('Enter'),
    screenReader,
  })

  expect.soft(capture.itemText).toMatch(expectedItem)
  await trigger.page().keyboard.press('Escape')
}

export async function openWidgetDrawer({ page, serverURL }: { page: Page; serverURL: string }) {
  await page.goto(formatAdminURL({ adminRoute: '/admin', serverURL }))
  await new DashboardHelper(page).setEditing()
  const trigger = page.locator('.dashboard-breadcrumb-dropdown__actions button').first()

  return { drawer: page.locator('dialog[id^="widgets-drawer-"]'), trigger }
}

export async function openRelationshipCreationDrawer({
  page,
  postsURL,
}: {
  page: Page
  postsURL: AdminUrlUtil
}) {
  await gotoCreatePost({ page, postsURL })
  await page.locator('#relatedPost-add-new button').press('Enter')
  const drawer = page.locator('dialog[id^="doc-drawer_posts_"]')

  await expect(drawer).toBeVisible()
  await expect(drawer.locator('[data-form-ready="true"]').first()).toBeVisible()
  await expect(drawer.locator('#field-title')).toBeVisible()
  await waitForLexicalReady(drawer.locator('[data-field-path="content"]'))
  return drawer
}

export async function openRichTextUploadDrawer({
  page,
  postsURL,
}: {
  page: Page
  postsURL: AdminUrlUtil
}) {
  await gotoCreatePost({ page, postsURL })
  await page.locator('.rich-text-lexical .toolbar-popup__dropdown-add').click()
  await page.locator('.toolbar-popup__dropdown-item[data-item-key="upload"]').press('Enter')
  const drawer = page.locator('dialog[id^="list-drawer_1_"]')

  await expect(drawer).toBeVisible()
  return drawer
}

const mediaFixtures = new WeakMap<Page, string[]>()

export async function cleanupModalMedia({ page }: { page: Page }) {
  for (const url of mediaFixtures.get(page) || []) {
    const response = await page.request.delete(url)

    expect(response.ok(), 'Remove the temporary media document and its generated image files').toBe(
      true,
    )
  }
  mediaFixtures.delete(page)
}

export async function createMediaFixture({ page, serverURL }: { page: Page; serverURL: string }) {
  const apiURL = formatAdminURL({ apiRoute: '/api', path: '/media', serverURL })
  const response = await page.request.post(apiURL, {
    multipart: {
      _payload: JSON.stringify({}),
      file: {
        name: 'modal-dialog-regression.png',
        buffer: await readFile(path.resolve(dirname, '../uploads/image.png')),
        mimeType: 'image/png',
      },
    },
  })

  expect(response.ok(), 'Create a persisted image so production crop controls are available').toBe(
    true,
  )
  const { doc } = await response.json()

  mediaFixtures.set(page, [...(mediaFixtures.get(page) || []), `${apiURL}/${doc.id}`])
  return doc
}

export async function openEditImageDialog({ page, serverURL }: { page: Page; serverURL: string }) {
  const doc = await createMediaFixture({ page, serverURL })
  const mediaURL = new AdminUrlUtil(serverURL, 'media')

  await page.goto(mediaURL.edit(doc.id))
  await waitForFormReady(page)
  await page.getByRole('button', { name: /edit image/i }).click()
  const dialog = page.locator('.edit-upload__dialog')

  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: /apply changes/i })).toBeEnabled()
  return dialog
}

export async function openBulkUploadDialog({ page, serverURL }: { page: Page; serverURL: string }) {
  const mediaURL = new AdminUrlUtil(serverURL, 'media')

  await page.goto(mediaURL.list)
  await page.getByRole('button', { name: /bulk upload/i }).click()
  const dialog = page.locator('.bulk-upload--add-files')

  await expect(dialog).toBeVisible()
  return dialog
}

export async function openAPIKeyDialog({ page, serverURL }: { page: Page; serverURL: string }) {
  await page.goto(formatAdminURL({ adminRoute: '/admin', path: '/account', serverURL }))
  await waitForFormReady(page)
  await page.locator('#regenerate-api-key').click()
  const dialog = page.locator('dialog[id^="generate-confirmation-"]')

  await expect(dialog).toBeVisible()
  return dialog
}

export async function openDrawerFilters({
  collectionLabel,
  drawer,
}: {
  collectionLabel?: string
  drawer: Locator
}) {
  if (collectionLabel) {
    await selectInput({
      multiSelect: false,
      option: collectionLabel,
      page: drawer.page(),
      selectLocator: drawer.locator('.list-drawer__select-collection-wrap'),
    })
    await expect(
      drawer.locator('.list-drawer__select-collection-wrap .rs__single-value'),
    ).toHaveText(collectionLabel)
    if (collectionLabel === 'Post') {
      await expect(drawer.locator('.collection-list--posts')).toBeVisible()
    }
  }
  const drawerSelector = `dialog[id=${JSON.stringify(await drawer.getAttribute('id'))}]`
  const { filterContainer: filters } = await openListFilters(drawer.page(), {
    filterContainerSelector: `${drawerSelector} .where-builder`,
    togglerSelector: `${drawerSelector} #toggle-list-filters`,
  })
  const comboboxes = filters.getByRole('combobox', { name: /^(Field|Filter)$/ })

  if ((await comboboxes.count()) === 0) {
    await filters.getByRole('button', { name: /add filter/i }).click()
  }
  await expect(comboboxes).toHaveCount(2)
  return comboboxes
}

export async function openDashboardEditor({ page, serverURL }: { page: Page; serverURL: string }) {
  await page.goto(formatAdminURL({ adminRoute: '/admin', serverURL }))
  const trigger = page.locator('.dashboard-breadcrumb-dropdown .popup__trigger-wrap button')

  await trigger.focus()
  await trigger.press('Enter')
  await page.getByRole('menuitem', { name: 'Edit Dashboard', exact: true }).press('Enter')
  await expect(page.locator('.modular-dashboard.editing')).toBeVisible()
  return page.locator('.dashboard-breadcrumb-dropdown__editing')
}

export async function addCollectionQueryWidget({ page }: { page: Page }) {
  const widgets = page.locator('.widget[data-slug^="collection-query-"]')
  const previousCount = await widgets.count()
  const add = page
    .locator('.dashboard-breadcrumb-dropdown__actions')
    .getByRole('button', { name: 'Add +: Add Widget', exact: true })

  await add.press('Enter')
  const drawer = page.locator('dialog[id^="widgets-drawer-"]')
  await expect(drawer).toBeVisible()
  await drawer.getByRole('button', { name: /collection query/i }).press('Enter')
  await expect(drawer).toBeHidden()
  await expect(widgets).toHaveCount(previousCount + 1)
  await expect(widgets.last().locator('.collection-query-widget')).toBeVisible()
  await expect(widgets.last().locator('.draggable')).toBeFocused()
  return widgets.last()
}

export async function insertTextBlockWithKeyboard({ page }: { page: Page }) {
  const trigger = page.locator('#field-layout > .blocks-field__drawer-toggler')

  await trigger.press('Enter')
  const drawer = page.locator('[id^="drawer_1_blocks-drawer-"]')
  await expect(drawer).toBeVisible()
  await drawer.getByRole('button', { name: 'Text block', exact: true }).press('Enter')
  await drawer.getByRole('button', { name: 'Insert', exact: true }).press('Enter')
  await expect(drawer).toBeHidden()
  const row = page.locator('#field-layout .blocks-field__row').last()
  await expect(row).toBeVisible()
  return row
}

export async function expectPaintedFocus({ page }: { page: Page }) {
  const focused = page.locator(':focus')

  await expect(focused).toBeVisible()
  await expect
    .poll(() =>
      focused.evaluate((element) => {
        for (let node: Element | null = element; node; node = node.parentElement) {
          const style = getComputedStyle(node)
          if (Number(style.opacity) === 0 || style.visibility === 'hidden') {
            return false
          }
        }
        const rect = element.getBoundingClientRect()
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          rect.bottom > 0 &&
          rect.right > 0 &&
          rect.top < innerHeight &&
          rect.left < innerWidth
        )
      }),
    )
    .toBe(true)
}

export async function openGlobalAPI({ page, serverURL }: { page: Page; serverURL: string }) {
  await page.goto(formatAdminURL({ adminRoute: '/admin', path: '/globals/menu', serverURL }))
  await page.getByRole('link', { name: 'API', exact: true }).click()
  await expect(page.locator('.query-inspector .monaco-editor')).toBeVisible()
  await expect(page.getByRole('button', { name: 'toggle fullscreen', exact: true })).toBeVisible()
}

export async function openNavigation({ page }: { page: Page }) {
  await expect(page.locator('aside.nav--nav-hydrated')).toBeVisible()
  const openMenu = page.getByRole('button', { name: 'Open Menu', exact: true })

  if (await openMenu.isVisible()) {
    await openMenu.click()
  }
  await expect(page.locator('aside.nav')).toHaveClass(/nav--nav-open/)
}

export async function openNavigationFolders({
  page,
  serverURL,
}: {
  page: Page
  serverURL: string
}) {
  await page.goto(formatAdminURL({ adminRoute: '/admin', serverURL }))
  await openNavigation({ page })
  const tab = page.getByRole('tab', { name: /folders/i })

  if ((await tab.getAttribute('aria-selected')) !== 'true') {
    const response = page.waitForResponse((response) =>
      (response.request().postData() || '').includes('render-tab'),
    )

    await tab.click()
    await response
  }
  const sidebar = page.locator('.hierarchy-sidebar-tab:visible')

  await expect(sidebar.getByRole('tree')).toBeVisible()
  await expect(
    sidebar.locator('.tree-node__title', { hasText: /^Accessibility folder$/ }),
  ).toBeVisible()
  return sidebar
}

/** Measure text against the composited backgrounds of its rendered ancestors. */
export async function getTextContrastRatios({
  container,
  selectors,
}: {
  container: Locator
  selectors: string[]
}) {
  return container.evaluate((element, selectors) => {
    const rgba = ({ value }: { value: string }) => {
      const values = value.match(/[\d.]+/g)!.map(Number)
      const divisor = value.startsWith('color(srgb') ? 1 : 255

      return [values[0] / divisor, values[1] / divisor, values[2] / divisor, values[3] ?? 1]
    }
    const composite = ({
      background,
      foreground,
    }: {
      background: number[]
      foreground: number[]
    }) =>
      foreground
        .slice(0, 3)
        .map((channel, index) => channel * foreground[3] + background[index] * (1 - foreground[3]))
    const luminance = ({ color }: { color: number[] }) =>
      color.reduce((sum, channel, index) => {
        const linear = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4

        return sum + linear * [0.2126, 0.7152, 0.0722][index]
      }, 0)

    return selectors.flatMap((selector) =>
      Array.from(element.querySelectorAll(selector)).map((text) => {
        const ancestors: Element[] = []
        let ancestor: Element | null = text

        while (ancestor) {
          ancestors.unshift(ancestor)
          ancestor = ancestor.parentElement
        }
        const background = ancestors.reduce(
          (color, node) =>
            composite({
              background: color,
              foreground: rgba({ value: getComputedStyle(node).backgroundColor }),
            }),
          [1, 1, 1],
        )
        const foreground = composite({
          background,
          foreground: rgba({ value: getComputedStyle(text).color }),
        })
        const lighter = Math.max(luminance({ color: foreground }), luminance({ color: background }))
        const darker = Math.min(luminance({ color: foreground }), luminance({ color: background }))

        return { ratio: (lighter + 0.05) / (darker + 0.05), selector }
      }),
    )
  }, selectors)
}

export async function openLLMInstructions({ page, serverURL }: { page: Page; serverURL: string }) {
  await page.goto(
    formatAdminURL({
      adminRoute: '/admin',
      path: `/collections/${instructionsCollectionSlug}/collection-posts`,
      serverURL,
    }),
  )
  await expect(page.getByRole('heading', { name: 'posts', exact: true })).toBeVisible()

  const field = page.locator('.llm-instructions')

  await field.getByRole('tab', { name: 'Additional instructions', exact: true }).press('Enter')
  await expect(
    field.getByRole('textbox', { name: 'Additional instructions', exact: true }),
  ).toBeVisible()

  return field
}
