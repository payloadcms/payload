import type { Locator, Page } from '@playwright/test'

import { testIds } from '@payloadcms/ui/shared'
import { expect } from '@playwright/test'

/**
 * Opens the list filters drawer in the list view. If it's already open, does nothing.
 * Return the filter container locator for further interactions.
 */
export const openListFilters = async (
  page: Page,
  {
    togglerSelector,
    filterContainerSelector,
  }: {
    filterContainerSelector?: string
    togglerSelector?: string
  } = {},
): Promise<{
  filterContainer: Locator
}> => {
  const toggler = togglerSelector
    ? page.locator(togglerSelector)
    : page.getByTestId(testIds.filterControls.toggle)

  await expect(toggler).toBeVisible()

  const filterContainer = filterContainerSelector
    ? page.locator(filterContainerSelector).first()
    : page.getByTestId(testIds.filterControls.container).first()

  const isAlreadyOpen = await filterContainer.isVisible()

  if (!isAlreadyOpen) {
    await toggler.first().click()
  }

  const containerSelector =
    filterContainerSelector ?? `[data-testid="${testIds.filterControls.container}"]`
  await expect(page.locator(`${containerSelector}.rah-static--height-auto`)).toBeVisible()

  return { filterContainer }
}
