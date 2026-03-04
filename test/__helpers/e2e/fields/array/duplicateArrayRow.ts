import type { Locator, Page } from '@playwright/test'

import { testIds } from '@payloadcms/ui/shared'
import { expect } from '@playwright/test'

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
  const rowLocator = page
    .getByTestId(testIds.field(fieldName))
    .locator(':scope > .array-field__draggable-rows > *')

  const numberOfPrevRows = await rowLocator.count()

  const { popupContentLocator, rowActionsButtonLocator } = await openArrayRowActions(page, {
    fieldName,
    rowIndex,
  })

  await popupContentLocator.getByTestId(testIds.arrayAction.duplicate).click()

  expect(await rowLocator.count()).toBe(numberOfPrevRows + 1)

  // TODO: test the array row's field input values have been duplicated as well

  return { popupContentLocator, rowActionsButtonLocator }
}
