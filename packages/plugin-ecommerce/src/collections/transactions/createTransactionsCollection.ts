import type { CollectionConfig, Field } from 'payload'

import type { AccessConfig, CurrenciesConfig, FieldsOverride, PaymentAdapter } from '../../types.js'

import { amountField } from '../../fields/amountField.js'
import { cartItemsField } from '../../fields/cartItemsField.js'
import { currencyField } from '../../fields/currencyField.js'
import { statusField } from '../../fields/statusField.js'

type Props = {
  access: {
    adminOnly: NonNullable<AccessConfig['adminOnly']>
  }
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
  overrides?: { fields?: FieldsOverride } & Partial<Omit<CollectionConfig, 'fields'>>
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
    access: { adminOnly },
    addressFields,
    cartsSlug = 'carts',
    currenciesConfig,
    customersSlug = 'users',
    enableVariants = false,
    ordersSlug = 'orders',
    overrides,
    paymentMethods,
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
      name: 'customerEmail',
      type: 'email',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:customerEmail'),
    },
    {
      name: 'order',
      type: 'relationship',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:order'),
      relationTo: ordersSlug,
    },
    {
      name: 'cart',
      type: 'relationship',
      relationTo: cartsSlug,
    },
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
    statusField(),
  ]

  if (paymentMethods?.length && paymentMethods.length > 0) {
    defaultFields.push({
      name: 'paymentMethod',
      type: 'select',
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:paymentMethod'),
      options: paymentMethods.map((method) => ({
        label: method.label ?? method.name,
        value: method.name,
      })),
    })

    paymentMethods.forEach((method) => {
      defaultFields.push(method.group)
    })
  }

  if (currenciesConfig) {
    defaultFields.push(currencyField({ currenciesConfig }))
    defaultFields.push(amountField({ currenciesConfig }))
  }

  const fields =
    fieldsOverride && typeof fieldsOverride === 'function'
      ? fieldsOverride({ defaultFields })
      : defaultFields

  const baseConfig: CollectionConfig = {
    slug: 'transactions',
    ...overrides,
    access: {
      create: adminOnly,
      delete: adminOnly,
      read: adminOnly,
      update: adminOnly,
      ...overrides?.access,
    },
    admin: {
      defaultColumns: ['createdAt', 'customer', 'order', 'amount', 'status'],
      group: 'Ecommerce',
      ...overrides?.admin,
    },
    fields,
  }

  return { ...baseConfig }
}
