import type { CollectionConfig, FieldHook } from 'payload/types'

const getTotalPrice: FieldHook = ({ data }) => {
  if (!data) return 0

  const { fees, price, salesTaxPercentage } = data.tickets
  const totalPrice = Math.round(price * (1 + salesTaxPercentage / 100)) + fees

  return totalPrice
}

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    defaultColumns: ['title', 'date', 'location'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
        },
        {
          name: 'location',
          type: 'relationship',
          hasMany: false,
          maxDepth: 0,
          relationTo: 'locations',
        },
      ],
    },
    {
      name: 'tickets',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'price',
              type: 'number',
              admin: {
                description: 'USD',
              },
            },
            {
              name: 'salesTaxPercentage',
              type: 'number',
              admin: {
                description: '%',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'fees',
              type: 'number',
              admin: {
                description: 'USD',
              },
            },
            {
              name: 'totalPrice',
              type: 'number',
              access: {
                create: () => false,
                update: () => false,
              },
              admin: {
                description: 'USD',
                readOnly: true,
              },
              hooks: {
                afterRead: [getTotalPrice],
                beforeChange: [
                  ({ siblingData }) => {
                    // Mutate the sibling data to prevent DB storage
                    // eslint-disable-next-line no-param-reassign
                    siblingData.totalPrice = undefined
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
}
