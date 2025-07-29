import type { CollectionConfig, Field } from 'payload'

import type { CurrenciesConfig, FieldsOverride } from '../types.js'

import { amountField } from '../fields/amountField.js'
import { cartItemsField } from '../fields/cartItemsField.js'
import { currencyField } from '../fields/currencyField.js'
import { beforeChangeCart } from './beforeChange.js'

type Props = {
  /**
   * Slug of the coupons collection, defaults to 'coupons'.
   */
  couponsSlug?: string
  currenciesConfig?: CurrenciesConfig
  /**
   * Slug of the customers collection, defaults to 'users'.
   */
  customersSlug?: string
  enableCoupons?: boolean
  /**
   * Enables support for variants in the cart.
   * Defaults to false.
   */
  enableVariants?: boolean
  /**
   * Enables support for coupons in the cart.
   * Defaults to false.
   */
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
  /**
   * Slug of the products collection, defaults to 'products'.
   */
  productsSlug?: string
  /**
   * Slug of the variants collection, defaults to 'variants'.
   */
  variantsSlug?: string
}

export const cartsCollection: (props?: Props) => CollectionConfig = (props) => {
  const {
    couponsSlug = 'coupons',
    currenciesConfig,
    customersSlug = 'users',
    enableCoupons = false,
    enableVariants = false,
    overrides,
    productsSlug = 'products',
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
      name: 'purchasedAt',
      type: 'date',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:purchasedAt'),
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      interfaceName: 'CartStatus',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:status'),
      options: [
        {
          // @ts-expect-error - translations are not typed in plugins yet
          label: ({ t }) => t('plugin-ecommerce:open'),
          value: 'open',
        },
        {
          // @ts-expect-error - translations are not typed in plugins yet
          label: ({ t }) => t('plugin-ecommerce:abandoned'),
          value: 'abandoned',
        },
        {
          // @ts-expect-error - translations are not typed in plugins yet
          label: ({ t }) => t('plugin-ecommerce:completed'),
          value: 'completed',
        },
      ],
    },

    ...(enableCoupons && currenciesConfig
      ? [
          {
            name: 'discount',
            type: 'group',
            fields: [
              {
                name: 'discountLines',
                type: 'array',
                fields: [
                  {
                    name: 'coupon',
                    type: 'relationship',
                    hasMany: false,
                    label: 'Coupon',
                    relationTo: couponsSlug,
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

              amountField({
                currenciesConfig,
                overrides: {
                  name: 'totalAmount',
                  // @ts-expect-error - translations are not typed in plugins yet
                  label: ({ t }) => t('plugin-ecommerce:discount.amount'),
                },
              }),

              amountField({
                currenciesConfig,
                overrides: {
                  name: 'cartAmount',
                  // @ts-expect-error - translations are not typed in plugins yet
                  label: ({ t }) => t('plugin-ecommerce:discount.amount'),
                },
              }),

              amountField({
                currenciesConfig,
                overrides: {
                  name: 'lineItemsAmount',
                  // @ts-expect-error - translations are not typed in plugins yet
                  label: ({ t }) => t('plugin-ecommerce:discount.amount'),
                },
              }),
            ],
          } as Field,
        ]
      : []),
    ...(currenciesConfig
      ? [
          currencyField({
            currenciesConfig,
          }),
          amountField({
            currenciesConfig,
            overrides: {
              name: 'subtotal',
              label: ({ t }) =>
                // @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:subtotal'),
            },
          }),
          amountField({
            currenciesConfig,
            overrides: {
              name: 'total',
              label: ({ t }) =>
                // @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:total'),
            },
          }),
        ]
      : []),
    cartItemsField({
      currenciesConfig,
      enableCoupons,
      enableVariants,
      overrides: {
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
    slug: 'carts',
    timestamps: true,
    ...overrides,
    admin: {
      useAsTitle: 'createdAt',
      ...overrides?.admin,
    },
    fields,
    hooks: {
      beforeChange: [
        // This hook can be used to update the subtotal before saving the cart
        beforeChangeCart({ couponsSlug, productsSlug, variantsSlug }),
        ...(overrides?.hooks?.beforeChange || []),
      ],
      ...overrides?.hooks,
    },
  }

  return { ...baseConfig }
}
