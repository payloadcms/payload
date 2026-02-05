import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

export type ToggleOptions = {
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
