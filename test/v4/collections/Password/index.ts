import type { CollectionConfig } from 'payload'

import { passwordFieldsSlug } from '../../slugs.js'

const PasswordFields: CollectionConfig = {
  slug: passwordFieldsSlug,
  fields: [
    {
      name: 'password',
      type: 'text',
      label: 'Password',
      admin: {
        description: 'Must be at least 8 characters',
      },
    },
    {
      name: 'passwordRequired',
      type: 'text',
      label: 'Password',
      required: true,
      admin: {
        description: 'Must be at least 8 characters',
      },
    },
    {
      name: 'passwordDisabled',
      type: 'text',
      label: 'Password',
      admin: {
        readOnly: true,
        description: 'Must be at least 8 characters',
      },
    },
  ],
}

export default PasswordFields
