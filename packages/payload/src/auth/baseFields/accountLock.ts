import type { Field } from '../../fields/config/types.js'

export const accountLockFields: Field[] = [
  {
    name: 'loginAttempts',
    type: 'number',
    access: {
      create: () => false,
      update: () => false,
    },
    defaultValue: 0,
    hidden: true,
  },
  {
    name: 'lockUntil',
    type: 'date',
    access: {
      create: () => false,
      update: () => false,
    },
    hidden: true,
  },
] as Field[]
