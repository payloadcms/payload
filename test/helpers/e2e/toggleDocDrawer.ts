import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { wait } from 'payload/shared'

export async function openDocDrawer({
  page,
  selector,
  withMetaKey = false,
}: {
  page: Page
  selector: string
  withMetaKey?: boolean
}): Promise<void> {
  let clickProperties = {}
  if (withMetaKey) {
    clickProperties = { modifiers: ['ControlOrMeta'] }
  }
  await wait(500) // wait for parent form state to initialize
  await page.locator(selector).click(clickProperties)
  await wait(500) // wait for drawer form state to initialize
}

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
