import type { Field } from '../../fields/config/types.js'

import { email } from '../../fields/validations.js'
import { extractTranslations } from '../../translations/extractTranslations.js'

const labels = extractTranslations(['general:email'])

const baseAuthFields: Field[] = [
  {
    name: 'email',
    type: 'email',
    admin: {
      components: {
        Field: () => null,
      },
    },
    label: labels['general:email'],
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
