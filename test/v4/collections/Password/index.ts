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
        components: {
          Field: '/collections/Password/Field#CustomPasswordField',
        },
      },
    },
    {
      name: 'passwordRequired',
      type: 'text',
      label: 'Password (Required)',
      required: true,
      admin: {
        description: 'Must be at least 8 characters',
        components: {
          Field: '/collections/Password/Field#CustomPasswordField',
        },
      },
    },
    {
      name: 'passwordDisabled',
      type: 'text',
      label: 'Password (Disabled)',
      admin: {
        readOnly: true,
        description: 'Must be at least 8 characters',
        components: {
          Field: '/collections/Password/Field#CustomPasswordFieldReadOnly',
        },
      },
    },
    {
      name: 'passwordWithDefault',
      type: 'text',
      label: 'Password (With Default)',
      defaultValue: 'test',
      admin: {
        description: 'Has a default value',
        components: {
          Field: '/collections/Password/Field#CustomPasswordField',
        },
      },
    },
    {
      name: 'confirmPassword',
      type: 'text',
      label: 'Confirm Password',
      defaultValue: 'test',
      admin: {
        components: {
          Field: '/collections/Password/Field#CustomConfirmPasswordField',
        },
      },
    },
    {
      name: 'confirmPasswordDisabled',
      type: 'text',
      label: 'Confirm Password (Disabled)',
      admin: {
        readOnly: true,
        components: {
          Field: '/collections/Password/Field#CustomConfirmPasswordFieldDisabled',
        },
      },
    },
  ],
}

export default PasswordFields
