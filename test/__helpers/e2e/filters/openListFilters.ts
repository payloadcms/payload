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

  const isAlreadyOpen = await filterContainer.isVisible()

  if (!isAlreadyOpen) {
    await page.locator(togglerSelector).first().click()
  }

  await expect(page.locator(`${filterContainerSelector}.rah-static--height-auto`)).toBeVisible()

  return { filterContainer }
}
