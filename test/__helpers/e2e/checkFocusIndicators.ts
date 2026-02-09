import type { Page, TestInfo } from '@playwright/test'

import AxeBuilder from '@axe-core/playwright'
import { expect } from '@playwright/test'

type AxeResults = Awaited<ReturnType<AxeBuilder['analyze']>>

export interface CheckFocusIndicatorsOptions {
  /** Maximum number of elements that should be focusable (optional) */
  maxFocusableElements?: number
  /** Minimum number of elements that should be focusable (default: 1) */
  minFocusableElements?: number
  /** The page to test */
  page: Page
  /** Whether to run axe accessibility scan on each focused element (default: false) */
  runAxeOnElements?: boolean
  /** CSS selector to scope the focus check to a specific area (e.g., '.sidebar', '#main-content') */
  selector?: string
  /** Playwright test info for attaching results */
  testInfo?: TestInfo
  /** Whether to log focus information to console (default: false) */
  verbose?: boolean
}

export interface FocusIndicatorResult {
  /** Axe scan results per element (if runAxeOnElements was enabled) */
  axeResultsPerElement?: Array<{
    axeViolations: AxeResults['violations']
    elementSelector: string
  }>
  /** Number of elements with visible focus indicators */
  elementsWithIndicators: number
  /** Details of elements without focus indicators */
  elementsWithoutIndicatorDetails: Array<{
    ariaLabel: string
    axeViolations?: AxeResults['violations']
    className: string
    id: string
    selector: string
    tagName: string
    textContent: string
  }>
  /** Number of elements without visible focus indicators */
  elementsWithoutIndicators: number
  /** Total number of axe violations across all elements (if runAxeOnElements was enabled) */
  totalAxeViolations?: number
  /** Total number of focusable elements found */
  totalFocusableElements: number
}

/**
 * Checks that all focusable elements on the page have a visual focus indicator
 * by tabbing through the page and detecting CSS changes on focus.
 *
 * Optionally runs axe accessibility scans on each focused element to catch
 * additional accessibility issues beyond just visual focus indicators.
 *
 * @param options - Configuration options for the check
 * @returns Promise<FocusIndicatorResult> - Details about the check results
 *
 * @example
 * ```typescript
 * // Check entire page for focus indicators
 * const result = await checkFocusIndicators({ page, testInfo })
 * expect(result.elementsWithoutIndicators).toBe(0)
 *
 * // Check only within sidebar
 * const result = await checkFocusIndicators({ page, selector: '.nav', testInfo })
 * expect(result.elementsWithoutIndicators).toBe(0)
 *
 * // Check focus indicators AND run axe scans on each element
 * const result = await checkFocusIndicators({
 *   page,
 *   runAxeOnElements: true,
 *   testInfo
 * })
 * expect(result.elementsWithoutIndicators).toBe(0)
 * expect(result.totalAxeViolations).toBe(0)
 *
 * // Ensure a simple form has between 3 and 10 focusable elements
 * const result = await checkFocusIndicators({
 *   page,
 *   selector: 'form',
 *   minFocusableElements: 3,
 *   maxFocusableElements: 10,
 *   testInfo
 * })
 * ```
 */
