import type { ArrayField, Field } from 'payload'

import type { CurrenciesConfig } from '../types/index.js'

import { amountField } from './amountField.js'
import { currencyField } from './currencyField.js'

type Props = {
  /**
   * Include this in order to enable support for currencies per item in the cart.
   */
  currenciesConfig?: CurrenciesConfig
  enableVariants?: boolean
  /**
   * Enables individual prices for each item in the cart.
   * Defaults to false.
   */
  individualPrices?: boolean
  overrides?: Partial<ArrayField>
  /**
   * Slug of the products collection, defaults to 'products'.
   */
  productsSlug?: string
  /**
   * Slug of the variants collection, defaults to 'variants'.
   */
  variantsSlug?: string
}

export const cartItemsField: (props?: Props) => ArrayField = (props) => {
  const {
    currenciesConfig,
    enableVariants = false,
    individualPrices,
    overrides,
    productsSlug = 'products',
    variantsSlug = 'variants',
  } = props || {}

  const field: ArrayField = {
    name: 'items',
    type: 'array',
    admin: {
      initCollapsed: true,
    },
    fields: [
      {
        name: 'product',
        type: 'relationship',
        label: ({ t }) =>
          // @ts-expect-error - translations are not typed in plugins yet
          t('plugin-ecommerce:product'),
        relationTo: productsSlug,
      },
      ...(enableVariants
        ? [
            {
              name: 'variant',
              type: 'relationship',
              label: ({ t }) =>
                // @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:variant'),
              relationTo: variantsSlug,
            } as Field,
          ]
        : []),
      {
        name: 'quantity',
        type: 'number',
        defaultValue: 1,
        label: ({ t }) =>
          // @ts-expect-error - translations are not typed in plugins yet
          t('plugin-ecommerce:quantity'),
        min: 1,
        required: true,
      },
      ...(currenciesConfig && individualPrices ? [amountField({ currenciesConfig })] : []),
      ...(currenciesConfig ? [currencyField({ currenciesConfig })] : []),
    ],
    label: ({ t }) =>
      // @ts-expect-error - translations are not typed in plugins yet
      t('plugin-ecommerce:cart'),
    ...overrides,
  }

  return field
}
