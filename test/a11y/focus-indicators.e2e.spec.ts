import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { formatAdminURL } from 'payload/shared'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, getRoutes, initPageConsoleErrorCatch } from '../helpers.js'
import { checkFocusIndicators } from '../helpers/e2e/checkFocusIndicators.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'

/**
 * This test suite validates the checkFocusIndicators utility against
 * a custom test page with known good and bad focus indicator patterns.
 */

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, describe } = test

let page: Page
let serverURL: string
let adminRoute: string

describe('Focus Indicators Test Page', () => {
  beforeAll(async ({ browser }, testInfo) => {
    const { serverURL: url } = await initPayloadE2ENoConfig({ dirname })
    serverURL = url

    const {
      routes: { admin: adminRouteFromConfig },
    } = getRoutes({})
    adminRoute = adminRouteFromConfig

    const context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  describe('Full Page Scan', () => {
    test('should detect all focusable elements on the page', async ({}, testInfo) => {
      await page.goto(formatAdminURL({ adminRoute, path: '/focus-indicators', serverURL }))
      await page.locator('.focus-indicators-test-page').waitFor()

      const result = await checkFocusIndicators({
        page,
        testInfo,
        verbose: false,
      })

      // We expect many focusable elements across all sections
      expect(result.totalFocusableElements).toBeGreaterThan(20)

      // We have intentionally bad elements, so we expect violations
      expect(result.elementsWithoutIndicators).toBeGreaterThan(0)

      // But we should also have many elements with good indicators
      expect(result.elementsWithIndicators).toBeGreaterThan(10)
    })
  })

  describe('Section 1: Good Payload Components', () => {
    test('should pass for all Payload buttons', async ({}, testInfo) => {
      await page.goto(formatAdminURL({ adminRoute, path: '/focus-indicators', serverURL }))
      await page.locator('[data-testid="section-good-payload"]').waitFor()

      const result = await checkFocusIndicators({
        page,
        testInfo,
        selector: '[data-testid="section-good-payload"]',
        verbose: false,
      })

      // Payload buttons should all have focus indicators
      expect(result.totalFocusableElements).toBeGreaterThanOrEqual(3)
      expect(result.elementsWithoutIndicators).toBe(0)
      expect(result.elementsWithIndicators).toBe(result.totalFocusableElements)
    })
  })

  describe('Section 2: Good HTML Elements', () => {
    test('should pass for standard HTML with good focus styles', async ({}, testInfo) => {
      await page.goto(formatAdminURL({ adminRoute, path: '/focus-indicators', serverURL }))
      await page.locator('[data-testid="section-good-html"]').waitFor()

      const result = await checkFocusIndicators({
        page,
        testInfo,
        selector: '[data-testid="section-good-html"]',
        verbose: false,
      })

      // Should have 5 elements: 3 buttons + 2 links
      expect(result.totalFocusableElements).toBeGreaterThanOrEqual(5)
      expect(result.elementsWithoutIndicators).toBe(0)

      // All elements should pass
      expect(result.elementsWithIndicators).toBe(result.totalFocusableElements)
    })

    test('should detect specific good buttons by ID', async ({}, testInfo) => {
      await page.goto(formatAdminURL({ adminRoute, path: '/focus-indicators', serverURL }))

      const result = await checkFocusIndicators({
        page,
        testInfo,
        selector: '[data-testid="section-good-html"]',
        verbose: false,
      })

      // Verify that none of our good buttons are in the violations list
      const violationIds = result.elementsWithoutIndicatorDetails.map((el) => el.id)

      expect(violationIds).not.toContain('good-button-1')
      expect(violationIds).not.toContain('good-button-2')
      expect(violationIds).not.toContain('good-button-3')
      expect(violationIds).not.toContain('good-link-1')
      expect(violationIds).not.toContain('good-link-2')
    })
  })

  describe('Section 3: Pseudo-element Focus Indicators', () => {
    test('should detect focus indicators on ::after and ::before pseudo-elements', async ({}, testInfo) => {
      await page.goto(formatAdminURL({ adminRoute, path: '/focus-indicators', serverURL }))
      await page.locator('[data-testid="section-pseudo"]').waitFor()

      const result = await checkFocusIndicators({
        page,
        testInfo,
        selector: '[data-testid="section-pseudo"]',
        verbose: false,
      })

      // Should have 3 buttons with pseudo-element focus indicators
      expect(result.totalFocusableElements).toBe(3)

      // All should pass (this validates our pseudo-element detection)
      expect(result.elementsWithoutIndicators).toBe(0)
      expect(result.elementsWithIndicators).toBe(3)

      // Verify none are flagged as violations
      const violationIds = result.elementsWithoutIndicatorDetails.map((el) => el.id)
      expect(violationIds).not.toContain('pseudo-after-outline')
      expect(violationIds).not.toContain('pseudo-before-border')
      expect(violationIds).not.toContain('pseudo-after-shadow')
    })
  })

  describe('Section 4: Bad Focus Indicators (Expected Failures)', () => {
    test('should fail for elements without focus indicators', async ({}, testInfo) => {
      await page.goto(formatAdminURL({ adminRoute, path: '/focus-indicators', serverURL }))
      await page.locator('[data-testid="section-bad"]').waitFor()

      const result = await checkFocusIndicators({
        page,
        testInfo,
        selector: '[data-testid="section-bad"]',
        verbose: false,
      })

      // Should find 6 focusable elements: 3 buttons + 2 links + 1 input
      expect(result.totalFocusableElements).toBe(6)

      // ALL should fail (no focus indicators)
      expect(result.elementsWithoutIndicators).toBe(6)
      expect(result.elementsWithIndicators).toBe(0)
    })

    test('should identify specific bad elements by ID', async ({}, testInfo) => {
      await page.goto(formatAdminURL({ adminRoute, path: '/focus-indicators', serverURL }))

      const result = await checkFocusIndicators({
        page,
        testInfo,
        selector: '[data-testid="section-bad"]',
        verbose: false,
      })

      const violationIds = result.elementsWithoutIndicatorDetails.map((el) => el.id)

      // All bad elements should be in violations
      expect(violationIds).toContain('bad-button-1')
      expect(violationIds).toContain('bad-button-2')
      expect(violationIds).toContain('bad-button-3')
      expect(violationIds).toContain('bad-link-1')
      expect(violationIds).toContain('bad-link-2')
      expect(violationIds).toContain('bad-input-1')
    })

    test('should provide useful selectors for violations', async ({}, testInfo) => {
      await page.goto(formatAdminURL({ adminRoute, path: '/focus-indicators', serverURL }))

      const result = await checkFocusIndicators({
        page,
        testInfo,
        selector: '[data-testid="section-bad"]',
        verbose: false,
      })

      // Check that selectors are provided for violations
      result.elementsWithoutIndicatorDetails.forEach((violation) => {
        expect(violation.selector).toBeTruthy()
        expect(typeof violation.selector).toBe('string')

        // Verify the selector can actually find the element
        if (violation.id) {
          expect(violation.selector).toContain(violation.id)
        }
      })
    })
  })

  describe('Section 5: Mixed Focus Indicators', () => {
    test('should correctly identify mix of good and bad elements', async ({}, testInfo) => {
      await page.goto(formatAdminURL({ adminRoute, path: '/focus-indicators', serverURL }))
      await page.locator('[data-testid="section-mixed"]').waitFor()

      const result = await checkFocusIndicators({
        page,
        testInfo,
        selector: '[data-testid="section-mixed"]',
        verbose: false,
      })

      // Should find 4 elements: 2 inputs + 2 selects
      expect(result.totalFocusableElements).toBe(4)

      // Should have 2 good and 2 bad
      expect(result.elementsWithIndicators).toBe(2)
      expect(result.elementsWithoutIndicators).toBe(2)
    })

    test('should correctly categorize good vs bad in mixed section', async ({}, testInfo) => {
      await page.goto(formatAdminURL({ adminRoute, path: '/focus-indicators', serverURL }))

      const result = await checkFocusIndicators({
        page,
        testInfo,
        selector: '[data-testid="section-mixed"]',
        verbose: false,
      })

      const violationIds = result.elementsWithoutIndicatorDetails.map((el) => el.id)

      // Good elements should NOT be in violations
      expect(violationIds).not.toContain('good-input-1')
      expect(violationIds).not.toContain('good-select-1')

      // Bad elements SHOULD be in violations
      expect(violationIds).toContain('bad-input-2')
      expect(violationIds).toContain('bad-select-1')
    })
  })

  describe('Section 6: Edge Cases', () => {
    test('should fail for edge cases with non-visible focus indicators', async ({}, testInfo) => {
      await page.goto(formatAdminURL({ adminRoute, path: '/focus-indicators', serverURL }))
      await page.locator('[data-testid="section-edge-cases"]').waitFor()

      const result = await checkFocusIndicators({
        page,
        testInfo,
        selector: '[data-testid="section-edge-cases"]',
        verbose: false,
      })

      // Should find 4 elements: 3 buttons + 1 focusable div
      expect(result.totalFocusableElements).toBe(4)

      // 3 edge case buttons should fail, 1 focusable div should pass
      expect(result.elementsWithoutIndicators).toBe(3)
      expect(result.elementsWithIndicators).toBe(1)
    })

    test('should detect zero-width borders as invalid', async ({}, testInfo) => {
      await page.goto(formatAdminURL({ adminRoute, path: '/focus-indicators', serverURL }))

      const result = await checkFocusIndicators({
        page,
        testInfo,
        selector: '[data-testid="section-edge-cases"]',
        verbose: false,
      })

      const violationIds = result.elementsWithoutIndicatorDetails.map((el) => el.id)
      expect(violationIds).toContain('zero-width-border')
    })

    test('should detect zero-opacity shadows as invalid', async ({}, testInfo) => {
      await page.goto(formatAdminURL({ adminRoute, path: '/focus-indicators', serverURL }))

      const result = await checkFocusIndicators({
        page,
        testInfo,
        selector: '[data-testid="section-edge-cases"]',
        verbose: false,
      })

      const violationIds = result.elementsWithoutIndicatorDetails.map((el) => el.id)
      expect(violationIds).toContain('zero-opacity-shadow')
    })

    test('should detect transparent outlines as invalid', async ({}, testInfo) => {
      await page.goto(formatAdminURL({ adminRoute, path: '/focus-indicators', serverURL }))

      const result = await checkFocusIndicators({
        page,
        testInfo,
        selector: '[data-testid="section-edge-cases"]',
        verbose: false,
      })

      const violationIds = result.elementsWithoutIndicatorDetails.map((el) => el.id)
      expect(violationIds).toContain('transparent-outline')
    })

    test('should pass for focusable div with good focus indicator', async ({}, testInfo) => {
      await page.goto(formatAdminURL({ adminRoute, path: '/focus-indicators', serverURL }))

      const result = await checkFocusIndicators({
        page,
        testInfo,
        selector: '[data-testid="section-edge-cases"]',
        verbose: false,
      })

      const violationIds = result.elementsWithoutIndicatorDetails.map((el) => el.id)
      expect(violationIds).not.toContain('focusable-div')
    })
  })

  describe('Section 7: Disabled Elements', () => {
    test('should not include disabled elements in tab order', async ({}, testInfo) => {
      await page.goto(formatAdminURL({ adminRoute, path: '/focus-indicators', serverURL }))
      await page.locator('[data-testid="section-disabled"]').waitFor()

      const result = await checkFocusIndicators({
        page,
        testInfo,
        selector: '[data-testid="section-disabled"]',
        verbose: false,
        minFocusableElements: 0,
        maxFocusableElements: 0,
      })

      // Disabled elements should not be in the focusable elements count
      expect(result.totalFocusableElements).toBe(0)
      expect(result.elementsWithIndicators).toBe(0)
      expect(result.elementsWithoutIndicators).toBe(0)
    })
  })

  describe('Utility Validation', () => {
    test('should limit focusable elements count with maxFocusableElements', async ({}, testInfo) => {
      await page.goto(formatAdminURL({ adminRoute, path: '/focus-indicators', serverURL }))

      const result = await checkFocusIndicators({
        page,
        testInfo,
        selector: '[data-testid="section-good-html"]',
        maxFocusableElements: 10,
        verbose: false,
      })

      // Should not exceed max
      expect(result.totalFocusableElements).toBeLessThanOrEqual(10)
    })

    test('should run axe scans on each focused element when runAxeOnElements is true', async ({}, testInfo) => {
      await page.goto(formatAdminURL({ adminRoute, path: '/focus-indicators', serverURL }))

      const result = await checkFocusIndicators({
        page,
        testInfo,
        selector: '[data-testid="section-good-html"]',
        runAxeOnElements: true,
        verbose: false,
      })

      // Should have axe results defined (only elements with violations are stored)
      expect(result.totalAxeViolations).toBeDefined()

      // If there are violations, verify the structure
      if (result.axeResultsPerElement && result.axeResultsPerElement.length > 0) {
        expect(result.axeResultsPerElement.length).toBeGreaterThan(0)
      }

      // Each axe result should have the expected structure (only violations are stored)
      if (result.axeResultsPerElement) {
        result.axeResultsPerElement.forEach((axeResult) => {
          expect(axeResult.elementSelector).toBeTruthy()
          expect(axeResult.axeViolations).toBeDefined()
          expect(Array.isArray(axeResult.axeViolations)).toBe(true)
          expect(axeResult.axeViolations.length).toBeGreaterThan(0) // Should only have violations
        })
      }
    })

    test('should detect axe violations on specific elements', async ({}, testInfo) => {
      await page.goto(formatAdminURL({ adminRoute, path: '/focus-indicators', serverURL }))

      const result = await checkFocusIndicators({
        page,
        testInfo,
        selector: '[data-testid="section-bad"]',
        runAxeOnElements: true,
        verbose: false,
      })

      // Bad section might have axe violations beyond just focus indicators
      expect(result.axeResultsPerElement).toBeDefined()
      expect(result.totalAxeViolations).toBeDefined()

      // Check that violations are properly recorded per element
      if (result.totalAxeViolations && result.totalAxeViolations > 0) {
        const elementsWithViolations = result.axeResultsPerElement?.filter(
          (r) => r.axeViolations.length > 0,
        )
        expect(elementsWithViolations?.length).toBeGreaterThan(0)
      }
    })

    test('should provide detailed violation information', async ({}, testInfo) => {
      await page.goto(formatAdminURL({ adminRoute, path: '/focus-indicators', serverURL }))

      const result = await checkFocusIndicators({
        page,
        testInfo,
        selector: '[data-testid="section-bad"]',
        verbose: false,
      })

      expect(result.elementsWithoutIndicatorDetails.length).toBeGreaterThan(0)

      // Each violation should have complete information
      result.elementsWithoutIndicatorDetails.forEach((violation) => {
        expect(violation).toHaveProperty('tagName')
        expect(violation).toHaveProperty('id')
        expect(violation).toHaveProperty('className')
        expect(violation).toHaveProperty('selector')
        expect(violation).toHaveProperty('ariaLabel')
        expect(violation).toHaveProperty('textContent')

        // Tag name should be valid
        expect(violation.tagName).toBeTruthy()
        expect(['button', 'a', 'input', 'select', 'div', 'textarea']).toContain(violation.tagName)
      })
    })

    test('should attach results to test info', async ({}, testInfo) => {
      await page.goto(formatAdminURL({ adminRoute, path: '/focus-indicators', serverURL }))

      await checkFocusIndicators({
        page,
        testInfo,
        selector: '[data-testid="section-bad"]',
        verbose: false,
      })

      // Verify attachments were created
      const attachments = testInfo.attachments
      const resultAttachment = attachments.find((a) => a.name === 'focus-indicator-results')
      const violationAttachment = attachments.find(
        (a) => a.name === 'focus-indicator-results--violations',
      )

      expect(resultAttachment).toBeTruthy()
      expect(violationAttachment).toBeTruthy()
    })
  })

  describe('Performance & Limits', () => {
    test('should handle scanning large sections efficiently', async ({}, testInfo) => {
      await page.goto(formatAdminURL({ adminRoute, path: '/focus-indicators', serverURL }))

      const startTime = Date.now()

      await checkFocusIndicators({
        page,
        testInfo,
        verbose: false,
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete within reasonable time (30 seconds for full page scan)
      expect(duration).toBeLessThan(30000)
    })
  })
})
