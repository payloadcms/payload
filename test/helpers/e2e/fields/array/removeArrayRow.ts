import type { Page } from 'playwright'

import { openArrayRowActions } from './openArrayRowActions.js'

/**
 * Removes an array row at the specified index.
 */
export const removeArrayRow = async (
  page: Page,
  { fieldName, rowIndex = 0 }: Parameters<typeof openArrayRowActions>[1],
) => {
  await openArrayRowActions(page, { fieldName, rowIndex })

  // replace double underscores with single hyphens for the row ID
  const formattedRowID = fieldName.toString().replace(/__/g, '-')

  await page
    .locator(
      `#field-${fieldName} #${formattedRowID}-row-${rowIndex} .array-actions__action.array-actions__remove`,
    )
    .click()

  // TODO: test the array row has been removed
  // another row may have been moved into its place, though
}
