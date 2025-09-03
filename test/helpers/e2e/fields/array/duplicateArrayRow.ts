import type { Locator, Page } from 'playwright'

import { openArrayRowActions } from './openArrayRowActions.js'

/**
 * Duplicates the array row at the specified index.
 */
export const duplicateArrayRow = async (
  page: Page,
  { fieldName, rowIndex = 0 }: Parameters<typeof openArrayRowActions>[1],
): Promise<{
  popupContentLocator: Locator
  rowActionsButtonLocator: Locator
}> => {
  const { popupContentLocator, rowActionsButtonLocator } = await openArrayRowActions(page, {
    fieldName,
    rowIndex,
  })

  const rowSelector = page.locator(`#field-${fieldName} .array-field__row`)
  const numberOfCurrentRows = await rowSelector.count()

  await popupContentLocator.locator('.array-actions__action.array-actions__duplicate').click()

  expect(await rowSelector.count()).toBe(numberOfCurrentRows + 1)

  // TODO: test the array row's field input values have been duplicated as well

  return { popupContentLocator, rowActionsButtonLocator }
}
