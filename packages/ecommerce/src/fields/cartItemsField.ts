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
}

export const cartItemsField: (props?: Props) => ArrayField = (props) => {
  const { currenciesConfig, individualPrices, overrides } = props || {}

  const field: ArrayField = {
    name: 'cartItems',
    type: 'array',
    fields: [
      {
        name: 'product',
        type: 'relationship',
        relationTo: 'products',
        required: true,
      },
      {
        name: 'variant',
        type: 'relationship',
        relationTo: 'variants',
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
