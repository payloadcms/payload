import type { Expression, ObjectLiteralExpression, TypeNode } from 'ts-morph'

import { Node, SyntaxKind, VariableDeclarationKind } from 'ts-morph'

import type { Transform } from '../../types.js'

/** Removes obsolete localized-status options from Payload configuration objects. */
export const removeLocalizeStatusConfig: Transform = {
  name: 'remove-localize-status-config',
  apply: ({ project }) => {
    const sourceFiles = project.getSourceFiles()
    const originals = new Map(sourceFiles.map((file) => [file, file.getFullText()]))
    const configs = new Set<ObjectLiteralExpression>()
    const entities = new Set<ObjectLiteralExpression>()
    const notes = new Set<string>()

    for (const sourceFile of sourceFiles) {
      sourceFile.forEachDescendant((node) => {
        if (Node.isCallExpression(node)) {
          const expression = node.getExpression()

          if (isPayloadImport({ expression, name: 'buildConfig' })) {
            const config = resolveObject({ expression: node.getArguments()[0] as Expression })

            if (config) {
              configs.add(config)
            }
          }
        }

        if (
          Node.isVariableDeclaration(node) ||
          Node.isAsExpression(node) ||
          Node.isSatisfiesExpression(node)
        ) {
          const type = node.getTypeNode()
          const expression = Node.isVariableDeclaration(node)
            ? node.getInitializer()
            : node.getExpression()
          const object = resolveObject({ expression })

          if (!object) {
            return
          }

          if (isPayloadType({ name: 'Config', type })) {
            configs.add(object)
          } else if (
            isPayloadType({ name: 'CollectionConfig', type }) ||
            isPayloadType({ name: 'GlobalConfig', type })
          ) {
            entities.add(object)
          }
        }
      })
    }

    for (const config of configs) {
      const experimentalProperty = config.getProperty('experimental')
      const experimental = resolvePropertyObject({ object: config, name: 'experimental' })

      if (experimental && removeSetting({ notes, object: experimental })) {
        if (experimental.getProperties().length === 0) {
          experimentalProperty?.remove()
        }
      }

      for (const name of ['collections', 'globals']) {
        const array = resolveExpression({ expression: getPropertyValue({ name, object: config }) })

        if (array && Node.isArrayLiteralExpression(array)) {
          for (const element of array.getElements()) {
            const entity = resolveObject({ expression: element as Expression })

            if (entity) {
              entities.add(entity)
            }
          }
        }
      }
    }

    for (const entity of entities) {
      const versions = resolvePropertyObject({ name: 'versions', object: entity })
      const drafts = versions && resolvePropertyObject({ name: 'drafts', object: versions })

      if (
        drafts &&
        removeSetting({ notes, object: drafts }) &&
        drafts.getProperties().length === 0
      ) {
        drafts.replaceWithText('{}')
      }
    }

    return {
      filesChanged: sourceFiles
        .filter((file) => file.getFullText() !== originals.get(file))
        .map((file) => file.getFilePath()),
      ...(notes.size > 0 && { notes: [...notes] }),
    }
  },
  description:
    'Remove `localizeStatus` boolean settings from versions.drafts config and `experimental.localizeStatus` from root Payload config. Per-locale status is now automatically enabled when localization is configured and the collection/global has localized fields.',
}

function isPayloadImport({ expression, name }: { expression: Node; name: string }): boolean {
  return (
    Node.isIdentifier(expression) &&
    Boolean(
      expression
        .getSymbol()
        ?.getDeclarations()
        .some(
          (declaration) =>
            Node.isImportSpecifier(declaration) &&
            declaration.getName() === name &&
            declaration
              .getFirstAncestorByKind(SyntaxKind.ImportDeclaration)
              ?.getModuleSpecifierValue() === 'payload',
        ),
    )
  )
}

function isPayloadType({ name, type }: { name: string; type: TypeNode | undefined }): boolean {
  return Boolean(
    type && Node.isTypeReference(type) && isPayloadImport({ expression: type.getTypeName(), name }),
  )
}

function resolveExpression({
  expression,
  seen = new Set<Expression>(),
}: {
  expression: Expression | undefined
  seen?: Set<Expression>
}): Expression | undefined {
  if (!expression || seen.has(expression)) {
    return undefined
  }

  seen.add(expression)

  if (
    Node.isParenthesizedExpression(expression) ||
    Node.isAsExpression(expression) ||
    Node.isSatisfiesExpression(expression)
  ) {
    return resolveExpression({ expression: expression.getExpression(), seen })
  }

  if (Node.isIdentifier(expression)) {
    const declaration = expression
      .getDefinitions()
      .map((definition) => definition.getDeclarationNode())
      .find(Node.isVariableDeclaration)

    if (
      declaration?.getSourceFile() === expression.getSourceFile() &&
      declaration?.getVariableStatement()?.getDeclarationKind() === VariableDeclarationKind.Const
    ) {
      return resolveExpression({ expression: declaration.getInitializer(), seen })
    }

    return undefined
  }

  return expression
}

function resolveObject({
  expression,
}: {
  expression: Expression | undefined
}): ObjectLiteralExpression | undefined {
  const resolved = resolveExpression({ expression })

  return resolved && Node.isObjectLiteralExpression(resolved) ? resolved : undefined
}

function resolvePropertyObject({
  name,
  object,
}: {
  name: string
  object: ObjectLiteralExpression
}): ObjectLiteralExpression | undefined {
  return resolveObject({ expression: getPropertyValue({ name, object }) })
}

function getPropertyValue({
  name,
  object,
}: {
  name: string
  object: ObjectLiteralExpression
}): Expression | undefined {
  const property = object.getProperty(name)

  if (Node.isPropertyAssignment(property)) {
    return property.getInitializer()
  }

  if (Node.isShorthandPropertyAssignment(property)) {
    const declaration = property
      .getValueSymbol()
      ?.getDeclarations()
      .find(Node.isVariableDeclaration)

    if (
      declaration?.getVariableStatement()?.getDeclarationKind() === VariableDeclarationKind.Const
    ) {
      return declaration.getInitializer()
    }
  }

  return undefined
}

function removeSetting({
  notes,
  object,
}: {
  notes: Set<string>
  object: ObjectLiteralExpression
}): boolean {
  const property = object.getProperty('localizeStatus')

  if (!property) {
    return false
  }

  const initializer = Node.isPropertyAssignment(property) ? property.getInitializer() : undefined

  if (
    initializer &&
    [SyntaxKind.TrueKeyword, SyntaxKind.FalseKeyword].includes(initializer.getKind())
  ) {
    property.remove()
    return true
  }

  notes.add(
    `${object.getSourceFile().getFilePath()}: remove the obsolete localizeStatus setting manually; its value is not a boolean literal.`,
  )
  return false
}
