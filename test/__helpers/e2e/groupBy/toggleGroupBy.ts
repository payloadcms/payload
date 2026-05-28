import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

export type ToggleOptions = {
  targetState: 'closed' | 'open'
}

/**
 * Toggles the group-by popup in the list view based on the targetState option.
 */
export const toggleGroupBy = async (page: Page, { targetState = 'open' }: ToggleOptions) => {
  const groupByButton = page.locator('#toggle-group-by').first()
  const groupByContent = page.locator('.group-by-control__popup .group-by-control__content').first()

  const isAlreadyOpen = await groupByContent.isVisible()

  if (!isAlreadyOpen && targetState === 'open') {
    await groupByButton.click()
    await expect(groupByContent).toBeVisible()
  }

  if (isAlreadyOpen && targetState === 'closed') {
    // Click the close button inside the popup
    await groupByContent.locator('.group-by-control__header-actions button').last().click()
    await expect(groupByContent).toBeHidden()
  }

  return { groupByContent }
}
