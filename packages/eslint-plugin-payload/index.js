/** @type {import('eslint').Linter.Config} */
module.exports = {
  rules: {
    'no-jsx-import-statements': require('./customRules/no-jsx-import-statements'),
    'no-non-retryable-assertions': require('./customRules/no-non-retryable-assertions'),
    'no-relative-monorepo-imports': require('./customRules/no-relative-monorepo-imports'),
    'no-imports-from-exports-dir': require('./customRules/no-imports-from-exports-dir'),
    'no-flaky-assertions': require('./customRules/no-flaky-assertions'),
    'no-wait-function': {
      create: function (context) {
        return {
          CallExpression(node) {
            // Check if the function being called is named "wait"
            if (node.callee.name === 'wait') {
              context.report({
                node,
                message:
                  'Usage of "wait" function is discouraged as it\'s flaky. Proper assertions should be used instead.',
              })
            }
          },
        }
      },
    },
  },
}
