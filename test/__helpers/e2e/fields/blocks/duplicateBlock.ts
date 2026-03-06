import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { openArrayRowActions } from '../array/openArrayRowActions.js'

/**
 * Duplicates the block row at the specified index.
 */
export const duplicateBlock = async (
  page: Page,
  { fieldName, rowIndex = 0 }: Parameters<typeof openArrayRowActions>[1],
): Promise<{
  popupContentLocator: Locator
  rowActionsButtonLocator: Locator
  rowCount: number
}> => {
  const rowLocator = page.locator(
    `#field-${fieldName} > .blocks-field__rows > div > .blocks-field__row`,
  )

  const numberOfPrevRows = await rowLocator.count()

  const { popupContentLocator, rowActionsButtonLocator } = await openArrayRowActions(page, {
    fieldName,
    rowIndex,
  })

  await popupContentLocator.locator('.array-actions__action.array-actions__duplicate').click()
  const numberOfCurrentRows = await rowLocator.count()

  expect(numberOfCurrentRows).toBe(numberOfPrevRows + 1)

  // TODO: test the array row's field input values have been duplicated as well

  return { popupContentLocator, rowActionsButtonLocator, rowCount: numberOfCurrentRows }
}
