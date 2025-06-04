import type { CollectionConfig, Field } from 'payload'

import type { CurrenciesConfig, FieldsOverride } from '../types.js'

import { amountField } from '../fields/amountField.js'
import { cartField } from '../fields/cartField.js'
import { currencyField } from '../fields/currencyField.js'

type Props = {
  currenciesConfig?: CurrenciesConfig
  /**
   * Slug of the customers collection, defaults to 'users'.
   */
  customersSlug?: string
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
  /**
   * Slug of the products collection, defaults to 'products'.
   */
  productsSlug?: string
  /**
   * Slug of the transactions collection, defaults to 'transactions'.
   */
  transactionsSlug?: string
  /**
   * Slug of the variants collection, defaults to 'variants'.
   */
  variantsSlug?: string
}

export const ordersCollection: (props?: Props) => CollectionConfig = (props) => {
  const {
    currenciesConfig,
    customersSlug = 'users',
    overrides,
    productsSlug = 'products',
    transactionsSlug = 'transactions',
    variantsSlug = 'variants',
  } = props || {}
  const fieldsOverride = overrides?.fields

  const defaultFields: Field[] = [
    {
      name: 'customer',
      type: 'relationship',
      relationTo: customersSlug,
    },
    {
      name: 'customerEmail',
      type: 'email',
    },
    {
      name: 'transactions',
      type: 'relationship',
      hasMany: true,
      relationTo: transactionsSlug,
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
      ? [amountField({ currenciesConfig }), currencyField({ currenciesConfig })]
      : []),
    cartField({ currenciesConfig, individualPrices: true, productsSlug, variantsSlug }),
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
