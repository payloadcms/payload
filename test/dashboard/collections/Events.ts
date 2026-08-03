import type { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
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
      name: 'startDate',
      type: 'date',
      required: true,
    },
    {
      name: 'endDate',
      type: 'date',
    },
    {
      name: 'location',
      type: 'text',
    },
    {
      name: 'type',
      type: 'select',
      defaultValue: 'meeting',
      options: [
        {
          label: 'Meeting',
          value: 'meeting',
        },
        {
          label: 'Conference',
          value: 'conference',
        },
        {
          label: 'Workshop',
          value: 'workshop',
        },
        {
          label: 'Webinar',
          value: 'webinar',
        },
        {
          label: 'Other',
          value: 'other',
        },
      ],
      required: true,
    },
    {
      name: 'organizer',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'scheduled',
      options: [
        {
          label: 'Scheduled',
          value: 'scheduled',
        },
        {
          label: 'In Progress',
          value: 'in-progress',
        },
        {
          label: 'Completed',
          value: 'completed',
        },
        {
          label: 'Cancelled',
          value: 'cancelled',
        },
      ],
      required: true,
    },
    // Nested group, so the collection-query widget can sort/filter by a dot-path field
    // such as `details.priority`.
    {
      name: 'details',
      type: 'group',
      fields: [
        {
          name: 'priority',
          type: 'number',
        },
        {
          name: 'room',
          type: 'text',
        },
      ],
    },
  ],
  versions: false,
}
