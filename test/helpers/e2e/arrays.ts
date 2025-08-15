import type { Page } from 'playwright'

import { wait } from 'payload/shared'
import { expect } from 'playwright/test'

/**
 * Opens the row actions menu for the specified array row.
 * If already open, does nothing.
 */
export const openArrayRowActions = async (page: Page, fieldName: string, rowIndex: number) => {
  const rowActions = page.locator(
    `#field-${fieldName} #array-row-${rowIndex} .array-actions__action`,
  )

  if (await rowActions.isVisible()) {
    return
  }

  const rowActionsButton = page.locator(
    `#field-${fieldName} #array-row-${rowIndex} .array-actions__button`,
  )

  await rowActionsButton.click()

  await expect(rowActions).toBeVisible()
}

/**
 * Adds an array row to the end of the array using the primary "Add Row" button.
 */
export const addArrayRow = async (page: Page, fieldName: string) => {
  const addRowButton = page.locator(`#field-${fieldName} > .array-field__add-row`)

  await expect(addRowButton).toBeVisible()

  await addRowButton.click()

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

/**
 * Removes an array row at the specified index.
 */
export const removeArrayRow = async (page: Page, fieldName: string, rowIndex: number) => {
  await openArrayRowActions(page, fieldName, rowIndex)

  await page
    .locator(
      `#field-${fieldName} #array-row-${rowIndex} .array-actions__action.array-actions__remove`,
    )
    .click()

  // TODO: test the array row has been removed
  // another row may have been moved into its place, though
}

/**
 * Duplicates the array row at the specified index.
 */
export const duplicateArrayRow = async (page: Page, fieldName: string, rowIndex: number) => {
  await openArrayRowActions(page, fieldName, rowIndex)

  await page
    .locator(
      `#field-${fieldName} #array-row-${rowIndex} .array-actions__action.array-actions__duplicate`,
    )
    .click()

  // TODO: test the array row has been duplicated

  await wait(300)
}
