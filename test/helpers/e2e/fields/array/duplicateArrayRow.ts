import type { Locator, Page } from 'playwright'

import { openArrayRowActions } from './openArrayRowActions.js'

/**
 * Duplicates the array row at the specified index.
 */
export const duplicateArrayRow = async (
  page: Page,
  { fieldName, rowIndex = 0 }: Parameters<typeof openArrayRowActions>[1],
): Promise<{
  popupContent: Locator
  rowActionsButton: Locator
}> => {
  const { popupContent, rowActionsButton } = await openArrayRowActions(page, {
    fieldName,
    rowIndex,
  })

  await popupContent.locator('.array-actions__action.array-actions__duplicate').click()

  // TODO: test the array row has been duplicated

  return { popupContent, rowActionsButton }
}
