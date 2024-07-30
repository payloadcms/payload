import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { exactText, navigateToListCellLink } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'

export const EXPECT_TIMEOUT = 8000
export const POLL_TOPASS_TIMEOUT = EXPECT_TIMEOUT * 4

export const goToDoc = async (page: Page, urlUtil: AdminUrlUtil) => {
  await page.goto(urlUtil.list)
  await page.waitForURL(urlUtil.list)
  await navigateToListCellLink(page)
}

export const goToCollectionLivePreview = async (
  page: Page,
  urlUtil: AdminUrlUtil,
): Promise<void> => {
  await goToDoc(page, urlUtil)
  await page.goto(`${page.url()}/preview`)
  await page.waitForURL(`**/preview`)
}

export const goToGlobalLivePreview = async (
  page: Page,
  slug: string,
  serverURL: string,
): Promise<void> => {
  const global = new AdminUrlUtil(serverURL, slug)
  const previewURL = `${global.global(slug)}/preview`
  await page.goto(previewURL)
  await page.waitForURL(previewURL)
}

export const selectLivePreviewBreakpoint = async (page: Page, breakpointLabel: string) => {
  const breakpointSelector = page.locator(
    '.live-preview-toolbar-controls__breakpoint button.popup-button',
  )

  await expect(() => expect(breakpointSelector).toBeTruthy()).toPass({
    timeout: POLL_TOPASS_TIMEOUT,
  })

  await breakpointSelector.first().click()

  await page
    .locator(`.live-preview-toolbar-controls__breakpoint button.popup-button-list__button`)
    .filter({ hasText: breakpointLabel })
    .click()

  await expect(breakpointSelector).toContainText(breakpointLabel)

  const option = page.locator(
    '.live-preview-toolbar-controls__breakpoint button.popup-button-list__button--selected',
  )

  await expect(option).toHaveText(breakpointLabel)
}

export const selectLivePreviewZoom = async (page: Page, zoomLabel: string) => {
  const zoomSelector = page.locator('.live-preview-toolbar-controls__zoom button.popup-button')

  await expect(() => expect(zoomSelector).toBeTruthy()).toPass({
    timeout: POLL_TOPASS_TIMEOUT,
  })

  await zoomSelector.first().click()

  const zoomOption = page.locator(
    '.live-preview-toolbar-controls__zoom button.popup-button-list__button',
    {
      hasText: exactText(zoomLabel),
    },
  )

  expect(zoomOption).toBeTruthy()
  await zoomOption.click()

  await expect(zoomSelector).toContainText(zoomLabel)

  const option = page.locator(
    '.live-preview-toolbar-controls__zoom button.popup-button-list__button--selected',
  )

  await expect(option).toHaveText(zoomLabel)
}

export const ensureDeviceIsCentered = async (page: Page) => {
  const main = page.locator('.live-preview-window__main')
  const iframe = page.locator('iframe.live-preview-iframe')
  const mainBoxAfterZoom = await main.boundingBox()
  const iframeBoxAfterZoom = await iframe.boundingBox()
  const distanceFromIframeLeftToMainLeftAfterZoom = Math.abs(
    mainBoxAfterZoom?.x - iframeBoxAfterZoom?.x,
  )
  const distanceFromIFrameRightToMainRightAfterZoom = Math.abs(
    mainBoxAfterZoom?.x +
      mainBoxAfterZoom?.width -
      iframeBoxAfterZoom?.x -
      iframeBoxAfterZoom?.width,
  )
  await expect(() =>
    expect(distanceFromIframeLeftToMainLeftAfterZoom).toBe(
      distanceFromIFrameRightToMainRightAfterZoom,
    ),
  ).toPass({
    timeout: POLL_TOPASS_TIMEOUT,
  })
}

export const ensureDeviceIsLeftAligned = async (page: Page) => {
  const main = page.locator('.live-preview-window__main > div')
  const iframe = page.locator('iframe.live-preview-iframe')
  const mainBoxAfterZoom = await main.boundingBox()
  const iframeBoxAfterZoom = await iframe.boundingBox()
  const distanceFromIframeLeftToMainLeftAfterZoom = Math.abs(
    mainBoxAfterZoom?.x - iframeBoxAfterZoom?.x,
  )
  await expect(() => expect(distanceFromIframeLeftToMainLeftAfterZoom).toBe(0)).toPass({
    timeout: POLL_TOPASS_TIMEOUT,
  })
}
