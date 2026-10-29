import type { ScreenReaderPlaywright } from '@guidepup/playwright'
import type { Browser, Locator, Page, TestInfo } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatAdminURL, instructionsCollectionSlug } from 'payload/shared'

import { toggleColumn } from '../__helpers/e2e/columns/toggleColumn.js'
import { addBlock } from '../__helpers/e2e/fields/blocks/index.js'
import { openListFilters } from '../__helpers/e2e/filters/index.js'
import {
  openLocaleSelector,
  waitForFormReady,
  waitForLexicalReady,
} from '../__helpers/e2e/helpers.js'
import { toggleLivePreview } from '../__helpers/e2e/live-preview/toggleLivePreview.js'
import { runAxeScan } from '../__helpers/e2e/runAxeScan.js'
import { selectInput } from '../__helpers/e2e/selectInput.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { devUser } from '../credentials.js'
import { DashboardHelper } from '../dashboard/utils.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { seededAPIKey } from './constants.js'

const workflowUsers = new Map<Page, number | string>()

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

export async function getFocusIndicatorStyle(
  element: Locator,
  { pseudoElement }: { pseudoElement?: '::after' | '::before' } = {},
) {
  return element.evaluate((node, pseudoElement) => {
    const style = getComputedStyle(node, pseudoElement)

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
  }, pseudoElement)
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
    isPaintedColor(focusedStyle.outlineColor) &&
    (focusedStyle.outlineStyle !== unfocusedStyle.outlineStyle ||
      focusedStyle.outlineWidth !== unfocusedStyle.outlineWidth ||
      focusedStyle.outlineColor !== unfocusedStyle.outlineColor)
  const hasChangedBoxShadow =
    focusedStyle.boxShadow !== unfocusedStyle.boxShadow &&
    hasPaintedBoxShadow({ shadow: focusedStyle.boxShadow })
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

function hasPaintedBoxShadow({ shadow }: { shadow: string }) {
  // Computed shadows have resolved colors and pixel lengths; split only between layers.
  return shadow.split(/,(?![^(]*\))/).some((layer) => {
    const color = layer.match(/[a-z-]+\([^)]*\)|transparent/i)?.[0]

    if (!color || !isPaintedColor(color)) {
      return false
    }
    const [offsetX, offsetY, blur = 0, spread = 0] = layer
      .replace(color, '')
      .replace(/\binset\b/, '')
      .trim()
      .split(/\s+/)
      .map((length) => Number.parseFloat(length))

    return (
      Number.isFinite(offsetX) &&
      Number.isFinite(offsetY) &&
      (offsetX !== 0 || offsetY !== 0 || blur > 0 || spread > 0)
    )
  })
}

