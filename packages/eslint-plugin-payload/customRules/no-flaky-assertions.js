/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
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

    return {
      CallExpression(node) {
        if (
          node.callee.type === 'MemberExpression' &&
          //node.callee.object.name === 'expect' &&
          node.callee.property.type === 'Identifier' &&
          nonRetryableAssertions.includes(node.callee.property.name)
        ) {
          let ancestor = node
          let hasExpectPollOrToPass = false

          while (ancestor) {
            if (
              ancestor.type === 'CallExpression' &&
              ancestor.callee.type === 'MemberExpression' &&
              ((ancestor.callee.object.type === 'CallExpression' &&
                ancestor.callee.object.callee.type === 'MemberExpression' &&
                ancestor.callee.object.callee.property.name === 'poll') ||
                ancestor.callee.property.name === 'toPass')
            ) {
              hasExpectPollOrToPass = true
              break
            }
            ancestor = ancestor.parent
          }

          if (hasExpectPollOrToPass) {
            return
          }

          context.report({
            node: node.callee.property,
            message:
              'Non-retryable, flaky assertion used in Playwright test: "{{ assertion }}". Those need to be wrapped in expect.poll() or expect().toPass.',
            data: {
              assertion: node.callee.property.name,
            },
          })
        }
      },
    }
  },
}
