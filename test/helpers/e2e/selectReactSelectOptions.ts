import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

type SelectReactOptionsParams = {
  /**
   * The container selector for the react-select component.
   */
  containerSelector: string
  /**
   * Array of options to select from the react-select component.
   */
  options: string[]
  page: Page
}

export async function selectReactSelectOptions({
  page,
  containerSelector,
  options,
}: SelectReactOptionsParams) {
  const container = page.locator(containerSelector)
  await expect(container).toBeVisible() // Ensure the select element is visible

  for (const optionText of options) {
    // Check if the option is already selected
    const alreadySelected = await container
      .locator('.multi-value-label__text', {
        hasText: optionText,
      })
      .count()

    if (alreadySelected > 0) {
      continue // Skip if already selected
    }

    await container.locator('.dropdown-indicator').click()

    // Wait for the dropdown menu to appear
    const menu = container.locator('.rs__menu')
    await menu.waitFor({ state: 'visible', timeout: 2000 })

    // Find and click the desired option by visible text
    const optionLocator = container.locator('.rs__option', {
      hasText: optionText,
    })
    if (optionLocator) {
      await optionLocator.click()
    }
  }
}
