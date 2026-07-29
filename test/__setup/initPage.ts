import type { BrowserContext, Page } from '@playwright/test'

import { catchConsoleErrors } from './catchConsoleErrors.js'
import { patchPageMethods } from './patchPageMethods.js'

type InitPageArgs = {
  /** Creates the page. Ignored when `page` is supplied. */
  context?: BrowserContext
  /** Whether to ignore CORS errors in the console. */
  ignoreCORS?: boolean
  /** An existing page to wire up, i.e. Playwright's `{ page }` fixture. */
  page?: Page
}

/**
 * Returns a page wired up for e2e use: navigation waits for the admin view to be
 * interactive, and browser console errors fail the test.
 *
 * Pass `context` to have the page created for you, so there is no way to end up with a
 * page that skipped this setup. Pass `page` when it comes from somewhere you don't
 * control, i.e. Playwright's `{ page }` fixture.
 *
 * @see {@link patchPageMethods}
 * @see {@link catchConsoleErrors}
 */
export async function initPage({ context, ignoreCORS = false, page: incomingPage }: InitPageArgs) {
  if (!context && !incomingPage) {
    throw new Error('initPage requires either a `context` to create a page from, or a `page`.')
  }

  const page = incomingPage ?? (await context!.newPage())

  patchPageMethods(page)

  const { collectErrors, consoleErrors, stopCollectingErrors } = catchConsoleErrors(page, {
    ignoreCORS,
  })

  return { collectErrors, consoleErrors, page, stopCollectingErrors }
}
