import type { CollectionConfig, Field } from 'payload'

import type { CurrenciesConfig, FieldsOverride } from '../types.js'

import { amountField } from '../fields/amountField.js'
import { cartItemsField } from '../fields/cartItemsField.js'
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
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:customer'),
      relationTo: customersSlug,
    },
    {
      name: 'customerEmail',
      type: 'email',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:customerEmail'),
    },
    {
      name: 'transactions',
      type: 'relationship',
      hasMany: true,
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:transactions'),
      relationTo: transactionsSlug,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'processing',
      interfaceName: 'OrderStatus',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:status'),
      options: [
        {
          // @ts-expect-error - translations are not typed in plugins yet
          label: ({ t }) => t('plugin-ecommerce:processing'),
          value: 'processing',
        },
        {
          // @ts-expect-error - translations are not typed in plugins yet
          label: ({ t }) => t('plugin-ecommerce:completed'),
          value: 'completed',
        },
        {
          // @ts-expect-error - translations are not typed in plugins yet
          label: ({ t }) => t('plugin-ecommerce:cancelled'),
          value: 'cancelled',
        },
        {
          // @ts-expect-error - translations are not typed in plugins yet
          label: ({ t }) => t('plugin-ecommerce:refunded'),
          value: 'refunded',
        },
      ],
    },
    ...(currenciesConfig
      ? [amountField({ currenciesConfig }), currencyField({ currenciesConfig })]
      : []),
    cartItemsField({
      currenciesConfig,
      individualPrices: true,
      overrides: {
        name: 'items',
        label: ({ t }) =>
          // @ts-expect-error - translations are not typed in plugins yet
          t('plugin-ecommerce:items'),
        labels: {
          plural: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-ecommerce:items'),
          singular: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-ecommerce:item'),
        },
      },
      productsSlug,
      variantsSlug,
    }),
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
