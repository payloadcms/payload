import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

const VERSIONED_CONFIG_TYPE_NAMES = new Set([
  'CollectionConfig',
  'GlobalConfig',
  'SanitizedCollectionConfig',
  'SanitizedGlobalConfig',
])

const isVersionedConfigTypeName = (typeText: string): boolean =>
  VERSIONED_CONFIG_TYPE_NAMES.has(typeText)

/**
 * Finds object literals typed as CollectionConfig or GlobalConfig and adds
 * `versions: false` if the property is absent. Covers three annotation forms:
 *   const X: CollectionConfig = { ... }
 *   { ... } satisfies GlobalConfig
 *   { ... } as CollectionConfig
 */
export const migrateVersionsDefault: Transform = {
  name: 'migrate-versions-default',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()

    for (const sourceFile of project.getSourceFiles()) {
      let mutated = false

      sourceFile.forEachDescendant((node) => {
        const objectLiteral = resolveVersionedConfigObject(node)
        if (!objectLiteral) {
          return
        }

        if (objectLiteral.getProperty('versions')) {
          return
        }

        objectLiteral.addPropertyAssignment({
          name: 'versions',
          initializer: 'false',
        })

        mutated = true
      })

      if (mutated) {
        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return { filesChanged: [...filesChanged] }
  },
  description:
    'Add `versions: false` to CollectionConfig and GlobalConfig objects that do not already have a versions property, preserving the previous opt-in behaviour after versions became enabled by default.',
}

/**
 * Given a node, returns its ObjectLiteralExpression if the node represents a
 * CollectionConfig- or GlobalConfig-typed value in one of the three recognised forms.
 * Returns undefined for everything else.
 */
const resolveVersionedConfigObject = (node: Node) => {
  // Form 1: const X: CollectionConfig = { ... }
  if (Node.isVariableDeclaration(node)) {
    const typeNode = node.getTypeNode()
    if (!typeNode) {
      return undefined
    }
    const typeText = typeNode.getText().trim()
    if (!isVersionedConfigTypeName(typeText)) {
      return undefined
    }
    const initializer = node.getInitializer()
    if (initializer && Node.isObjectLiteralExpression(initializer)) {
      return initializer
    }
    return undefined
  }

  // Form 2: { ... } satisfies CollectionConfig
  if (node.getKind() === SyntaxKind.SatisfiesExpression) {
    const typeNode = (node as any).getTypeNode?.()
    if (!typeNode) {
      return undefined
    }
    const typeText = typeNode.getText().trim()
    if (!isVersionedConfigTypeName(typeText)) {
      return undefined
    }
    const expr = (node as any).getExpression?.()
    if (expr && Node.isObjectLiteralExpression(expr)) {
      return expr
    }
    return undefined
  }

  // Form 3: { ... } as CollectionConfig
  if (Node.isAsExpression(node)) {
    const typeNode = node.getTypeNode()
    if (!typeNode) {
      return undefined
    }
    const typeText = typeNode.getText().trim()
    if (!isVersionedConfigTypeName(typeText)) {
      return undefined
    }
    const expr = node.getExpression()
    if (Node.isObjectLiteralExpression(expr)) {
      return expr
    }
    return undefined
  }

  return undefined
}
