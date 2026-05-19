import type { Field } from '../../fields/config/types.js'

export const baseAuthFields: Field[] = [
  {
    name: 'resetPasswordToken',
    type: 'text',
    access: {
      create: () => false,
      update: () => false,
    },
    hidden: true,
  },
  {
    name: 'resetPasswordExpiration',
    type: 'date',
    access: {
      create: () => false,
      update: () => false,
    },
    hidden: true,
  },
  {
    name: 'salt',
    type: 'text',
    access: {
      create: () => false,
      update: () => false,
    },
    hidden: true,
  },
  {
    name: 'hash',
    type: 'text',
    access: {
      create: () => false,
      update: () => false,
    },
    hidden: true,
  },
]
