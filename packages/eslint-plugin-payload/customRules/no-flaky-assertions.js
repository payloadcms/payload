/** @type {import('eslint').Rule.RuleModule} */
export const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow non-retryable assertions in Playwright E2E tests unless they are wrapped in an expect.poll() or expect().toPass()',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
  },
  create: function (context) {
    const nonRetryableAssertions = [
      'toBe',
      'toBeCloseTo',
      'toBeDefined',
      'toBeFalsy',
      'toBeGreaterThan',
      'toBeGreaterThanOrEqual',
      'toBeInstanceOf',
      'toBeLessThan',
      'toBeLessThanOrEqual',
      'toBeNaN',
      'toBeNull',
      'toBeTruthy',
      'toBeUndefined',
      'toContain',
      'toContainEqual',
      'toEqual',
      'toHaveLength',
      'toHaveProperty',
      'toMatch',
      'toMatchObject',
      'toStrictEqual',
      'toThrow',
      'any',
      'anything',
      'arrayContaining',
      'closeTo',
      'objectContaining',
      'stringContaining',
      'stringMatching',
    ]

    function isNonRetryableAssertion(node) {
      return (
        node.type === 'MemberExpression' &&
        node.property.type === 'Identifier' &&
        nonRetryableAssertions.includes(node.property.name)
      )
    }

    function isExpectPollOrToPass(node) {
      if (
        node.type === 'MemberExpression' &&
        (node?.property?.name === 'poll' || node?.property?.name === 'toPass')
      ) {
        return true
      }

      return (
        node.type === 'CallExpression' &&
        node.callee.type === 'MemberExpression' &&
        ((node.callee.object.type === 'CallExpression' &&
          node.callee.object.callee.type === 'MemberExpression' &&
          node.callee.object.callee.property.name === 'poll') ||
          node.callee.property.name === 'toPass')
      )
    }

    function hasExpectPollOrToPassInChain(node) {
      let ancestor = node

      while (ancestor) {
        if (isExpectPollOrToPass(ancestor)) {
          return true
        }
        ancestor = 'object' in ancestor ? ancestor.object : ancestor.callee
      }

      return false
    }

    function hasExpectPollOrToPassInParentChain(node) {
      let ancestor = node

      while (ancestor) {
        if (isExpectPollOrToPass(ancestor)) {
          return true
        }
        ancestor = ancestor.parent
      }

      return false
    }

    return {
      CallExpression(node) {
        // node.callee is MemberExpressiom
        if (isNonRetryableAssertion(node.callee)) {
          if (hasExpectPollOrToPassInChain(node.callee)) {
            return
          }

          if (hasExpectPollOrToPassInParentChain(node)) {
            return
          }

          context.report({
            node: node.callee.property,
            message:
              'Non-retryable, flaky assertion used in Playwright test: "{{ assertion }}". Those need to be wrapped in expect.poll() or expect().toPass().',
            data: {
              assertion: node.callee.property.name,
            },
          })
        }
      },
    }
  },
}

export default rule
