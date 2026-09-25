import type { Locator, Page } from '@playwright/test'

import { exactText } from '../helpers.js'

/**
 * Click on a chip selector item (column chip) to toggle its selection state.
 * This helper encapsulates the locator pattern for chip selector items which use
 * the Chip component internally.
 *
 * Works with both draggable and non-draggable PillSelector components:
 * - Draggable: chips have `.pill-selector__draggable-item` class
 * - Non-draggable: chips are direct children with just `.chip` class
 *
 * @param params.container - The container (Page or Locator) to search within
 * @param params.label - The exact text label of the chip to click
 * @returns The locator for the chip item (useful for further assertions)
 */
export const clickPillSelectorItem = async ({
  container,
  label,
}: {
  container: Locator | Page
  label: string
}): Promise<Locator> => {
  // Use `.pill-selector .chip` to match both draggable and non-draggable PillSelectors
  const chip = container.locator('.pill-selector .chip', {
    hasText: exactText(label),
  })

  await chip.locator('.chip__action').click()

  return chip
}

/**
 * Get a locator for a pill selector item without clicking it.
 * Useful for assertions or when you need more control over the interaction.
 *
 * Works with both draggable and non-draggable PillSelector components.
 */
export const getPillSelectorItem = ({
  container,
  label,
}: {
  container: Locator | Page
  label: string
}): Locator => {
  // Use `.pill-selector .chip` to match both draggable and non-draggable PillSelectors
  return container.locator('.pill-selector .chip', {
    hasText: exactText(label),
  })
}

/**
 * Get a locator for a column selector item (v4 design).
 * The new column selector uses `.column-selector__item` with aria-label for the label text.
 *
 * @param params.container - The container (Page or Locator) to search within
 * @param params.label - The exact text label of the column item
 * @returns The locator for the column selector item
 */
export const getColumnSelectorItem = ({
  container,
  label,
}: {
  container: Locator | Page
  label: string
}): Locator => {
  return container.locator(`.column-selector__item[aria-label="${label}"]`)
}

/**
 * Click on a column selector item (v4 design) to toggle its selection state.
 *
 * @param params.container - The container (Page or Locator) to search within
 * @param params.label - The exact text label of the column item to click
 * @returns The locator for the column item
 */
export const clickColumnSelectorItem = async ({
  container,
  label,
}: {
  container: Locator | Page
  label: string
}): Promise<Locator> => {
  const item = getColumnSelectorItem({ container, label })
  // Click the switch inside the item to toggle
  await item.locator('.switch').click()
  return item
}
