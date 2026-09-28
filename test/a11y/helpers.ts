import type { ScreenReaderPlaywright } from '@guidepup/playwright'
import type { Browser, Locator, Page, TestInfo } from '@playwright/test'

import { expect } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { addBlock } from '../__helpers/e2e/fields/blocks/index.js'
import { openListFilters } from '../__helpers/e2e/filters/index.js'
import { openLocaleSelector, waitForFormReady } from '../__helpers/e2e/helpers.js'
import { toggleLivePreview } from '../__helpers/e2e/live-preview/toggleLivePreview.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
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
  const { page } = await initPage({ context, serverURL })
  page.removeAllListeners('console')

  return { page, postsURL, serverURL }
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
  await waitForFormReady(page)
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
  const drawer = page.locator('[id^="list-drawer_1_"]')
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
}: {
  page: Page
  postsURL: AdminUrlUtil
  serverURL: string
}) {
  await openVersionsList({ page, postsURL, serverURL })
  const versionLink = page.locator('main.versions table tbody tr td a').nth(1)
  await expect(versionLink).toBeVisible()
  await versionLink.click()
  await expect(page.locator('.view-version')).toBeVisible()
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
