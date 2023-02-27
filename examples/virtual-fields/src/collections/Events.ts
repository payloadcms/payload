import payload from 'payload';
import { CollectionAfterReadHook, CollectionConfig, FieldHook } from 'payload/types';

const getTotalPrice: CollectionAfterReadHook = async ({ doc }) => {
  const { price, salesTaxPercentage, fees } = doc.tickets;
  const totalPrice = Math.round(price * (1 + (salesTaxPercentage / 100))) + fees;

  const updatedDoc = {
    ...doc,
    tickets: {
      ...doc.tickets,
      totalPrice,
    },
  };

  return updatedDoc;
};

const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    defaultColumns: ['title', 'date', 'location'],
    useAsTitle: 'title',
  },
  hooks: {
    afterRead: [getTotalPrice],
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
          relationTo: 'locations',
          maxDepth: 0,
          hasMany: false,
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
              admin: {
                description: 'USD',
                readOnly: true,
              },
            },
          ],
        },
      ],
    },
  ],
};

export default Events;
