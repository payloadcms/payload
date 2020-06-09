const validations = require('../fields/validations');

module.exports = [
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
