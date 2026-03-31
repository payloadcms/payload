// packages/eslint-plugin/customRules/no-server-imports-in-client-exports.js

const NODE_BUILTINS = new Set([
  'assert',
  'buffer',
  'child_process',
  'cluster',
  'crypto',
  'dgram',
  'dns',
  'events',
  'fs',
  'http',
  'http2',
  'https',
  'module',
  'net',
  'os',
  'path',
  'perf_hooks',
  'process',
  'querystring',
  'readline',
  'stream',
  'string_decoder',
  'timers',
  'tls',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'worker_threads',
  'zlib',
])

// npm packages that are server-only and should never appear in browser entry points.
// Extend this list as new server-only dependencies are added to payload packages.
const SERVER_PACKAGES = new Set([
  'payload',
  'busboy',
  'mongoose',
  'drizzle-orm',
  'pg',
  'better-sqlite3',
])

// Subpath patterns that identify browser-facing entry point files.
const CLIENT_EXPORT_PATTERNS = ['/src/exports/react/', '/src/exports/client/']

function getPackageName(importPath) {
  if (importPath.startsWith('@')) {
    return importPath.split('/').slice(0, 2).join('/')
  }
  return importPath.split('/')[0]
}

function isServerImport(importPath) {
  const bare = importPath.replace(/^node:/, '')
  if (NODE_BUILTINS.has(bare)) return true
  return SERVER_PACKAGES.has(getPackageName(importPath))
}

/** @type {import('eslint').Rule.RuleModule} */
export const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow server-only package imports in browser-facing client export entry points',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
  },
  create(context) {
    const filePath = context.getFilename()
    const isClientExportFile = CLIENT_EXPORT_PATTERNS.some((pattern) => filePath.includes(pattern))

    if (!isClientExportFile) return {}

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value

        // Only check external package imports, not relative paths
        if (importPath.startsWith('.')) return

        if (isServerImport(importPath)) {
          context.report({
            node: node.source,
            message: `Server-only package "${importPath}" must not be imported in browser-facing client export files (src/exports/react/ or src/exports/client/). These files are consumed by pure browser apps without Node.js types.`,
          })
        }
      },
    }
  },
}

export default rule
