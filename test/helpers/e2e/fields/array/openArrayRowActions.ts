import type { Page } from 'playwright'

import { expect } from 'playwright/test'

/**
 * Opens the row actions menu for the specified array row.
 * If already open, does nothing.
 */
export const openArrayRowActions = async (page: Page, fieldName: string, rowIndex: number = 0) => {
  const rowActions = page.locator(
    `#field-${fieldName} #${fieldName}-row-${rowIndex} .array-actions`,
  )

  const popupContent = rowActions.locator('.popup__content')

  if (await popupContent.isVisible()) {
    return
  }

  const rowActionsButton = rowActions.locator(`.array-actions__button`)

  await rowActionsButton.click()

  await expect(popupContent).toBeVisible()
}