export function isPaintedColor(color: string) {
  return (
    color !== 'transparent' &&
    !/(?:rgba|hsla)\([^)]*,\s*0(?:\.0+)?%?\s*\)$/i.test(color) &&
    !/\/\s*0(?:\.0+)?%?\s*\)$/.test(color)
  )
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
  await toggleColumn(page, {
    columnLabel: 'Title',
    columnName: 'title',
    shouldCloseListColumns: true,
    targetState: 'on',
  })
  const postLink = page.locator('tbody tr .cell-title a', { hasText: 'Example post one' })

  await expect(postLink).toHaveAttribute('href')
  const href = await postLink.getAttribute('href')

  await postLink.click()
  await expect(page).toHaveURL(new URL(href!, serverURL).toString())
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
  const capture = await screenReader.capture(action)

  if (process.env.PAYLOAD_SCREEN_READER_DEBUG === 'true') {
    console.info(
      '[screen-reader-capture]',
      JSON.stringify({ itemText: capture.itemText, spokenPhrase: capture.spokenPhrase }),
    )
  }

  return capture
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
  maxSteps = 150,
  screenReader,
  shouldEnterDialogs = false,
  shouldMoveCursorToKeyboardFocus = false,
  shouldResetCursor = true,
  shouldSkipToContent = false,
  startAt,
}: {
  matches: RegExp
  maxSteps?: number
  screenReader: ScreenReaderPlaywright
  shouldEnterDialogs?: boolean
  shouldMoveCursorToKeyboardFocus?: boolean
  shouldResetCursor?: boolean
  shouldSkipToContent?: boolean
  startAt?: Locator
}) {
  if (startAt) {
    await expect(startAt).toHaveCount(1)
    await expect(startAt).toBeVisible()
  }

  await screenReader.clearItemTextLog()
  await screenReader.clearSpokenPhraseLog()
  if (shouldResetCursor) {
    await screenReader.navigateToWebContent()
  }

  if (startAt) {
    await captureScreenReader({ action: () => startAt.focus(), screenReader })
    await expect(startAt).toBeFocused()
    if (shouldMoveCursorToKeyboardFocus && screenReader.name === 'VoiceOver') {
      const { voiceOverKeyCodeCommands } = await import('@guidepup/guidepup')

      // DOM focus does not establish the VoiceOver cursor's starting position.
      await screenReader.perform(voiceOverKeyCodeCommands.moveCursorToKeyboardFocus)
    }
  }

  let hasSkippedToContent = false

  for (let index = 0; index < maxSteps; index++) {
    const itemText = await screenReader.itemText()
    const spokenPhrase = await screenReader.lastSpokenPhrase()
    const output = `${itemText} ${spokenPhrase}`.replace(/\s+/g, ' ').trim()

    if (process.env.PAYLOAD_SCREEN_READER_DEBUG === 'true') {
      console.info(
        '[screen-reader-navigation]',
        JSON.stringify({ index, itemText, matches: matches.source, spokenPhrase }),
      )
    }

    if (shouldSkipToContent && !hasSkippedToContent && /^skip to content\b/i.test(itemText)) {
      hasSkippedToContent = true
      await screenReader.act()
      continue
    }

    matches.lastIndex = 0
    if (matches.test(output)) {
      return output
    }
    if (
      shouldEnterDialogs &&
      screenReader.name === 'VoiceOver' &&
      /\bweb dialog\b/i.test(itemText)
    ) {
      await screenReader.interact()
    } else {
      await screenReader.next()
    }
  }

  throw new Error(
    `Screen reader did not reach ${matches}. Visited: ${JSON.stringify(await screenReader.itemTextLog())}`,
  )
}

export async function inContrastThemes({
  page,
  run,
  serverURL,
  themes,
}: {
  page: Page
  run: () => Promise<void>
  serverURL: string
  themes: ('dark' | 'light')[]
}) {
  test.setTimeout(90_000)

  const context = page.context()
  const preferenceCookieNames = /^(payload-theme|payload-high-contrast-mode)$/
  const previousCookies = (await context.cookies()).filter(({ name }) =>
    preferenceCookieNames.test(name),
  )

  try {
    for (const theme of themes) {
      await test.step(`${theme} theme`, async () => {
        await page.context().addCookies([
          { name: 'payload-theme', url: serverURL, value: theme },
          { name: 'payload-high-contrast-mode', url: serverURL, value: 'true' },
        ])
        await page.mouse.move(0, 0)
        await run()
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        await expect(page.locator('html')).toHaveAttribute('data-enhanced-contrast', '')
      })
    }
  } finally {
    await context.clearCookies({ name: preferenceCookieNames })
    await context.addCookies(previousCookies)
  }
}

export async function expectTextContrast({
  placeholder = false,
  targets,
}: {
  placeholder?: boolean
  targets: Locator
}) {
  await expectPaintContrast({ minimum: 4.5, placeholder, property: 'color', targets })
}

/**
 * Measures solid CSS paint, including alpha and ancestor group opacity, without rounding ratios.
 * Boundary checks accept a contrasting fill, border, or outline.
 */
