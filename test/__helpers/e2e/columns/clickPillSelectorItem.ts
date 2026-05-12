import type { Locator, Page } from '@playwright/test'

import { exactText } from '../helpers.js'

/**
 * Click on a pill selector item (column chip) to toggle its selection state.
 * This helper encapsulates the locator pattern for pill selector items which use
 * the Chip component internally.
 *
 * @param params.container - The container (Page or Locator) to search within
 * @param params.label - The exact text label of the pill to click
 * @returns The locator for the pill item (useful for further assertions)
 */
export const clickPillSelectorItem = async ({
  container,
  label,
}: {
  container: Locator | Page
  label: string
}): Promise<Locator> => {
  const pill = container.locator('.pill-selector .pill-selector__draggable-item', {
    hasText: exactText(label),
  })

  await pill.locator('.chip__action').click()

  return pill
}

/**
 * Get a locator for a pill selector item without clicking it.
 * Useful for assertions or when you need more control over the interaction.
 */
export const getPillSelectorItem = ({
  container,
  label,
}: {
  container: Locator | Page
  label: string
}): Locator => {
  return container.locator('.pill-selector .pill-selector__draggable-item', {
    hasText: exactText(label),
  })
}

/**
 * Check if a pill selector item is selected (has chip--selected class)
 */
export const isPillSelectorItemSelected = async ({
  container,
  label,
}: {
  container: Locator | Page
  label: string
}): Promise<boolean> => {
  const pill = getPillSelectorItem({ container, label })
  const classes = await pill.getAttribute('class')
  return classes?.includes('chip--selected') ?? false
}
