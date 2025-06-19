import type { ArrayField } from 'payload'

import type { CurrenciesConfig } from '../types.js'

import { amountField } from './amountField.js'
import { currencyField } from './currencyField.js'

type Props = {
  currenciesConfig?: CurrenciesConfig
  /**
   * Enables individual prices for each item in the cart.
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

export const cartField: (props?: Props) => ArrayField = (props) => {
  const {
    currenciesConfig,
    individualPrices,
    overrides,
    productsSlug = 'products',
    variantsSlug = 'variants',
  } = props || {}

  const field: ArrayField = {
    name: 'cart',
    type: 'array',
    fields: [
      {
        name: 'product',
        type: 'relationship',
        label: ({ t }) =>
          // @ts-expect-error - translations are not typed in plugins yet
          t('plugin-ecommerce:product'),
        relationTo: productsSlug,
      },
      {
        name: 'variant',
        type: 'relationship',
        label: ({ t }) =>
          // @ts-expect-error - translations are not typed in plugins yet
          t('plugin-ecommerce:variant'),
        relationTo: variantsSlug,
      },
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