export async function expectPaintContrast({
  againstParent = false,
  minimum,
  placeholder = false,
  property,
  pseudo,
  targets,
}: {
  againstParent?: boolean
  minimum: number
  placeholder?: boolean
  property:
    | 'backgroundColor'
    | 'borderBottomColor'
    | 'borderTopColor'
    | 'color'
    | 'fill'
    | 'outlineColor'
    | 'stroke'
  pseudo?: '::after' | '::before'
  targets: Locator
}) {
  await expect(targets.first()).toBeVisible()
  const results = await targets.evaluateAll(
    (roots, { againstParent, minimum, placeholder, property, pseudo }) => {
      type Color = [number, number, number, number]
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 1
      const context = canvas.getContext('2d')!
      const parse = (value: string): Color => {
        const rgb = value.match(/^rgba?\(([^)]+)\)$/)
        if (rgb) {
          const channels = rgb[1]!.split(',').map(Number)
          return [channels[0]!, channels[1]!, channels[2]!, channels[3] ?? 1]
        }
        if (!CSS.supports('color', value)) {
          throw new Error(`Unsupported paint: ${value}`)
        }
        context.clearRect(0, 0, 1, 1)
        context.fillStyle = value
        context.fillRect(0, 0, 1, 1)
        const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data
        return [r!, g!, b!, a! / 255]
      }
      const over = (foreground: Color, background: Color): Color => {
        const alpha = foreground[3] + background[3] * (1 - foreground[3])
        return [
          ...[0, 1, 2].map((channel) =>
            alpha
              ? (foreground[channel]! * foreground[3] +
                  background[channel]! * background[3] * (1 - foreground[3])) /
                alpha
              : 0,
          ),
          alpha,
        ] as Color
      }
      const luminance = (color: Color) => {
        const [r, g, b] = color.slice(0, 3).map((channel) => {
          const value = channel / 255
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
        })
        return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
      }
      const elements = new Set<Element>()
      for (const root of roots) {
        for (const element of property === 'color' && !placeholder
          ? [root, ...root.querySelectorAll('*')]
          : [root]) {
          if (!element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) {
            continue
          }
          const hasText = [...element.childNodes].some(
            (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
          )
          const hasValue =
            (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) &&
            element.value.length > 0
          if (property !== 'color' || placeholder || hasText || hasValue) {
            elements.add(element)
          }
        }
      }
      return [...elements].map((element) => {
        const style = getComputedStyle(element, placeholder ? '::placeholder' : pseudo)
        const label = placeholder
          ? element.getAttribute('placeholder')
          : element.textContent?.trim() || element.getAttribute('aria-label') || element.tagName
        const paints: ('outlineColor' | typeof property)[] = [property]
        if (againstParent && property === 'backgroundColor') {
          if (style.borderTopStyle !== 'none' && parseFloat(style.borderTopWidth) > 0) {
            paints.push('borderTopColor')
          }
          if (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) {
            paints.push('outlineColor')
          }
        }
        const candidates = paints.map((paintProperty) => {
          let foreground = parse(style[paintProperty])
          let background: Color = [0, 0, 0, 0]
          if (placeholder || pseudo) {
            foreground[3] *= Number(style.opacity)
          }
          const unsupported: string[] = []
          if (
            pseudo &&
            (style.content === 'none' ||
              style.display === 'none' ||
              parseFloat(style.width) <= 0 ||
              parseFloat(style.height) <= 0 ||
              style.backgroundImage !== 'none' ||
              style.filter !== 'none' ||
              style.mixBlendMode !== 'normal')
          ) {
            unsupported.push('pseudo-element is not a visible solid paint')
          }
          if (
            placeholder &&
            (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) ||
              element.value !== '')
          ) {
            unsupported.push('placeholder is not rendered on an empty input or textarea')
          }
          if (
            paintProperty.startsWith('border') &&
            (style[
              paintProperty === 'borderBottomColor' ? 'borderBottomStyle' : 'borderTopStyle'
            ] === 'none' ||
              parseFloat(
                style[
                  paintProperty === 'borderBottomColor' ? 'borderBottomWidth' : 'borderTopWidth'
                ],
              ) === 0)
          ) {
            unsupported.push('border is not painted')
          }
          if (paintProperty === 'stroke') {
            foreground[3] *= Number(style.strokeOpacity)
          }
          if (paintProperty === 'fill') {
            foreground[3] *= Number(style.fillOpacity)
          }
          let ancestor: Element | null = element
          while (ancestor) {
            const ancestorStyle = getComputedStyle(ancestor)
            if (
              ancestorStyle.backgroundImage !== 'none' ||
              !['blur(0px)', 'none'].includes(ancestorStyle.filter) ||
              ancestorStyle.mixBlendMode !== 'normal'
            ) {
              unsupported.push(`unsupported background/filter/blending on ${ancestor.tagName}`)
            }
            const paint = parse(ancestorStyle.backgroundColor)
            // A component's own fill is compared to its adjacent parent surface.
            if (ancestor === element && againstParent) {
              // Borders are painted over the element background; outlines are outside it.
              if (paintProperty.startsWith('border')) {
                foreground = over(foreground, paint)
              }
            } else {
              foreground = over(foreground, paint)
              background = over(background, paint)
            }
            foreground[3] *= Number(ancestorStyle.opacity)
            background[3] *= Number(ancestorStyle.opacity)
            ancestor = ancestor.parentElement
          }
          const canvasColor: Color = [255, 255, 255, 1]
          foreground = over(foreground, canvasColor)
          background = over(background, canvasColor)
          const foregroundLuminance = luminance(foreground)
          const backgroundLuminance = luminance(background)
          const ratio =
            (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
            (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
          const isLargeText =
            parseFloat(style.fontSize) >= 24 ||
            (parseFloat(style.fontSize) >= 18.6666666667 && Number(style.fontWeight) >= 700)
          return {
            background,
            foreground,
            label,
            minimum: property === 'color' && isLargeText ? 3 : minimum,
            property: paintProperty,
            ratio,
            selector: `${element.tagName}.${[...element.classList].join('.')}${pseudo ?? ''}`,
            unsupported,
          }
        })
        const strongest = candidates.reduce((best, candidate) =>
          candidate.ratio > best.ratio ? candidate : best,
        )
        return { ...strongest, candidates }
      })
    },
    { againstParent, minimum, placeholder, property, pseudo },
  )

  expect(results.length, `No rendered contrast targets in ${targets.toString()}`).toBeGreaterThan(0)
  for (const result of results) {
    expect.soft(result.unsupported, JSON.stringify(result)).toEqual([])
    expect.soft(result.ratio, JSON.stringify(result)).toBeGreaterThanOrEqual(result.minimum)
  }
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
  await expect(drawer.getByRole('textbox', { name: /^Title/ })).toBeVisible()
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

/** Measures block movement independently of page layout and ancestor scrolling. */
export async function getTopWithinEditor({ target }: { target: Locator }): Promise<number> {
  return target.evaluate((element) => {
    const parent = element.closest('.ContentEditable__root')!

    return (
      element.getBoundingClientRect().top - parent.getBoundingClientRect().top + parent.scrollTop
    )
  })
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
  const widgetID = await widgets.last().getAttribute('data-slug')

  if (!widgetID) {
    throw new Error('Added Collection Query widget has no ID')
  }

  return page.locator(`.widget[data-slug="${widgetID}"]`)
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

export async function readBorderStyles({ targets }: { targets: Locator }) {
  await expect(targets.first()).toBeVisible()
  return targets.evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element)
      return {
        borderBottom: style.borderBottom,
        borderLeft: style.borderLeft,
        borderRight: style.borderRight,
        borderTop: style.borderTop,
        outline: style.outline,
        outlineOffset: style.outlineOffset,
      }
    }),
  )
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

