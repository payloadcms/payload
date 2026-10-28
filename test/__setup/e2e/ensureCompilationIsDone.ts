import type { Browser, Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { type Config } from 'payload'
import { formatAdminURL, wait } from 'payload/shared'

import type { AdminRoutes } from '../../__helpers/e2e/helpers.js'

import { getRoutes } from '../../__helpers/e2e/helpers.js'
import { hideNextDevTools } from '../../__helpers/e2e/hideNextDevTools.js'
import { POLL_TOPASS_TIMEOUT } from '../../playwright.config.js'

/**
 * Ensure admin panel is loaded before running tests
 * @param page
 * @param serverURL
 */
export async function ensureCompilationIsDone({
  browser,
  customAdminRoutes,
  customRoutes,
  noAutoLogin,
  page: pageFromArgs,
  readyURL,
  serverURL,
}: {
  /**
   * Provide a browser if you need this utility to create and close a temporary page for you.
   */
  browser?: Browser
  customAdminRoutes?: AdminRoutes
  customRoutes?: Config['routes']
  noAutoLogin?: boolean
  page?: Page
  readyURL?: string
  serverURL: string
}): Promise<void> {
  if (!pageFromArgs && !browser) {
    throw new Error('Either page or browser must be provided')
  }
  if (pageFromArgs && browser) {
    throw new Error('Either page or browser must be provided, not both')
  }

  const page = pageFromArgs ?? (await browser!.newPage())

  // Hide Next.js dev tools to prevent them from blocking interactions
  await hideNextDevTools(page)

  const { routes: { admin: adminRoute } = {} } = getRoutes({ customAdminRoutes, customRoutes })

  const adminURL = formatAdminURL({ adminRoute, path: '', serverURL })

  // Disable the hydration wait during compilation polling — the page won't
  // have the React tree mounted yet, so waiting 15s per attempt for the
  // hydration marker would exhaust the beforeAll hook timeout.
  const patchedPage = page as unknown as { __payloadSkipHydrationWait?: boolean }
  patchedPage.__payloadSkipHydrationWait = true

  const maxAttempts = 15
  let attempt = 1

  while (attempt <= maxAttempts) {
    try {
      console.log(
        `Checking if compilation is done (attempt ${attempt}/${maxAttempts})...`,
        readyURL ??
          (noAutoLogin ? `${adminURL + (adminURL.endsWith('/') ? '' : '/')}login` : adminURL),
      )

      // Commit is faster than waiting for the default waitUntil: load
      await page.goto(adminURL, { waitUntil: 'commit' })

      if (readyURL) {
        await page.waitForURL(readyURL, { waitUntil: 'commit' })
      } else {
        await expect
          .poll(
            () => {
              if (noAutoLogin) {
                const baseAdminURL = adminURL + (adminURL.endsWith('/') ? '' : '/')
                return (
                  page.url() === `${baseAdminURL}create-first-user` ||
                  page.url() === `${baseAdminURL}login`
                )
              } else {
                return page.url() === adminURL
              }
            },
            { timeout: POLL_TOPASS_TIMEOUT },
          )
          .toBe(true)
      }

      console.log('Successfully compiled')
      patchedPage.__payloadSkipHydrationWait = false
      if (browser) {
        await page.close()
      }
      return
    } catch (error) {
      if (attempt === maxAttempts) {
        patchedPage.__payloadSkipHydrationWait = false
        console.error(
          'Compilation not done yet. Giving up. The dev server is probably not running or crashed.',
        )
        throw error
      }

      console.log('Compilation not done yet. Retrying in 2 seconds...')
      await wait(2000)
      attempt++
    }
  }

  patchedPage.__payloadSkipHydrationWait = false

  if (noAutoLogin) {
    if (browser) {
      await page.close()
    }
    return
  }
  await expect(() => expect(page.locator('.template-default')).toBeVisible()).toPass({
    timeout: POLL_TOPASS_TIMEOUT,
  })

  await expect(page.locator('.dashboard__label').first()).toBeVisible()

  if (browser) {
    await page.close()
  }
}
