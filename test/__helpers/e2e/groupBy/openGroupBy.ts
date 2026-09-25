import type { Locator, Page } from '@playwright/test'

import { toggleGroupBy } from './toggleGroupBy.js'

/**
 * Opens the group-by popup in the list view. If it's already open, does nothing.
 */
export const openGroupBy = async (
  page: Page,
): Promise<{
  groupByContent: Locator
}> => toggleGroupBy(page, { targetState: 'open' })
