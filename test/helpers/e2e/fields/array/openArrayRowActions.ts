import type { Page } from 'playwright'

import { expect } from 'playwright/test'

/**
 * Opens the row actions menu for the specified array row.
 * If already open, does nothing.
 */
export const openArrayRowActions = async (
  page: Page,
  {
    fieldName,
    rowIndex = 0,
  }: {
    fieldName: string
    rowIndex?: number
  },
) => {
  // replace double underscores with single hyphens for the row ID
  const formattedRowID = fieldName.toString().replace(/__/g, '-')

  const rowActions = page.locator(
    `#field-${fieldName} #${formattedRowID}-row-${rowIndex} .array-actions`,
  )

  const popupContent = rowActions.locator('.popup__content')

  if (await popupContent.isVisible()) {
    return
  }

  const rowActionsButton = rowActions.locator(`.array-actions__button`)

  await rowActionsButton.click()

  await expect(popupContent).toBeVisible()
}
