import type { CollectionConfig, Field } from 'payload'

import type { AccessConfig, CurrenciesConfig, PaymentAdapter } from '../../types/index.js'

import { amountField } from '../../fields/amountField.js'
import { cartItemsField } from '../../fields/cartItemsField.js'
import { currencyField } from '../../fields/currencyField.js'
import { statusField } from '../../fields/statusField.js'

type Props = {
  access: Pick<AccessConfig, 'isAdmin'>
  /**
   * Array of fields used for capturing the billing address.
   */
  addressFields?: Field[]
  /**
   * Slug of the carts collection, defaults to 'carts'.
   */
  cartsSlug?: string
  currenciesConfig?: CurrenciesConfig
  /**
   * Slug of the customers collection, defaults to 'users'.
   */
  customersSlug?: string
  /**
   * Enable variants in the transactions collection.
   */
  enableVariants?: boolean
  /**
   * Slug of the orders collection, defaults to 'orders'.
   */
  ordersSlug?: string
  paymentMethods?: PaymentAdapter[]
  /**
   * Slug of the products collection, defaults to 'products'.
   */
  productsSlug?: string
  /**
   * Slug of the variants collection, defaults to 'variants'.
   */
  variantsSlug?: string
}

export const createTransactionsCollection: (props: Props) => CollectionConfig = (props) => {
  const {
    access,
    addressFields,
    cartsSlug = 'carts',
    currenciesConfig,
    customersSlug = 'users',
    enableVariants = false,
    ordersSlug = 'orders',
    paymentMethods,
    productsSlug = 'products',
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
            ...(paymentMethods?.length && paymentMethods.length > 0
              ? [
                  {
                    name: 'paymentMethod',
                    type: 'select',
                    label: ({ t }) =>
                      // @ts-expect-error - translations are not typed in plugins yet
                      t('plugin-ecommerce:paymentMethod'),
                    options: paymentMethods.map((method) => ({
                      label: method.label ?? method.name,
                      value: method.name,
                    })),
                  } as Field,
                  ...(paymentMethods.map((method) => method.group) || []),
                ]
              : []),
          ],
          label: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-ecommerce:transactionDetails'),
        },
        {
          fields: [
            ...(addressFields
              ? [
                  {
                    name: 'billingAddress',
                    type: 'group',
                    fields: addressFields,
                    label: ({ t }) =>
                      // @ts-expect-error - translations are not typed in plugins yet
                      t('plugin-ecommerce:billingAddress'),
                  } as Field,
                ]
              : []),
          ],
          label: ({ t }) =>
            // @ts-expect-error - translations are not typed in plugins yet
            t('plugin-ecommerce:billing'),
        },
      ],
    },
    statusField({
      overrides: {
        admin: {
          position: 'sidebar',
        },
      },
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
      name: 'order',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:order'),
      relationTo: ordersSlug,
    },
    {
      name: 'cart',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      relationTo: cartsSlug,
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
    slug: 'transactions',
    access: {
      create: access.isAdmin,
      delete: access.isAdmin,
      read: access.isAdmin,
      update: access.isAdmin,
    },
    admin: {
      defaultColumns: ['createdAt', 'customer', 'order', 'amount', 'status'],
      description: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:transactionsCollectionDescription'),
      group: 'Ecommerce',
    },
    fields,
    labels: {
      plural: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:transactions'),
      singular: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:transaction'),
    },
  }

  return { ...baseConfig }
}
