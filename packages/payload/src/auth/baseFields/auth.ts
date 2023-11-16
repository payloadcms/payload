import type { Field } from '../../fields/config/types'

import { email } from '../../fields/validations'
import { extractTranslations } from '../../translations/extractTranslations'

const labels = extractTranslations(['general:email'])

const baseAuthFields: Field[] = [
  {
    name: 'email',
    admin: {
      components: {
        Field: () => null,
      },
    },
    label: labels['general:email'],
    required: true,
    type: 'email',
    unique: true,
    validate: email,
  },
  {
    name: 'resetPasswordToken',
    hidden: true,
    type: 'text',
  },
  {
    name: 'resetPasswordExpiration',
    hidden: true,
    type: 'date',
  },
  {
    name: 'salt',
    hidden: true,
    type: 'text',
  },
  {
    name: 'hash',
    hidden: true,
    type: 'text',
  },
]

export default baseAuthFields
