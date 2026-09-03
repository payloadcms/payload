const SCOPED_METHODS = new Set([
  'afterAll',
  'afterEach',
  'aroundAll',
  'aroundEach',
  'beforeAll',
  'beforeEach',
  'describe',
  'options',
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

function isTestOptionsCall(node) {
  if (
    node.type !== 'CallExpression' ||
    node.callee.type !== 'MemberExpression' ||
    getStaticPropertyName(node.callee) !== 'options'
  ) {
    return false
  }

  const rootIdentifier = getRootIdentifier(node.callee.object)

  return Boolean(rootIdentifier && ['it', 'test'].includes(rootIdentifier.name))
}

/** @type {import('eslint').Rule.RuleModule} */
export const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require parser-friendly Vitest suite, hook, and conditional APIs so editor test discovery uses the correct test name',
      category: 'Possible Errors',
      recommended: false,
    },
    messages: {
      useRunIf:
        'Use `{{target}}.runIf(matchesDatabase(...))` instead of `{{testIdentifier}}.options(...)`. Vitest understands `runIf`, so the editor can discover the correct test name.',
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

        // `test.options(...).describe(...)` gets one diagnostic on `options` with the complete
        // `describe.runIf(...)` replacement instead of a second overlapping `describe` error.
        if (method !== 'options' && isTestOptionsCall(node.object)) {
          return
        }

        const rootIdentifier = getRootIdentifier(node.object)

        if (!rootIdentifier || !['it', 'test'].includes(rootIdentifier.name)) {
          return
        }

        context.report({
          node,
          messageId: method === 'options' ? 'useRunIf' : 'useStandalone',
          data: {
            method,
            target:
              node.parent?.type === 'CallExpression' &&
              node.parent.parent?.type === 'MemberExpression'
                ? (getStaticPropertyName(node.parent.parent) ?? rootIdentifier.name)
                : rootIdentifier.name,
            testIdentifier: rootIdentifier.name,
          },
        })
      },
    }
  },
}

export default rule
