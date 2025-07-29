import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { exactText } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { navigateToDoc, navigateToTrashedDoc } from '../helpers/e2e/navigateToDoc.js'
import { POLL_TOPASS_TIMEOUT } from '../playwright.config.js'

export const toggleLivePreview = async (
  page: Page,
  options?: {
    targetState?: 'off' | 'on'
  },
): Promise<void> => {
  const toggler = page.locator('#live-preview-toggler')
  await expect(toggler).toBeVisible()

  const isActive = await toggler.evaluate((el) =>
    el.classList.contains('live-preview-toggler--active'),
  )

  if (isActive && (options?.targetState === 'off' || !options?.targetState)) {
    await toggler.click()
    await expect(toggler).not.toHaveClass(/live-preview-toggler--active/)
    await expect(page.locator('iframe.live-preview-iframe')).toBeHidden()
  }

  if (!isActive && (options?.targetState === 'on' || !options?.targetState)) {
    await toggler.click()
    await expect(toggler).toHaveClass(/live-preview-toggler--active/)
    await expect(page.locator('iframe.live-preview-iframe')).toBeVisible()
  }
}

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
