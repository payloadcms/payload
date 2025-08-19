import type { Page } from 'playwright'

import { wait } from 'payload/shared'

import { openArrayRowActions } from './openArrayRowActions.js'

/**
 * Duplicates the array row at the specified index.
 */
export const duplicateArrayRow = async (
  page: Page,
  { fieldName, rowIndex = 0 }: Parameters<typeof openArrayRowActions>[1],
) => {
  await openArrayRowActions(page, { fieldName, rowIndex })

  // replace double underscores with single hyphens for the row ID
  const formattedRowID = fieldName.toString().replace(/__/g, '-')

  await page
    .locator(
      `#field-${fieldName} #${formattedRowID}-row-${rowIndex} .array-actions__action.array-actions__duplicate`,
    )
    .click()

  // TODO: test the array row has been duplicated

  await wait(300)
}