/** Checks the rendered divider in enhanced mode and exact restoration when disabled. */
export async function expectEnhancedDividerContrast({
  page,
  property,
  pseudo,
  targets,
}: {
  page: Page
  property: 'backgroundColor' | 'borderBottomColor' | 'borderTopColor'
  pseudo?: '::after' | '::before'
  targets: Locator
}) {
  await expect(targets.first()).toBeVisible()
  const readPaint = () =>
    targets.evaluateAll(
      (elements, { property, pseudo }) =>
        elements.map((element) => getComputedStyle(element, pseudo)[property]),
      { property, pseudo },
    )
  const defaultPaint = await readPaint()

  await page
    .locator('html')
    .evaluate((element) => element.setAttribute('data-enhanced-contrast', ''))
  try {
    await expectPaintContrast({ againstParent: true, minimum: 3, property, pseudo, targets })
  } finally {
    await page
      .locator('html')
      .evaluate((element) => element.removeAttribute('data-enhanced-contrast'))
  }
  expect(await readPaint()).toEqual(defaultPaint)
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

export async function disableWorkflowAutoLogin({
  page,
  serverURL,
}: {
  page: Page
  serverURL: string
}) {
  // Keep the test-only header off cross-origin assets, where it triggers CORS preflights.
  await page.route(`${serverURL}/**`, async (route) => {
    await route.continue({
      headers: { ...route.request().headers(), DisableAutologin: 'true' },
    })
  })
}

export async function scanA11y({
  name,
  page,
  include,
  testInfo = test.info(),
}: {
  include?: string[]
  name: string
  page: Page
  testInfo?: TestInfo
}) {
  const run = async () => {
    const startedAt = performance.now()
    const results = await runAxeScan({
      defaultExcludes: false,
      include,
      page,
      screenshotViolations: false,
      testInfo,
    })

    testInfo.annotations.push({
      type: 'a11y-scan',
      description: JSON.stringify({
        name,
        durationMs: Math.round(performance.now() - startedAt),
        violations: results.violations.length,
      }),
    })
    expect.soft(results.violations, `Axe checkpoint: ${name}`).toEqual([])
  }

  await test.step(`axe: ${name}`, run)
}

export async function expectNoPageOverflow({ page }: { page: Page }) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    )
    .toBe(true)
}

