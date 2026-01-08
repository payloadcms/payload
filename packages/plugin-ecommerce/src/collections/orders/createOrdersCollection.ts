import type { CollectionConfig, Field } from 'payload'

import type { AccessConfig, CurrenciesConfig } from '../../types/index.js'

import { amountField } from '../../fields/amountField.js'
import { cartItemsField } from '../../fields/cartItemsField.js'
import { currencyField } from '../../fields/currencyField.js'
import { accessOR } from '../../utilities/accessComposition.js'

type Props = {
  access: Pick<AccessConfig, 'adminOnlyFieldAccess' | 'isAdmin' | 'isDocumentOwner'>
  /**
   * Array of fields used for capturing the shipping address data.
   */
  addressFields?: Field[]
  currenciesConfig?: CurrenciesConfig
  /**
   * Slug of the customers collection, defaults to 'users'.
   */
  customersSlug?: string
  enableVariants?: boolean
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

export const createOrdersCollection: (props: Props) => CollectionConfig = (props) => {
  const {
    access,
    addressFields,
    currenciesConfig,
    customersSlug = 'users',
    enableVariants = false,
    productsSlug = 'products',
    transactionsSlug = 'transactions',
    variantsSlug = 'variants',
  } = props || {}

  const fields: Field[] = [
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            cartItemsField({
              enableVariants,
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
          ],
          label: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-ecommerce:orderDetails'),
        },
        {
          fields: [
            ...(addressFields
              ? [
                  {
                    name: 'shippingAddress',
                    type: 'group',
                    fields: addressFields,
                    label: ({ t }) =>
                      // @ts-expect-error - translations are not typed in plugins yet
                      t('plugin-ecommerce:shippingAddress'),
                  } as Field,
                ]
              : []),
          ],
          label: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-ecommerce:shipping'),
        },
      ],
    },
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
      name: 'customerEmail',
      type: 'email',
      admin: {
        position: 'sidebar',
      },
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:customerEmail'),
    },
    {
      name: 'transactions',
      type: 'relationship',
      access: {
        create: access.adminOnlyFieldAccess,
        read: access.adminOnlyFieldAccess,
        update: access.adminOnlyFieldAccess,
      },
      admin: {
        position: 'sidebar',
      },
      hasMany: true,
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:transactions'),
      relationTo: transactionsSlug,
    },
    {
      name: 'status',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
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
      ? [
          {
            type: 'row',
            admin: {
              position: 'sidebar',
            },
            fields: [
              amountField({
                currenciesConfig,
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
    slug: 'orders',
    access: {
      create: access.isAdmin,
      delete: access.isAdmin,
      read: accessOR(access.isAdmin, access.isDocumentOwner),
      update: access.isAdmin,
    },
    admin: {
      description: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:ordersCollectionDescription'),
      group: 'Ecommerce',
      useAsTitle: 'createdAt',
    },
    fields,
    labels: {
      plural: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:orders'),
      singular: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:order'),
    },
    timestamps: true,
  }

  return { ...baseConfig }
}
