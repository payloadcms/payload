import type { Locator, Page } from '@playwright/test'

import type { ToggleOptions } from './toggleGroupBy.js'

import { toggleGroupBy } from './toggleGroupBy.js'

/**
 * Opens the group-by drawer in the list view. If it's already open, does nothing.
 */
export const openGroupBy = async (
  page: Page,
  options?: Omit<ToggleOptions, 'targetState'>,
): Promise<{
  groupByContainer: Locator
}> => toggleGroupBy(page, { ...(options || ({} as ToggleOptions)), targetState: 'open' })
