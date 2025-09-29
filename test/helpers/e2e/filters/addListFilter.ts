import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { selectInput } from '../selectInput.js'
import { openListFilters } from './openListFilters.js'

export const addListFilter = async ({
  page,
  fieldLabel = 'ID',
  operatorLabel = 'equals',
  value,
}: {
  fieldLabel: string
  operatorLabel: string
  page: Page
  replaceExisting?: boolean
  value?: string | string[]
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

    // Check if this is a react-select component (for relationships, etc.)
    if ((await valueLocator.locator('input.rs__input').count()) > 0) {
      // Handle react-select (relationship fields, etc.)
      if (Array.isArray(value)) {
        // Multi-select case
        await selectInput({
          selectLocator: valueLocator,
          multiSelect: true,
          options: value,
        })
      } else {
        // Single select case
        const valueOptions = condition.locator('.condition__value .rs__option')
        const createValue = valueOptions.locator(`text=Create "${value}"`)
        if ((await createValue.count()) > 0) {
          await createValue.click()
        } else {
          await selectInput({
            selectLocator: valueLocator,
            multiSelect: false,
            option: value,
          })
        }
      }
    } else {
      // Handle regular input fields
      const valueInput = valueLocator.locator('input')
      const inputValue = Array.isArray(value) ? value.join(', ') : value
      await valueInput.fill(inputValue)
      await expect(valueInput).toHaveValue(inputValue)
    }

    await networkPromise
  }

  return { whereBuilder, condition }
}
