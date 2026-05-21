import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

/**
 * Opens the list filters drawer in the list view. If it's already open, does nothing.
 * Return the filter container locator for further interactions.
 *
 * Uses `expect.toPass` to retry the click. In dev/SSR setups (notably the
 * TanStack Start tests) the very first click can land on the SSR'd button
 * before React has finished hydrating, so the `onClick` handler isn't yet
 * attached and the drawer never opens. Retrying the click until the expanded
 * marker class appears is much more reliable than a one-shot click + assert.
 */
export const openListFilters = async (
  page: Page,
  {
    togglerSelector = '#toggle-list-filters',
    filterContainerSelector = '#list-controls-where',
  }: {
    filterContainerSelector?: string
    togglerSelector?: string
  },
): Promise<{
  filterContainer: Locator
}> => {
  await expect(page.locator(togglerSelector)).toBeVisible()
  const filterContainer = page.locator(filterContainerSelector).first()
  const expandedFilterContainer = page.locator(`${filterContainerSelector}.rah-static--height-auto`)

  await expect(async () => {
    if (!(await expandedFilterContainer.isVisible())) {
      await page.locator(togglerSelector).first().click()
    }
    await expect(expandedFilterContainer).toBeVisible({ timeout: 1500 })
  }).toPass({ timeout: 18000 })

  return { filterContainer }
}
