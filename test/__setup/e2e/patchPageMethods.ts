import type { Page } from '@playwright/test'

/**
 * Wrapper element every admin view renders inside, and the shallowest node whose React
 * ownership proves the view has been committed.
 */
const ADMIN_TEMPLATE_SELECTOR = '.template-default, .template-minimal'

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
 * Waits on two signals, because neither alone is sufficient: the router marker (see
 * `test/__helpers/components/HydrationMarker`) for the loader settling, then React
 * ownership of the view for the commit that follows it 60-135ms later.
 *
 * No-op for Next.js, where the marker is never set, so tests don't branch on framework.
 *
 * Idempotent: calling this more than once on the same page is safe.
 */
export function patchPageMethods(page: Page) {
  if (process.env.PAYLOAD_FRAMEWORK !== 'tanstack-start') {
    return
  }

  const patchedPage = page as unknown as {
    __payloadGotoPatched?: boolean
    __payloadSkipHydrationWait?: boolean
  }

  if (patchedPage.__payloadGotoPatched) {
    return
  }

  patchedPage.__payloadGotoPatched = true

  const waitForHydration = async () => {
    if (patchedPage.__payloadSkipHydrationWait) {
      return
    }

    try {
      await page.waitForFunction(
        () => (window as unknown as { __TANSTACK_HYDRATED__?: boolean }).__TANSTACK_HYDRATED__,
        undefined,
        { timeout: 15000 },
      )

      // Router-idle lands 60-135ms BEFORE React commits the view. In that gap the SSR'd
      // markup is still on screen but doomed: it gets torn down and replaced by nodes React
      // owns, so a click there targets an element that ceases to exist. Wait for the admin
      // template to carry React's internal keys, which happens in the same commit as every
      // interactive element inside it.
      if (await page.locator(ADMIN_TEMPLATE_SELECTOR).count()) {
        await page.waitForFunction(
          (selector) => {
            const el = document.querySelector(selector)

            return (
              !!el &&
              Object.keys(el).some(
                (key) => key.startsWith('__reactProps$') || key.startsWith('__reactFiber$'),
              )
            )
          },
          ADMIN_TEMPLATE_SELECTOR,
          { timeout: 15000 },
        )
      }
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

  page.goto = (async (...args: Parameters<Page['goto']>) => {
    const response = await originalGoto(...args)

    if (requiresHydrationWait(args[0])) {
      await waitForHydration()
    }

    return response
  }) as Page['goto']

  const originalReload = page.reload.bind(page)

  page.reload = (async (...args: Parameters<Page['reload']>) => {
    const response = await originalReload(...args)

    if (requiresHydrationWait(page.url())) {
      await waitForHydration()
    }

    return response
  }) as Page['reload']
}
