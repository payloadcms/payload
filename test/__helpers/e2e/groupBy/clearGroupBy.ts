import type { Locator, Page } from '@playwright/test'

import { testIds } from '@payloadcms/ui/shared'
import { expect } from '@playwright/test'

import { openGroupBy } from './openGroupBy.js'

export const clearGroupBy = async (page: Page): Promise<{ groupByContainer: Locator }> => {
  const { groupByContainer } = await openGroupBy(page)

  await groupByContainer.getByTestId(testIds.groupBy.reset).click()
  const field = groupByContainer.getByTestId(testIds.groupBy.fieldSelect)

  await expect(field.locator('.react-select--single-value')).toHaveText('Select a value')
  await expect(groupByContainer.getByTestId(testIds.groupBy.reset)).toBeHidden()
  await expect(page).not.toHaveURL(/&groupBy=/)
  await expect(
    groupByContainer.getByTestId(testIds.field('direction')).locator('input'),
  ).toBeDisabled()
  await expect(page.locator('.table-wrap')).toHaveCount(1)
  await expect(page.locator('.group-by-header')).toHaveCount(0)

  return { groupByContainer }
}