export async function tabToSignInControl({ control, page }: { control: Locator; page: Page }) {
  await expect(control).toBeVisible()
  await expect(control).toBeEnabled()
  // Bound traversal so a missing/unreachable control fails instead of hanging.
  for (let tabCount = 0; tabCount < 12; tabCount++) {
    if (await control.evaluate((element) => element === element.ownerDocument.activeElement)) {
      return
    }
    await page.keyboard.press(workflowTabKey({ direction: 'Tab', page }))
  }
  await expect(control).toBeFocused()
}

export async function openWorkflowDeleteDialog({ page }: { page: Page }) {
  const menu = page.locator('.doc-controls__popup .popup__trigger-wrap button')

  await tabToWorkflowControl({ control: menu, page })
  await page.keyboard.press('Enter')
  const trigger = page.getByRole('menuitem', { name: 'Delete', exact: true })

  await expect(trigger).toBeVisible()
  for (let index = 0; index < 12; index++) {
    if (await trigger.evaluate((element) => element === element.ownerDocument.activeElement)) {
      break
    }
    await page.keyboard.press('ArrowDown')
  }
  await expect(trigger).toBeFocused()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('alertdialog', { name: /confirm deletion/i })

  await expectFocusInside({ container: dialog, page })
  return { dialog, trigger: menu }
}

export async function arrowToWorkflowItem({
  item,
  key = 'ArrowDown',
  page,
}: {
  item: Locator
  key?: 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
  page: Page
}) {
  for (let index = 0; index < 20; index++) {
    if (await item.evaluate((element) => element === element.ownerDocument.activeElement)) {
      return
    }
    await page.keyboard.press(key)
  }
  await expect(item).toBeFocused()
}

export async function deleteWorkflowPostsByTitle({
  page,
  serverURL,
  title,
}: {
  page: Page
  serverURL: string
  title: string
}) {
  const response = await page.request.get(`${serverURL}/api/posts`, {
    params: { draft: 'true', trash: 'true', 'where[title][equals]': title },
  })

  await expect(response).toBeOK()
  for (const doc of (await response.json()).docs) {
    await expect(await page.request.delete(`${serverURL}/api/posts/${doc.id}?trash=true`)).toBeOK()
  }
}

export async function chooseWorkflowUpload({ page }: { page: Page }) {
  const select = page.getByRole('button', { name: /select.*file/i })

  await tabToWorkflowControl({ control: select, page })
  const chooser = page.waitForEvent('filechooser')

  await page.keyboard.press('Enter')
  // Playwright supplies the file at the native picker boundary; in-app controls use the keyboard.
  await (await chooser).setFiles(fileURLToPath(new URL('../uploads/image.png', import.meta.url)))
  await expect(page.locator('.file-manager__selected-preview')).toBeVisible()
}

export async function enterWorkflowGrid({ grid, page }: { grid: Locator; page: Page }) {
  // The grid has one roving Tab stop; Control+Home moves to its first header control.
  await tabToWorkflowControl({ control: grid.locator('[tabindex="0"]').first(), page })
  await page.keyboard.press('Control+Home')
  await expect(grid.locator('thead').getByRole('checkbox')).toBeFocused()
}

