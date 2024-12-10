import type { TextField } from '../../fields/config/types.js'

import { username } from '../../fields/validations.js'

export const usernameFieldConfig: TextField = {
  name: 'username',
  type: 'text',
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
  label: ({ t }) => t('authentication:username'),
  required: true,
  unique: true,
  validate: username,
}
