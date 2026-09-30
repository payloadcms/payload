import { Node } from 'ts-morph'

import type { Transform } from '../../types.js'

// Only user-authored config types. The `Sanitized*` variants are internal runtime types
// whose `authorship` property is required, so injecting `false` would break their types.
const AUTHORSHIP_CONFIG_TYPE_NAMES = new Set(['CollectionConfig', 'GlobalConfig'])

const isAuthorshipConfigTypeName = (typeText: string): boolean => {
  const baseName = typeText.replace(/<.*>$/, '').trim()
  return AUTHORSHIP_CONFIG_TYPE_NAMES.has(baseName)
}

/**
 * Finds Collection/Global config object literals and adds `authorship: false` if the property
 * is absent. Covers three annotation forms plus inline entries in a `buildConfig` call:
 *   const X: CollectionConfig = { ... }
 *   { ... } satisfies GlobalConfig
 *   { ... } as CollectionConfig
 *   buildConfig({ collections: [ { ... } ], globals: [ { ... } ] })
 */
export const migrateAuthorshipDefault: Transform = {
  name: 'migrate-authorship-default',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()

    for (const sourceFile of project.getSourceFiles()) {
      let mutated = false

      sourceFile.forEachDescendant((node) => {
        const objectLiteral = resolveAuthorshipConfigObject(node)
        if (!objectLiteral) {
          return
        }

        if (objectLiteral.getProperty('authorship')) {
          return
        }

        objectLiteral.addPropertyAssignment({
          name: 'authorship',
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
    'Add `authorship: false` to CollectionConfig and GlobalConfig objects that do not already have an authorship property, preserving the previous behaviour after createdBy / updatedBy tracking became enabled by default.',
}

/**
 * Given a node, returns its ObjectLiteralExpression if the node represents a
 * CollectionConfig- or GlobalConfig-typed value in one of the three recognised forms.
 * Returns undefined for everything else.
 */
const resolveAuthorshipConfigObject = (node: Node) => {
  // Form 1: const X: CollectionConfig = { ... }
  if (Node.isVariableDeclaration(node)) {
    const typeNode = node.getTypeNode()
    if (!typeNode) {
      return undefined
    }
    const typeText = typeNode.getText().trim()
    if (!isAuthorshipConfigTypeName(typeText)) {
      return undefined
    }
    const initializer = node.getInitializer()
    if (initializer && Node.isObjectLiteralExpression(initializer)) {
      return initializer
    }
    return undefined
  }

  // Form 2: { ... } satisfies CollectionConfig
  if (Node.isSatisfiesExpression(node)) {
    const typeNode = node.getTypeNode()
    if (!typeNode) {
      return undefined
    }
    const typeText = typeNode.getText().trim()
    if (!isAuthorshipConfigTypeName(typeText)) {
      return undefined
    }
    const expr = node.getExpression()
    if (Node.isObjectLiteralExpression(expr)) {
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
    if (!isAuthorshipConfigTypeName(typeText)) {
      return undefined
    }
    const expr = node.getExpression()
    if (Node.isObjectLiteralExpression(expr)) {
      return expr
    }
    return undefined
  }

  // Form 4: inline entries in `buildConfig({ collections: [ { ... } ], globals: [ { ... } ] })`
  if (Node.isObjectLiteralExpression(node) && isInlineBuildConfigEntry(node)) {
    return node
  }

  return undefined
}

const CONFIG_ENTRY_PROPERTY_NAMES = new Set(['collections', 'globals'])

/**
 * True when `node` is an inline object-literal element of a `collections` or `globals` array
 * passed to a `buildConfig(...)` call, e.g. `buildConfig({ collections: [{ ... }] })`.
 */
const isInlineBuildConfigEntry = (node: Node): boolean => {
  const array = node.getParent()
  if (!array || !Node.isArrayLiteralExpression(array)) {
    return false
  }

  const property = array.getParent()
  if (!property || !Node.isPropertyAssignment(property)) {
    return false
  }

  if (!CONFIG_ENTRY_PROPERTY_NAMES.has(property.getName())) {
    return false
  }

  const configObject = property.getParent()
  if (!configObject || !Node.isObjectLiteralExpression(configObject)) {
    return false
  }

  const call = configObject.getParent()
  if (!call || !Node.isCallExpression(call)) {
    return false
  }

  const callee = call.getExpression()
  return Node.isIdentifier(callee) && callee.getText() === 'buildConfig'
}
