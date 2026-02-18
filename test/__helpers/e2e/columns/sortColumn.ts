import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

/**
 * Sort by columns within the list view.
 * Will search for that field's heading in the selector, and click the appropriate sort button.
 */
export const sortColumn = async (
  page: Page,
  options: {
    fieldPath: string
    /**
     * Scope the sorting to a specific DOM tree.
     * If not provided, will search the whole page for the column heading.
     */
    scope?: Locator
    targetState: 'asc' | 'desc'
  },
) => {
  const pathAsClassName = options.fieldPath.replace(/\./g, '__')
  const columnHeading = (options.scope || page).locator(`#heading-${pathAsClassName}`)

  const upChevron = columnHeading.locator('button.sort-column__asc')
  const downChevron = columnHeading.locator('button.sort-column__desc')

  if (options.targetState === 'asc') {
    await upChevron.waitFor({ state: 'visible' })
    await upChevron.click({ delay: 100 })
    const activeButton = columnHeading.locator('button.sort-column__asc.sort-column--active')
    await activeButton.waitFor({ state: 'visible' })
    await expect(activeButton).toBeVisible()
    await page.waitForURL(() => page.url().includes(`sort=${options.fieldPath}`))
  } else if (options.targetState === 'desc') {
    await downChevron.waitFor({ state: 'visible' })
    await downChevron.click({ delay: 100 })
    const activeButton = columnHeading.locator('button.sort-column__desc.sort-column--active')
    await activeButton.waitFor({ state: 'visible' })
    await expect(activeButton).toBeVisible()
    await page.waitForURL(() => page.url().includes(`sort=-${options.fieldPath}`))
  }
}
