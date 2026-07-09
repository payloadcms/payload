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
      // Scroll toggler to top of viewport before opening so the popup renders
      // below the button and not off the top of the page
      const toggler = page.locator(togglerSelector).first()
      await toggler.evaluate((el) => {
        const rect = el.getBoundingClientRect()
        window.scrollBy({ top: rect.top - 100, behavior: 'instant' })
      })
      await toggler.click()
    }
    await expect(columnContainer).toBeVisible({ timeout: 1500 })
  }).toPass({ timeout: 18000 })

  return { columnContainer }
}
