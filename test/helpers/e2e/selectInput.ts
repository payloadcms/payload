import type { Locator, Page } from '@playwright/test'

type SelectReactOptionsParams = {
  selectLocator: Locator // Locator for the react-select component
} & (
  | {
      clear?: boolean // Whether to clear the selection before selecting new options
      multiSelect: true // Multi-selection mode
      option?: never
      options: string[] // Array of visible labels to select
    }
  | {
      clear?: never
      multiSelect: false // Single selection mode
      option: string // Single visible label to select
      options?: never
    }
)

export async function selectInput({
  selectLocator,
  options,
  option,
  multiSelect = true,
  clear = true,
}: SelectReactOptionsParams) {
  if (multiSelect && options) {
    if (clear) {
      await clearSelectInput({
        selectLocator,
      })
    }

    for (const optionText of options) {
      // Check if the option is already selected
      const alreadySelected = await selectLocator
        .locator('.multi-value-label__text', {
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
      .locator('.react-select--single-value', {
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
    hasText: optionText,
  })

  if (optionLocator) {
    await optionLocator.click()
  }
}

type GetSelectInputValueFunction = <TMultiSelect = true>(args: {
  multiSelect: TMultiSelect
  selectLocator: Locator
}) => Promise<TMultiSelect extends true ? string[] : string | undefined>

export const getSelectInputValue: GetSelectInputValueFunction = async ({
  selectLocator,
  multiSelect = false,
}) => {
  if (multiSelect) {
    // For multi-select, get all selected options
    const selectedOptions = await selectLocator
      .locator('.multi-value-label__text')
      .allTextContents()
    return selectedOptions || []
  }

  // For single-select, get the selected value
  const singleValue = await selectLocator.locator('.react-select--single-value').textContent()
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
