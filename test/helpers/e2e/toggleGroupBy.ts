import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

/**
 * Opens the group-by drawer in the list view. If it's already open, does nothing.
 * Return the filter container locator for further interactions.
 */
export const openGroupBy = async (
  page: Page,
  {
    togglerSelector = '#toggle-group-by',
    filterContainerSelector = '#list-controls-group-by',
  }: {
    filterContainerSelector?: string
    togglerSelector?: string
  },
): Promise<{
  filterContainer: Locator
}> => {
  const filterContainer = page.locator(filterContainerSelector).first()

  const isAlreadyOpen = await filterContainer.isVisible()

  if (!isAlreadyOpen) {
    await page.locator(togglerSelector).first().click()
  }

  await expect(page.locator(`${filterContainerSelector}.rah-static--height-auto`)).toBeVisible()

  return { filterContainer }
}
