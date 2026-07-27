import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { Config } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
} from '../../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

test.describe('Tooltip', () => {
  let page: Page
  let context: BrowserContext
  let url: AdminUrlUtil
  let serverURL: string

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    url = new AdminUrlUtil(serverURL, 'posts')

    context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  test.afterAll(async () => {
    await context.close()
  })

  test.beforeEach(async () => {
    await page.goto(`${url.admin}/tooltip-showcase`)
    await expect(page.locator('h1')).toHaveText('Tooltip Showcase')
  })

  test('escapes an overflow: hidden container', async () => {
    const tooltip = page.locator('#tooltip-overflow-demo')
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toHaveClass(/tooltip--show/)

    // The portaled tooltip is a direct child of <body>, so it cannot be
    // clipped by the trigger's overflow: hidden ancestor.
    const isInsideOverflowContainer = await tooltip.evaluate(
      (el) => !!el.closest('.tooltip-showcase__overflow-container'),
    )
    expect(isInsideOverflowContainer).toBe(false)

    const tooltipBox = await tooltip.boundingBox()
    expect(tooltipBox?.height).toBeGreaterThan(0)
  })

  test('updates its position when the trigger moves or resizes', async () => {
    const trigger = page.locator('.tooltip-showcase__move-resize-trigger')
    const tooltip = page.locator('#tooltip-move-resize-demo')

    // The trigger is below the fold - the `hide` middleware correctly keeps the
    // tooltip hidden until it's scrolled into view.
    await trigger.scrollIntoViewIfNeeded()

    await expect(tooltip).toBeVisible()
    const initialBox = await tooltip.boundingBox()

    await page.locator('.tooltip-showcase__move-resize-toggle').click()

    await expect(async () => {
      const nextBox = await tooltip.boundingBox()
      expect(nextBox?.x).not.toBe(initialBox?.x)
    }).toPass()
  })

  test('appears once a trigger that was initially hidden becomes visible', async () => {
    const tooltip = page.locator('#tooltip-hidden-demo')

    // The trigger's ancestor is `display: none`, so the tooltip must not be
    // visibly rendered yet even though `show` is permanently true.
    await expect(tooltip).toBeHidden()

    await page.locator('.tooltip-showcase__hidden-toggle').click()

    await expect(tooltip).toBeVisible()
    const tooltipBox = await tooltip.boundingBox()
    const triggerBox = await page.locator('.tooltip-showcase__hidden-trigger').boundingBox()

    expect(tooltipBox?.height).toBeGreaterThan(0)
    // The tooltip should be re-measured against the now-visible trigger,
    // not left pinned to a stale (0, 0) position.
    expect(Math.abs((tooltipBox?.x ?? 0) - (triggerBox?.x ?? 0))).toBeLessThan(200)
  })

  test('staticPositioning tooltips still portal to the body without adaptive placement', async () => {
    const tooltip = page.locator('#tooltip-static-demo')
    await expect(tooltip).toBeVisible()

    const isPortaled = await tooltip.evaluate((el) => el.parentElement === document.body)
    expect(isPortaled).toBe(true)

    // Even though there isn't enough room below the trigger, staticPositioning
    // must keep the requested placement instead of flipping to the top.
    await expect(tooltip).toHaveClass(/tooltip--position-bottom/)
  })
})
