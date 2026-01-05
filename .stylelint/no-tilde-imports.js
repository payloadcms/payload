import stylelint from 'stylelint'

const ruleName = 'plugin/no-tilde-imports'
const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: (importPath) =>
    `Unexpected tilde (~) in import "${importPath}". Use relative paths instead. See PR #15028`,
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

    root.walkAtRules('import', (atRule) => {
      const importValue = atRule.params.replace(/['"`]/g, '').trim()

      if (importValue.startsWith('~')) {
        stylelint.utils.report({
          message: messages.rejected(atRule.params),
          node: atRule,
          result,
          ruleName,
        })
      }
    })

    root.walkAtRules('use', (atRule) => {
      const importValue = atRule.params.replace(/['"`]/g, '').trim()

      if (importValue.startsWith('~')) {
        stylelint.utils.report({
          message: messages.rejected(atRule.params),
          node: atRule,
          result,
          ruleName,
        })
      }
    })
  }
}

ruleFunction.ruleName = ruleName
ruleFunction.messages = messages

export default stylelint.createPlugin(ruleName, ruleFunction)
