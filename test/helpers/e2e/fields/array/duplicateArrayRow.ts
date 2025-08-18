import type { Page } from 'playwright'

import { wait } from 'payload/shared'

import { openArrayRowActions } from './openArrayRowActions.js'

/**
 * Duplicates the array row at the specified index.
 */
export const duplicateArrayRow = async (page: Page, fieldName: string, rowIndex: number) => {
  await openArrayRowActions(page, fieldName, rowIndex)

  await page
    .locator(
      `#field-${fieldName} #${fieldName}-row-${rowIndex} .array-actions__action.array-actions__duplicate`,
    )
    .click()

  // TODO: test the array row has been duplicated

  await wait(300)
}
