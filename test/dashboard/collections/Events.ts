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
      required: true,
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
    },
    {
      name: 'organizer',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
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
    },
  ],
}
