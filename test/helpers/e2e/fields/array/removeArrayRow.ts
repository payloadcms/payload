import type { Locator, Page } from 'playwright'

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
  const { popupContentLocator, rowActionsButtonLocator } = await openArrayRowActions(page, {
    fieldName,
    rowIndex,
  })

  await popupContentLocator.locator('.array-actions__action.array-actions__remove').click()

  // TODO: test the array row has been removed
  // another row may have been moved into its place, though

  return { popupContentLocator, rowActionsButtonLocator }
}
