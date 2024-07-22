import type { Field } from '../../fields/config/types.js'

import { username } from '../../fields/validations.js'

export const usernameField: Field = {
  name: 'username',
  type: 'text',
  admin: {
    components: {
      Field: () => null,
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
  label: ({ t }) => t('authentication:username'),
  required: true,
  unique: true,
  validate: username,
}
