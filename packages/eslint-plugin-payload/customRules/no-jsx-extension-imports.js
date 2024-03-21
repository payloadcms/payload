module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow .jsx file extensions in imports.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
  },
  create: function (context) {
    return {
      ImportDeclaration(node) {
        const importPath = node.source.value

        // Match any imports where the file ext ends with .jsx
        const regex = /\.jsx$/

        if (regex.test(importPath)) {
          context.report({
            node: node.source,
            message:
              'Do not use ".jsx" as import extension. Use ".js" instead. VS Code is dumb and auto-suggests ".jsx" for some reason.',
          })
        }
      },
    }
  },
}
