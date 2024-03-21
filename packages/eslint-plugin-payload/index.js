/** @type {import('eslint').Linter.Config} */
module.exports = {
  rules: {
    'no-non-retryable-assertions': require('./customRules/no-non-retryable-assertions'),
    'no-relative-monorepo-imports': require('./customRules/no-relative-monorepo-imports'),
  },
}
