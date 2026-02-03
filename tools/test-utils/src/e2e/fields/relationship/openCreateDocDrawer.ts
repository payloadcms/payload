import type { Page } from 'playwright'

import { wait } from 'payload/shared'
import { expect } from 'playwright/test'

export async function openCreateDocDrawer({
  page,
  fieldSelector,
}: {
  fieldSelector: string
  page: Page
}): Promise<void> {
  await wait(500) // wait for parent form state to initialize
  const relationshipField = page.locator(fieldSelector)
  await expect(relationshipField.locator('input')).toBeEnabled()
  const addNewButton = relationshipField.locator('.relationship-add-new__add-button')
  await expect(addNewButton).toBeVisible()
  await addNewButton.click()
  await wait(500) // wait for drawer form state to initialize
}
