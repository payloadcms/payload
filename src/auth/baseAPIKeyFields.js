module.exports = [
  {
    name: 'enableAPIKey',
    type: 'checkbox',
    defaultValue: false,
    hidden: 'admin',
  },
  {
    name: 'apiKey',
    type: 'text',
    minLength: 24,
    maxLength: 48,
    hidden: 'admin',
  },
];
