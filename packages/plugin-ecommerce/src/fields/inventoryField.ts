import type { NumberField } from 'payload'

type Props = {
  overrides?: Partial<NumberField>
}

export const inventoryField: (props?: Props) => NumberField = (props) => {
  const { overrides } = props || {}

  // @ts-expect-error - issue with payload types
  const field: NumberField = {
    name: 'inventory',
    type: 'number',
    // @ts-expect-error - translations are not typed in plugins yet
    label: ({ t }) => t('plugin-ecommerce:inventory'),
    min: 0,
    ...(overrides || {}),
    admin: {
      description: 'Leave empty if stock is not tracked (unlimited). 0 means out of stock.',
      ...(overrides?.admin || {}),
    },
  }

  return field
}
