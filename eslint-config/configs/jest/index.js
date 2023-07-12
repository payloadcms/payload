module.exports = {
  env: {
    jest: true,
  },
  plugins: [
    'jest',
    'jest-dom',
  ],
  extends: [
    './rules/jest',
    './rules/jest-dom',
  ].map(require.resolve),
  rules: {},
};
