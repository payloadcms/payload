module.exports = [
  {
    name: 'enableAPIKey',
    type: 'checkbox',
    defaultValue: false,
  },
  {
    name: 'apiKey',
    type: 'text',
    minLength: 24,
    maxLength: 48,
  },
];
