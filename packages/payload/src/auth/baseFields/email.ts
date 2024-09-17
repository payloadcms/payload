import type { EmailField } from '../../fields/config/types.js'

import { email } from '../../fields/validations.js'

export const emailFieldConfig: EmailField = {
  name: 'email',
  type: 'email',
  admin: {
    components: {
      Field: false,
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
  required: true,
  unique: true,
  validate: email,
}
