import type { Locator, Page } from '@playwright/test'

import { testIds } from '@payloadcms/ui/shared'
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
  const rowLocator = page
    .getByTestId(testIds.field(fieldName))
    .locator(':scope > .blocks-field__rows > div > .blocks-field__row')

  const numberOfPrevRows = await rowLocator.count()

  const { popupContentLocator, rowActionsButtonLocator } = await openArrayRowActions(page, {
    fieldName,
    fieldType: 'blocks',
    rowIndex,
  })

  await popupContentLocator.getByTestId(testIds.arrayAction.duplicate).click()
  const numberOfCurrentRows = await rowLocator.count()

  expect(numberOfCurrentRows).toBe(numberOfPrevRows + 1)

  // TODO: test the array row's field input values have been duplicated as well

  return { popupContentLocator, rowActionsButtonLocator, rowCount: numberOfCurrentRows }
}
