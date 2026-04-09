import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { openArrayRowActions } from './openArrayRowActions.js'

/**
 * Removes an array row at the specified index.
 */
export const removeArrayRow = async (
  page: Page,
  { fieldName, rowIndex = 0 }: Parameters<typeof openArrayRowActions>[1],
): Promise<{
  popupContentLocator: Locator
  rowActionsButtonLocator: Locator
}> => {
  const rowLocator = page.locator(`#field-${fieldName} .array-field__row`)
  const numberOfPrevRows = await rowLocator.count()

  const { popupContentLocator, rowActionsButtonLocator } = await openArrayRowActions(page, {
    fieldName,
    rowIndex,
  })

  await popupContentLocator.locator('.array-actions__action.array-actions__remove').click()

  expect(await rowLocator.count()).toBe(numberOfPrevRows - 1)

  // TODO: test the array row has been removed in the _correct position_ (original row index)
  // another row may have been moved into its place, need to ensure the test accounts for this fact

  return { popupContentLocator, rowActionsButtonLocator }
}
