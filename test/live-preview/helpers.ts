import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { toggleLivePreview } from '../helpers/e2e/live-preview/toggleLivePreview.js'
import { navigateToDoc, navigateToTrashedDoc } from '../helpers/e2e/navigateToDoc.js'
import { POLL_TOPASS_TIMEOUT } from '../playwright.config.js'

export const goToCollectionLivePreview = async (
  page: Page,
  urlUtil: AdminUrlUtil,
): Promise<void> => {
  await navigateToDoc(page, urlUtil)

  await toggleLivePreview(page, {
    targetState: 'on',
  })
}

export const goToTrashedLivePreview = async (page: Page, urlUtil: AdminUrlUtil): Promise<void> => {
  await navigateToTrashedDoc(page, urlUtil)

  await toggleLivePreview(page, {
    targetState: 'on',
  })
}

export const goToGlobalLivePreview = async (
  page: Page,
  slug: string,
  serverURL: string,
): Promise<void> => {
  const globalUrlUtil = new AdminUrlUtil(serverURL, slug)
  await page.goto(globalUrlUtil.global(slug))

  await toggleLivePreview(page, {
    targetState: 'on',
  })
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
