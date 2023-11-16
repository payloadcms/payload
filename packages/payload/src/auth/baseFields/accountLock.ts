import type { Field } from '../../fields/config/types'

export default [
  {
    name: 'loginAttempts',
    defaultValue: 0,
    hidden: true,
    type: 'number',
  },
  {
    name: 'lockUntil',
    hidden: true,
    type: 'date',
  },
] as Field[]
