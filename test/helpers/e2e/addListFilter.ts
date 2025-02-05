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

  const operatorField = page.locator('.condition__operator')
  const valueField = page.locator('.condition__value input')

  await operatorField.click()

  const dropdownOptions = operatorField.locator('.rs__option')
  await dropdownOptions.locator(`text=${operatorLabel}`).click()

  if (!skipValueInput) {
    await valueField.fill(value)
    await wait(500)
    const firstValueField = page.locator('.condition__value >> input')
    await expect(firstValueField).toHaveValue('hello')
  }
}
