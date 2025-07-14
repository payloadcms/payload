import { expect } from '@playwright/test'

/**
 * Sort by columns within the list view.
 * Will search for that field's heading in the table, and click the appropriate sort button.
 */
export const sortColumn = async (
  page: any,
  options: { fieldLabel: string; fieldPath: string; targetState: 'asc' | 'desc' },
) => {
  const pathAsClassName = options.fieldPath.replace(/\./g, '__')
  const field = page.locator(`#heading-${pathAsClassName}`)

  const upChevron = field.locator('button.sort-column__asc')
  const downChevron = field.locator('button.sort-column__desc')

  if (options.targetState === 'asc') {
    await downChevron.click()
    await expect(field.locator('button.sort-column__asc.sort-column--active')).toBeVisible()
    await page.waitForURL((url: string) => url.includes(`sort=${options.fieldPath}`))
  } else if (options.targetState === 'desc') {
    await upChevron.click()
    await expect(field.locator('button.sort-column__desc.sort-column--active')).toBeVisible()
    await page.waitForURL((url: string) => url.includes(`sort=-${options.fieldPath}`))
  }
}
