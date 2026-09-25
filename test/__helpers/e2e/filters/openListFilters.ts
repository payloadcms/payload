import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

/**
 * Opens the list filters drawer in the list view. If it's already open, does nothing.
 * Return the filter container locator for further interactions.
 *
 * Drives the drawer open off the toggler's `aria-expanded` state (the source of truth)
 * rather than a point-in-time visibility check of the container. The container flickers
 * visible mid-animation, and a preceding re-render (e.g. a group-by/sort change) can drop
 * the open click before it updates React state. Retrying the toggle until `aria-expanded`
 * reports open makes this idempotent and resilient to that race.
 *
 * The `toPass` retry also covers the dev/SSR case (notably the TanStack Start tests)
 * where the very first click can land on the SSR'd button before React has hydrated and
 * its `onClick` handler is attached, so the drawer never opens on that first click.
 */
export const openListFilters = async (
  page: Page,
  {
    togglerSelector = '#toggle-list-filters',
    filterContainerSelector = '.where-builder',
  }: {
    filterContainerSelector?: string
    togglerSelector?: string
  },
): Promise<{
  filterContainer: Locator
}> => {
  const toggler = page.locator(togglerSelector).first()
  await expect(toggler).toBeVisible()

  await expect(async () => {
    if ((await toggler.getAttribute('aria-expanded')) !== 'true') {
      await toggler.click()
    }

    // Use a short, explicit inner timeout. The global `EXPECT_TIMEOUT` is 18s on CI, so without
    // this a single (lost, pre-hydration) click would consume the entire `toPass` budget and defeat
    // the retry — the exact failure this helper exists to prevent. A short inner timeout lets
    // `toPass` re-click until the button has hydrated and the drawer actually opens.
    await expect(toggler).toHaveAttribute('aria-expanded', 'true', { timeout: 3000 })
  }).toPass({ timeout: 30000 })

  const openContainer = page.locator(filterContainerSelector).first()
  await expect(openContainer).toBeVisible()

  return { filterContainer: openContainer }
}
