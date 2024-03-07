import type { Field } from '../../fields/config/types.js'

export default [
  {
    name: 'loginAttempts',
    type: 'number',
    defaultValue: 0,
    hidden: true,
  },
  {
    name: 'lockUntil',
    type: 'date',
    hidden: true,
  },
] as Field[]
