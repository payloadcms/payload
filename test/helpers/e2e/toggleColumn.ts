import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { exactText } from '../../helpers.js'
import { openListColumns } from './openListColumns.js'

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

  const column = columnContainer.locator(`.column-selector .column-selector__column`, {
    hasText: exactText(columnLabel),
  })

  const isActiveBeforeClick = await column.evaluate((el) =>
    el.classList.contains('column-selector__column--active'),
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
    await expect(column).not.toHaveClass(/column-selector__column--active/)
  } else {
    // has class
    await expect(column).toHaveClass(/column-selector__column--active/)
  }

  if (expectURLChange && columnName && requiresToggle) {
    await waitForColumnInURL({ page, columnName, state: targetState })
  }

  return { columnContainer }
}

export const waitForColumnInURL = async ({
  page,
  columnName,
  state,
}: {
  columnName: string
  page: Page
  state: 'off' | 'on'
}): Promise<void> => {
  await page.waitForURL(/.*\?.*/)

  const identifier = `${state === 'off' ? '-' : ''}${columnName}`

  // Test that the identifier is in the URL
  // It must appear in the `columns` query parameter, i.e. after `columns=...` and before the next `&`
  // It must also appear in it entirety to prevent partially matching other values, i.e. between quotation marks
  const regex = new RegExp(`columns=([^&]*${encodeURIComponent(`"${identifier}"`)}[^&]*)`)

  await page.waitForURL(regex)
}
