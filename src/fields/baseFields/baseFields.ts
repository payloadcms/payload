import { email } from '../validations';
import { Field } from '../config/types';

export default [
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    validate: email,
    unique: true,
    admin: {
      components: {
        Field: () => null,
      },
    },
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
] as Field[];
