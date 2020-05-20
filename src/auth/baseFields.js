module.exports = [
  {
    name: 'email',
    label: 'Email',
    type: 'email',
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
