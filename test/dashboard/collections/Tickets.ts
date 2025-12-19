import type { CollectionConfig } from 'payload'

export const Tickets: CollectionConfig = {
  slug: 'tickets',
  admin: {
    group: 'Dashboard Data',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      options: [
        {
          label: 'Open',
          value: 'open',
        },
        {
          label: 'In Progress',
          value: 'in-progress',
        },
        {
          label: 'Closed',
          value: 'closed',
        },
      ],
    },
    {
      name: 'priority',
      type: 'select',
      required: true,
      defaultValue: 'medium',
      options: [
        {
          label: 'Low',
          value: 'low',
        },
        {
          label: 'Medium',
          value: 'medium',
        },
        {
          label: 'High',
          value: 'high',
        },
        {
          label: 'Critical',
          value: 'critical',
        },
      ],
    },
    {
      name: 'assignee',
      type: 'relationship',
      relationTo: 'users',
    },
  ],
}
