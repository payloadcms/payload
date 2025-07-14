import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { exactText } from 'helpers.js'

/**
 * Opens the group-by drawer in the list view. If it's already open, does nothing.
 * Return the filter container locator for further interactions.
 */
export const openGroupBy = async (
  page: Page,
  {
    togglerSelector = '#toggle-group-by',
    groupByContainerSelector = '#list-controls-group-by',
  }: {
    groupByContainerSelector?: string
    togglerSelector?: string
  } = {},
): Promise<{
  groupByContainer: Locator
}> => {
  const groupByContainer = page.locator(groupByContainerSelector).first()

  const isAlreadyOpen = await groupByContainer.isVisible()

  if (!isAlreadyOpen) {
    await page.locator(togglerSelector).first().click()
  }

  await expect(page.locator(`${groupByContainerSelector}.rah-static--height-auto`)).toBeVisible()

  return { groupByContainer }
}

export const addGroupBy = async (
  page: Page,
  { fieldLabel, fieldPath }: { fieldLabel: string; fieldPath: string },
): Promise<{ field: Locator; groupByContainer: Locator }> => {
  const { groupByContainer } = await openGroupBy(page)
  const field = groupByContainer.locator('#group-by--field-select')

  await field.click()
  await field.locator('.rs__option', { hasText: exactText(fieldLabel) })?.click()
  await expect(field.locator('.react-select--single-value')).toHaveText(fieldLabel)

  await expect(page).toHaveURL(new RegExp(`&groupBy=${fieldPath}`))

  return { groupByContainer, field }
}
