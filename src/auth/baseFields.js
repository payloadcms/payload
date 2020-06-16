const validations = require('../validation/validations');

module.exports = [
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    validate: validations.email,
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
