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
    type: 'checkbox',
    defaultValue: false,
  },
  {
    name: 'apiKey',
    type: 'text',
    condition: (_, siblings) => {
      return siblings.enableAPIKey;
    },
  },
];
