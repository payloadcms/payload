import type { CollectionConfig, Field } from 'payload'

import type { CurrenciesConfig, FieldsOverride } from '../types.js'

import { amountField } from '../fields/amountField.js'
import { cartItemsField } from '../fields/cartItemsField.js'
import { currencyField } from '../fields/currencyField.js'

type Props = {
  currenciesConfig?: CurrenciesConfig
  customersCollectionSlug?: string
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
}

export const ordersCollection: (props?: Props) => CollectionConfig = (props) => {
  const { currenciesConfig, customersCollectionSlug = 'users', overrides } = props || {}
  const fieldsOverride = overrides?.fields

  const defaultFields: Field[] = [
    {
      name: 'customer',
      type: 'relationship',
      relationTo: customersCollectionSlug,
    },
    {
      name: 'paymentRecord',
      type: 'relationship',
      relationTo: 'paymentRecords',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'processing',
      interfaceName: 'OrderStatus',
      options: [
        {
          label: 'Processing',
          value: 'processing',
        },
        {
          label: 'Completed',
          value: 'completed',
        },
        {
          label: 'Cancelled',
          value: 'cancelled',
        },
        {
          label: 'Refunded',
          value: 'refunded',
        },
      ],
    },
    ...(currenciesConfig
      ? [
          amountField({ currenciesConfig, overrides: { name: 'total' } }),
          currencyField({ currenciesConfig }),
        ]
      : []),
    cartItemsField({ currenciesConfig, individualPrices: true }),
  ]

  const fields =
    fieldsOverride && typeof fieldsOverride === 'function'
      ? fieldsOverride({ defaultFields })
      : defaultFields

  const baseConfig: CollectionConfig = {
    slug: 'orders',
    timestamps: true,
    ...overrides,
    admin: {
      useAsTitle: 'createdAt',
      ...overrides?.admin,
    },
    fields,
  }

  return { ...baseConfig }
}
