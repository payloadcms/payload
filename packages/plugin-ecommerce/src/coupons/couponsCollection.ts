import type { CollectionConfig, Field } from 'payload'

import type { CollectionOverride } from '../types.js'

type Props = {
  /**
   * Slug of the customers collection, defaults to 'users'.
   */
  customersSlug?: string

  overrides?: CollectionOverride

  /**
   * Slug of the products collection, defaults to 'products'.
   */
  productsSlug?: string
}

export const couponsCollection: (props?: Props) => CollectionConfig = (props) => {
  const { customersSlug = 'customers', productsSlug = 'products' } = props || {}

  const defaultFields: Field[] = [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
    },
    {
      name: 'identifier',
      type: 'text',
      label: 'Unique identifier',
      required: true,
      unique: true,
    },
    {
      name: 'appliesTo',
      type: 'select',
      defaultValue: 'cart',
      options: [
        {
          label: 'Cart',
          value: 'cart',
        },
        {
          label: 'Product',
          value: 'product',
        },
      ],
      required: true,
    },
    {
      name: 'eligbleProducts',
      type: 'relationship',
      admin: {
        condition: ({ appliesTo }) => appliesTo === 'product',
      },
      hasMany: true,
      label: 'Eligble products',
      relationTo: productsSlug,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'select',
          defaultValue: 'flat',
          label: 'Discount type',
          options: [
            {
              label: 'Flat rate',
              value: 'flat',
            },
            {
              label: 'Percentage',
              value: 'percentage',
            },
          ],
          required: true,
        },
        {
          name: 'value',
          type: 'number',
          label: 'Discount value',
          required: true,
          validate: (value: null | number | undefined, { data }: { data: any }) => {
            if (!value) {
              return 'Please enter a value.'
            }

            if (data.type === 'flat') {
              if (value <= 0) {
                return 'Value must be higer than 0.'
              }
            } else {
              if (value < 1 || value > 100) {
                return 'Value must be between 1 and 100.'
              }
            }

            return true
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'maxClaims',
          type: 'number',
          label: 'Max amount of claims',
        },
        {
          name: 'numberOfClaims',
          type: 'number',
          admin: {
            disabled: true,
          },
          defaultValue: 0,
          label: 'Number of claims',
          required: true,
        },
        {
          name: 'eligbleCustomers',
          type: 'relationship',

          hasMany: true,
          label: 'Eligble customers',
          relationTo: customersSlug,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'validFrom',
          type: 'date',
          label: 'Valid from date',
        },
        {
          name: 'validTo',
          type: 'date',
          label: 'Valid until date',
        },
      ],
    },
  ]

  const fields =
    typeof props?.overrides?.fields === 'function'
      ? props.overrides.fields({ defaultFields })
      : defaultFields

  return {
    slug: 'coupons',
    ...props?.overrides,
    admin: {
      useAsTitle: 'title',
      ...(props?.overrides?.admin ?? {}),
    },
    fields,
  }
}
