import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { selectInput } from '../selectInput.js'
import { openListFilters } from './openListFilters.js'

export const addListFilter = async ({
  page,
  fieldLabel = 'ID',
  operatorLabel = 'equals',
  value,
  multiSelect,
}: {
  fieldLabel: string
  multiSelect?: boolean
  operatorLabel: string
  page: Page
  replaceExisting?: boolean
  value?: string
}): Promise<{
  /**
   * A Locator pointing to the condition that was just added.
   */
  condition: Locator
  /**
   * A Locator pointing to the WhereBuilder node.
   */
  whereBuilder: Locator
}> => {
  await openListFilters(page, {})

  const whereBuilder = page.locator('.where-builder')

  const addFirst = whereBuilder.locator('.where-builder__add-first-filter')
  const initializedEmpty = await addFirst.isVisible()

  if (initializedEmpty) {
    await addFirst.click()
    // Wait for navigation to complete (URL will have where param)
    await page.waitForURL(/where/)
    // Wait for the filter row to appear after re-render
    await expect(whereBuilder.locator('.where-builder__or-filters > li').first()).toBeVisible()
  }

  const filters = whereBuilder.locator('.where-builder__or-filters > li')
  expect(await filters.count()).toBeGreaterThan(0)

  // If there were already filter(s), need to add another and manipulate _that_ instead of the existing one
  if (!initializedEmpty) {
    const addFilterButtons = whereBuilder.locator('.where-builder__add-or')
    await addFilterButtons.last().click()
    await expect(filters).toHaveCount(2)
  }

  const condition = filters.last()

  await selectInput({
    selectLocator: condition.locator('.condition__field'),
    multiSelect: false,
    option: fieldLabel,
  })

  await selectInput({
    selectLocator: condition.locator('.condition__operator'),
    multiSelect: false,
    option: operatorLabel,
  })

  if (value !== undefined) {
    const networkPromise = page.waitForResponse(
      (response) =>
        response.url().includes(encodeURIComponent('where[or')) && response.status() === 200,
    )
    const valueLocator = condition.locator('.condition__value')
    const valueInput = valueLocator.locator('input')
    await valueInput.fill(value)
    await expect(valueInput).toHaveValue(value)

    if ((await valueLocator.locator('input.rs__input').count()) > 0) {
      const valueOptions = condition.locator('.condition__value .rs__option')
      const createValue = valueOptions.locator(`text=Create "${value}"`)
      if ((await createValue.count()) > 0) {
        await createValue.click()
      } else {
        await selectInput({
          selectLocator: valueLocator,
          multiSelect: multiSelect ? undefined : false,
          option: value,
        })
      }
    }
    await networkPromise
  }

  return { whereBuilder, condition }
}
