import fs from 'fs'
import path from 'path'

/** @type {import('eslint').Rule.RuleModule} */
export const rule = {
  meta: {
    docs: {
      description: 'Disallow specific imports based on configuration',
      category: 'Best Practices',
      recommended: false,
    },
    schema: {
      type: 'array',
      items: [
        {
          type: 'object',
          properties: {
            paths: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of package names or patterns to restrict',
            },
            restrictTypeImports: {
              type: 'boolean',
              description: 'Whether to also restrict type-only imports (default: false)',
            },
            message: {
              type: 'string',
              description: 'Custom error message to display',
            },
            resolvePathsFrom: {
              type: 'string',
              description: 'Path to a file that exports the paths to restrict',
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
    const options = context.options[0] || {}
    const restrictTypeImports = options.restrictTypeImports ?? false
    const customMessage = options.message
    let restrictedPaths = options.paths || []

    // If resolvePathsFrom is provided, read the file and extract export names
    if (options.resolvePathsFrom) {
      const resolvedPath = resolvePathsFromFile(context, options.resolvePathsFrom)
      if (resolvedPath) {
        restrictedPaths = [...restrictedPaths, ...resolvedPath]
      }
    }

    const restrictedPatterns = restrictedPaths.map((pattern) => {
      // Check if it's already a regex pattern
      if (pattern.startsWith('/') && pattern.endsWith('/')) {
        return new RegExp(pattern.slice(1, -1))
      }
      // Exact match
      return new RegExp(`^${escapeRegex(pattern)}$`)
    })

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value

        // Check if this is a type-only import
        const isTypeImport = node.importKind === 'type'

        // Skip type imports if restrictTypeImports is false
        if (isTypeImport && !restrictTypeImports) {
          return
        }

        // Check if import matches any restricted pattern
        const matchesRestricted = restrictedPatterns.some((pattern) => pattern.test(importPath))

        if (matchesRestricted) {
          const typeInfo = isTypeImport ? 'type-only ' : ''
          const defaultMessage = `Direct ${typeInfo}import from "${importPath}" is not allowed.`

          context.report({
            node,
            message: customMessage || defaultMessage,
          })
        }
      },
    }
  },
}

export default rule

/**
 * Escape special regex characters
 * @param {string} str
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Resolve paths from a file that exports them
 * @param {import('eslint').Rule.RuleContext} context
 * @param {string} filePath
 */
function resolvePathsFromFile(context, filePath) {
  try {
    // Find the package root
    const packageRoot = findNearestPackageJson(path.dirname(context.filename))
    if (!packageRoot) {
      return null
    }

    const fullPath = path.resolve(packageRoot.dir, filePath)
    if (!fs.existsSync(fullPath)) {
      return null
    }

    const fileContent = fs.readFileSync(fullPath, 'utf8')

    // Extract export declarations
    // Matches patterns like:
    // - export * as moduleName from 'package-name'
    // - export { moduleName } from 'package-name'
    const exportAsRegex = /export\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g
    const exportNamedRegex = /export\s+\{[^}]*\}\s+from\s+['"]([^'"]+)['"]/g
    const exportDefaultRegex = /export\s+\{\s*default\s+as\s+(\w+)\s*\}\s+from\s+['"]([^'"]+)['"]/g

    const paths = []
    let match

    // Match "export * as name from 'package'" and extract the package name
    while ((match = exportAsRegex.exec(fileContent)) !== null) {
      paths.push(match[2]) // Use the package name (second capture group)
    }

    // Match "export { default as name } from 'package'" and extract the package name
    exportDefaultRegex.lastIndex = 0
    while ((match = exportDefaultRegex.exec(fileContent)) !== null) {
      paths.push(match[2]) // Use the package name (second capture group)
    }

    // Match "export { name } from 'package'" and extract the package name
    exportNamedRegex.lastIndex = 0
    while ((match = exportNamedRegex.exec(fileContent)) !== null) {
      paths.push(match[1]) // Use the package name (first capture group)
    }

    return paths
  } catch (error) {
    console.error(`Error reading resolvePathsFrom file: ${error.message}`)
    return null
  }
}

/**
 * @param {string} startDir
 */
function findNearestPackageJson(startDir) {
  let currentDir = startDir
  while (currentDir !== path.dirname(currentDir)) {
    const pkgPath = path.join(currentDir, 'package.json')
    if (fs.existsSync(pkgPath)) {
      const pkgContent = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
      return { name: pkgContent.name, dir: currentDir }
    }
    currentDir = path.dirname(currentDir)
  }
  return null
}
