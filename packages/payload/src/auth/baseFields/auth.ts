import type { Field } from '../../fields/config/types.js'

import { email } from '../../fields/validations.js'

const baseAuthFields: Field[] = [
  {
    name: 'email',
    type: 'email',
    admin: {
      components: {
        Field: () => null,
      },
    },
    label: ({ t }) => t('general:email'),
    required: true,
    unique: true,
    validate: email,
  },
  {
    name: 'resetPasswordToken',
    type: 'text',
    hidden: true,
  },
  {
    name: 'resetPasswordExpiration',
    type: 'date',
    hidden: true,
  },
  {
    name: 'salt',
    type: 'text',
    hidden: true,
  },
  {
    name: 'hash',
    type: 'text',
    hidden: true,
  },
]

export default baseAuthFields
