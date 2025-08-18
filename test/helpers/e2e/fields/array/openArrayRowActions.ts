import type { Page } from 'playwright'

import { expect } from 'playwright/test'

/**
 * Opens the row actions menu for the specified array row.
 * If already open, does nothing.
 */
export const openArrayRowActions = async (page: Page, fieldName: string, rowIndex: number) => {
  const rowActions = page.locator(
    `#field-${fieldName} #${fieldName}-row-${rowIndex} .array-actions`,
  )

  if (await rowActions.isVisible()) {
    return
  }

  const rowActionsButton = rowActions.locator(`.array-actions__button`)

  await rowActionsButton.click()

  const popupContent = rowActions.locator('.popup__content')

  if (await popupContent.isVisible()) {
    return
  }

  await expect(popupContent).toBeVisible()
}
