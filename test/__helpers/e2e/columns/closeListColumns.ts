import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

/**
 * Closes the column selector in the list view. If it's already closed,
 * does nothing.
 */
export const closeListColumns = async ({
  columnContainerSelector = '.popup__content .column-selector',
  page,
}: {
  columnContainerSelector?: string
  page: Page
}): Promise<void> => {
  const columnContainer = page.locator(columnContainerSelector).first()

  if (await columnContainer.isVisible()) {
    await columnContainer.locator('.column-selector__close').click()
  }

  await expect(columnContainer).toBeHidden()
}
