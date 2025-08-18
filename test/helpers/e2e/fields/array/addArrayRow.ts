import type { Page } from 'playwright'

import { wait } from 'payload/shared'
import { expect } from 'playwright/test'

import { openArrayRowActions } from './openArrayRowActions.js'

export const addArrayRowDirect = async (page: Page, fieldName: string) => {
  const addRowButton = page.locator(`#field-${fieldName} > .array-field__add-row`)

  await expect(addRowButton).toBeVisible()

  await page.locator(`#field-${fieldName} > .array-field__add-row`).click()
}

/**
 * Adds an array row to the end of the array using the primary "Add Row" button.
 */
export const addArrayRow = async (page: Page, fieldName: string) => {
  await addArrayRowDirect(page, fieldName)

  await wait(300)

  // TODO: test the array row has appeared
}

/**
 * Like `addArrayRow`, but inserts the row at the specified index using the row actions menu.
 */
export const addArrayRowBelow = async (page: Page, fieldName: string, rowIndex: number) => {
  await openArrayRowActions(page, fieldName, rowIndex)

  const addBelowButton = page.locator(
    `#field-${fieldName} #array-row-${rowIndex} .array-actions__action.array-actions__add`,
  )
  await expect(addBelowButton).toBeVisible()

  await addBelowButton.click()

  await wait(300)

  // TODO: test the array row has appeared
}
