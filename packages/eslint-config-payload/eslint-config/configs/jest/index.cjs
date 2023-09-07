module.exports = {
  env: {
    jest: true,
  },
  plugins: ['jest', 'jest-dom'],
  extends: ['./rules/jest.cjs', './rules/jest-dom.cjs'].map(require.resolve),
  rules: {},
}
