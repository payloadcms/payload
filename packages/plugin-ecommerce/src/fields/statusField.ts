import type { SelectField } from 'payload'

export const statusOptions: SelectField['options'] = [
  {
    label: 'Pending',
    value: 'pending',
  },
  {
    label: 'Succeeded',
    value: 'succeeded',
  },
  {
    label: 'Failed',
    value: 'failed',
  },
  {
    label: 'Cancelled',
    value: 'cancelled',
  },
  {
    label: 'Expired',
    value: 'expired',
  },
  {
    label: 'Refunded',
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
    options: statusOptions,
    required: true,
    ...overrides,
  }

  return field
}
