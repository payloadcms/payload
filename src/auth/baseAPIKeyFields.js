module.exports = [
  {
    name: 'enableAPIKey',
    type: 'checkbox',
    defaultValue: false,
    admin: {
      disabled: true,
    },
  },
  {
    name: 'apiKey',
    type: 'text',
    minLength: 24,
    maxLength: 48,
    admin: {
      disabled: true,
    },
  },
];
