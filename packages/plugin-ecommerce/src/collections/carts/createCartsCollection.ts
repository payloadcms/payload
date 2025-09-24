import type { CollectionConfig, Field } from 'payload'

import type { AccessConfig, CurrenciesConfig } from '../../types/index.js'

import { amountField } from '../../fields/amountField.js'
import { cartItemsField } from '../../fields/cartItemsField.js'
import { currencyField } from '../../fields/currencyField.js'
import { beforeChangeCart } from './beforeChange.js'
import { statusBeforeRead } from './statusBeforeRead.js'

type Props = {
  access: {
    adminOrCustomerOwner: NonNullable<AccessConfig['adminOrCustomerOwner']>
    publicAccess: NonNullable<AccessConfig['publicAccess']>
  }
  currenciesConfig?: CurrenciesConfig
  /**
   * Slug of the customers collection, defaults to 'users'.
   */
  customersSlug?: string
  /**
   * Enables support for variants in the cart.
   * Defaults to false.
   */
  enableVariants?: boolean
  /**
   * Slug of the products collection, defaults to 'products'.
   */
  productsSlug?: string
  /**
   * Slug of the variants collection, defaults to 'variants'.
   */
  variantsSlug?: string
}

export const createCartsCollection: (props: Props) => CollectionConfig = (props) => {
  const {
    access: { adminOrCustomerOwner, publicAccess },
    currenciesConfig,
    customersSlug = 'users',
    enableVariants = false,
    productsSlug = 'products',
    variantsSlug = 'variants',
  } = props || {}

  const fields: Field[] = [
    cartItemsField({
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
    {
      name: 'customer',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:customer'),
      relationTo: customersSlug,
    },
    {
      name: 'purchasedAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        position: 'sidebar',
      },
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:purchasedAt'),
    },
    {
      name: 'status',
      type: 'select',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      hooks: {
        afterRead: [statusBeforeRead],
      },
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:status'),
      options: [
        {
          // @ts-expect-error - translations are not typed in plugins yet
          label: ({ t }) => t('plugin-ecommerce:active'),
          value: 'active',
        },
        {
          // @ts-expect-error - translations are not typed in plugins yet
          label: ({ t }) => t('plugin-ecommerce:purchased'),
          value: 'purchased',
        },
        {
          // @ts-expect-error - translations are not typed in plugins yet
          label: ({ t }) => t('plugin-ecommerce:abandoned'),
          value: 'abandoned',
        },
      ],
      virtual: true,
    },
    ...(currenciesConfig
      ? [
          {
            type: 'row',
            admin: { position: 'sidebar' },
            fields: [
              amountField({
                currenciesConfig,
                overrides: {
                  name: 'subtotal',

                  label: ({ t }) =>
                    // @ts-expect-error - translations are not typed in plugins yet
                    t('plugin-ecommerce:subtotal'),
                },
              }),
              currencyField({
                currenciesConfig,
              }),
            ],
          } as Field,
        ]
      : []),
  ]

  const baseConfig: CollectionConfig = {
    slug: 'carts',
    access: {
      create: publicAccess,
      delete: adminOrCustomerOwner,
      read: adminOrCustomerOwner,
      update: adminOrCustomerOwner,
    },
    admin: {
      description: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:cartsCollectionDescription'),
      group: 'Ecommerce',
      useAsTitle: 'createdAt',
    },
    fields,
    hooks: {
      beforeChange: [
        // This hook can be used to update the subtotal before saving the cart
        beforeChangeCart({ productsSlug, variantsSlug }),
      ],
    },
    labels: {
      plural: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:carts'),
      singular: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:cart'),
    },
    timestamps: true,
  }

  return { ...baseConfig }
}