export async function checkFocusIndicators(
  options: CheckFocusIndicatorsOptions,
): Promise<FocusIndicatorResult> {
  const {
    page,
    selector,
    testInfo,
    verbose = false,
    minFocusableElements = 1,
    maxFocusableElements,
    runAxeOnElements = false,
  } = options

  const focusedElements: Set<string> = new Set()
  const elementsWithoutIndicator: Array<{
    ariaLabel: string
    axeViolations?: AxeResults['violations']
    className: string
    id: string
    selector: string
    tagName: string
    textContent: string
  }> = []
  const axeResultsPerElement: Array<{
    axeViolations: AxeResults['violations']
    elementSelector: string
  }> = []

  let elementsWithIndicators = 0
  let totalAxeViolations = 0

  // Ensure the page is focused (important for headless mode)
  if (verbose) {
    console.log('Bringing page to front and ensuring focus...')
  }
  await page.bringToFront()
  await page.evaluate(() => {
    window.focus()
    document.body.focus()
  })
  await page.waitForTimeout(200)

  if (verbose) {
    const hasFocus = await page.evaluate(() => document.hasFocus())
    console.log('Page has focus:', hasFocus)
  }

  // If a selector is provided, click on it to establish focus within that scope
  if (selector) {
    try {
      await page
        .locator(selector)
        .first()
        .click({ force: true, position: { x: 1, y: 1 } })
      await page.waitForTimeout(200) // Allow focus to settle after click
    } catch (error) {
      if (verbose) {
        console.warn(`Could not click on selector: ${selector}`, error)
      }
    }
  } else {
    // Focus on the body first to start from a known state
    await page.evaluate(() => {
      document.body.focus()
      document.body.tabIndex = -1 // Temporarily make body focusable
      document.body.focus()
      document.body.removeAttribute('tabIndex')
    })
    await page.waitForTimeout(100)
  }

  // Tab through all elements until we cycle back to the start
  let cycleComplete = false
  let consecutiveBodyFocus = 0
  const maxConsecutiveBodyFocus = 3 // Stop if we focus body 3 times in a row

  while (!cycleComplete) {
    // Press Tab to focus the next element
    await page.keyboard.press('Tab')

    // Wait longer in headless mode for styles to compute
    await page.waitForTimeout(250)

    // Force style recalculation by triggering reflow
    await page.evaluate(() => {
      void document.body.offsetHeight // Force reflow
    })

    await page.waitForTimeout(50)

    // Get information about the currently focused element
    const focusInfo = await page.evaluate(
      (
        scopeSelector: string | undefined,
      ):
        | {
            ariaLabel: string
            className: string
            elementPath: string
            hasVisibleFocusIndicator: boolean
            id: string
            selector: string
            styles: {
              backgroundColor: string
              border: string
              borderColor: string
              borderWidth: string
              boxShadow: string
              filter: string
              opacity: string
              outline: string
              outlineColor: string
              outlineOffset: string
              outlineStyle: string
              outlineWidth: string
            }
            tagName: string
            textContent: string
          }
        | { outsideScope: true }
        | null => {
        const el = document.activeElement
        if (!el || el === document.body) {
          return null
        }

        // Skip Next.js portal elements (dev mode only)
        if (el.closest('nextjs-portal')) {
          return null
        }

        // If we have a scope selector, check if the focused element is within scope
        if (scopeSelector) {
          const scopeElement = document.querySelector(scopeSelector)
          if (scopeElement && !scopeElement.contains(el)) {
            // Element is outside our scope, return special marker
            return { outsideScope: true } as const
          }
        }

        // Generate a unique identifier for this element
        const xpath = (element: Element): string => {
          if (element.id) {
            return `id("${element.id}")`
          }
          if (element === document.body) {
            return 'body'
          }

          let ix = 0
          const siblings = element.parentNode?.children
          if (siblings) {
            for (let i = 0; i < siblings.length; i++) {
              const sibling = siblings[i]

              if (!sibling) {
                continue
              }

              if (sibling === element) {
                const parentPath = element.parentNode ? xpath(element.parentNode as Element) : ''
                return `${parentPath}/${element.tagName.toLowerCase()}[${ix + 1}]`
              }
              if (sibling.tagName === element.tagName) {
                ix++
              }
            }
          }
          return ''
        }

        const elementPath = xpath(el)

        // Generate a useful CSS selector for this element
        const generateSelector = (): string => {
          // If element has an ID, that's the most specific
          if (el.id) {
            return `#${el.id}`
          }

          // Build selector with tag and classes
          let selector = el.tagName.toLowerCase()

          // Add classes if present
          if (el.className && typeof el.className === 'string') {
            const classes = el.className.trim().split(/\s+/).filter(Boolean)
            if (classes.length > 0) {
              // Use first 2-3 classes to keep selector manageable
              selector += '.' + classes.slice(0, 3).join('.')
            }
          }

          // Add nth-child if we can determine it
          if (el.parentElement) {
            const siblings = Array.from(el.parentElement.children).filter(
              (child) => child.tagName === el.tagName,
            )
            if (siblings.length > 1) {
              const index = siblings.indexOf(el) + 1
              selector += `:nth-of-type(${index})`
            }
          }

          return selector
        }

        const cssSelector = generateSelector()

        // Force style recalculation and get computed styles
        // This is important in headless mode where styles may not update properly
        if (el instanceof HTMLElement) {
          void el.offsetHeight // Force reflow
        }

        // Check main element styles
        const computedStyle = window.getComputedStyle(el)
        const outline = computedStyle.outline
        const outlineWidth = computedStyle.outlineWidth
        const outlineStyle = computedStyle.outlineStyle
        const outlineColor = computedStyle.outlineColor
        const outlineOffset = computedStyle.outlineOffset
        const boxShadow = computedStyle.boxShadow
        const filter = computedStyle.filter
        const border = computedStyle.border
        const borderWidth = computedStyle.borderWidth
        const borderColor = computedStyle.borderColor
        const backgroundColor = computedStyle.backgroundColor
        const opacity = computedStyle.opacity

        // Also check pseudo-elements (::before and ::after) for focus indicators
        const beforeStyle = window.getComputedStyle(el, '::before')
        const afterStyle = window.getComputedStyle(el, '::after')

        const beforeOutlineWidth = beforeStyle.outlineWidth
        const beforeOutlineStyle = beforeStyle.outlineStyle
        const beforeOutlineColor = beforeStyle.outlineColor
        const beforeBoxShadow = beforeStyle.boxShadow
        const beforeFilter = beforeStyle.filter
        const beforeBorder = beforeStyle.border
        const beforeBorderWidth = beforeStyle.borderWidth
        const beforeBorderColor = beforeStyle.borderColor

        const afterOutlineWidth = afterStyle.outlineWidth
        const afterOutlineStyle = afterStyle.outlineStyle
        const afterOutlineColor = afterStyle.outlineColor
        const afterBoxShadow = afterStyle.boxShadow
        const afterFilter = afterStyle.filter
        const afterBorder = afterStyle.border
        const afterBorderWidth = afterStyle.borderWidth
        const afterBorderColor = afterStyle.borderColor

        // Helper to check if a style has a visible outline
        const hasVisibleOutline = (style: string, width: string, color: string) =>
          Boolean(
            style &&
            style !== 'none' &&
            width &&
            width !== '0px' &&
            color &&
            color !== 'transparent' &&
            color !== 'rgba(0, 0, 0, 0)' &&
            !color.includes('rgba(0, 0, 0, 0)'),
          )

        // Helper to check if a style has a visible box-shadow
        // Note: We don't check opacity here because opacity:0 elements with box-shadow
        // are a valid pattern (e.g., hidden checkboxes with visual siblings)
        const hasVisibleBoxShadow = (shadow: string) => {
          if (!shadow || shadow === 'none' || shadow === 'transparent') {
            return false
          }
          // Check for any rgba color with 0 alpha (e.g., rgba(0, 0, 0, 0) or rgba(255, 0, 0, 0))
          // This regex matches rgba(..., 0) patterns
          const hasZeroAlpha = /rgba\([^)]*,\s*0\)/.test(shadow)
          return !hasZeroAlpha
        }

        // Helper to check if filter has a visible drop-shadow
        const hasVisibleDropShadow = (filterValue: string) => {
          if (!filterValue || filterValue === 'none') {
            return false
          }
          // Check for drop-shadow function in filter
          if (filterValue.includes('drop-shadow(')) {
            // Check for transparent or zero-alpha colors in drop-shadow
            const hasZeroAlpha = /rgba\([^)]*,\s*0\)/.test(filterValue)
            const isTransparent = filterValue.includes('transparent')
            return !hasZeroAlpha && !isTransparent
          }
          return false
        }

        // Helper to check if a style has a visible border
        const hasVisibleBorderCheck = (bdr: string, width: string, color: string) =>
          Boolean(
            bdr &&
            bdr !== 'none' &&
            width &&
            width !== '0px' &&
            color &&
            color !== 'transparent' &&
            color !== 'rgba(0, 0, 0, 0)' &&
            !color.includes('rgba(0, 0, 0, 0)'),
          )

        // Check if element has a visible focus indicator on the element itself
        const hasOutline = hasVisibleOutline(outlineStyle, outlineWidth, outlineColor)
        const hasBoxShadow = hasVisibleBoxShadow(boxShadow)
        const hasDropShadow = hasVisibleDropShadow(filter)
        const hasVisibleBorder = hasVisibleBorderCheck(border, borderWidth, borderColor)

        // Check pseudo-elements for focus indicators
        const hasBeforeOutline = hasVisibleOutline(
          beforeOutlineStyle,
          beforeOutlineWidth,
          beforeOutlineColor,
        )
        const hasBeforeBoxShadow = hasVisibleBoxShadow(beforeBoxShadow)
        const hasBeforeDropShadow = hasVisibleDropShadow(beforeFilter)
        const hasBeforeBorder = hasVisibleBorderCheck(
          beforeBorder,
          beforeBorderWidth,
          beforeBorderColor,
        )

        const hasAfterOutline = hasVisibleOutline(
          afterOutlineStyle,
          afterOutlineWidth,
          afterOutlineColor,
        )
        const hasAfterBoxShadow = hasVisibleBoxShadow(afterBoxShadow)
        const hasAfterDropShadow = hasVisibleDropShadow(afterFilter)
        const hasAfterBorder = hasVisibleBorderCheck(
          afterBorder,
          afterBorderWidth,
          afterBorderColor,
        )

        // Note: We don't check background color change because we can't compare
        // the before/after state. Background color alone is not a reliable indicator.

        // For elements with opacity: 0 (common for hidden checkboxes/radios),
        // check parent and siblings for focus indicators
        let hasParentOrSiblingWithIndicator = false
        if (opacity === '0') {
          // Check parent element (common pattern: parent gets box-shadow when child input is focused)
          if (el.parentElement) {
            const parentStyle = window.getComputedStyle(el.parentElement)
            const parentBoxShadow = parentStyle.boxShadow
            const parentFilter = parentStyle.filter
            const parentOutlineStyle = parentStyle.outlineStyle
            const parentOutlineWidth = parentStyle.outlineWidth
            const parentOutlineColor = parentStyle.outlineColor
            const parentBorder = parentStyle.border
            const parentBorderWidth = parentStyle.borderWidth
            const parentBorderColor = parentStyle.borderColor

            if (
              hasVisibleBoxShadow(parentBoxShadow) ||
              hasVisibleDropShadow(parentFilter) ||
              hasVisibleOutline(parentOutlineStyle, parentOutlineWidth, parentOutlineColor) ||
              hasVisibleBorderCheck(parentBorder, parentBorderWidth, parentBorderColor)
            ) {
              hasParentOrSiblingWithIndicator = true
            }
          }

          // Also check siblings if parent didn't have indicator
          if (!hasParentOrSiblingWithIndicator && el.parentElement) {
            const siblings = Array.from(el.parentElement.children).slice(0, 10)
            for (const sibling of siblings) {
              if (sibling === el || !(sibling instanceof HTMLElement)) {
                continue
              }

              const siblingStyle = window.getComputedStyle(sibling)
              const siblingBoxShadow = siblingStyle.boxShadow
              const siblingFilter = siblingStyle.filter
              const siblingOutlineStyle = siblingStyle.outlineStyle
              const siblingOutlineWidth = siblingStyle.outlineWidth
              const siblingOutlineColor = siblingStyle.outlineColor
              const siblingBorder = siblingStyle.border
              const siblingBorderWidth = siblingStyle.borderWidth
              const siblingBorderColor = siblingStyle.borderColor

              if (
                hasVisibleBoxShadow(siblingBoxShadow) ||
                hasVisibleDropShadow(siblingFilter) ||
                hasVisibleOutline(siblingOutlineStyle, siblingOutlineWidth, siblingOutlineColor) ||
                hasVisibleBorderCheck(siblingBorder, siblingBorderWidth, siblingBorderColor)
              ) {
                hasParentOrSiblingWithIndicator = true
                break
              }
            }
          }
        }

        // Combine all checks: element itself + pseudo-elements + parent/siblings (for hidden inputs)
        const hasAnyFocusIndicator =
          hasOutline ||
          hasBoxShadow ||
          hasDropShadow ||
          hasVisibleBorder ||
          hasBeforeOutline ||
          hasBeforeBoxShadow ||
          hasBeforeDropShadow ||
          hasBeforeBorder ||
          hasAfterOutline ||
          hasAfterBoxShadow ||
          hasAfterDropShadow ||
          hasAfterBorder ||
          hasParentOrSiblingWithIndicator

        return {
          tagName: el.tagName.toLowerCase(),
          id: el.id,
          className: el.className,
          selector: cssSelector,
          ariaLabel: el.getAttribute('aria-label') || '',
          textContent: (el.textContent || '').trim().substring(0, 100), // Limit to 100 chars
          elementPath,
          hasVisibleFocusIndicator: hasAnyFocusIndicator,
          styles: {
            outline,
            outlineWidth,
            outlineStyle,
            outlineColor,
            outlineOffset,
            boxShadow,
            filter,
            border,
            borderWidth,
            borderColor,
            backgroundColor,
            opacity,
          },
        }
      },
      selector,
    )

    // If we're back to body or null, increment counter
    if (!focusInfo) {
      consecutiveBodyFocus++
      if (verbose) {
        console.log(
          `Focus returned to body/null (${consecutiveBodyFocus}/${maxConsecutiveBodyFocus})`,
        )
      }
      if (consecutiveBodyFocus >= maxConsecutiveBodyFocus) {
        if (verbose) {
          console.log('Completed tab cycle or reached end of focusable elements')
        }
        cycleComplete = true
      }
      continue
    }

    // Check if element is outside scope (only relevant when selector is provided)
    if ('outsideScope' in focusInfo) {
      if (verbose) {
        console.log('Focused element is outside scope, tab cycle complete')
      }
      cycleComplete = true
      continue
    }

    // Reset body focus counter since we found a focusable element
    consecutiveBodyFocus = 0

    // At this point, TypeScript knows focusInfo has the full element info
    // Skip if we've seen this element before (we've cycled through)
    if (focusedElements.has(focusInfo.elementPath)) {
      if (verbose) {
        console.log('Encountered previously focused element, tab cycle complete')
      }
      cycleComplete = true
      continue
    }

    focusedElements.add(focusInfo.elementPath)

    if (verbose) {
      const indicatorStatus = focusInfo.hasVisibleFocusIndicator ? '✓ PASS' : '✗ FAIL'
      console.log(`\nFocused element ${focusedElements.size}: ${indicatorStatus}`)
      console.log(`  Selector: ${focusInfo.selector}`)
      console.log(`  Tag: ${focusInfo.tagName}`)
      if (focusInfo.id) {
        console.log(`  ID: ${focusInfo.id}`)
      }
      if (focusInfo.className) {
        console.log(`  Class: ${focusInfo.className}`)
      }
      if (focusInfo.textContent) {
        console.log(`  Text: ${focusInfo.textContent}`)
      }
      console.log(`  Has focus indicator: ${focusInfo.hasVisibleFocusIndicator}`)
      if (!focusInfo.hasVisibleFocusIndicator) {
        console.log('  Styles:', {
          outline: focusInfo.styles.outline,
          outlineWidth: focusInfo.styles.outlineWidth,
          outlineColor: focusInfo.styles.outlineColor,
          boxShadow: focusInfo.styles.boxShadow,
          border: focusInfo.styles.border,
          borderWidth: focusInfo.styles.borderWidth,
          borderColor: focusInfo.styles.borderColor,
          opacity: focusInfo.styles.opacity,
        })
      }
    }

    // Run axe scan on this specific element if requested
    let elementAxeViolations: AxeResults['violations'] | undefined
    if (runAxeOnElements) {
      try {
        const axeResults = await new AxeBuilder({ page }).include(focusInfo.selector).analyze()

        elementAxeViolations = axeResults.violations

        if (elementAxeViolations.length > 0) {
          axeResultsPerElement.push({
            elementSelector: focusInfo.selector,
            axeViolations: elementAxeViolations,
          })

          totalAxeViolations += elementAxeViolations.length

          if (verbose) {
            console.log(`  ⚠️  Found ${elementAxeViolations.length} axe violations:`)
            elementAxeViolations.forEach((violation) => {
              console.log(`    - ${violation.id}: ${violation.help}`)
              console.log(`      Impact: ${violation.impact}`)
              console.log(`      Help URL: ${violation.helpUrl}`)
              violation.nodes.forEach((node, idx) => {
                console.log(`      Node ${idx + 1}/${violation.nodes.length}:`)
                console.log(`        Target: ${node.target.join(' ')}`)
                console.log(`        HTML: ${node.html.substring(0, 80)}...`)
                if (node.failureSummary) {
                  console.log(`        Failure: ${node.failureSummary}`)
                }
              })
            })
          }
        } else if (verbose) {
          console.log('  ✓ No axe violations')
        }
      } catch (error) {
        if (verbose) {
          console.warn(`Could not run axe scan on ${focusInfo.selector}:`, error)
        }
      }
    }

    // Track elements with and without focus indicators
    if (focusInfo.hasVisibleFocusIndicator) {
      elementsWithIndicators++
    } else {
      elementsWithoutIndicator.push({
        tagName: focusInfo.tagName,
        id: focusInfo.id,
        className: focusInfo.className,
        selector: focusInfo.selector,
        ariaLabel: focusInfo.ariaLabel,
        textContent: focusInfo.textContent,
        ...(elementAxeViolations &&
          elementAxeViolations.length > 0 && { axeViolations: elementAxeViolations }),
      })
    }
  }

  const result: FocusIndicatorResult = {
    totalFocusableElements: focusedElements.size,
    elementsWithIndicators,
    elementsWithoutIndicators: elementsWithoutIndicator.length,
    elementsWithoutIndicatorDetails: elementsWithoutIndicator,
    ...(runAxeOnElements && {
      axeResultsPerElement,
      totalAxeViolations,
    }),
  }

  if (verbose) {
    console.log('\nFocus Indicator Check Results:', result)
  }

  // Attach results to test info if provided
  if (testInfo) {
    await testInfo.attach('focus-indicator-results', {
      body: JSON.stringify(result, null, 2),
      contentType: 'application/json',
    })

    if (result.elementsWithoutIndicators > 0) {
      await testInfo.attach('focus-indicator-results--violations', {
        body: JSON.stringify(result.elementsWithoutIndicatorDetails, null, 2),
        contentType: 'application/json',
      })
    }

    if (runAxeOnElements && axeResultsPerElement.length > 0) {
      await testInfo.attach('focus-indicator-axe-violations', {
        body: JSON.stringify(axeResultsPerElement, null, 2),
        contentType: 'application/json',
      })
    }
  }

  // Assert that we found at least the minimum number of focusable elements
  await expect(() => {
    expect(result.totalFocusableElements).toBeGreaterThanOrEqual(minFocusableElements)
  }).toPass()

  // Assert that we didn't exceed the maximum if specified
  if (maxFocusableElements !== undefined) {
    await expect(() => {
      expect(result.totalFocusableElements).toBeLessThanOrEqual(maxFocusableElements)
    }).toPass()
  }

  return result
}

/**
 * Simple assertion helper to verify all focusable elements have focus indicators
 *
 * @param options - Configuration options for the check
 * @throws {Error} - If any focusable elements are missing focus indicators
 *
 * @example
 * ```typescript
 * test('should have focus indicators', async ({ page }) => {
 *   await page.goto(url.create)
 *   await assertAllElementsHaveFocusIndicators({ page })
 * })
 * ```
 */
export async function assertAllElementsHaveFocusIndicators(
  options: CheckFocusIndicatorsOptions,
): Promise<void> {
  await expect(async () => {
    const result = await checkFocusIndicators(options)

    if (result.elementsWithoutIndicators > 0) {
      console.error('Elements without focus indicators:', result.elementsWithoutIndicatorDetails)
    }

    expect(result.totalFocusableElements).toBeGreaterThan(0)
    expect(result.elementsWithoutIndicators).toBe(0)
  }).toPass()
}
