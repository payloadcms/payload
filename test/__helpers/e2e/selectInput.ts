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

/**
 * Returns a Locator for the portaled menu belonging to a specific ReactSelect
 * container. ReactSelect menus are rendered at document.body via a React portal,
 * so they are not DOM descendants of the select container. This helper uses the
 * `aria-controls` attribute on the hidden input — which react-select sets to the
 * listbox ID — to scope the menu lookup to the correct instance.
 *
 * Falls back to `page.locator('.rs__menu')` when the attribute is not yet present
 * (e.g. before the menu has been opened for the first time).
 */
export async function getSelectMenu({
  selectLocator,
}: {
  selectLocator: Locator
}): Promise<Locator> {
  const page = selectLocator.page()
  const menuId = await selectLocator.locator('.rs__input').getAttribute('aria-controls')
  if (menuId) {
    return page.locator(`#${menuId}`)
  }
  return page.locator('.rs__menu')
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
    await openSelectMenu({ selectLocator })
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
        await selectOption({ selectLocator, optionText })
      }
    }
  } else if (option) {
    const alreadySelected = await selectLocator
      .locator(selectors.hasOne[selectType], { hasText: option })
      .count()

    if (alreadySelected === 0) {
      await selectOption({ selectLocator, optionText: option })
    }
  }
}

export async function openSelectMenu({ selectLocator }: { selectLocator: Locator }): Promise<void> {
  const menu = await getSelectMenu({ selectLocator })
  if (await menu.isHidden()) {
    await selectLocator.locator('button.dropdown-indicator').click()
  }
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
  const menu = await getSelectMenu({ selectLocator })
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
  selectLocator,
}: {
  selectLocator: Locator
}): Promise<string[]> => {
  await openSelectMenu({ selectLocator })
  const menu = await getSelectMenu({ selectLocator })
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
