import type { CollectionConfig, Field } from 'payload'

import type { AccessConfig, CurrenciesConfig, FieldsOverride } from '../../types.js'

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

export const createCartsCollection: (props: Props) => CollectionConfig = (props) => {
  const {
    access: { adminOrCustomerOwner, publicAccess },
    currenciesConfig,
    customersSlug = 'users',
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
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
      label: ({ t }) =>
        // @ts-expect-error - translations are not typed in plugins yet
        t('plugin-ecommerce:purchasedAt'),
    },
    {
      name: 'status',
      type: 'select',
      admin: {
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
        ]
      : []),
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
  ]

  const fields =
    fieldsOverride && typeof fieldsOverride === 'function'
      ? fieldsOverride({ defaultFields })
      : defaultFields

  const baseConfig: CollectionConfig = {
    slug: 'carts',
    timestamps: true,
    ...overrides,
    access: {
      create: publicAccess,
      delete: adminOrCustomerOwner,
      read: adminOrCustomerOwner,
      update: adminOrCustomerOwner,
      ...overrides?.access,
    },
    admin: {
      group: 'Ecommerce',
      useAsTitle: 'createdAt',
      ...overrides?.admin,
    },
    fields,
    hooks: {
      beforeChange: [
        // This hook can be used to update the subtotal before saving the cart
        beforeChangeCart({ productsSlug, variantsSlug }),
        ...(overrides?.hooks?.beforeChange || []),
      ],
      ...overrides?.hooks,
    },
  }

  return { ...baseConfig }
}
