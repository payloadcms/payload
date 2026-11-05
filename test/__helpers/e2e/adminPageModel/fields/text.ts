import { expect } from '@playwright/test'

import type { HasManyTextFieldModel, TextFieldModel } from '../modelTypes.js'
import type { CreateBaseFieldModelArgs } from './base.js'

import { formatIndexedLocatorContext } from '../errors.js'
import { selectors } from '../selectors.js'
import { createBaseFieldModel } from './base.js'

type CreateTextFieldModelArgs = {
  collectionSlug: string
  scope: string
} & Omit<CreateBaseFieldModelArgs, 'wrapperSelector'>

export const createTextFieldModel = ({
  instancePath,
  root,
  schemaPath,
  scope,
}: CreateTextFieldModelArgs): TextFieldModel => {
  const inputSelector = selectors.textInput(instancePath)
  const wrapperSelector = selectors.textFieldWrapper(instancePath)
  const baseField = createBaseFieldModel({
    instancePath,
    root,
    schemaPath,
    wrapperSelector,
  })
  const input = root.locator(inputSelector)

  return {
    ...baseField,
    expectValue: async (value) => {
      await expect(
        input,
        `Expected text field "${schemaPath}" at "${instancePath}" in ${scope} to have the requested value.`,
      ).toHaveValue(value)
    },
    fill: (value) => input.fill(value),
    getValue: () => input.inputValue(),
    input,
    inputID: selectors.textInputID(instancePath),
    selectors: {
      input: inputSelector,
      wrapper: wrapperSelector,
    },
  }
}

export const createHasManyTextFieldModel = ({
  collectionSlug,
  instancePath,
  root,
  schemaPath,
  scope,
}: CreateTextFieldModelArgs): HasManyTextFieldModel => {
  const wrapperSelector = selectors.hasManyTextControl(instancePath)
  const inputSelector = selectors.hasManyTextInput(instancePath)
  const baseField = createBaseFieldModel({
    instancePath,
    root,
    schemaPath,
    wrapperSelector,
  })
  const input = root.locator(inputSelector)
  const valueLocators = baseField.wrapper.locator('.multi-value-label__text')

  return {
    ...baseField,
    addValue: async (value) => {
      const previousCount = await valueLocators.count()

      await input.fill(value)
      await input.press('Enter')
      await expect(
        valueLocators,
        `Expected addValue() to add one value to "${schemaPath}" in collection "${collectionSlug}".`,
      ).toHaveCount(previousCount + 1)
      await expect(valueLocators.nth(previousCount)).toHaveText(value)
    },
    expectValues: async (values) => {
      await expect(
        valueLocators,
        `Expected text field "${schemaPath}" at "${instancePath}" to have the requested values.`,
      ).toHaveText([...values])
    },
    input,
    selectors: {
      input: inputSelector,
      wrapper: wrapperSelector,
    },
    value: async (index) => {
      const availableCount = await valueLocators.count()
      const valueSelector = `${wrapperSelector} .multi-value-label__text`
      const wrapper = valueLocators.nth(index >= 0 ? index : availableCount)

      await expect(
        wrapper,
        formatIndexedLocatorContext({
          availableCount,
          collectionSlug,
          fieldPath: schemaPath,
          index,
          itemName: 'value',
          scope,
          selector: valueSelector,
        }),
      ).toHaveCount(1)

      return {
        expectValue: async (value) => {
          await expect(wrapper).toHaveText(value)
        },
        fill: async (value) => {
          await wrapper.click()
          await wrapper.fill(value)
          await wrapper.press('Enter')
        },
        getValue: () => wrapper.innerText(),
        wrapper,
      }
    },
  }
}
