import type { Locator, Page } from '@playwright/test'

import type { ToggleOptions } from './toggleGroupBy.js';

import { toggleGroupBy } from './toggleGroupBy.js'

/**
 * Closes the group-by drawer in the list view. If it's already closed, does nothing.
 */
export const closeGroupBy = async (
  page: Page,
  options?: Omit<ToggleOptions, 'targetState'>,
): Promise<{
  groupByContainer: Locator
}> => toggleGroupBy(page, { ...(options || ({} as ToggleOptions)), targetState: 'closed' })
