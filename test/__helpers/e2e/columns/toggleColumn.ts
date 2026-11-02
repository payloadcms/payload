import type { Page } from '@playwright/test'

import type { ColumnToggleOptions, ToggleColumnsResult } from './toggleColumns.js'

import { toggleColumns } from './toggleColumns.js'

export const toggleColumn = async (
  page: Page,
  {
    columnContainerSelector,
    columnLabel,
    columnName,
    expectURLChange = true,
    shouldCloseListColumns = false,
    targetState: targetStateFromArgs,
    togglerSelector,
  }: {
    columnContainerSelector?: string
    shouldCloseListColumns?: boolean
    togglerSelector?: string
  } & ColumnToggleOptions,
): Promise<ToggleColumnsResult> =>
  toggleColumns({
    columnContainerSelector,
    columns: [{ columnLabel, columnName, expectURLChange, targetState: targetStateFromArgs }],
    page,
    shouldCloseListColumns,
    togglerSelector,
  })
