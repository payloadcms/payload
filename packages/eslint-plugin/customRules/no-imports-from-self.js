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
    schema: {
      type: 'array',
      items: [
        {
          type: 'object',
          properties: {
            exclude: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
          additionalProperties: false,
        },
      ],
      minItems: 0,
      maxItems: 100,
    },
  },

  create(context) {
    let packageName = null
    const options = context.options[0] || {}
    const excludePatterns = (options.exclude || []).map((pattern) => new RegExp(pattern))

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value
        packageName = getPackageName(context, packageName)

        if (packageName && importPath.startsWith(packageName)) {
          // Check if import matches any exclude pattern
          const isExcluded = excludePatterns.some((pattern) => pattern.test(importPath))

          if (!isExcluded) {
            context.report({
              node,
              message: `Package "${packageName}" should not import from itself. Use relative instead.`,
            })
          }
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

  const pkg = findNearestPackageJson(path.dirname(context.filename))
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
