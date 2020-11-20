const validations = require('../validations');

module.exports = [
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
