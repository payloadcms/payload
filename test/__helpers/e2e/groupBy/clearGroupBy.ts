import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { openGroupBy } from './openGroupBy.js'

export const clearGroupBy = async (page: Page): Promise<{ groupByContent: Locator }> => {
  const { groupByContent } = await openGroupBy(page)

  // Click the trash/clear button in the header
  const clearButton = groupByContent.locator(
    '.group-by-control__header-actions button[aria-label="Clear"]',
  )
  await clearButton.click()

  // Verify no groupBy in URL
  await expect(page).not.toHaveURL(/groupBy=/)

  // Verify grouped tables are gone
  await expect(page.locator('.table-section__header')).toHaveCount(0)

  return { groupByContent }
}
