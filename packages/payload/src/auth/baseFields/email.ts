import type { Field } from '../../fields/config/types.js'

import { email } from '../../fields/validations.js'

export const emailField = ({ required = true }: { required?: boolean }): Field => ({
  name: 'email',
  type: 'email',
  admin: {
    components: {
      Field: required ? () => null : undefined,
    },
  },
  hooks: {
    beforeChange: [
      ({ value }) => {
        if (value) {
          return value.toLowerCase().trim()
        }
      },
    ],
  },
  label: ({ t }) => t('general:email'),
  required,
  unique: true,
  validate: email,
})
