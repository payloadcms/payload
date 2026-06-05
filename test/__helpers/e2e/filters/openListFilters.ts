import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

/**
 * Opens the list filters drawer in the list view. If it's already open, does nothing.
 * Return the filter container locator for further interactions.
 *
 * The drawer is rendered conditionally (only present in the DOM when open), so its
 * visibility is the source of truth for the open/closed state. Click the toggler only
 * when the container isn't already visible, then retry until it is — idempotent and
 * resilient to re-render races (e.g. after a group-by/sort change).
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

  const openContainer = page.locator(filterContainerSelector).first()

  await expect(async () => {
    if (!(await openContainer.isVisible())) {
      await toggler.click()
    }

    await expect(openContainer).toBeVisible()
  }).toPass({ timeout: 18000 })

  return { filterContainer: openContainer }
}
