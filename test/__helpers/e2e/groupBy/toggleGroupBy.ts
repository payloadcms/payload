import type { Page } from '@playwright/test'

import { testIds } from '@payloadcms/ui/shared'
import { expect } from '@playwright/test'

export type ToggleOptions = {
  groupByContainerSelector?: string
  targetState: 'closed' | 'open'
  togglerSelector?: string
}

/**
 * Toggles the group-by drawer in the list view based on the targetState option.
 */
export const toggleGroupBy = async (
  page: Page,
  { targetState = 'open', togglerSelector, groupByContainerSelector }: ToggleOptions,
) => {
  const toggler = togglerSelector
    ? page.locator(togglerSelector)
    : page.getByTestId(testIds.groupBy.toggle)

  const groupByContainer = groupByContainerSelector
    ? page.locator(groupByContainerSelector).first()
    : page.getByTestId(testIds.groupBy.container).first()

  const containerSelector =
    groupByContainerSelector ?? `[data-testid="${testIds.groupBy.container}"]`

  const isAlreadyOpen = await groupByContainer.isVisible()

  if (!isAlreadyOpen && targetState === 'open') {
    await toggler.first().click()
    await expect(page.locator(`${containerSelector}.rah-static--height-auto`)).toBeVisible()
  }

  if (isAlreadyOpen && targetState === 'closed') {
    await toggler.first().click()
    await expect(page.locator(`${containerSelector}.rah-static--height-auto`)).toBeHidden()
  }

  return { groupByContainer }
}
