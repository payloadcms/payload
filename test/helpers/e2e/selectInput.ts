import { expect, type Locator } from '@playwright/test'

import { exactText } from './helpers.js'

type SelectReactOptionsParams = {
  filter?: string // Optional filter text to narrow down options
  selectLocator: Locator // Locator for the react-select component
  selectType?: 'relationship' | 'select'
} & (
  | {
      clear?: boolean // Whether to clear the selection before selecting new options
      multiSelect: true // Multi-selection mode
      option?: never
      options: string[] // Array of visible labels to select
    }
  | {
      clear?: never
      multiSelect: false | undefined // Single selection mode
      option: string // Single visible label to select
      options?: never
    }
)

const selectors = {
  hasMany: {
    relationship: '.relationship--multi-value-label__text',
    select: '.multi-value-label__text',
  },
  hasOne: {
    relationship: '.relationship--single-value__text',
    select: '.react-select--single-value',
  },
}

export async function selectInput({
  selectLocator,
  options,
  option,
  multiSelect = true,
  clear = true,
  filter,
  selectType = 'select',
}: SelectReactOptionsParams) {
  if (filter) {
    // Open the select menu to access the input field
    await openSelectMenu({ selectLocator })

    // Type the filter text into the input field
    const inputLocator = selectLocator.locator('.rs__input[type="text"]')
    await inputLocator.fill(filter)
  }

  if (multiSelect && options) {
    if (clear) {
      await clearSelectInput({
        selectLocator,
      })
    }

    for (const optionText of options) {
      // Check if the option is already selected
      const alreadySelected = await selectLocator
        .locator(selectors.hasMany[selectType], {
          hasText: optionText,
        })
        .count()

      if (alreadySelected === 0) {
        await selectOption({
          selectLocator,
          optionText,
        })
      }
    }
  } else if (option) {
    // For single selection, ensure only one option is selected
    const alreadySelected = await selectLocator
      .locator(selectors.hasOne[selectType], {
        hasText: option,
      })
      .count()

    if (alreadySelected === 0) {
      await selectOption({
        selectLocator,
        optionText: option,
      })
    }
  }
}

export async function openSelectMenu({ selectLocator }: { selectLocator: Locator }): Promise<void> {
  if (await selectLocator.locator('.rs__menu').isHidden()) {
    // Open the react-select dropdown
    await selectLocator.locator('button.dropdown-indicator').click()
  }

  // Wait for the dropdown menu to appear
  const menu = selectLocator.locator('.rs__menu')
  await menu.waitFor({ state: 'visible', timeout: 2000 })
}

async function selectOption({
  selectLocator,
  optionText,
}: {
  optionText: string
  selectLocator: Locator
}) {
  await openSelectMenu({ selectLocator })

  // Find and click the desired option by visible text
  const optionLocator = selectLocator.locator('.rs__option', {
    hasText: exactText(optionText),
  })

  if (optionLocator) {
    await optionLocator.click()
  }
}

type GetSelectInputValueFunction = <TMultiSelect = true>(args: {
  multiSelect: TMultiSelect
  selectLocator: Locator
  selectType?: 'relationship' | 'select'
  valueLabelClass?: string
}) => Promise<TMultiSelect extends true ? string[] : false | string | undefined>

export const getSelectInputValue: GetSelectInputValueFunction = async ({
  selectLocator,
  multiSelect = false,
  selectType = 'select',
}) => {
  if (multiSelect) {
    // For multi-select, get all selected options
    const selectedOptions = await selectLocator
      .locator(selectors.hasMany[selectType])
      .allTextContents()
    return selectedOptions || []
  }

  await expect(selectLocator).toBeVisible()

  // For single-select, get the selected value
  const valueLocator = selectLocator.locator(selectors.hasOne[selectType])
  const count = await valueLocator.count()
  if (count === 0) {
    return false
  }
  const singleValue = await valueLocator.textContent()
  return (singleValue ?? undefined) as any
}

export const getSelectInputOptions = async ({
  selectLocator,
}: {
  selectLocator: Locator
}): Promise<string[]> => {
  await openSelectMenu({ selectLocator })
  const options = await selectLocator.locator('.rs__option').allTextContents()
  return options.map((option) => option.trim()).filter(Boolean)
}

export async function clearSelectInput({ selectLocator }: { selectLocator: Locator }) {
  // Clear the selection if clear is true
  const clearButton = selectLocator.locator('.clear-indicator')
  if (await clearButton.isVisible()) {
    const clearButtonCount = await clearButton.count()
    if (clearButtonCount > 0) {
      await clearButton.click()
    }
  }
}
