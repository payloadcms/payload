import fs from 'fs'
import path from 'path'

/** @type {import('eslint').Rule.RuleModule} */
export const rule = {
  meta: {
    docs: {
      description: 'Disallow a package from importing from itself',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
  },

  create(context) {
    let packageName = null

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value
        const pkgName = getPackageName(context, packageName)
        if (pkgName && importPath.startsWith(pkgName)) {
          context.report({
            node,
            message: `Package "${pkgName}" should not import from itself. Use relative instead.`,
          })
        }
      },
    }
  },
}

export default rule

/**
 * @param {import('eslint').Rule.RuleContext} context
 * @param {string|undefined} packageName
 */
function getPackageName(context, packageName) {
  if (packageName) {
    return packageName
  }

  const fileName = context.getFilename()
  const pkg = findNearestPackageJson(path.dirname(fileName))
  if (pkg) {
    return pkg.name
  }
}

/**
 * @param {string} startDir
 */
function findNearestPackageJson(startDir) {
  let currentDir = startDir
  while (currentDir !== path.dirname(currentDir)) {
    // Root directory check
    const pkgPath = path.join(currentDir, 'package.json')
    if (fs.existsSync(pkgPath)) {
      const pkgContent = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
      return pkgContent
    }
    currentDir = path.dirname(currentDir)
  }
  return null
}
