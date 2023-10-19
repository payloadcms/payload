import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import { exactText, saveDocAndAssert } from '../helpers'
import { AdminUrlUtil } from '../helpers/adminUrlUtil'
import { initPayloadE2E } from '../helpers/configHelpers'
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
    await page.locator('#field-title').fill('Title')
    await page.locator('#field-slug').fill('slug')

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
    await page.locator('#field-title').fill('Title')
    await page.locator('#field-slug').fill('slug')

    await saveDocAndAssert(page)

    await page.goto(`${page.url()}/preview`)
    const iframe = page.locator('iframe')

    expect(iframe).toBeTruthy()
  })

  test('renders iframe window width and height', async () => {
    await page.goto(url.create)
    await page.locator('#field-title').fill('Title')
    await page.locator('#field-slug').fill('slug')

    await saveDocAndAssert(page)

    await page.goto(`${page.url()}/preview`)
    const iframe = page.locator('iframe')

    // Measure the actual iframe size and compare it with the inputs rendered in the toolbar

    const iframeSize = await iframe.boundingBox()
    const iframeWidthInPx = iframeSize?.width
    const iframeHeightInPx = iframeSize?.height

    const widthInput = page.locator('.live-preview-toolbar input[name="live-preview-width"]')
    const heightInput = page.locator('.live-preview-toolbar input[name="live-preview-height"]')

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
})
