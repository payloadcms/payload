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
  // Detect whether the filters panel was already open before this call. Opening
  // the panel auto-adds an empty first condition, so a freshly opened panel
  // should reuse that condition instead of adding a new one.
  const wasAlreadyOpen = await page.locator('.where-builder').isVisible()

  await openListFilters(page, {})

  const whereBuilder = page.locator('.where-builder')

  const filters = whereBuilder.locator('.condition')

  if (wasAlreadyOpen) {
    // The panel already had condition(s), so add another and manipulate _that_
    // instead of an existing condition.
    const countBefore = await filters.count()
    const addFilterButtons = whereBuilder.locator('.where-builder__add-or')
    await addFilterButtons.last().click()
    await expect(filters).toHaveCount(countBefore + 1)
  }

  expect(await filters.count()).toBeGreaterThan(0)

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

    // Check if this is a react-select input
    const isReactSelect = (await valueLocator.locator('input.rs__input').count()) > 0

    if (isReactSelect) {
      if (Array.isArray(value)) {
        // For multi-select with array values
        await selectInput({
          selectLocator: valueLocator,
          multiSelect: true,
          options: value,
        })
      } else {
        // For single select - fill input first to trigger search, then select option
        const valueInput = valueLocator.locator('input')
        await valueInput.fill(value)

        const valueOptions = page.locator('.rs__menu .rs__option')
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
    } else {
      // For regular input fields (non react-select)
      const valueInput = valueLocator.locator('input')
      const stringValue = Array.isArray(value) ? value.join(',') : value
      await valueInput.fill(stringValue)
      await expect(valueInput).toHaveValue(stringValue)
    }

    await networkPromise
  }

  return { whereBuilder, condition }
}
