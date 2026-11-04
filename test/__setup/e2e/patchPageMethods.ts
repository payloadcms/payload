import type { Locator, Page } from '@playwright/test'

/**
 * Elements outside the pages Next.js keeps hidden in React `<Activity>` boundaries when
 * `cacheComponents` is enabled. React hides such a page by setting an inline
 * `display: none !important` on its top-level elements, which in the admin panel are direct
 * children of `<body>`. Elements hidden any other way (collapsed fields, closed popups, elements
 * with a plain `display: none`) still match.
 */
const outsideHiddenActivitySelector =
  ':not(body > [style*="display: none !important"], body > [style*="display: none !important"] *)'

/**
 * Patches `page.goto()` / `page.reload()` so it only returns once the admin view is interactive.
 *
 * On the TanStack Start adapter a full document load does not hydrate the SSR'd view in
 * place. `AdminPage` renders an RSC payload fetched by the route loader, so the server
 * markup is torn down and re-mounted as different DOM nodes a few hundred ms later. An
 * interaction landing in that window is lost outright — the element it targeted no longer
 * exists — and unlike Next.js there is no dehydrated boundary for React to replay the
 * event into. `toBeVisible()` is no protection, since the doomed markup is on screen from
 * the first byte.
 *
 * Waits for the router marker (see `test/__helpers/components/HydrationMarker`) to report
 * that the loader has settled.
 *
 * No-op for Next.js, which never renders the marker, so tests don't branch on framework.
 *
 * Also scopes locators and selector-based actions to elements outside hidden `<Activity>` pages.
 * `UnmountWhenHidden` empties those pages, but React only does that at its lowest priority, so
 * right after a navigation the previous page can still be in the DOM. Without this, a selector
 * that matches on both pages trips strict mode or `.first()` picks the hidden copy.
 *
 * Idempotent: calling this more than once on the same page is safe.
 */
export function patchPageMethods(page: Page) {
  const patchedPage = page as unknown as {
    __payloadGotoPatched?: boolean
    __payloadSkipHydrationWait?: boolean
  }

  if (patchedPage.__payloadGotoPatched) {
    return
  }

  patchedPage.__payloadGotoPatched = true

  /**
   * Asked of the page rather than the environment. `PAYLOAD_FRAMEWORK` is set by the CLI runner
   * but not by editor test runners, and gating on it there silently disabled every wait below
   * while the tests still ran against the TanStack server.
   *
   * Reads server-rendered markup, not a global: `window.__TANSTACK_*` is only assigned once
   * hydration runs, which is well after `goto` resolves and therefore too late to decide with.
   */
  const isTanStackApp = () =>
    page
      .locator('[data-tanstack-app]')
      .count()
      .then((count) => count > 0)
      .catch(() => false)

  const waitForHydration = async () => {
    if (patchedPage.__payloadSkipHydrationWait) {
      return
    }

    if (!(await isTanStackApp())) {
      return
    }

    try {
      await page.waitForFunction(
        () => (window as unknown as { __TANSTACK_HYDRATED__?: boolean }).__TANSTACK_HYDRATED__,
        undefined,
        { timeout: 15000 },
      )
    } catch {
      // Best-effort. Don't fail navigation if the marker never shows up;
      // the underlying assertion in the test will still surface the real
      // failure.
    }
  }

  // Non-admin URLs (e.g. `/api/<collection>` JSON endpoints used by tests that
  // assert on the raw REST response) never mount the TanStack admin app, so
  // `__TANSTACK_HYDRATED__` will never be set. Skip the hydration wait for
  // those, otherwise each such navigation pays the full 15s timeout.
  const requiresHydrationWait = (url: string | undefined): boolean => {
    if (!url) {
      return true
    }

    try {
      const path = new URL(url, 'http://localhost').pathname
      return !path.startsWith('/api/') && path !== '/api'
    } catch {
      return true
    }
  }

  const originalGoto = page.goto.bind(page)

  page.goto = async (...args: Parameters<Page['goto']>) => {
    const response = await originalGoto(...args)

    if (requiresHydrationWait(args[0])) {
      await waitForHydration()
    }

    return response
  }

  const originalReload = page.reload.bind(page)

  page.reload = async (...args: Parameters<Page['reload']>) => {
    const response = await originalReload(...args)

    if (requiresHydrationWait(page.url())) {
      await waitForHydration()
    }

    return response
  }

  const originalLocator = page.locator.bind(page)
  const outsideHiddenActivity = () => originalLocator(outsideHiddenActivitySelector)

  page.locator = (...args: Parameters<Page['locator']>) =>
    originalLocator(...args).and(outsideHiddenActivity())

  // `getByRole` already ignores hidden elements
  for (const method of [
    'getByAltText',
    'getByLabel',
    'getByPlaceholder',
    'getByTestId',
    'getByText',
    'getByTitle',
  ] as const) {
    const originalGetBy = page[method].bind(page) as (...args: unknown[]) => Locator

    page[method] = (...args: unknown[]) => originalGetBy(...args).and(outsideHiddenActivity())
  }

  // Selector-based actions act on the first match, so keep that and only skip hidden pages
  page.click = (selector, options) => page.locator(selector).first().click(options)

  page.fill = (selector, value, options) => page.locator(selector).first().fill(value, options)

  page.isVisible = (selector) => page.locator(selector).first().isVisible()

  page.setInputFiles = (selector, files, options) =>
    page.locator(selector).first().setInputFiles(files, options)

  page.waitForSelector = (async (
    selector: string,
    options?: Parameters<Page['waitForSelector']>[1],
  ) => {
    const locator = page.locator(selector).first()

    await locator.waitFor({ state: options?.state, timeout: options?.timeout })

    return options?.state === 'hidden' || options?.state === 'detached'
      ? null
      : locator.elementHandle()
  }) as Page['waitForSelector']
}
