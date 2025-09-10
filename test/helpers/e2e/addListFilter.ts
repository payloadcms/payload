import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'

import { openListFilters } from './openListFilters.js'
import { selectInput } from './selectInput.js'

export const addListFilter = async ({
  page,
  fieldLabel = 'ID',
  operatorLabel = 'equals',
  value = '',
  skipValueInput,
}: {
  fieldLabel: string
  operatorLabel: string
  page: Page
  replaceExisting?: boolean
  skipValueInput?: boolean
  value?: string
}): Promise<{
  whereBuilder: Locator
}> => {
  await openListFilters(page, {})

  const whereBuilder = page.locator('.where-builder')

  await whereBuilder.locator('.where-builder__add-first-filter').click()

  await selectInput({
    selectLocator: whereBuilder.locator('.condition__field'),
    multiSelect: false,
    option: fieldLabel,
  })

  await selectInput({
    selectLocator: whereBuilder.locator('.condition__operator'),
    multiSelect: false,
    option: operatorLabel,
  })

  if (!skipValueInput) {
    const networkPromise = page.waitForResponse(
      (response) =>
        response.url().includes(encodeURIComponent('where[or')) && response.status() === 200,
    )
    const valueLocator = whereBuilder.locator('.condition__value')
    const valueInput = valueLocator.locator('input')
    await valueInput.fill(value)
    await expect(valueInput).toHaveValue(value)

    if ((await valueLocator.locator('input.rs__input').count()) > 0) {
      const valueOptions = whereBuilder.locator('.condition__value .rs__option')
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
    await networkPromise
  }

  return { whereBuilder }
}
