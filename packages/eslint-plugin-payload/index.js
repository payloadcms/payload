/** @type {import('eslint').Linter.Config} */
module.exports = {
  rules: {
    'no-jsx-import-statements': require('./customRules/no-jsx-import-statements'),
    'no-non-retryable-assertions': require('./customRules/no-non-retryable-assertions'),
    'no-relative-monorepo-imports': require('./customRules/no-relative-monorepo-imports'),
  },
}
