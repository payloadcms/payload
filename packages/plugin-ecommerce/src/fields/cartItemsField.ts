import type { ArrayField, Field } from 'payload'

import type { CurrenciesConfig } from '../types.js'

import { amountField } from './amountField.js'
import { currencyField } from './currencyField.js'

type Props = {
  /**
   * Slug of the coupons collection, defaults to 'coupons'.
   */
  couponsSlug?: string
  /**
   * Include this in order to enable support for currencies per item in the cart.
   */
  currenciesConfig?: CurrenciesConfig
  /**
   * Enables coupons for specific products / cart items.
   * Defaults to false.
   */
  enableCoupons?: boolean
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
    couponsSlug = 'coupons',
    currenciesConfig,
    enableCoupons = false,
    enableVariants = false,
    individualPrices,
    overrides,
    productsSlug = 'products',
    variantsSlug = 'variants',
  } = props || {}

  const field: ArrayField = {
    name: 'items',
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
      ...(enableCoupons && currenciesConfig
        ? [
            {
              name: 'discount',
              type: 'group',
              fields: [
                amountField({
                  currenciesConfig,
                  overrides: {
                    name: 'amount',
                    // @ts-expect-error - translations are not typed in plugins yet
                    label: ({ t }) => t('plugin-ecommerce:discount.amount'),
                  },
                }),
                {
                  name: 'discountLines',
                  type: 'array' as const,
                  fields: [
                    {
                      name: 'coupon',
                      type: 'relationship',
                      hasMany: false,
                      label: 'Coupons',
                      relationTo: 'coupons',
                    },

                    amountField({
                      currenciesConfig,
                      overrides: {
                        name: 'amount',
                        label: ({ t }) =>
                          // @ts-expect-error - translations are not typed in plugins yet
                          t('plugin-ecommerce:subtotal'),
                      },
                    }),
                  ],
                },
              ],
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
