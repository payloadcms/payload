module.exports = {
  env: {
    jest: true,
  },
  plugins: ['jest', 'jest-dom'],
  extends: ['./rules/jest.js', './rules/jest-dom.js'].map(require.resolve),
  rules: {},
}
