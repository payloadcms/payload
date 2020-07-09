const validations = require('../fields/validations');

module.exports = [
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    validate: validations.email,
    hidden: 'admin',
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