export async function prepareSignInPage({ page, serverURL }: { page: Page; serverURL: string }) {
  const contrastCookies = (await page.context().cookies()).filter(
    ({ name }) => name === 'payload-high-contrast-mode',
  )

  await page.context().clearCookies()
  await page.context().addCookies(contrastCookies)
  const serverOrigin = new URL(serverURL).origin

  await page.route(
    (url) => url.origin === serverOrigin,
    async (route) => {
      await route.continue({
        headers: { ...route.request().headers(), DisableAutologin: 'true' },
      })
    },
  )
  await initPage({ noAutoLogin: true, page, serverURL })
  const loginURL = formatAdminURL({ adminRoute: '/admin', path: '/login', serverURL })

  // Normal patched navigation waits for hydration after compilation polling has finished.
  await page.goto(loginURL)
  await expect(page).toHaveURL(loginURL)
}

export async function tabToWorkflowControl({
  control,
  direction = 'Tab',
  page,
}: {
  control: Locator
  direction?: 'Shift+Tab' | 'Tab'
  page: Page
}) {
  await expect(control).toBeVisible()
  await expect(control).toBeEnabled()
  // Traverse the real tab order, including document controls before the form.
  for (let tabCount = 0; tabCount < 160; tabCount++) {
    if (await control.evaluate((element) => element === element.ownerDocument.activeElement)) {
      return
    }
    // Lexical documents Escape followed by Tab as its exit gesture.
    if (
      await page
        .locator(':focus')
        .evaluateAll((elements) =>
          elements.some(
            (element) =>
              element instanceof HTMLElement &&
              element.isContentEditable &&
              Boolean(element.closest('.rich-text-lexical')),
          ),
        )
    ) {
      await page.keyboard.press('Escape')
    }
    await page.keyboard.press(workflowTabKey({ direction, page }))
  }
  await expect(control).toBeFocused()
}

export async function prepareWorkflowPage({ page, serverURL }: { page: Page; serverURL: string }) {
  const credentials = { email: `workflow-${randomUUID()}@example.com`, password: devUser.password }
  // API-key setup avoids concurrent logins overwriting the seeded admin's session list.
  const created = await page.request.post(`${serverURL}/api/users`, {
    data: credentials,
    headers: { Authorization: `users API-Key ${seededAPIKey}` },
  })

  await expect(created).toBeOK()
  const { doc } = (await created.json()) as { doc: { id: number | string } }

  workflowUsers.set(page, doc.id)
  await expect(
    await page.request.post(`${serverURL}/api/users/login`, { data: credentials }),
  ).toBeOK()
  await initPage({ page, serverURL })
}

export async function cleanupWorkflowUsers({ serverURL }: { serverURL: string }) {
  for (const [page, id] of workflowUsers) {
    try {
      await expect(
        await page.request.delete(`${serverURL}/api/users/${id}`, {
          headers: { Authorization: `users API-Key ${seededAPIKey}` },
        }),
      ).toBeOK()
    } finally {
      workflowUsers.delete(page)
    }
  }
}

export async function withWorkflowPost({
  action,
  initialStatus = 'published',
  page,
  postsURL,
  serverURL,
}: {
  action: (post: { id: number | string; title: string }) => Promise<void>
  initialStatus?: 'draft' | 'published'
  page: Page
  postsURL: AdminUrlUtil
  serverURL: string
}) {
  const title = `Accessibility workflow ${randomUUID()}`
  const response = await page.request.post(`${serverURL}/api/posts`, {
    data: { _status: initialStatus, title },
  })

  expect(response.ok()).toBe(true)
  const { doc } = (await response.json()) as { doc: { id: number | string } }

  try {
    await page.goto(postsURL.edit(doc.id))
    await waitForFormReady(page)
    await action({ id: doc.id, title })
  } finally {
    const cleanup = await page.request.delete(`${serverURL}/api/posts/${doc.id}?trash=true`)

    // A destructive regression may already have removed this disposable document.
    // Do not mask its primary assertion failure with a second cleanup failure.
    expect(cleanup.ok() || cleanup.status() === 404).toBe(true)
  }
}

