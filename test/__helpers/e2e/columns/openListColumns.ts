import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

export const openListColumns = async (
  page: Page,
  {
    togglerSelector = '.list-controls__toggle-columns',
    columnContainerSelector = '.column-selector',
  }: {
    columnContainerSelector?: string
    togglerSelector?: string
  },
): Promise<{
  columnContainer: Locator
}> => {
  const columnContainer = page.locator(columnContainerSelector).first()

  const isAlreadyOpen = await columnContainer.isVisible()

  if (!isAlreadyOpen) {
    await page.locator(togglerSelector).first().click()
  }

  await expect(columnContainer).toBeVisible()

  return { columnContainer }
}
