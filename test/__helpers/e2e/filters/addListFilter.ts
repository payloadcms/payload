import type { Locator, Page } from '@playwright/test'

import { testIds } from '@payloadcms/ui/shared'
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

  const whereBuilder = page.getByTestId(testIds.whereBuilder.root)

  const addFirst = whereBuilder.getByTestId(testIds.whereBuilder.addFirstFilter)
  const initializedEmpty = await addFirst.isVisible()

  if (initializedEmpty) {
    await addFirst.click()
  }

  const filters = whereBuilder.locator('.where-builder__or-filters > li')
  expect(await filters.count()).toBeGreaterThan(0)

  // If there were already filter(s), need to add another and manipulate _that_ instead of the existing one
  if (!initializedEmpty) {
    const addFilterButtons = whereBuilder.getByTestId(testIds.whereBuilder.addOr)
    await addFilterButtons.last().click()
    await expect(filters).toHaveCount(2)
  }

  const condition = filters.last()

  await selectInput({
    selectLocator: condition.getByTestId(testIds.whereBuilder.condition.field),
    multiSelect: false,
    option: fieldLabel,
  })

  await selectInput({
    selectLocator: condition.getByTestId(testIds.whereBuilder.condition.operator),
    multiSelect: false,
    option: operatorLabel,
  })

  if (value !== undefined) {
    const networkPromise = page.waitForResponse(
      (response) =>
        response.url().includes(encodeURIComponent('where[or')) && response.status() === 200,
    )
    const valueLocator = condition.getByTestId(testIds.whereBuilder.condition.value)
    const valueInput = valueLocator.locator('input')
    await valueInput.fill(value)
    await expect(valueInput).toHaveValue(value)

    if ((await valueLocator.locator('input.rs__input').count()) > 0) {
      const valueOptions = valueLocator.locator('.rs__option')
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
