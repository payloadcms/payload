import validations from '../validations';

export default [
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    validate: validations.email,
    admin: {
      disabled: true,
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
];
