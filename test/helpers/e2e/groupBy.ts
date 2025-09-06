import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { exactText } from 'helpers.js'

type ToggleOptions = {
  groupByContainerSelector: string
  targetState: 'closed' | 'open'
  togglerSelector: string
}

/**
 * Toggles the group-by drawer in the list view based on the targetState option.
 */
export const toggleGroupBy = async (
  page: Page,
  {
    targetState = 'open',
    togglerSelector = '#toggle-group-by',
    groupByContainerSelector = '#list-controls-group-by',
  }: ToggleOptions,
) => {
  const groupByContainer = page.locator(groupByContainerSelector).first()

  const isAlreadyOpen = await groupByContainer.isVisible()

  if (!isAlreadyOpen && targetState === 'open') {
    await page.locator(togglerSelector).first().click()
    await expect(page.locator(`${groupByContainerSelector}.rah-static--height-auto`)).toBeVisible()
  }

  if (isAlreadyOpen && targetState === 'closed') {
    await page.locator(togglerSelector).first().click()
    await expect(page.locator(`${groupByContainerSelector}.rah-static--height-auto`)).toBeHidden()
  }

  return { groupByContainer }
}

/**
 * Closes the group-by drawer in the list view. If it's already closed, does nothing.
 */
export const closeGroupBy = async (
  page: Page,
  options?: Omit<ToggleOptions, 'targetState'>,
): Promise<{
  groupByContainer: Locator
}> => toggleGroupBy(page, { ...(options || ({} as ToggleOptions)), targetState: 'closed' })

/**
 * Opens the group-by drawer in the list view. If it's already open, does nothing.
 */
export const openGroupBy = async (
  page: Page,
  options?: Omit<ToggleOptions, 'targetState'>,
): Promise<{
  groupByContainer: Locator
}> => toggleGroupBy(page, { ...(options || ({} as ToggleOptions)), targetState: 'open' })

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
