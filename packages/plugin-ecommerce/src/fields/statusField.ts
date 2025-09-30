import type { SelectField } from 'payload'

export const statusOptions: SelectField['options'] = [
  {
    // @ts-expect-error - translations are not typed in plugins yet
    label: ({ t }) => t('plugin-ecommerce:pending'),
    value: 'pending',
  },
  {
    // @ts-expect-error - translations are not typed in plugins yet
    label: ({ t }) => t('plugin-ecommerce:succeeded'),
    value: 'succeeded',
  },
  {
    // @ts-expect-error - translations are not typed in plugins yet
    label: ({ t }) => t('plugin-ecommerce:failed'),
    value: 'failed',
  },
  {
    // @ts-expect-error - translations are not typed in plugins yet
    label: ({ t }) => t('plugin-ecommerce:cancelled'),
    value: 'cancelled',
  },
  {
    // @ts-expect-error - translations are not typed in plugins yet
    label: ({ t }) => t('plugin-ecommerce:expired'),
    value: 'expired',
  },
  {
    // @ts-expect-error - translations are not typed in plugins yet
    label: ({ t }) => t('plugin-ecommerce:refunded'),
    value: 'refunded',
  },
]

type Props = {
  overrides?: Partial<SelectField>
}

export const statusField: (props?: Props) => SelectField = (props) => {
  const { overrides } = props || {}

  // @ts-expect-error - issue with payload types
  const field: SelectField = {
    name: 'status',
    type: 'select',
    defaultValue: 'pending',
    label: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-ecommerce:status'),
    options: statusOptions,
    required: true,
    ...overrides,
  }

  return field
}
