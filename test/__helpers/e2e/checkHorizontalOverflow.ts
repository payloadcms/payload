import type { Page, TestInfo } from '@playwright/test'

import { expect } from '@playwright/test'

export interface HorizontalOverflowResult {
  /** Whether horizontal overflow/scrolling was detected */
  hasHorizontalOverflow: boolean
  /** Details about elements causing overflow */
  overflowingElements: Array<{
    className: string
    computedWidth: number
    id: string
    offsetWidth: number
    scrollWidth: number
    selector: string
    tagName: string
  }>
  /** The viewport width used for testing */
  viewportWidth: number
}

/**
 * Checks if the page has horizontal overflow/scrolling at the current viewport size.
 * This is important for WCAG 2.1 AA 1.4.10 (Reflow) compliance - content should
 * reflow without horizontal scrolling at 320px width.
 *
 * @param page - Playwright page object
 * @param testInfo - Optional TestInfo for attaching results
 * @returns Promise<HorizontalOverflowResult>
 *
 * @example
 * ```typescript
 * // Test at 320px (WCAG requirement)
 * await page.setViewportSize({ width: 320, height: 568 })
 * const result = await checkHorizontalOverflow(page, testInfo)
 * expect(result.hasHorizontalOverflow).toBe(false)
 * ```
 */
export async function checkHorizontalOverflow(
  page: Page,
  testInfo?: TestInfo,
): Promise<HorizontalOverflowResult> {
  const viewportSize = page.viewportSize()
  const viewportWidth = viewportSize?.width || 0

  // Check if page has horizontal overflow by actually trying to scroll using mouse wheel
  // Save original scroll position
  const originalScrollX = await page.evaluate(() => window.scrollX)

  // Try to scroll horizontally using mouse wheel (deltaX = 1000px to the right)
  await page.mouse.wheel(1000, 0)

  // Wait a bit for scroll to complete
  await page.waitForTimeout(100)

  // Check if we actually scrolled
  const newScrollX = await page.evaluate(() => window.scrollX)
  const hasHorizontalScroll = newScrollX > originalScrollX

  // Restore original scroll position
  if (hasHorizontalScroll) {
    await page.evaluate((x) => window.scrollTo(x, window.scrollY), originalScrollX)
  }

  // If we can scroll horizontally, find elements causing the overflow
  const overflowInfo = await page.evaluate((canScroll: boolean) => {
    const body = document.body
    const html = document.documentElement

    const overflowingElements: Array<{
      className: string
      computedWidth: number
      id: string
      offsetWidth: number
      scrollWidth: number
      selector: string
      tagName: string
    }> = []

    if (canScroll) {
      // Get all elements
      const allElements = document.querySelectorAll('*')

      allElements.forEach((el) => {
        if (!(el instanceof HTMLElement)) {
          return
        }

        const computedStyle = window.getComputedStyle(el)

        // Only report elements that have content overflow
        // (scrollWidth > offsetWidth means content is wider than the element's box)
        const hasContentOverflow = el.scrollWidth > el.offsetWidth

        if (hasContentOverflow) {
          // Generate a selector for this element
          const generateSelector = (): string => {
            if (el.id) {
              return `#${el.id}`
            }

            let selector = el.tagName.toLowerCase()

            if (el.className && typeof el.className === 'string') {
              const classes = el.className.trim().split(/\s+/).filter(Boolean)
              if (classes.length > 0) {
                selector += '.' + classes.slice(0, 2).join('.')
              }
            }

            return selector
          }

          overflowingElements.push({
            tagName: el.tagName.toLowerCase(),
            id: el.id,
            className: typeof el.className === 'string' ? el.className : '',
            selector: generateSelector(),
            offsetWidth: el.offsetWidth,
            scrollWidth: el.scrollWidth,
            computedWidth: parseFloat(computedStyle.width),
          })
        }
      })
    }

    return {
      hasHorizontalScroll: canScroll,
      bodyScrollWidth: body.scrollWidth,
      bodyClientWidth: body.clientWidth,
      htmlScrollWidth: html.scrollWidth,
      htmlClientWidth: html.clientWidth,
      overflowingElements,
    }
  }, hasHorizontalScroll)

  const result: HorizontalOverflowResult = {
    hasHorizontalOverflow:
      overflowInfo.hasHorizontalScroll || overflowInfo.overflowingElements.length > 0,
    overflowingElements: overflowInfo.overflowingElements,
    viewportWidth,
  }

  // Attach results to test info if provided
  if (testInfo) {
    await testInfo.attach('horizontal-overflow-results', {
      body: JSON.stringify(result, null, 2),
      contentType: 'application/json',
    })

    if (result.hasHorizontalOverflow) {
      await testInfo.attach('horizontal-overflow-violations', {
        body: JSON.stringify(
          {
            viewportWidth,
            bodyScrollWidth: overflowInfo.bodyScrollWidth,
            bodyClientWidth: overflowInfo.bodyClientWidth,
            overflowingElements: result.overflowingElements,
          },
          null,
          2,
        ),
        contentType: 'application/json',
      })
    }
  }

  return result
}

/**
 * Assertion helper to verify no horizontal overflow with built-in polling.
 * Retries the check until the result stabilizes and meets expectations.
 *
 * @param page - Playwright page object
 * @param testInfo - Optional TestInfo for attaching results
 *
 * @example
 * ```typescript
 * await page.setViewportSize({ width: 320, height: 568 })
 * await assertNoHorizontalOverflow(page, testInfo)
 * ```
 */
export async function assertNoHorizontalOverflow(page: Page, testInfo?: TestInfo): Promise<void> {
  await expect(async () => {
    const result = await checkHorizontalOverflow(page, testInfo)
    expect(result.hasHorizontalOverflow).toBe(false)
    expect(result.overflowingElements.length).toBe(0)
  }).toPass()
}
