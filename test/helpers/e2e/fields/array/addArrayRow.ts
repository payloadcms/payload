import type { Locator, Page } from 'playwright'

import { wait } from 'payload/shared'

import { openArrayRowActions } from './openArrayRowActions.js'

/**
 * Does not wait after adding the row for the row to appear and fully load in. Simply clicks the primary "Add Row" button and moves on.
 */
export const addArrayRowAsync = async (page: Page, fieldName: string) => {
  await page.locator(`#field-${fieldName} > .array-field__add-row`).first().click()
}

/**
 * Adds an array row to the end of the array using the primary "Add Row" button.
 */
export const addArrayRow = async (
  page: Page,
  { fieldName }: Omit<Parameters<typeof openArrayRowActions>[1], 'rowIndex'>,
) => {
  await addArrayRowAsync(page, fieldName)

  // TODO: test the array row has appeared
  await wait(300)
}

/**
 * Like `addArrayRow`, but inserts the row at the specified index using the row actions menu.
 */
export const addArrayRowBelow = async (
  page: Page,
  { fieldName, rowIndex = 0 }: Parameters<typeof openArrayRowActions>[1],
): Promise<{ popupContentLocator: Locator; rowActionsButtonLocator: Locator }> => {
  const { popupContentLocator, rowActionsButtonLocator } = await openArrayRowActions(page, {
    fieldName,
    rowIndex,
  })

  const addBelowButton = popupContentLocator.locator('.array-actions__action.array-actions__add')

  await addBelowButton.click()

  // TODO: test the array row has appeared
  await wait(300)

  return { popupContentLocator, rowActionsButtonLocator }
}
