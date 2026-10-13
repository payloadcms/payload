const { parse } = require('@babel/parser')

/**
 * Add Next's blocking-route opt-out to compiled admin entries only. App source
 * stays unchanged so disabling Cache Components cannot leave an invalid export.
 * Appending preserves the incoming source map's mappings for the original code.
 */
module.exports = function (source, sourceMap) {
  const match = /[/\\](layout|page)\.(?:[cm]?[jt]s|[jt]sx)$/.exec(this.resourcePath)

  if (!match || !source.includes('@payloadcms/next/')) {
    this.callback(null, source, sourceMap)
    return
  }

  const isLayout = match[1] === 'layout'
  const importPath = isLayout ? '@payloadcms/next/layouts' : '@payloadcms/next/views'
  const componentName = isLayout ? 'RootLayout' : 'RootPage'
  const ast = parse(source, {
    plugins: ['typescript', ...(/\.[cm]?ts$/.test(this.resourcePath) ? [] : ['jsx'])],
    sourceType: 'module',
  })
  const isAdminEntry = ast.program.body.some(
    (node) =>
      node.type === 'ImportDeclaration' &&
      node.importKind !== 'type' &&
      node.source.value === importPath &&
      node.specifiers.some(
        (specifier) =>
          specifier.type === 'ImportSpecifier' &&
          specifier.importKind !== 'type' &&
          (specifier.imported.name ?? specifier.imported.value) === componentName,
      ),
  )
  const hasInstantExport = ast.program.body.some(
    (node) =>
      node.type === 'ExportNamedDeclaration' &&
      node.exportKind !== 'type' &&
      (node.specifiers.some(
        (specifier) => (specifier.exported.name ?? specifier.exported.value) === 'instant',
      ) ||
        (node.declaration?.type === 'VariableDeclaration' &&
          node.declaration.declarations.some((declaration) =>
            hasInstantBinding({ node: declaration.id }),
          ))),
  )

  if (isAdminEntry && !hasInstantExport) {
    let identifier = '__payloadInstant'

    while (source.includes(identifier)) {
      identifier += '_'
    }

    source += `\nconst ${identifier} = false;\nexport { ${identifier} as instant };\n`
  }

  this.callback(null, source, sourceMap)
}

function hasInstantBinding({ node }) {
  switch (node?.type) {
    case 'Identifier':
      return node.name === 'instant'
    case 'ObjectPattern':
      return node.properties.some((property) =>
        hasInstantBinding({
          node: property.type === 'RestElement' ? property.argument : property.value,
        }),
      )
    case 'ArrayPattern':
      return node.elements.some((element) => hasInstantBinding({ node: element }))
    case 'AssignmentPattern':
      return hasInstantBinding({ node: node.left })
    case 'RestElement':
      return hasInstantBinding({ node: node.argument })
    default:
      return false
  }
}
