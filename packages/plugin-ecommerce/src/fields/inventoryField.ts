import type { NumberField } from 'payload'

import { defaultInventoryFieldName } from '../utilities/inventory.js'

type Props = {
  /**
   * The name of the field used to track inventory levels. Defaults to 'inventory'.
   */
  fieldName?: string
  overrides?: Partial<NumberField>
}

export const inventoryField: (props?: Props) => NumberField = (props) => {
  const { fieldName = defaultInventoryFieldName, overrides } = props || {}

  // @ts-expect-error - issue with payload types
  const field: NumberField = {
    name: fieldName,
    type: 'number',
    defaultValue: 0,
    // @ts-expect-error - translations are not typed in plugins yet
    label: ({ t }) => t('plugin-ecommerce:inventory'),
    min: 0,
    ...(overrides || {}),
  }

  return field
}
