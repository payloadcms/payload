import type { BrowserContext, Page } from '@playwright/test'
import type { Config } from 'payload'

import type { AdminRoutes } from '../__helpers/e2e/helpers.js'

import { catchConsoleErrors } from './catchConsoleErrors.js'
import { ensureCompilationIsDone } from './ensureCompilationIsDone.js'
import { patchPageMethods } from './patchPageMethods.js'

type InitPageArgs = {
  /** Creates the page. Ignored when `page` is supplied. */
  context?: BrowserContext
  customAdminRoutes?: AdminRoutes
  customRoutes?: Config['routes']
  /** Whether to ignore CORS errors in the console. */
  ignoreCORS?: boolean
  noAutoLogin?: boolean
  /** An existing page to wire up, i.e. Playwright's `{ page }` fixture. */
  page?: Page
  readyURL?: string
  serverURL: string
}

/**
 * Returns a page wired up for e2e use, once the admin panel has compiled: navigation
 * waits for the admin view to be interactive, and browser console errors fail the test.
 *
 * Pass `context` to have the page created for you, so there is no way to end up with a
 * page that skipped this setup. Pass `page` when it comes from somewhere you don't
 * control, i.e. Playwright's `{ page }` fixture.
 *
 * @see {@link patchPageMethods}
 * @see {@link catchConsoleErrors}
 * @see {@link ensureCompilationIsDone}
 */
export async function initPage({
  context,
  customAdminRoutes,
  customRoutes,
  ignoreCORS = false,
  noAutoLogin,
  page: incomingPage,
  readyURL,
  serverURL,
}: InitPageArgs) {
  if (!context && !incomingPage) {
    throw new Error('initPage requires either a `context` to create a page from, or a `page`.')
  }

  const page = incomingPage ?? (await context!.newPage())

  patchPageMethods(page)

  const { collectErrors, consoleErrors, stopCollectingErrors } = catchConsoleErrors(page, {
    ignoreCORS,
  })

  await ensureCompilationIsDone({
    customAdminRoutes,
    customRoutes,
    noAutoLogin,
    page,
    readyURL,
    serverURL,
  })

  return { collectErrors, consoleErrors, page, stopCollectingErrors }
}
