module.exports = {
  plugins: [
    'node',
  ],
  env: {
    node: true,
  },
  extends: [
    '../../../../../.eslintrc.cjs',
    './rules/best-practices.cjs',
    './rules/errors.cjs',
    './rules/es6.cjs',
    './rules/imports.cjs',
    './rules/variables.cjs',
  ].map(require.resolve),
  rules: {},
};
