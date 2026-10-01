import stylelint from 'stylelint'

const ruleName = 'plugin/no-max-width-media-query'
const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: 'Unexpected max-width in media query. Use min-width for a mobile-first approach.',
})

const ruleFunction = (enabled) => {
  return (root, result) => {
    const validOptions = stylelint.utils.validateOptions(result, ruleName, {
      actual: enabled,
      possible: [true, false],
    })

    if (!validOptions || !enabled) {
      return
    }

    root.walkAtRules('media', (atRule) => {
      if (/max-width/.test(atRule.params)) {
        stylelint.utils.report({
          message: messages.rejected,
          node: atRule,
          result,
          ruleName,
          word: 'max-width',
        })
      }
    })
  }
}

ruleFunction.ruleName = ruleName
ruleFunction.messages = messages

export default stylelint.createPlugin(ruleName, ruleFunction)
