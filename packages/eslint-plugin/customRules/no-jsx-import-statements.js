/**
 * Disallows imports from .jsx extensions. Auto-fixes to .js.
 */

/** @type {import('eslint').Rule.RuleModule} */
export const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow imports from .jsx extensions',
    },
    fixable: 'code',
    schema: [],
  },
  create: function (context) {
    return {
      ImportDeclaration(node) {
        const importPath = node.source.value

        if (!importPath.endsWith('.jsx')) return

        context.report({
          node: node.source,
          message: 'JSX imports are invalid. Use .js instead.',
          fix: (fixer) => {
            return fixer.removeRange([node.source.range[1] - 2, node.source.range[1] - 1])
          },
        })
      },
    }
  },
}

export default rule
