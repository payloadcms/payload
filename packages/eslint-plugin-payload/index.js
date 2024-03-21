/** @type {import('eslint').Linter.Config} */
module.exports = {
  rules: {
    'no-non-retryable-assertions': require('./customRules/no-non-retryable-assertions'),
  },
}
