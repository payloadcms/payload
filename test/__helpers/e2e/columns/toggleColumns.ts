import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { getColumnSelectorItem } from './clickPillSelectorItem.js'
import { closeListColumns } from './closeListColumns.js'
import { openListColumns } from './openListColumns.js'
import { waitForColumnInURL } from './waitForColumnsInURL.js'

export type ColumnToggleOptions = {
  columnLabel: string
  columnName?: string
  expectURLChange?: boolean
  targetState?: 'off' | 'on'
}

export type ToggleColumnsResult = {
  columnContainer: Locator
}

/**
 * Toggles multiple list view columns while keeping the selector open between items.
 * The selector remains open after the batch unless `shouldCloseListColumns` is true.
 */
export const toggleColumns = async ({
  columnContainerSelector,
  columns,
  page,
  shouldCloseListColumns = false,
  togglerSelector,
}: {
  columnContainerSelector?: string
  columns: ColumnToggleOptions[]
  page: Page
  shouldCloseListColumns?: boolean
  togglerSelector?: string
}): Promise<ToggleColumnsResult> => {
  const { columnContainer } = await openListColumns(page, {
    columnContainerSelector,
    togglerSelector,
  })

  for (const {
    columnLabel,
    columnName,
    expectURLChange = true,
    targetState: targetStateFromArgs,
  } of columns) {
    const column = getColumnSelectorItem({ container: columnContainer, label: columnLabel })

    const isActiveBeforeClick = await column.evaluate(
      (element) => !element.classList.contains('column-selector__item--inactive'),
    )

    const targetState =
      targetStateFromArgs !== undefined ? targetStateFromArgs : isActiveBeforeClick ? 'off' : 'on'

    await expect(column).toBeVisible()

    const requiresToggle =
      (isActiveBeforeClick && targetState === 'off') ||
      (!isActiveBeforeClick && targetState === 'on')

    if (requiresToggle) {
      await column.locator('.switch').click()
    }

    if (targetState === 'off') {
      await expect(column).toHaveClass(/column-selector__item--inactive/)
    } else {
      await expect(column).not.toHaveClass(/column-selector__item--inactive/)
    }

    if (expectURLChange && columnName && requiresToggle) {
      await waitForColumnInURL({ columnName, page, state: targetState })
    }
  }

  if (shouldCloseListColumns) {
    await closeListColumns({ columnContainerSelector, page })
  }

  return { columnContainer }
}
