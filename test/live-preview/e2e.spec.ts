import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import { exactText, saveDocAndAssert } from '../helpers'
import { AdminUrlUtil } from '../helpers/adminUrlUtil'
import { initPayloadE2E } from '../helpers/configHelpers'
import { mobileBreakpoint } from './config'
import { startLivePreviewDemo } from './startLivePreviewDemo'

const { beforeAll, describe } = test
let url: AdminUrlUtil
let serverURL: string

describe('Live Preview', () => {
  let page: Page

  beforeAll(async ({ browser }) => {
    const { serverURL: incomingServerURL, payload } = await initPayloadE2E(__dirname)
    url = new AdminUrlUtil(incomingServerURL, 'pages')
    serverURL = incomingServerURL
    const context = await browser.newContext()
    page = await context.newPage()

    await startLivePreviewDemo({
      payload,
    })
  })

  test('collection - has tab', async () => {
    await page.goto(url.create)

    const livePreviewTab = page.locator('.doc-tab', {
      hasText: exactText('Live Preview'),
    })

    expect(livePreviewTab).toBeTruthy()
  })

  test('collection - has route', async () => {
    await page.goto(url.create)
    await page.locator('#field-title').fill('Title 1')
    await page.locator('#field-slug').fill('slug-1')

    await saveDocAndAssert(page)
    const docURL = page.url()

    const livePreviewTab = page.locator('.doc-tab', {
      hasText: exactText('Live Preview'),
    })

    expect(livePreviewTab).toBeTruthy()
    await livePreviewTab.click()
    expect(page.url()).toBe(`${docURL}/preview`)
  })

  test('global - has tab', async () => {
    const global = new AdminUrlUtil(serverURL, 'header')
    await page.goto(global.global('header'))

    const livePreviewTab = page.locator('.doc-tab', {
      hasText: exactText('Live Preview'),
    })

    expect(livePreviewTab).toBeTruthy()
  })

  test('global - has route', async () => {
    const global = new AdminUrlUtil(serverURL, 'header')
    await page.goto(global.global('header'))

    const docURL = page.url()

    const livePreviewTab = page.locator('.doc-tab', {
      hasText: exactText('Live Preview'),
    })

    expect(livePreviewTab).toBeTruthy()
    await livePreviewTab.click()
    expect(page.url()).toBe(`${docURL}/preview`)
  })

  test('renders preview iframe on the page', async () => {
    await page.goto(url.create)
    await page.locator('#field-title').fill('Title 2')
    await page.locator('#field-slug').fill('slug-2')

    await saveDocAndAssert(page)
    const docURL = page.url()
    await page.goto(`${docURL}/preview`)
    expect(page.url()).toBe(`${docURL}/preview`)
    const iframe = page.locator('iframe')
    expect(iframe).toBeTruthy()
  })

  test('properly measures iframe and displays size', async () => {
    await page.goto(url.create)
    await page.locator('#field-title').fill('Title 3')
    await page.locator('#field-slug').fill('slug-3')

    await saveDocAndAssert(page)
    const docURL = page.url()
    await page.goto(`${docURL}/preview`)
    expect(page.url()).toBe(`${docURL}/preview`)
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
    const docURL = page.url()
    await page.goto(`${docURL}/preview`)
    expect(page.url()).toBe(`${docURL}/preview`)

    const breakpointSelector = page.locator(
      '.live-preview-toolbar select[name="live-preview-breakpoint"]',
    )

    expect(breakpointSelector).toBeTruthy()
    await breakpointSelector.selectOption({ label: mobileBreakpoint.label })

    // check the select again to make sure the value has been set
    // then check that the `label` is proper based on the config
    // we already know the `name` is proper because its been selected
    const option = page.locator(
      '.live-preview-toolbar select[name="live-preview-breakpoint"] option:checked',
    )
    expect(option).toBeTruthy()
    const optionLabel = await option.innerText()
    expect(optionLabel).toBe(mobileBreakpoint.label)

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
})
