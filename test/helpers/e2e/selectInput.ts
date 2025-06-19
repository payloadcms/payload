import type { Locator, Page } from '@playwright/test'

type SelectReactOptionsParams = {
  page: Page
  selector: string // Selector for the react-select component
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
  page,
  selector,
  options,
  option,
  multiSelect = true,
  clear = true,
}: SelectReactOptionsParams) {
  const select = page.locator(selector)

  if (multiSelect && options) {
    if (clear) {
      await clearSelectInput({
        page,
        selector,
      })
    }

    for (const optionText of options) {
      // Check if the option is already selected
      const alreadySelected = await select
        .locator('.multi-value-label__text', {
          hasText: optionText,
        })
        .count()

      if (alreadySelected === 0) {
        await selectOption({
          page,
          selector,
          optionText,
        })
      }
    }
  } else if (option) {
    // For single selection, ensure only one option is selected
    const alreadySelected = await select
      .locator('.react-select--single-value', {
        hasText: option,
      })
      .count()

    if (alreadySelected === 0) {
      await selectOption({
        page,
        selector,
        optionText: option,
      })
    }
  }
}

async function openSelectMenu({
  page,
  selector,
}: {
  page: Page
  selector: string
}): Promise<Locator> {
  const selectInput = page.locator(selector)
  // Open the react-select dropdown
  await selectInput.click()

  // Wait for the dropdown menu to appear
  const menu = selectInput.locator('.rs__menu')
  await menu.waitFor({ state: 'visible', timeout: 2000 })
  return selectInput
}

async function selectOption({
  page,
  selector,
  optionText,
}: {
  optionText: string
  page: Page
  selector: string
}) {
  const selectorLocator = await openSelectMenu({ page, selector })

  // Find and click the desired option by visible text
  const optionLocator = selectorLocator.locator('.rs__option', {
    hasText: optionText,
  })

  if (optionLocator) {
    await optionLocator.click()
  }
}

type GetSelectInputValueFunction = <TMultiSelect = true>(args: {
  multiSelect: TMultiSelect
  page: Page
  selector: string
}) => Promise<TMultiSelect extends true ? string[] : string | undefined>

export const getSelectInputValue: GetSelectInputValueFunction = async ({
  page,
  selector,
  multiSelect = false,
}) => {
  const select = page.locator(selector)

  if (multiSelect) {
    // For multi-select, get all selected options
    const selectedOptions = await select.locator('.multi-value-label__text').allTextContents()
    return selectedOptions as any
  }

  // For single-select, get the selected value
  const singleValue = await select.locator('.react-select--single-value').textContent()
  return (singleValue ?? undefined) as any
}

export const getSelectInputOptions = async ({
  page,
  selector,
}: {
  page: Page
  selector: string
}): Promise<string[]> => {
  const selectorLocator = await openSelectMenu({ page, selector })
  const options = await selectorLocator.locator('.rs__option').allTextContents()
  return options.map((option) => option.trim()).filter(Boolean)
}

export async function clearSelectInput({ page, selector }: { page: Page; selector: string }) {
  const select = page.locator(selector)

  // Clear the selection if clear is true
  const clearButton = select.locator('.clear-indicator')
  const clearButtonCount = await clearButton.count()
  if (clearButtonCount > 0) {
    await clearButton.click()
  }
}
