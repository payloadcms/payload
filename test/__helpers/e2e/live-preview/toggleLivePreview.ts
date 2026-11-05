import type { FrameLocator, Page, Route } from '@playwright/test'

import { expect } from '@playwright/test'

/**
 * Match this to whatever the component uses.
 */
const livePreviewIframeID = 'live-preview-iframe'

export const getLivePreviewIframe = async (
  page: Page,
  options?: {
    expectIframeSrcToMatch?: RegExp
  },
): Promise<{
  frame: FrameLocator
  iframe: ReturnType<Page['locator']>
}> => {
  const { expectIframeSrcToMatch } = options || {}

  const iframe = page.locator(`#${livePreviewIframeID}`)

  if (expectIframeSrcToMatch) {
    await expect.poll(async () => iframe.getAttribute('src')).toMatch(expectIframeSrcToMatch)
  }

  const frame = getLivePreviewIframeFrame(page)

  return {
    iframe,
    frame,
  }
}

export const getLivePreviewIframeFrame = (page: Page): FrameLocator => {
  const frame = page.frameLocator(`#${livePreviewIframeID}`)
  return frame
}

const endpoint = '**/api/payload-preferences/**'

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

  let hasSavedPrefs = false
  let hasClickedToggler = false

  const onRoute = async (route: Route) => {
    const request = route.request()
    const response = await route.fetch()

    if (request.method() === 'POST' && response.status() === 200) {
      hasSavedPrefs = true
    }

    await route.fulfill({ response })
  }

  await page.route(endpoint, onRoute)

  try {
    if (isActive && (options?.targetState === 'off' || !options?.targetState)) {
      await toggler.click()
      hasClickedToggler = true
      await expect(toggler).not.toHaveClass(/live-preview-toggler--active/)
      const { iframe } = await getLivePreviewIframe(page)
      await expect(iframe).toBeHidden()
    }

    if (!isActive && (options?.targetState === 'on' || !options?.targetState)) {
      await toggler.click()
      hasClickedToggler = true
      await expect(toggler).toHaveClass(/live-preview-toggler--active/)
      const { iframe } = await getLivePreviewIframe(page)
      await expect(iframe).toBeVisible()
    }

    if (hasClickedToggler) {
      await expect.poll(() => hasSavedPrefs).toBeTruthy()
    }
  } finally {
    await page.unroute(endpoint, onRoute)
  }
}
