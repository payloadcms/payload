/** @type {import('eslint').Rule.RuleModule} */
export const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow non-retryable assertions in Playwright E2E tests',
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
          context.report({
            node: node.callee.property,
            message:
              'Non-retryable, flaky assertion used in Playwright test: "{{ assertion }}". Those need to be wrapped in expect.poll or expect.toPass.',
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
