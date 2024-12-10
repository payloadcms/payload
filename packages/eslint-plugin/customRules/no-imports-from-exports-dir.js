/** @type {import('eslint').Rule.RuleModule} */
export const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow imports from an exports directory',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
  },
  create: function (context) {
    return {
      ImportDeclaration(node) {
        const importPath = node.source.value

        // Match imports starting with any number of "../" followed by "exports/"
        const regex = /^(\.?\.\/)*exports\//

        if (regex.test(importPath)) {
          context.report({
            node: node.source,
            message:
              'Import from relative "exports/" is not allowed. Import directly to the source instead.',
          })
        }
      },
    }
  },
}

export default rule
