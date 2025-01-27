import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import { exactText, initPageConsoleErrorCatch, saveDocAndAssert } from '../helpers'
import { AdminUrlUtil } from '../helpers/adminUrlUtil'
import { initPayloadE2E } from '../helpers/configHelpers'
import {
  ensureDeviceIsCentered,
  ensureDeviceIsLeftAligned,
  goToCollectionLivePreview,
  selectLivePreviewBreakpoint,
  selectLivePreviewZoom,
} from './helpers'
import { desktopBreakpoint, mobileBreakpoint } from './shared'
import { startLivePreviewDemo } from './startLivePreviewDemo'

const { beforeAll, describe } = test

describe('Live Preview', () => {
  let page: Page
  let serverURL: string
  let url: AdminUrlUtil

  const goToDoc = async (page: Page) => {
    await page.goto(url.list)
    const linkToDoc = page.locator('tbody tr:first-child .cell-id a').first()
    expect(linkToDoc).toBeTruthy()
    await linkToDoc.click()
  }

  const goToCollectionPreview = async (page: Page): Promise<void> => {
    await goToDoc(page)
    await page.goto(`${page.url()}/preview`)
  }

  const goToGlobalPreview = async (page: Page, slug: string): Promise<void> => {
    const global = new AdminUrlUtil(serverURL, slug)
    const previewURL = `${global.global(slug)}/preview`
    await page.goto(previewURL)
  }

  beforeAll(async ({ browser }) => {
    const { serverURL: incomingServerURL, payload } = await initPayloadE2E(__dirname)
    url = new AdminUrlUtil(incomingServerURL, 'pages')
    serverURL = incomingServerURL
    const context = await browser.newContext()
    page = await context.newPage()

    await startLivePreviewDemo({
      payload,
    })

    initPageConsoleErrorCatch(page)
  })

  test('collection - has tab', async () => {
    await goToDoc(page)
    const docURL = page.url()
    const pathname = new URL(docURL).pathname

    const livePreviewTab = page.locator('.doc-tab', {
      hasText: exactText('Live Preview'),
    })

    expect(livePreviewTab).toBeTruthy()
    const href = await livePreviewTab.locator('a').first().getAttribute('href')
    expect(href).toBe(`${pathname}/preview`)
  })

  test('collection - has route', async () => {
    const url = page.url()
    await goToCollectionPreview(page)
    expect(page.url()).toBe(`${url}/preview`)
  })

  test('collection - renders iframe', async () => {
    await goToCollectionPreview(page)
    const iframe = page.locator('iframe.live-preview-iframe')
    await expect(iframe).toBeVisible()
  })

  test('collection - can edit fields', async () => {
    await goToCollectionPreview(page)
    const field = page.locator('#field-title')
    await expect(field).toBeVisible()
    await field.fill('Title 1')
    await saveDocAndAssert(page)
  })

  test('collection - should show live-preview view level action in live-preview view', async () => {
    await goToCollectionPreview(page)
    await expect(page.locator('.app-header .collection-live-preview-button')).toHaveCount(1)
  })

  test('global - should show live-preview view level action in live-preview view', async () => {
    await goToGlobalPreview(page, 'footer')
    await expect(page.locator('.app-header .global-live-preview-button')).toHaveCount(1)
  })

  test('global - has tab', async () => {
    const global = new AdminUrlUtil(serverURL, 'header')
    await page.goto(global.global('header'))

    const docURL = page.url()
    const pathname = new URL(docURL).pathname

    const livePreviewTab = page.locator('.doc-tab', {
      hasText: exactText('Live Preview'),
    })

    expect(livePreviewTab).toBeTruthy()
    const href = await livePreviewTab.locator('a').first().getAttribute('href')
    expect(href).toBe(`${pathname}/preview`)
  })

  test('global - has route', async () => {
    const url = page.url()
    await goToGlobalPreview(page, 'header')
    expect(page.url()).toBe(`${url}/preview`)
  })

  test('global - renders iframe', async () => {
    await goToGlobalPreview(page, 'header')
    const iframe = page.locator('iframe.live-preview-iframe')
    await expect(iframe).toBeVisible()
  })

  test('global - can edit fields', async () => {
    await goToGlobalPreview(page, 'header')
    const field = page.locator('input#field-navItems__0__link__newTab')
    await expect(field).toBeVisible()
    await expect(field).toBeEnabled()
    await field.check()
    await saveDocAndAssert(page)
  })

  test('properly measures iframe and displays size', async () => {
    await page.goto(url.create)
    await page.locator('#field-title').fill('Title 3')
    await page.locator('#field-slug').fill('slug-3')

    await saveDocAndAssert(page)
    await goToCollectionPreview(page)
    expect(page.url()).toContain('/preview')

    const iframe = page.locator('iframe')

    // Measure the actual iframe size and compare it with the inputs rendered in the toolbar

    const iframeSize = await iframe.boundingBox()
    const iframeWidthInPx = iframeSize?.width
    const iframeHeightInPx = iframeSize?.height

    const widthInput = page.locator('.live-preview-toolbar input[name="live-preview-width"]')
    expect(widthInput).toBeTruthy()
    const heightInput = page.locator('.live-preview-toolbar input[name="live-preview-height"]')
    expect(heightInput).toBeTruthy()

    const widthInputValue = await widthInput.getAttribute('value')
    const width = parseInt(widthInputValue)
    const heightInputValue = await heightInput.getAttribute('value')
    const height = parseInt(heightInputValue)

    // Allow a tolerance of a couple of pixels
    const tolerance = 2
    expect(iframeWidthInPx).toBeLessThanOrEqual(width + tolerance)
    expect(iframeWidthInPx).toBeGreaterThanOrEqual(width - tolerance)
    expect(iframeHeightInPx).toBeLessThanOrEqual(height + tolerance)
    expect(iframeHeightInPx).toBeGreaterThanOrEqual(height - tolerance)
  })

  test('resizes iframe to specified breakpoint', async () => {
    await page.goto(url.create)
    await page.locator('#field-title').fill('Title 4')
    await page.locator('#field-slug').fill('slug-4')

    await saveDocAndAssert(page)
    await goToCollectionPreview(page)
    expect(page.url()).toContain('/preview')

    // Check that the breakpoint select is present
    const breakpointSelector = page.locator(
      '.live-preview-toolbar-controls__breakpoint button.popup-button',
    )
    expect(breakpointSelector).toBeTruthy()

    // Select the mobile breakpoint
    await breakpointSelector.first().click()
    await page
      .locator(`.live-preview-toolbar-controls__breakpoint button.popup-button-list__button`)
      .filter({ hasText: mobileBreakpoint.label })
      .click()

    // Make sure the value has been set
    await expect(breakpointSelector).toContainText(mobileBreakpoint.label)
    const option = page.locator(
      '.live-preview-toolbar-controls__breakpoint button.popup-button-list__button--selected',
    )
    await expect(option).toHaveText(mobileBreakpoint.label)

    // Measure the size of the iframe against the specified breakpoint
    const iframe = page.locator('iframe')
    expect(iframe).toBeTruthy()
    const iframeSize = await iframe.boundingBox()
    const iframeWidthInPx = iframeSize?.width
    const iframeHeightInPx = iframeSize?.height
    const tolerance = 2
    expect(iframeWidthInPx).toBeLessThanOrEqual(mobileBreakpoint.width + tolerance)
    expect(iframeWidthInPx).toBeGreaterThanOrEqual(mobileBreakpoint.width - tolerance)
    expect(iframeHeightInPx).toBeLessThanOrEqual(mobileBreakpoint.height + tolerance)
    expect(iframeHeightInPx).toBeGreaterThanOrEqual(mobileBreakpoint.height - tolerance)

    // Check that the inputs have been updated to reflect the new size
    const widthInput = page.locator('.live-preview-toolbar input[name="live-preview-width"]')
    expect(widthInput).toBeTruthy()
    const heightInput = page.locator('.live-preview-toolbar input[name="live-preview-height"]')
    expect(heightInput).toBeTruthy()
    const widthInputValue = await widthInput.getAttribute('value')
    const width = parseInt(widthInputValue)
    expect(width).toBe(mobileBreakpoint.width)
    const heightInputValue = await heightInput.getAttribute('value')
    const height = parseInt(heightInputValue)
    expect(height).toBe(mobileBreakpoint.height)
  })

  test('device — centers device when smaller than frame despite zoom', async () => {
    await goToCollectionLivePreview(page, url)
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
    await goToCollectionLivePreview(page, url)
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
