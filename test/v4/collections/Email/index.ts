import type { CollectionConfig } from 'payload'

import { emailFieldsSlug } from '../../slugs.js'

const EmailFields: CollectionConfig = {
  slug: emailFieldsSlug,
  fields: [
    {
      name: 'emailAddress',
      type: 'email',
      label: 'Email Address',
      admin: {
        description: 'The primary contact email for this account',
      },
    },
    {
      name: 'emailAddressRequired',
      type: 'email',
      label: 'Email Address',
      required: true,
      admin: {
        description: 'The primary contact email for this account',
      },
    },
    {
      name: 'emailAddressDisabled',
      type: 'email',
      label: 'Email Address',
      admin: {
        readOnly: true,
        description: 'The primary contact email for this account',
      },
    },
  ],
}

export default EmailFields
