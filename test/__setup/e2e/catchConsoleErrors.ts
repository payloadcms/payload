import type { Page } from '@playwright/test'

/**
 * Hydration-mismatch errors, which the unminified filters below already ignore by message.
 * A production build only ever reports the code, so matching on prose silently stopped
 * covering them and every navigation in a prod run failed its test instead.
 *
 * 418 server/client markup mismatch, 422 and 423 errors while hydrating, 425 text content
 * mismatch.
 *
 * @see https://react.dev/errors
 */
const REACT_HYDRATION_ERROR_CODES = [418, 422, 423, 425]

const isReactHydrationError = (message: string): boolean =>
  REACT_HYDRATION_ERROR_CODES.some((code) => message.includes(`Minified React error #${code}`))

/**
 * Throws an error when browser console error messages (with some exceptions) are thrown, thus resulting
 * in the e2e test failing.
 *
 * Useful to prevent the e2e test from passing when, for example, there are react missing key prop errors
 * @param page
 * @param options
 */
export function catchConsoleErrors(page: Page, options?: { ignoreCORS?: boolean }) {
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
      !msg.text().includes('Hydration failed because the server rendered HTML') &&
      !isReactHydrationError(msg.text()) &&
      !msg.text().includes('the server responded with a status of') &&
      !msg.text().includes('Failed to fetch RSC payload for') &&
      !msg.text().includes('Error loading language') &&
      !msg.text().includes('Error: NEXT_NOT_FOUND') &&
      !msg.text().includes('Error: NEXT_REDIRECT') &&
      // TanStack Start adapter nav control-flow contract (analogous to the
      // NEXT_NOT_FOUND / NEXT_REDIRECT signals above). `req.server.notFound()` /
      // `redirect()` thrown deep inside a streamed RSC view surface as these.
      !msg.text().includes('Error: not-found') &&
      !msg.text().includes('Error: redirect:') &&
      !msg.text().includes('Error getting document data') &&
      !msg.text().includes('Failed trying to load default language strings') &&
      !msg.text().includes('TypeError: Failed to fetch') && // This happens when server actions are aborted
      !msg.text().includes('TypeError: network error') && // Transient network errors during chunk loading
      !msg.text().includes('der-radius: 2px  Server   Error: Error getting do') && // This is a weird error that happens in the console
      // Expected lexical-converter warning for blocks/inline-blocks intentionally
      // configured without an HTML converter (e.g. the `diff` test collection's
      // `myBlock`). Logged server-side via `console.error`; harmless in Next, but
      // the TanStack/vite-rsc adapter forwards server `console.error` to the
      // browser console, so it would otherwise fail every diff-view test.
      !msg.text().includes('no converter is provided') &&
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
      const { columnNumber, lineNumber, url } = msg.location() || {}
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
    const message = error?.message ?? String(error)

    if (
      message.includes('Hydration failed because the server rendered HTML') ||
      isReactHydrationError(message)
    ) {
      return
    }

    if (shouldCollectErrors) {
      const stack = error?.stack
      consoleErrors.push(`Page error: ${message}${stack ? `\n${stack}` : ''}`)
    } else {
      // Rethrow the original error to preserve stack, name, and other metadata
      throw error
    }
  })

  return {
    collectErrors: () => (shouldCollectErrors = true), // Enable collection of errors for specific tests
    consoleErrors,
    stopCollectingErrors: () => (shouldCollectErrors = false), // Disable collection of errors after the test
  }
}
