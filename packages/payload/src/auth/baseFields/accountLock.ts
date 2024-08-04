import type { Field } from '../../fields/config/types.js'

export const accountLockFields: Field[] = [
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
