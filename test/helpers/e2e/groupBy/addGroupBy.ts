import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { exactText } from 'helpers.js'

import { openGroupBy } from './openGroupBy.js'

export const addGroupBy = async (
  page: Page,
  { fieldLabel, fieldPath }: { fieldLabel: string; fieldPath: string },
): Promise<{ field: Locator; groupByContainer: Locator }> => {
  const { groupByContainer } = await openGroupBy(page)
  const field = groupByContainer.locator('#group-by--field-select')

  await field.click()
  await field.locator('.rs__option', { hasText: exactText(fieldLabel) })?.click()
  await expect(field.locator('.react-select--single-value')).toHaveText(fieldLabel)

  await expect(page).toHaveURL(new RegExp(`[&?]groupBy=${fieldPath}`))
  await expect(page.locator('body')).not.toContainText('Loading')

  return { field, groupByContainer }
}
