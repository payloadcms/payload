import type { Page } from '@playwright/test'

type SelectReactOptionsParams = {
  options: string[] // Array of visible labels to select
  page: Page
  selector: string // Selector for the react-select component
}

export async function selectReactSelectOptions({
  page,
  selector,
  options,
}: SelectReactOptionsParams) {
  const select = page.locator(selector)

  for (const optionText of options) {
    // Check if the option is already selected
    const alreadySelected = await select
      .locator('.multi-value-label__text', {
        hasText: optionText,
      })
      .count()

    if (alreadySelected > 0) {
      continue // Skip if already selected
    }

    // Open the react-select dropdown
    await select.click()

    // Wait for the dropdown menu to appear
    const menu = page.locator('.rs__menu')
    await menu.waitFor({ state: 'visible', timeout: 2000 })

    // Find and click the desired option by visible text
    const optionLocator = page.locator('.rs__option', {
      hasText: optionText,
    })
    if (optionLocator) {
      await optionLocator.click()
    }
  }
}
