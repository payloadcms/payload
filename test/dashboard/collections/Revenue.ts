import type { CollectionConfig } from 'payload'

export const Revenue: CollectionConfig = {
  slug: 'revenue',
  admin: {
    group: 'Dashboard Data',
    useAsTitle: 'description',
  },
  fields: [
    {
      name: 'amount',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'description',
      type: 'text',
      required: true,
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'sales',
      options: [
        {
          label: 'Sales',
          value: 'sales',
        },
        {
          label: 'Subscriptions',
          value: 'subscriptions',
        },
        {
          label: 'Services',
          value: 'services',
        },
        {
          label: 'Other',
          value: 'other',
        },
      ],
    },
    {
      name: 'source',
      type: 'text',
    },
  ],
}
