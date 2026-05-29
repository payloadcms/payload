import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

/**
 * Opens the column selector drawer in the list view. If it's already open,
 * does nothing. See {@link ./../filters/openListFilters} for why we retry
 * the click via `expect.toPass`.
 */
export const openListColumns = async (
  page: Page,
  {
    togglerSelector = '.columns-button__button',
    columnContainerSelector = '.popup__content .column-selector',
  }: {
    columnContainerSelector?: string
    togglerSelector?: string
  } = {},
): Promise<{
  columnContainer: Locator
}> => {
  const columnContainer = page.locator(columnContainerSelector).first()

  await expect(async () => {
    if (!(await columnContainer.isVisible())) {
      await page.locator(togglerSelector).first().click()
    }
    await expect(columnContainer).toBeVisible({ timeout: 1500 })
  }).toPass({ timeout: 18000 })

  return { columnContainer }
}
