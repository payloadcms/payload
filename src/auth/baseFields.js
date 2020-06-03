const validations = require('../fields/validations');

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
  {
    name: 'enableAPIKey',
    label: 'Enable API key for this user',
    type: 'checkbox',
    defaultValue: false,
    validate: validations.checkbox,
  },
  {
    name: 'apiKey',
    type: 'text',
    label: 'User API Key',
    condition: (_, siblings) => {
      return siblings.enableAPIKey && siblings.enableAPIKey.value;
    },
    validate: validations.text,
  },
];
