import path from 'node:path'

/**
 * Where a file in packages/ui/src runs:
 * - client: client/** and the client barrel (exports/client)
 * - server: server/** and the server entry points (exports/rsc, exports/server, exports/layouts)
 * - shared: shared/** and the shared entry point (exports/shared). Runs on both sides.
 * - neutral: css/, assets/, @types/ and styles.css, which any folder may import
 */
function getArea(filePath) {
  const normalized = filePath.split(path.sep).join('/')
  const match = normalized.match(/\/packages\/ui\/src\/(.+)$/)
  if (!match) {
    return null
  }
  const rel = match[1]
  if (rel.startsWith('client/')) {
    return 'client'
  }
  if (rel.startsWith('server/')) {
    return 'server'
  }
  if (rel.startsWith('shared/')) {
    return 'shared'
  }
  if (rel.startsWith('exports/client/')) {
    return 'clientBarrel'
  }
  if (rel.startsWith('exports/shared/')) {
    return 'shared'
  }
  if (rel.startsWith('exports/')) {
    return 'server'
  }
  return 'neutral'
}

const allowedTargets = {
  client: new Set(['client', 'clientBarrel', 'neutral', 'shared']),
  clientBarrel: new Set(['client', 'clientBarrel', 'neutral', 'shared']),
  // Server code reaches client code only through the client barrel, so every client
  // component resolves to the same module and React contexts are never duplicated.
  server: new Set(['clientBarrel', 'neutral', 'server', 'shared']),
  shared: new Set(['neutral', 'shared']),
}

const messages = {
  clientImportsServer: 'Client code must not import server code ("{{target}}").',
  serverImportsClient:
    'Server code must not import client files directly ("{{target}}"). Import it from the client barrel (exports/client/index.js) instead.',
  sharedImportsOther:
    'Shared code runs on both the client and the server, so it must not import client or server code ("{{target}}").',
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
        'Enforce the client/, server/ and shared/ import boundaries inside packages/ui/src',
      recommended: true,
    },
    messages,
    schema: [],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename()
    const fromArea = getArea(filename)
    if (!fromArea || fromArea === 'neutral') {
      return {}
    }

    const check = (node, source) => {
      if (!source || typeof source.value !== 'string' || !source.value.startsWith('.')) {
        return
      }
      if (isTypeOnly(node)) {
        return
      }
      const targetArea = getArea(path.resolve(path.dirname(filename), source.value))
      if (!targetArea || allowedTargets[fromArea].has(targetArea)) {
        return
      }
      const messageId =
        fromArea === 'shared'
          ? 'sharedImportsOther'
          : fromArea === 'server'
            ? 'serverImportsClient'
            : 'clientImportsServer'
      context.report({ data: { target: source.value }, messageId, node: source })
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
