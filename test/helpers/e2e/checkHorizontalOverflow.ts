import type { Page, TestInfo } from '@playwright/test'

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

  // Check if document body has horizontal scrolling
  const overflowInfo = await page.evaluate(() => {
    const body = document.body
    const html = document.documentElement

    // Check if horizontal scrollbar is present
    const hasHorizontalScroll = body.scrollWidth > body.clientWidth

    // Find elements that are wider than the viewport
    const overflowingElements: Array<{
      className: string
      computedWidth: number
      id: string
      offsetWidth: number
      scrollWidth: number
      selector: string
      tagName: string
    }> = []

    // Get all elements
    const allElements = document.querySelectorAll('*')

    allElements.forEach((el) => {
      if (!(el instanceof HTMLElement)) {return}

      const rect = el.getBoundingClientRect()
      const computedStyle = window.getComputedStyle(el)

      // Check if element extends beyond viewport
      // We check both scrollWidth and bounding rect
      const exceedsViewportRight = rect.right > document.documentElement.clientWidth
      const hasScrollWidth = el.scrollWidth > el.offsetWidth

      if (exceedsViewportRight || hasScrollWidth) {
        // Generate a selector for this element
        const generateSelector = (): string => {
          if (el.id) {return `#${el.id}`}

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

    return {
      hasHorizontalScroll,
      bodyScrollWidth: body.scrollWidth,
      bodyClientWidth: body.clientWidth,
      htmlScrollWidth: html.scrollWidth,
      htmlClientWidth: html.clientWidth,
      overflowingElements,
    }
  })

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
