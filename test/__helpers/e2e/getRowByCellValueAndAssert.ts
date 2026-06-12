import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

export async function getRowByCellValueAndAssert({
  page,
  textToMatch,
  cellClass,
}: {
  cellClass: `.cell-${string}`
  page: Page
  textToMatch: string
}): Promise<Locator> {
  const row = page
    .locator(`.collection-list .table tr`)
    .filter({
      has: page.locator(`${cellClass}`, { hasText: textToMatch }),
    })
    .first()

  await expect(row).toBeVisible()
  return row
}
