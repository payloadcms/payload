const SCOPED_METHODS = new Set([
  'afterAll',
  'afterEach',
  'aroundAll',
  'aroundEach',
  'beforeAll',
  'beforeEach',
  'describe',
  'suite',
])

/**
 * Returns the identifier at the start of a member or call chain.
 *
 * Examples:
 * - `test.describe` -> `test`
 * - `test.describe.each` -> `test`
 * - `test.options({ db: 'mongo' }).describe` -> `test`
 */
function getRootIdentifier(node) {
  if (!node) {
    return null
  }

  if (node.type === 'Identifier') {
    return node
  }

  if (node.type === 'CallExpression') {
    return getRootIdentifier(node.callee)
  }

  if (node.type === 'ChainExpression') {
    return getRootIdentifier(node.expression)
  }

  if (node.type === 'MemberExpression') {
    return getRootIdentifier(node.object)
  }

  return null
}

function getStaticPropertyName(node) {
  if (!node.computed && node.property.type === 'Identifier') {
    return node.property.name
  }

  if (node.computed && node.property.type === 'Literal') {
    return typeof node.property.value === 'string' ? node.property.value : null
  }

  return null
}

/** @type {import('eslint').Rule.RuleModule} */
export const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require standalone Vitest suite and hook functions so editor test discovery uses the correct test name',
      category: 'Possible Errors',
      recommended: false,
    },
    messages: {
      useStandalone:
        'Use the standalone `{{method}}(...)` API instead of `{{testIdentifier}}.{{method}}(...)`. Scoped suite and hook methods can make the VS Code Vitest extension discover the wrong test name.',
    },
    schema: [],
  },
  create(context) {
    return {
      MemberExpression(node) {
        const method = getStaticPropertyName(node)

        if (!method || !SCOPED_METHODS.has(method)) {
          return
        }

        const rootIdentifier = getRootIdentifier(node.object)

        if (!rootIdentifier || !['it', 'test'].includes(rootIdentifier.name)) {
          return
        }

        context.report({
          node,
          messageId: 'useStandalone',
          data: {
            method,
            testIdentifier: rootIdentifier.name,
          },
        })
      },
    }
  },
}

export default rule
