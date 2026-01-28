import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { exactText } from '../../../helpers.js'
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

  const column = columnContainer.locator(`.pill-selector .pill-selector__pill`, {
    hasText: exactText(columnLabel),
  })

  const isActiveBeforeClick = await column.evaluate((el) =>
    el.classList.contains('pill-selector__pill--selected'),
  )

  const targetState =
    targetStateFromArgs !== undefined ? targetStateFromArgs : isActiveBeforeClick ? 'off' : 'on'

  await expect(column).toBeVisible()

  const requiresToggle =
    (isActiveBeforeClick && targetState === 'off') || (!isActiveBeforeClick && targetState === 'on')

  if (requiresToggle) {
    await column.click()
  }

  if (targetState === 'off') {
    // no class
    await expect(column).not.toHaveClass(/pill-selector__pill--selected/)
  } else {
    // has class
    await expect(column).toHaveClass(/pill-selector__pill--selected/)
  }

  if (expectURLChange && columnName && requiresToggle) {
    await waitForColumnInURL({ page, columnName, state: targetState })
  }

  return { columnContainer }
}
