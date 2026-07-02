import type { Field, GroupField } from 'payload'

import type { CurrenciesConfig } from '../types/index.js'

import { amountField } from './amountField.js'
import { currencyField } from './currencyField.js'

type Props = {
  currenciesConfig: CurrenciesConfig
  overrides?: Partial<GroupField>
}

/**
 * A read-only group field that records the computed payment summary for a
 * transaction or order — total, currency, and the ordered list of lines
 * (subtotal, tax, shipping, discount, etc.) produced by the payment hook pipeline.
 */
export const summaryField: (props: Props) => GroupField = ({ currenciesConfig, overrides }) => {
  const lineFields: Field[] = [
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Subtotal', value: 'subtotal' },
        { label: 'Tax', value: 'tax' },
        { label: 'Shipping', value: 'shipping' },
        { label: 'Discount', value: 'discount' },
        { label: 'Gift Card', value: 'gift_card' },
        { label: 'Custom', value: 'custom' },
      ],
      required: true,
    },
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    amountField({
      currenciesConfig,
      overrides: { required: true },
    }),
    {
      name: 'metadata',
      type: 'json',
    },
  ]

  const field: GroupField = {
    name: 'summary',
    type: 'group',
    admin: {
      readOnly: true,
    },
    fields: [
      amountField({
        currenciesConfig,
        overrides: { name: 'total' },
      }),
      currencyField({ currenciesConfig }),
      {
        name: 'lines',
        type: 'array',
        fields: lineFields,
      },
    ],
    ...overrides,
  }

  return field
}
