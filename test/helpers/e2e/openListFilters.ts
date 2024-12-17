import type { Page } from '@playwright/test'

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
) => {
  const columnContainer = page.locator(filterContainerSelector).first()

  const isAlreadyOpen = await columnContainer.isVisible()

  if (!isAlreadyOpen) {
    await page.locator(togglerSelector).first().click()
  }

  await expect(page.locator(`${filterContainerSelector}.rah-static--height-auto`)).toBeVisible()

  return columnContainer
}
