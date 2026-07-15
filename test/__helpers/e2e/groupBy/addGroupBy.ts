import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { exactText } from '../helpers.js'
import { openGroupBy } from './openGroupBy.js'

export const addGroupBy = async (
  page: Page,
  { fieldLabel, fieldPath }: { fieldLabel: string; fieldPath: string },
): Promise<{ groupByContent: Locator }> => {
  const { groupByContent } = await openGroupBy(page)

  // Click the field selector trigger (first select button)
  const fieldSelectTrigger = groupByContent.locator('.group-by-control__select-trigger').first()
  await fieldSelectTrigger.click()

  // Select the field from the popup
  const fieldOption = page.locator('.popup-button-list .popup-button-list__button', {
    hasText: exactText(fieldLabel),
  })
  await fieldOption.click()

  // Verify the field is selected
  await expect(fieldSelectTrigger.locator('.group-by-control__select-value')).toHaveText(fieldLabel)

  await expect(page).toHaveURL(new RegExp(`[&?]groupBy=${fieldPath}`))
  await expect(page.locator('body')).not.toContainText('Loading')

  return { groupByContent }
}
