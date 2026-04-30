import type { CollectionConfig } from 'payload'

import { groupFieldsSlug } from '../../slugs.js'

const GroupFields: CollectionConfig = {
  slug: groupFieldsSlug,
  fields: [
    {
      name: 'shippingInfo',
      type: 'group',
      label: 'Shipping Info',
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Name',
        },
        {
          name: 'address',
          type: 'text',
          label: 'Address',
        },
      ],
    },
    {
      name: 'contactInfo',
      type: 'group',
      label: 'Contact Info',
      fields: [
        {
          name: 'emailAddress',
          type: 'email',
          label: 'Email Address',
          admin: {
            description: 'The primary contact email for this account',
          },
        },
      ],
    },
  ],
}

export default GroupFields
