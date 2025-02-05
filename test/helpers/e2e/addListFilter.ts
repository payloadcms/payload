import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { exactText } from 'helpers.js'
import { wait } from 'payload/shared'

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
  skipValueInput?: boolean
  value?: string
}) => {
  await page.locator('.where-builder__add-first-filter').click()

  const conditionField = page.locator('.condition__field')
  await conditionField.click()
  const dropdownFieldOption = conditionField.locator('.rs__option', {
    hasText: exactText(fieldLabel),
  })
  await dropdownFieldOption.click()
  await expect(page.locator('.condition__field')).toContainText(fieldLabel)

  const operatorInput = page.locator('.condition__operator')

  await operatorInput.click()

  const dropdownOptions = operatorInput.locator('.rs__option')
  await dropdownOptions.locator(`text=${operatorLabel}`).click()

  if (!skipValueInput) {
    const valueInput = page.locator('.condition__value >> input')
    await valueInput.fill(value)
    await wait(500)
    await expect(valueInput).toHaveValue(value)
  }
}
