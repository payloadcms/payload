import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { getColumnSelectorItem } from './clickPillSelectorItem.js'
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

  const column = getColumnSelectorItem({ container: columnContainer, label: columnLabel })

  // New column selector uses --inactive class when column is hidden
  const isActiveBeforeClick = await column.evaluate(
    (el) => !el.classList.contains('column-selector__item--inactive'),
  )

  const targetState =
    targetStateFromArgs !== undefined ? targetStateFromArgs : isActiveBeforeClick ? 'off' : 'on'

  await expect(column).toBeVisible()

  const requiresToggle =
    (isActiveBeforeClick && targetState === 'off') || (!isActiveBeforeClick && targetState === 'on')

  if (requiresToggle) {
    // Click the switch inside the column item
    await column.locator('.switch').click()
  }

  if (targetState === 'off') {
    // Has --inactive class when off
    await expect(column).toHaveClass(/column-selector__item--inactive/)
  } else {
    // No --inactive class when on
    await expect(column).not.toHaveClass(/column-selector__item--inactive/)
  }

  if (expectURLChange && columnName && requiresToggle) {
    await waitForColumnInURL({ page, columnName, state: targetState })
  }

  return { columnContainer }
}
