import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

/**
 * Sort by columns within the list view.
 * Will search for that field's heading in the selector, and click the appropriate sort button.
 */
export const sortColumn = async (
  page: Page,
  options: {
    fieldLabel: string
    fieldPath: string
    /**
     * Scope the sorting to a specific scope. If not provided, will search the whole page for the column heading.
     */
    scope?: Locator
    targetState: 'asc' | 'desc'
  },
) => {
  const pathAsClassName = options.fieldPath.replace(/\./g, '__')
  const field = (options.scope || page).locator(`#heading-${pathAsClassName}`)

  const upChevron = field.locator('button.sort-column__asc')
  const downChevron = field.locator('button.sort-column__desc')

  if (options.targetState === 'asc') {
    await upChevron.click()
    await expect(field.locator('button.sort-column__asc.sort-column--active')).toBeVisible()
    await page.waitForURL(() => page.url().includes(`sort=${options.fieldPath}`))
  } else if (options.targetState === 'desc') {
    await downChevron.click()
    await expect(field.locator('button.sort-column__desc.sort-column--active')).toBeVisible()
    await page.waitForURL(() => page.url().includes(`sort=-${options.fieldPath}`))
  }
}
