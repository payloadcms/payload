import type { Page } from 'playwright'

import { expect } from 'playwright/test'

/**
 * Opens the row actions menu for the specified array row.
 * If already open, does nothing.
 */
export const openArrayRowActions = async (page: Page, fieldName: string, rowIndex: number) => {
  const rowActions = page.locator(
    `#field-${fieldName} #array-row-${rowIndex} .array-actions__action`,
  )

  if (await rowActions.isVisible()) {
    return
  }

  const rowActionsButton = page.locator(
    `#field-${fieldName} #array-row-${rowIndex} .array-actions__button`,
  )

  await rowActionsButton.click()

  await expect(rowActions).toBeVisible()
}
