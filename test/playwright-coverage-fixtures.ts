import { test as base } from '@playwright/test'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

/**
 * Extended Playwright test fixture that automatically collects coverage.
 * Usage: import { test } from './playwright-coverage-fixtures'
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    // Check if coverage is enabled
    const coverageEnabled = process.env.ENABLE_COVERAGE === 'true'

    if (coverageEnabled) {
      // Start JS coverage for all pages in this context
      await Promise.all(
        context.pages().map((page) => page.coverage.startJSCoverage({ resetOnNavigation: false })),
      )

      // Track new pages that are created during the test
      context.on('page', async (page) => {
        await page.coverage.startJSCoverage({ resetOnNavigation: false })
      })
    }

    await use(context)

    if (coverageEnabled) {
      // Collect coverage from all pages
      const coverageData = []
      for (const page of context.pages()) {
        try {
          const coverage = await page.coverage.stopJSCoverage()
          coverageData.push(...coverage)
        } catch (error) {
          // Page might be closed already
          console.warn('Failed to collect coverage from page:', error)
        }
      }

      // Save coverage data to file
      if (coverageData.length > 0) {
        const coverageDir = path.resolve(process.cwd(), 'coverage/e2e')
        const coverageFile = path.join(coverageDir, `coverage-${crypto.randomUUID()}.json`)

        // Ensure directory exists
        fs.mkdirSync(coverageDir, { recursive: true })

        // Convert Playwright coverage to V8 format
        const v8Coverage = {
          result: coverageData.map((entry) => ({
            functions: [
              {
                functionName: '',
                isBlockCoverage: true,
                ranges: entry.ranges.map((range) => ({
                  count: range.count || 1,
                  endOffset: range.end,
                  startOffset: range.start,
                })),
              },
            ],
            scriptId: '0',
            url: entry.url,
          })),
        }

        fs.writeFileSync(coverageFile, JSON.stringify(v8Coverage, null, 2))
      }
    }
  },
})

export { expect } from '@playwright/test'
