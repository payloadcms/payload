import type { Locator, Page } from 'playwright'

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
): Promise<{
  popupContentLocator: Locator
  rowActionsButtonLocator: Locator
}> => {
  const rowActions = page
    .locator(`#field-${fieldName} [id$="-row-${rowIndex}"] .array-actions`)
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
