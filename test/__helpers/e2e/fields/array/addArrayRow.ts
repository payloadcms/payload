import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'
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
  const rowLocator = page.locator(`#field-${fieldName} .array-field__row`)
  const numberOfPrevRows = await rowLocator.count()

  await addArrayRowAsync(page, fieldName)

  expect(await rowLocator.count()).toBe(numberOfPrevRows + 1)
}

/**
 * Like `addArrayRow`, but inserts the row at the specified index using the row actions menu.
 */
export const addArrayRowBelow = async (
  page: Page,
  { fieldName, rowIndex = 0 }: Parameters<typeof openArrayRowActions>[1],
): Promise<{ popupContentLocator: Locator; rowActionsButtonLocator: Locator }> => {
  const rowLocator = page.locator(`#field-${fieldName} .array-field__row`)
  const numberOfPrevRows = await rowLocator.count()

  const { popupContentLocator, rowActionsButtonLocator } = await openArrayRowActions(page, {
    fieldName,
    rowIndex,
  })

  await popupContentLocator.locator('.array-actions__action.array-actions__add').click()

  await expect(rowLocator).toHaveCount(numberOfPrevRows + 1)

  // TODO: test the array row has appeared in the _correct position_ (immediately below the original row)
  await wait(300)

  return { popupContentLocator, rowActionsButtonLocator }
}
