import stylelint from 'stylelint'

const ruleName = 'plugin/no-non-standard-breakpoints'

const ALLOWED_BREAKPOINTS = ['400px', '768px', '1024px', '1440px']

const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: (value) =>
    `Unexpected breakpoint value "${value}". Allowed values are: ${ALLOWED_BREAKPOINTS.join(', ')}.`,
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
      const widthPattern = /(?:min|max)-width\s*:\s*([^\s)]+)/g
      let match

      while ((match = widthPattern.exec(atRule.params)) !== null) {
        const value = match[1]

        // Skip SCSS variables — they are resolved at compile time
        if (value.startsWith('$')) {
          continue
        }

        if (!ALLOWED_BREAKPOINTS.includes(value)) {
          stylelint.utils.report({
            message: messages.rejected(value),
            node: atRule,
            result,
            ruleName,
            word: value,
          })
        }
      }
    })
  }
}

ruleFunction.ruleName = ruleName
ruleFunction.messages = messages

export default stylelint.createPlugin(ruleName, ruleFunction)
