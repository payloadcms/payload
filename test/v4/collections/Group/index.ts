import type { CollectionConfig } from 'payload'

import { groupFieldsSlug } from '../../slugs.js'

const GroupFields: CollectionConfig = {
  slug: groupFieldsSlug,
  fields: [
    {
      name: 'shippingInfo',
      type: 'group',
      label: 'Shipping Info',
      admin: {
        description: 'Enter the shipping address details',
      },
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
    {
      name: 'requiredInfo',
      type: 'group',
      label: 'Required Info',
      admin: {
        description: 'This group has required fields to test error state',
      },
      fields: [
        {
          name: 'requiredField',
          type: 'text',
          label: 'Required Field',
          required: true,
        },
        {
          name: 'anotherRequired',
          type: 'text',
          label: 'Another Required',
          required: true,
        },
      ],
    },
    {
      type: 'group',
      name: 'unnamedGroup',
      label: '',
      fields: [
        {
          name: 'unnamedGroupField',
          type: 'text',
          label: 'Field in Unnamed Group',
          required: true,
        },
      ],
    },
  ],
}

export default GroupFields
