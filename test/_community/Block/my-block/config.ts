import type { CollectionConfig } from 'payload'

export const UserStatusCollection: CollectionConfig = {
  slug: 'user-statuses',
  admin: {
    useAsTitle: 'status',
    listSearchableFields: ['status'],
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      label: 'User Status',
      options: [
        { label: 'Active User', value: 'active' },
        { label: 'Expired User', value: 'expired' },
        { label: 'Failed User', value: 'failed' },
        { label: 'Cancelled User', value: 'cancelled' },
      ],
      required: true,
    },
  ],
}
