import resolveNestedSelector from 'postcss-resolve-nested-selector'
import selectorParser from 'postcss-selector-parser'
import stylelint from 'stylelint'

const ruleName = 'plugin/no-has-above-universal-subject'

const SUBJECT_NARROWING_NODE_TYPES = new Set(['attribute', 'class', 'id', 'tag'])

const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: (selector) =>
    `Unexpected :has() above a universal subject in "${selector}". When the :has() may have changed, Chrome restyles every element under it. Move :has() onto the subject or give the subject a class.`,
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

    root.walkRules((rule) => {
      const resolvedSelectors = rule.selectors.flatMap((selector) =>
        resolveNestedSelector(selector, rule),
      )
      const uniqueOffendingSelectors = new Set(
        resolvedSelectors.flatMap(findSelectorsWithHasAboveUniversalSubject),
      )

      for (const offendingSelector of uniqueOffendingSelectors) {
        stylelint.utils.report({
          message: messages.rejected(offendingSelector),
          node: rule,
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

const findSelectorsWithHasAboveUniversalSubject = (resolvedSelector) => {
  const offendingSelectors = []
  selectorParser()
    .astSync(resolvedSelector)
    .walk((node) => {
      if (node.type === 'selector' && putsHasAboveUniversalSubject(node)) {
        offendingSelectors.push(node.toString().trim())
      }
    })
  return offendingSelectors
}

const putsHasAboveUniversalSubject = (complexSelector) => {
  const lastCombinatorIndex = complexSelector.nodes.findLastIndex(
    (node) => node.type === 'combinator',
  )
  if (lastCombinatorIndex === -1) {
    return false
  }
  const subjectNodes = complexSelector.nodes.slice(lastCombinatorIndex + 1)
  const nodesBeforeSubject = complexSelector.nodes.slice(0, lastCombinatorIndex)
  return (
    nodesBeforeSubject.some(containsHasPseudo) &&
    !subjectNodes.some((node) => SUBJECT_NARROWING_NODE_TYPES.has(node.type))
  )
}

const containsHasPseudo = (node) => isHasPseudo(node) || (node.nodes ?? []).some(containsHasPseudo)

const isHasPseudo = (node) => node.type === 'pseudo' && node.value.toLowerCase() === ':has'
