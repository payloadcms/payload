import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

export const removeAllBlocks = async ({
  page,
  fieldName = 'blocks',
}: {
  fieldName: string
  page: Page
}) => {
  const blocksField = page.locator(`#field-${fieldName}`)

  const blocks = blocksField.locator(`[id^="${fieldName}-row-"]`)
  const count = await blocks.count()

  expect(count).toBeGreaterThan(0)

  for (let i = 0; i < count; i++) {
    // delete in reverse order to avoid index issues
    const block = blocksField.locator(`[id^="${fieldName}-row-${count - i - 1}"]`)
    await block.locator('.array-actions__button').first().click()
    await block.locator('.array-actions__action.array-actions__remove').first().click()
  }
}
