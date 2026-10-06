import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const uiPackageJSON = JSON.parse(
  fs.readFileSync(fileURLToPath(new URL('../../ui/package.json', import.meta.url)), 'utf8'),
)

/**
 * Resolves an `@payloadcms/ui` subpath like Node does: an exact `exports` key wins, otherwise the
 * wildcard pattern with the longest prefix. Returns the target file, or `null` if nothing matches.
 */
function resolveUISubpath(subpath) {
  const key = `./${subpath}`
  const getTarget = (value) => (typeof value === 'string' ? value : value.import || value.default)
  if (uiPackageJSON.exports[key]) {
    return getTarget(uiPackageJSON.exports[key])
  }
  let bestMatch = null
  for (const [pattern, value] of Object.entries(uiPackageJSON.exports)) {
    const [prefix, suffix = ''] = pattern.split('*')
    if (
      pattern.includes('*') &&
      key.startsWith(prefix) &&
      key.endsWith(suffix) &&
      (!bestMatch || prefix.length > bestMatch.prefix.length)
    ) {
      bestMatch = {
        prefix,
        replacement: key.slice(prefix.length, key.length - suffix.length),
        value,
      }
    }
  }
  return bestMatch ? getTarget(bestMatch.value).replace('*', bestMatch.replacement) : null
}

/**
 * @param {import('estree').Node & { importKind?: string, exportKind?: string, specifiers?: Array<{ importKind?: string }> }} node
 */
function isTypeOnly(node) {
  if (node.importKind === 'type' || node.exportKind === 'type') {
    return true
  }
  return (
    node.type === 'ImportDeclaration' &&
    node.specifiers.length > 0 &&
    node.specifiers.every((specifier) => specifier.importKind === 'type')
  )
}

/** @type {import('eslint').Rule.RuleModule} */
export const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow client subpaths of @payloadcms/ui (like @payloadcms/ui/elements/Link) in admin code',
      recommended: true,
    },
    messages: {
      clientSubpath:
        'Import client code from "@payloadcms/ui" instead of "{{source}}". Client subpaths are for apps outside the admin panel. Next to the bundled barrel, they load a second copy of the code, with separate React contexts.',
    },
    schema: [],
  },
  create(context) {
    const check = (node, source) => {
      if (
        !source ||
        typeof source.value !== 'string' ||
        !source.value.startsWith('@payloadcms/ui/') ||
        isTypeOnly(node)
      ) {
        return
      }
      const target = resolveUISubpath(source.value.slice('@payloadcms/ui/'.length))
      if (target?.includes('/client/')) {
        context.report({ data: { source: source.value }, messageId: 'clientSubpath', node: source })
      }
    }

    return {
      ExportAllDeclaration: (node) => check(node, node.source),
      ExportNamedDeclaration: (node) => check(node, node.source),
      ImportDeclaration: (node) => check(node, node.source),
      ImportExpression: (node) => check(node, node.source.type === 'Literal' ? node.source : null),
    }
  },
}

export default rule
