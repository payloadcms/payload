import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

const VERSIONED_CONFIG_TYPE_NAMES = new Set([
  'CollectionConfig',
  'GlobalConfig',
  'SanitizedCollectionConfig',
  'SanitizedGlobalConfig',
])

const isVersionedConfigTypeName = (typeText: string): boolean => {
  const baseName = typeText.replace(/<.*>$/, '').trim()
  return VERSIONED_CONFIG_TYPE_NAMES.has(baseName)
}

/**
 * Removes `versions: true` (bare boolean true — not an object) from
 * CollectionConfig and GlobalConfig objects. Now that versions defaults to
 * true, the explicit property is redundant.
 *
 * Only removes the property when the initializer is exactly the `true` keyword.
 * Object-form versions configs (e.g. `versions: { drafts: true }`) are left
 * untouched.
 */
export const removeVersionsTrue: Transform = {
  name: 'remove-versions-true',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()

    for (const sourceFile of project.getSourceFiles()) {
      let mutated = false

      sourceFile.forEachDescendant((node) => {
        const objectLiteral = resolveVersionedConfigObject(node)
        if (!objectLiteral) {
          return
        }

        const versionsProp = objectLiteral.getProperty('versions')
        if (!versionsProp || !Node.isPropertyAssignment(versionsProp)) {
          return
        }

        const initializer = versionsProp.getInitializer()
        if (!initializer || initializer.getKind() !== SyntaxKind.TrueKeyword) {
          return
        }

        versionsProp.remove()
        mutated = true
      })

      if (mutated) {
        filesChanged.add(sourceFile.getFilePath())
      }
    }

    return { filesChanged: [...filesChanged] }
  },
  description:
    'Remove redundant `versions: true` from CollectionConfig and GlobalConfig objects. Versions are now enabled by default so the explicit boolean true is no longer needed.',
}

/**
 * Given a node, returns its ObjectLiteralExpression if the node represents a
 * CollectionConfig- or GlobalConfig-typed value in one of the three recognised forms.
 */
const resolveVersionedConfigObject = (node: Node) => {
  // Form 1: const X: CollectionConfig = { ... }
  if (Node.isVariableDeclaration(node)) {
    const typeNode = node.getTypeNode()
    if (!typeNode) {
      return undefined
    }
    if (!isVersionedConfigTypeName(typeNode.getText().trim())) {
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
    if (!typeNode || !isVersionedConfigTypeName(typeNode.getText().trim())) {
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
    if (!typeNode || !isVersionedConfigTypeName(typeNode.getText().trim())) {
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
