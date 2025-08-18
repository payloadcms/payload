import type { Page } from 'playwright'

import { openArrayRowActions } from './openArrayRowActions.js'

/**
 * Removes an array row at the specified index.
 */
export const removeArrayRow = async (page: Page, fieldName: string, rowIndex: number = 0) => {
  await openArrayRowActions(page, fieldName, rowIndex)

  await page
    .locator(
      `#field-${fieldName} #${fieldName}-row-${rowIndex} .array-actions__action.array-actions__remove`,
    )
    .click()

  // TODO: test the array row has been removed
  // another row may have been moved into its place, though
}
