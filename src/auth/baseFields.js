const validations = require('../fields/validations');

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
];
