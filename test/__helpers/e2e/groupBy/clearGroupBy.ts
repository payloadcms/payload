import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { openGroupBy } from './openGroupBy.js'

export const clearGroupBy = async (page: Page): Promise<{ groupByContainer: Locator }> => {
  const { groupByContainer } = await openGroupBy(page)

  await groupByContainer.locator('#group-by--reset').click()
  const field = groupByContainer.locator('#group-by--field-select')

  await expect(field.locator('.react-select--single-value')).toHaveText('Select a value')
  await expect(groupByContainer.locator('#group-by--reset')).toBeHidden()
  await expect(page).not.toHaveURL(/&groupBy=/)
  await expect(groupByContainer.locator('#field-direction input')).toBeDisabled()
  await expect(page.locator('.table-wrap')).toHaveCount(1)
  await expect(page.locator('.group-by-header')).toHaveCount(0)

  return { groupByContainer }
}
