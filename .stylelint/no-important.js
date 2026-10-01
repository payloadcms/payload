import stylelint from 'stylelint'

const ruleName = 'plugin/no-important'
const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: (prop) =>
    `Unexpected !important on "${prop}". Refactor CSS specificity instead of using !important.`,
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

    root.walkDecls((decl) => {
      if (!decl.important) {
        return
      }

      stylelint.utils.report({
        message: messages.rejected(decl.prop),
        node: decl,
        result,
        ruleName,
        word: '!important',
      })
    })
  }
}

ruleFunction.ruleName = ruleName
ruleFunction.messages = messages

export default stylelint.createPlugin(ruleName, ruleFunction)
