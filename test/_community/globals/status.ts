export const Status = {
  slug: 'status',
  admin: {
    useAsTitle: 'globalText',
    listSearchableFields: ['globalText'],
  },
  fields: [
    {
      name: 'globalText',
      type: 'text',
    },
    {
      name: 'status',
      type: 'select',
      label: 'Payment Status',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      required: true,
    },
  ],
}
