const validations = require('../fields/validations');

module.exports = [
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    validate: validations.email,
    admin: {
      disable: true,
    },
  },
  {
    name: 'resetPasswordToken',
    type: 'text',
    admin: {
      disable: true,
    },
  },
  {
    name: 'resetPasswordExpiration',
    type: 'date',
    admin: {
      disable: true,
    },
  },
];
