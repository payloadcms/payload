module.exports = [
  {
    name: 'enableAPIKey',
    type: 'checkbox',
    defaultValue: false,
    admin: {
      disable: true,
    },
  },
  {
    name: 'apiKey',
    type: 'text',
    minLength: 24,
    maxLength: 48,
    admin: {
      disable: true,
    },
  },
];
