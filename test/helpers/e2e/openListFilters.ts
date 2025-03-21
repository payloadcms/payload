import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

export const openListFilters = async (
  page: Page,
  {
    togglerSelector = '.list-controls__toggle-where',
    filterContainerSelector = '.list-controls__where',
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
