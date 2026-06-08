import { expect, type Locator, type Page } from '@playwright/test'

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

/**
 * Returns a Locator for the portaled ReactSelect menu.
 *
 * Since react-select closes any open menu before opening another, at most one
 * `.rs__menu` exists in the DOM at a time — so a page-level locator is always
 * unambiguous.
 *
 * Using this helper instead of raw `.locator('.rs__menu')` keeps the selector
 * in one place. If per-instance scoping is ever needed in the future, wire a
 * `data-select-id` attribute onto the ReactSelect component and surface it on
 * the portaled `.rs__menu` div via `ThemedMenuPortal`, then extend this helper
 * to accept `{ page, selectId }`.
 */
export function getSelectMenu({ page }: { page: Page }): Locator {
  return page.locator('.rs__menu')
}

export async function selectInput({
  page,
  selectLocator,
  options,
  option,
  multiSelect = true,
  clear = true,
  filter,
  selectType = 'select',
}: SelectReactOptionsParams & { page: Page }) {
  if (filter) {
    await openSelectMenu({ page, selectLocator })
    const inputLocator = selectLocator.locator('.rs__input[type="text"]')
    await inputLocator.fill(filter)
  }

  if (multiSelect && options) {
    if (clear) {
      await clearSelectInput({ selectLocator })
    }

    for (const optionText of options) {
      const alreadySelected = await selectLocator
        .locator(selectors.hasMany[selectType], { hasText: optionText })
        .count()

      if (alreadySelected === 0) {
        await selectOption({ page, selectLocator, optionText })
      }
    }
  } else if (option) {
    const alreadySelected = await selectLocator
      .locator(selectors.hasOne[selectType], { hasText: option })
      .count()

    if (alreadySelected === 0) {
      await selectOption({ page, selectLocator, optionText: option })
    }
  }
}

export async function openSelectMenu({ page, selectLocator }: { page: Page; selectLocator: Locator }): Promise<void> {
  const menu = getSelectMenu({ page })
  if (await menu.isHidden()) {
    await selectLocator.locator('button.dropdown-indicator').click()
  }
  await menu.waitFor({ state: 'visible', timeout: 2000 })
}

async function selectOption({
  page,
  selectLocator,
  optionText,
}: {
  optionText: string
  page: Page
  selectLocator: Locator
}) {
  await openSelectMenu({ page, selectLocator })
  const menu = getSelectMenu({ page })
  await menu.locator('.rs__option', { hasText: exactText(optionText) }).click()
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
    const selectedOptions = await selectLocator
      .locator(selectors.hasMany[selectType])
      .allTextContents()
    return selectedOptions || []
  }

  await expect(selectLocator).toBeVisible()

  const valueLocator = selectLocator.locator(selectors.hasOne[selectType])
  const count = await valueLocator.count()
  if (count === 0) {
    return false
  }
  const singleValue = await valueLocator.textContent()
  return (singleValue ?? undefined) as any
}

export const getSelectInputOptions = async ({
  page,
  selectLocator,
}: {
  page: Page
  selectLocator: Locator
}): Promise<string[]> => {
  await openSelectMenu({ page, selectLocator })
  const menu = getSelectMenu({ page })
  const options = await menu.locator('.rs__option').allTextContents()
  return options.map((option) => option.trim()).filter(Boolean)
}

export async function clearSelectInput({ selectLocator }: { selectLocator: Locator }) {
  const clearButton = selectLocator.locator('.clear-indicator')
  if (await clearButton.isVisible()) {
    const clearButtonCount = await clearButton.count()
    if (clearButtonCount > 0) {
      await clearButton.click()
    }
  }
}
