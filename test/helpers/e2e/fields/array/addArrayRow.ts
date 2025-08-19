import type { Page } from 'playwright'

import { wait } from 'payload/shared'
import { expect } from 'playwright/test'

import { openArrayRowActions } from './openArrayRowActions.js'

/**
 * Does not wait after adding the row. Simply clicks the primary "Add Row" button.
 */
export const addArrayRowAsync = async (page: Page, fieldName: string) => {
  await page.locator(`#field-${fieldName} > .array-field__add-row`).first().click()
}

/**
 * Adds an array row to the end of the array using the primary "Add Row" button.
 */
export const addArrayRow = async (page: Page, fieldName: string) => {
  await addArrayRowAsync(page, fieldName)

  await wait(300)

  // TODO: test the array row has appeared
}

/**
 * Like `addArrayRow`, but inserts the row at the specified index using the row actions menu.
 */
export const addArrayRowBelow = async (page: Page, fieldName: string, rowIndex: number) => {
  await openArrayRowActions(page, { fieldName, rowIndex })

  // replace double underscores with single hyphens for the row ID
  const formattedRowID = fieldName.toString().replace(/__/g, '-')

  const addBelowButton = page.locator(
    `#field-${fieldName} #${formattedRowID}-row-${rowIndex} .array-actions__action.array-actions__add`,
  )

  await expect(addBelowButton).toBeVisible()

  await addBelowButton.click()

  await wait(300)

  // TODO: test the array row has appeared
}
