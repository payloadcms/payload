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
        relationTo: productsSlug,
      },
      {
        name: 'variant',
        type: 'relationship',
        relationTo: variantsSlug,
      },
      {
        name: 'quantity',
        type: 'number',
        defaultValue: 1,
        required: true,
      },
      ...(currenciesConfig && individualPrices ? [amountField({ currenciesConfig })] : []),
      ...(currenciesConfig ? [currencyField({ currenciesConfig })] : []),
    ],
    ...overrides,
  }

  return field
}
