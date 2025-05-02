import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import {
  ensureCompilationIsDone,
  exactText,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { navigateToDoc } from '../helpers/e2e/navigateToDoc.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../helpers/reInitializeDB.js'
import { waitForAutoSaveToRunAndComplete } from '../helpers/waitForAutoSaveToRunAndComplete.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
import {
  ensureDeviceIsCentered,
  ensureDeviceIsLeftAligned,
  goToCollectionLivePreview,
  goToGlobalLivePreview,
  selectLivePreviewBreakpoint,
  selectLivePreviewZoom,
} from './helpers.js'
import {
  desktopBreakpoint,
  mobileBreakpoint,
  pagesSlug,
  renderedPageTitleID,
  ssrAutosavePagesSlug,
  ssrPagesSlug,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, beforeEach, describe } = test

describe('Live Preview', () => {
  let page: Page
  let serverURL: string

  let pagesURLUtil: AdminUrlUtil
  let ssrPagesURLUtil: AdminUrlUtil
  let ssrAutosavePostsURLUtil: AdminUrlUtil

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ serverURL } = await initPayloadE2ENoConfig({ dirname }))

    pagesURLUtil = new AdminUrlUtil(serverURL, pagesSlug)
    ssrPagesURLUtil = new AdminUrlUtil(serverURL, ssrPagesSlug)
    ssrAutosavePostsURLUtil = new AdminUrlUtil(serverURL, ssrAutosavePagesSlug)

    const context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'livePreviewTest',
    })

    await ensureCompilationIsDone({ page, serverURL })
  })

  test('collection — has tab', async () => {
    await navigateToDoc(page, pagesURLUtil)

    const livePreviewTab = page.locator('.doc-tab', {
      hasText: exactText('Live Preview'),
    })

    await expect(() => expect(livePreviewTab).toBeTruthy()).toPass({ timeout: POLL_TOPASS_TIMEOUT })

    const href = await livePreviewTab.locator('a').first().getAttribute('href')
    const docURL = page.url()
    const pathname = new URL(docURL).pathname

    await expect(() => expect(href).toBe(`${pathname}/preview`)).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  })

  test('collection — has route', async () => {
    await goToCollectionLivePreview(page, pagesURLUtil)
    await expect(page.locator('.live-preview')).toBeVisible()
  })

  test('collection — renders iframe', async () => {
    await goToCollectionLivePreview(page, pagesURLUtil)
    const iframe = page.locator('iframe.live-preview-iframe')
    await expect(iframe).toBeVisible()
  })

  test('collection — re-renders iframe client-side when form state changes', async () => {
    await goToCollectionLivePreview(page, pagesURLUtil)

    const titleField = page.locator('#field-title')
    const frame = page.frameLocator('iframe.live-preview-iframe').first()

    await expect(titleField).toBeEnabled()

    const renderedPageTitleLocator = `#${renderedPageTitleID}`

    // Forces the test to wait for the Next.js route to render before we try editing a field
    await expect(() => expect(frame.locator(renderedPageTitleLocator)).toBeVisible()).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await expect(frame.locator(renderedPageTitleLocator)).toHaveText('For Testing: Home')

    const newTitleValue = 'Home (Edited)'

    await titleField.fill(newTitleValue)

    await expect(() =>
      expect(frame.locator(renderedPageTitleLocator)).toHaveText(`For Testing: ${newTitleValue}`),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await saveDocAndAssert(page)
  })

  test('collection ssr — re-render iframe when save is made', async () => {
    await goToCollectionLivePreview(page, ssrPagesURLUtil)

    const titleField = page.locator('#field-title')
    const frame = page.frameLocator('iframe.live-preview-iframe').first()

    await expect(titleField).toBeVisible()

    const renderedPageTitleLocator = `#${renderedPageTitleID}`

    // Forces the test to wait for the Next.js route to render before we try editing a field
    await expect(() => expect(frame.locator(renderedPageTitleLocator)).toBeVisible()).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await expect(frame.locator(renderedPageTitleLocator)).toHaveText('For Testing: SSR Home')

    const newTitleValue = 'SSR Home (Edited)'

    await titleField.fill(newTitleValue)

    await saveDocAndAssert(page)

    await expect(() =>
      expect(frame.locator(renderedPageTitleLocator)).toHaveText(`For Testing: ${newTitleValue}`),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  })

  test('collection ssr — re-render iframe when autosave is made', async () => {
    await goToCollectionLivePreview(page, ssrAutosavePostsURLUtil)

    const titleField = page.locator('#field-title')
    const frame = page.frameLocator('iframe.live-preview-iframe').first()

    await expect(titleField).toBeEnabled()

    const renderedPageTitleLocator = `#${renderedPageTitleID}`

    // Forces the test to wait for the Next.js route to render before we try editing a field
    await expect(() => expect(frame.locator(renderedPageTitleLocator)).toBeVisible()).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await expect(frame.locator(renderedPageTitleLocator)).toHaveText('For Testing: SSR Home')

    const newTitleValue = 'SSR Home (Edited)'
    await wait(1000)

    await titleField.clear()
    await titleField.pressSequentially(newTitleValue)

    await wait(1000)

    await waitForAutoSaveToRunAndComplete(page)

    await expect(() =>
      expect(frame.locator(renderedPageTitleLocator)).toHaveText(`For Testing: ${newTitleValue}`),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await saveDocAndAssert(page)
  })

  test('collection — should show live-preview view-level action in live-preview view', async () => {
    await goToCollectionLivePreview(page, pagesURLUtil)
    await expect(page.locator('.app-header .collection-live-preview-button')).toHaveCount(1)
  })

  test('global — should show live-preview view-level action in live-preview view', async () => {
    await goToGlobalLivePreview(page, 'footer', serverURL)
    await expect(page.locator('.app-header .global-live-preview-button')).toHaveCount(1)
  })

  test('global — has tab', async () => {
    const global = new AdminUrlUtil(serverURL, 'header')
    await page.goto(global.global('header'))

    const docURL = page.url()
    const pathname = new URL(docURL).pathname

    const livePreviewTab = page.locator('.doc-tab', {
      hasText: exactText('Live Preview'),
    })

    await expect(() => expect(livePreviewTab).toBeTruthy()).toPass({ timeout: POLL_TOPASS_TIMEOUT })
    const href = await livePreviewTab.locator('a').first().getAttribute('href')

    await expect(() => expect(href).toBe(`${pathname}/preview`)).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  })

  test('global — has route', async () => {
    await goToGlobalLivePreview(page, 'header', serverURL)
  })

  test('global — renders iframe', async () => {
    await goToGlobalLivePreview(page, 'header', serverURL)
    const iframe = page.locator('iframe.live-preview-iframe')
    await expect(iframe).toBeVisible()
  })

  test('global — can edit fields', async () => {
    await goToGlobalLivePreview(page, 'header', serverURL)
    const field = page.locator('input#field-navItems__0__link__newTab') //field-navItems__0__link__newTab
    await expect(field).toBeVisible()
    await expect(field).toBeEnabled()
    await field.check()
    await saveDocAndAssert(page)
  })

  test('device — properly measures size', async () => {
    await page.goto(pagesURLUtil.create)
    await page.locator('#field-title').fill('Title 3')
    await page.locator('#field-slug').fill('slug-3')

    await saveDocAndAssert(page)
    await goToCollectionLivePreview(page, pagesURLUtil)

    const iframe = page.locator('iframe')

    // Measure the actual iframe size and compare it with the inputs rendered in the toolbar

    const iframeSize = await iframe.boundingBox()
    const iframeWidthInPx = iframeSize?.width
    const iframeHeightInPx = iframeSize?.height

    const widthInput = page.locator('.live-preview-toolbar input[name="live-preview-width"]')

    await expect(() => expect(widthInput).toBeTruthy()).toPass({ timeout: POLL_TOPASS_TIMEOUT })
    const heightInput = page.locator('.live-preview-toolbar input[name="live-preview-height"]')

    await expect(() => expect(heightInput).toBeTruthy()).toPass({ timeout: POLL_TOPASS_TIMEOUT })

    const widthInputValue = await widthInput.getAttribute('value')
    const width = parseInt(widthInputValue)
    const heightInputValue = await heightInput.getAttribute('value')
    const height = parseInt(heightInputValue)

    // Allow a tolerance of a couple of pixels
    const tolerance = 2

    await expect(() => expect(iframeWidthInPx).toBeLessThanOrEqual(width + tolerance)).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await expect(() => expect(iframeWidthInPx).toBeGreaterThanOrEqual(width - tolerance)).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await expect(() => expect(iframeHeightInPx).toBeLessThanOrEqual(height + tolerance)).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await expect(() => expect(iframeHeightInPx).toBeGreaterThanOrEqual(height - tolerance)).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  })

  test('device — resizes to specified breakpoint', async () => {
    await page.goto(pagesURLUtil.create)
    await page.locator('#field-title').fill('Title 4')
    await page.locator('#field-slug').fill('slug-4')

    await saveDocAndAssert(page)
    await goToCollectionLivePreview(page, pagesURLUtil)

    await selectLivePreviewBreakpoint(page, mobileBreakpoint.label)

    // Measure the size of the iframe against the specified breakpoint
    const iframe = page.locator('iframe')

    await expect(() => expect(iframe).toBeTruthy()).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
    const iframeSize = await iframe.boundingBox()
    const iframeWidthInPx = iframeSize?.width
    const iframeHeightInPx = iframeSize?.height
    const tolerance = 2

    await expect(() =>
      expect(iframeWidthInPx).toBeLessThanOrEqual(mobileBreakpoint.width + tolerance),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await expect(() =>
      expect(iframeWidthInPx).toBeGreaterThanOrEqual(mobileBreakpoint.width - tolerance),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await expect(() =>
      expect(iframeHeightInPx).toBeLessThanOrEqual(mobileBreakpoint.height + tolerance),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await expect(() =>
      expect(iframeHeightInPx).toBeGreaterThanOrEqual(mobileBreakpoint.height - tolerance),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    // Check that the inputs have been updated to reflect the new size
    const widthInput = page.locator('.live-preview-toolbar input[name="live-preview-width"]')

    await expect(() => expect(widthInput).toBeTruthy()).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
    const heightInput = page.locator('.live-preview-toolbar input[name="live-preview-height"]')

    await expect(() => expect(heightInput).toBeTruthy()).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
    const widthInputValue = await widthInput.getAttribute('value')
    const width = parseInt(widthInputValue)

    await expect(() => expect(width).toBe(mobileBreakpoint.width)).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
    const heightInputValue = await heightInput.getAttribute('value')
    const height = parseInt(heightInputValue)

    await expect(() => expect(height).toBe(mobileBreakpoint.height)).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  })

  test('device — centers device when smaller than frame despite zoom', async () => {
    await goToCollectionLivePreview(page, pagesURLUtil)
    await selectLivePreviewBreakpoint(page, mobileBreakpoint.label)
    await ensureDeviceIsCentered(page)
    await selectLivePreviewZoom(page, '75%')
    await ensureDeviceIsCentered(page)
    await selectLivePreviewZoom(page, '50%')
    await ensureDeviceIsCentered(page)
    await selectLivePreviewZoom(page, '125%')
    await ensureDeviceIsCentered(page)
    await selectLivePreviewZoom(page, '200%')
    await ensureDeviceIsCentered(page)
    expect(true).toBeTruthy()
  })

  test('device — left-aligns device when larger than frame despite zoom', async () => {
    await goToCollectionLivePreview(page, pagesURLUtil)
    await selectLivePreviewBreakpoint(page, desktopBreakpoint.label)
    await ensureDeviceIsLeftAligned(page)
    await selectLivePreviewZoom(page, '75%')
    await ensureDeviceIsLeftAligned(page)
    await selectLivePreviewZoom(page, '50%')
    await ensureDeviceIsLeftAligned(page)
    await selectLivePreviewZoom(page, '125%')
    await ensureDeviceIsLeftAligned(page)
    await selectLivePreviewZoom(page, '200%')
    await ensureDeviceIsLeftAligned(page)
    expect(true).toBeTruthy()
  })
})