export async function expectPersistedWorkflowPost({
  id,
  draft = false,
  page,
  serverURL,
  status,
  subtitle,
  title,
}: {
  draft?: boolean
  id: number | string
  page: Page
  serverURL: string
  status?: 'draft' | 'published'
  subtitle?: string
  title: string
}) {
  await expect
    .poll(async () => {
      const response = await page.request.get(`${serverURL}/api/posts/${id}?draft=${draft}`)

      expect(response.ok()).toBe(true)
      const doc = (await response.json()) as { _status: string; subtitle?: string; title: string }

      return {
        ...(status !== undefined ? { status: doc._status } : {}),
        title: doc.title,
        ...(subtitle !== undefined ? { subtitle: doc.subtitle } : {}),
      }
    })
    .toEqual({
      ...(status !== undefined ? { status } : {}),
      title,
      ...(subtitle !== undefined ? { subtitle } : {}),
    })
}

export async function withWorkflowPosts({
  action,
  labels,
  page,
  serverURL,
}: {
  action: (posts: Array<{ id: number | string; title: string }>) => Promise<void>
  labels: string[]
  page: Page
  serverURL: string
}) {
  const prefix = 'Accessibility collection ' + randomUUID()
  const posts: Array<{ id: number | string; title: string }> = []

  try {
    for (const label of labels) {
      const title = prefix + ' ' + label
      const response = await page.request.post(serverURL + '/api/posts', {
        data: { _status: 'published', title },
      })

      expect(response.ok()).toBe(true)
      const { doc } = await response.json()
      posts.push({ id: doc.id, title })
    }
    await action(posts)
  } finally {
    const responses = await Promise.all(
      posts.map(({ id }) => page.request.delete(serverURL + '/api/posts/' + id + '?trash=true')),
    )
    for (const response of responses) {
      expect(response.ok() || response.status() === 404).toBe(true)
    }
  }
}

export function workflowTabKey({
  direction,
  page,
}: {
  direction: 'Shift+Tab' | 'Tab'
  page: Page
}) {
  // With default macOS settings, Safari uses Option-Tab to include buttons and links.
  return process.platform === 'darwin' &&
    page.context().browser()?.browserType().name() === 'webkit'
    ? `Alt+${direction}`
    : direction
}

export async function openDragReorderField({
  kind,
  page,
  postsURL,
  rowCount = 2,
}: {
  kind: 'Array' | 'Blocks'
  page: Page
  postsURL: AdminUrlUtil
  rowCount?: 2 | 3
}) {
  await gotoCreatePost({ page, postsURL })

  if (kind === 'Array') {
    await page.locator('#field-items .array-field__add-row').click()
    // Array sub-fields mount asynchronously after adding a row.
    await expect(page.locator('#field-items input[name$=".label"]')).toBeVisible({
      timeout: 15000,
    })
    for (let index = 1; index < rowCount; index++) {
      await page.locator('#field-items .array-field__add-row').click()
    }
  } else {
    await addBlock({ blockToSelect: 'Text block', fieldName: 'layout', page })
    await expect(page.locator('#field-layout input[name$=".text"]')).toBeVisible()
    for (let index = 1; index < rowCount; index++) {
      await addBlock({ blockToSelect: 'Text block', fieldName: 'layout', page })
    }
  }

  const field = page.locator(kind === 'Array' ? '#field-items' : '#field-layout')
  const rows = field.locator(kind === 'Array' ? '.array-field__row' : '.blocks-field__row')
  const values = rows.locator(kind === 'Array' ? 'input[name$=".label"]' : 'input[name$=".text"]')

  await expect(rows).toHaveCount(rowCount)
  await expect(rows.locator('.shimmer-effect')).toHaveCount(0, { timeout: 15000 })
  await field.getByRole('button', { name: /show all/i }).click()
  await expect(values).toHaveCount(rowCount)
  for (const [index, label] of ['First', 'Second', 'Third'].slice(0, rowCount).entries()) {
    await values.nth(index).fill(`${label} drag row`)
  }
  const firstRowLabel = (
    await rows
      .first()
      .locator(kind === 'Array' ? '.row-label' : '.blocks-field__block-pill')
      .innerText()
  ).trim()
  await field.getByRole('button', { name: /collapse all/i }).click()
  for (const content of await rows.locator('.collapsible__content').all()) {
    await expect(content).toBeHidden()
  }
  const handle = rows.first().getByRole('button', { name: /drag to reorder/i })

  await expect(handle).toBeVisible()
  expect(firstRowLabel).not.toBe('')
  return { field, firstRowLabel, handle, rows, values }
}
