import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

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
): Promise<{
  popupContentLocator: Locator
  rowActionsButtonLocator: Locator
}> => {
  // replace double underscores with single hyphens for the row ID
  const formattedRowID = fieldName.toString().replace(/__/g, '-')

  const rowActions = page
    .locator(`#field-${fieldName} #${formattedRowID}-row-${rowIndex} .array-actions`)
    .first()

  const popupContentLocator = page.locator('.popup__content')

  if (await popupContentLocator.isVisible()) {
    throw new Error(`Row actions for field "${fieldName}" at index ${rowIndex} are already open.`)
  }

  const rowActionsButtonLocator = rowActions.locator(`.array-actions__button`)

  await rowActionsButtonLocator.click()

  await expect(popupContentLocator).toBeVisible()

  return {
    rowActionsButtonLocator,
    popupContentLocator,
  }
}
