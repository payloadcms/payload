import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

/**
 * Opens the list filters drawer in the list view. If it's already open, does nothing.
 * Return the filter container locator for further interactions.
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

  // The filter drawer is now rendered conditionally (only present in the DOM when open),
  // so its visibility is the source of truth for the open/closed state. Click the toggler
  // only when the container isn't already visible, then retry until it is. This makes the
  // helper idempotent and resilient to re-render races (e.g. after a group-by/sort change).
  await expect(async () => {
    if (!(await openContainer.isVisible())) {
      await toggler.click()
    }

    await expect(openContainer).toBeVisible()
  }).toPass()

  return { filterContainer: openContainer }
}
