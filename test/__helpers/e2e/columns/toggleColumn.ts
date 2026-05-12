import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { getPillSelectorItem } from './clickPillSelectorItem.js'
import { openListColumns } from './openListColumns.js'
import { waitForColumnInURL } from './waitForColumnsInURL.js'

export const toggleColumn = async (
  page: Page,
  {
    togglerSelector,
    columnContainerSelector,
    columnLabel,
    targetState: targetStateFromArgs,
    columnName,
    expectURLChange = true,
  }: {
    columnContainerSelector?: string
    columnLabel: string
    columnName?: string
    expectURLChange?: boolean
    targetState?: 'off' | 'on'
    togglerSelector?: string
  },
): Promise<{
  columnContainer: Locator
}> => {
  const { columnContainer } = await openListColumns(page, {
    togglerSelector,
    columnContainerSelector,
  })

  const column = getPillSelectorItem({ container: columnContainer, label: columnLabel })

  const isActiveBeforeClick = await column.evaluate((el) => el.classList.contains('chip--selected'))

  const targetState =
    targetStateFromArgs !== undefined ? targetStateFromArgs : isActiveBeforeClick ? 'off' : 'on'

  await expect(column).toBeVisible()

  const requiresToggle =
    (isActiveBeforeClick && targetState === 'off') || (!isActiveBeforeClick && targetState === 'on')

  if (requiresToggle) {
    await column.locator('.chip__action').click()
  }

  if (targetState === 'off') {
    // no class
    await expect(column).not.toHaveClass(/chip--selected/)
  } else {
    // has class
    await expect(column).toHaveClass(/chip--selected/)
  }

  if (expectURLChange && columnName && requiresToggle) {
    await waitForColumnInURL({ page, columnName, state: targetState })
  }

  return { columnContainer }
}
