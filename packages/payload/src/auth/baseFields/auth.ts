import type { Field } from '../../fields/config/types.js'

const baseAuthFields: Field[] = [
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
