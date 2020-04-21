module.exports = [
  {
    name: 'resetPasswordToken',
    type: 'hidden',
  },
  {
    name: 'resetPasswordExpiration',
    type: 'hidden',
  },
  {
    name: 'enableAPIKey',
    label: 'Enable API key for this user',
    type: 'checkbox',
    defaultValue: false,
  },
  {
    name: 'apiKey',
    type: 'text',
    label: 'User API Key',
    condition: (_, siblings) => {
      return siblings.enableAPIKey && siblings.enableAPIKey.value;
    },
  },
];
