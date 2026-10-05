import type { CollectionConfig } from 'payload'

export const Tickets: CollectionConfig = {
  slug: 'tickets',
  access: {
    read: ({ req: { user } }) => Boolean(user) && user.email !== 'pins-restricted@payloadcms.com',
  },
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
      required: true,
    },
    {
      name: 'priority',
      type: 'select',
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
      required: true,
    },
    {
      name: 'assignee',
      type: 'relationship',
      relationTo: 'users',
    },
  ],
  versions: false,
}
