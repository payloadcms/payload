import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

/**
 * Throws an error when browser console error messages (with some exceptions) are thrown, thus resulting
 * in the e2e test failing.
 *
 * Useful to prevent the e2e test from passing when, for example, there are react missing key prop errors
 * @param page
 * @param options
 */
export function initPageConsoleErrorCatch(page: Page, options?: { ignoreCORS?: boolean }) {
  const { ignoreCORS = false } = options || {} // Default to not ignoring CORS errors
  const consoleErrors: string[] = []

  let shouldCollectErrors = false

  page.on('console', (msg) => {
    if (
      msg.type() === 'error' &&
      // Playwright is seemingly loading CJS files from React Select, but Next loads ESM.
      // This leads to classnames not matching. Ignore these God-awful errors
      // https://github.com/JedWatson/react-select/issues/3590
      !msg.text().includes('did not match. Server:') &&
      !msg.text().includes('the server responded with a status of') &&
      !msg.text().includes('Failed to fetch RSC payload for') &&
      !msg.text().includes('Error: NEXT_NOT_FOUND') &&
      !msg.text().includes('Error: NEXT_REDIRECT') &&
      !msg.text().includes('Error getting document data') &&
      !msg.text().includes('Failed trying to load default language strings') &&
      !msg.text().includes('TypeError: Failed to fetch') && // This happens when server actions are aborted
      !msg.text().includes('der-radius: 2px  Server   Error: Error getting do') && // This is a weird error that happens in the console
      // Conditionally ignore CORS errors based on the `ignoreCORS` option
      !(
        ignoreCORS &&
        msg.text().includes('Access to fetch at') &&
        msg.text().includes("No 'Access-Control-Allow-Origin' header is present")
      ) &&
      // Conditionally ignore network-related errors
      !msg.text().includes('Failed to load resource: net::ERR_FAILED')
    ) {
      // "Failed to fetch RSC payload for" happens seemingly randomly. There are lots of issues in the next.js repository for this. Causes e2e tests to fail and flake. Will ignore for now
      // the the server responded with a status of error happens frequently. Will ignore it for now.
      // Most importantly, this should catch react errors.
      const { url, lineNumber, columnNumber } = msg.location() || {}
      const locationSuffix = url ? `\n at ${url}:${lineNumber ?? 0}:${columnNumber ?? 0}` : ''
      throw new Error(`Browser console error: ${msg.text()}${locationSuffix}`)
    }

    // Log ignored CORS-related errors for visibility
    if (msg.type() === 'error' && msg.text().includes('Access to fetch at') && ignoreCORS) {
      console.log(`Ignoring expected CORS-related error: ${msg.text()}`)
    }

    // Log ignored network-related errors for visibility
    if (msg.type() === 'error' && msg.text().includes('Failed to load resource: net::ERR_FAILED')) {
      console.log(`Ignoring expected network error: ${msg.text()}`)
    }
  })

  // Capture uncaught errors that do not appear in the console
  page.on('pageerror', (error) => {
    if (shouldCollectErrors) {
      const stack = error?.stack
      const message = error?.message ?? String(error)
      consoleErrors.push(`Page error: ${message}${stack ? `\n${stack}` : ''}`)
    } else {
      // Rethrow the original error to preserve stack, name, and other metadata
      throw error
    }
  })

  return {
    consoleErrors,
    collectErrors: () => (shouldCollectErrors = true), // Enable collection of errors for specific tests
    stopCollectingErrors: () => (shouldCollectErrors = false), // Disable collection of errors after the test
  }
}

const { beforeAll, describe } = test

describe('General', () => {
  let page: Page
  let context: BrowserContext

  beforeAll(async ({ browser }) => {
    context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
  })

  test('repro', async () => {
    for (let i = 0; i < 100; i++) {
      await page.goto('http://localhost:3000/test')
      expect(true).toBe(true)
    }
  })
})
