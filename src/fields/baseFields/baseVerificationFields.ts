import { Field } from '../config/types';

export default [
  {
    name: '_verified',
    type: 'checkbox',
    access: {
      create: () => false,
      update: ({ req: { user } }) => Boolean(user),
      read: ({ req: { user } }) => Boolean(user),
    },
    admin: {
      disabled: true,
    },
  },
  {
    name: '_verificationToken',
    type: 'text',
    hidden: true,
  },
] as Field[];
