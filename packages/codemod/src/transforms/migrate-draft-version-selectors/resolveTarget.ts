import type { Expression, ObjectLiteralExpression, Project } from 'ts-morph'

import { Node, SyntaxKind, VariableDeclarationKind } from 'ts-morph'

export type Target = {
  drafts?: boolean
  localizedStatus?: boolean
}

/** Inspect only configurations registered in statically resolvable buildConfig calls. */
export function getTargets({ project }: { project: Project }): Map<string, Target> {
  const targets = new Map<string, Target>()
  const uncertainKinds = new Set<string>()

  for (const source of project.getSourceFiles()) {
    for (const call of source.getDescendantsOfKind(SyntaxKind.CallExpression)) {
      if (!isImported({ name: 'buildConfig', module: 'payload', node: call.getExpression() })) {
        continue
      }

      const config = resolveObject({ node: call.getArguments()[0] })

      if (!config) {
        uncertainKinds.add('collections')
        uncertainKinds.add('globals')
        continue
      }

      if (
        hasUnsafeMembers({ object: config }) ||
        hasUnsafeReferences({ object: config }) ||
        hasUnsafeConfigResult({ node: call }) ||
        hasConfigMutators({ object: config })
      ) {
        uncertainKinds.add('collections')
        uncertainKinds.add('globals')
      }

      const localization = resolveObject({
        node: getValue({ name: 'localization', object: config }),
      })

      for (const kind of ['collections', 'globals']) {
        const entries = unwrap({ node: getValue({ name: kind, object: config }) })

        if (!entries || !Node.isArrayLiteralExpression(entries)) {
          if (getProperty({ name: kind, object: config })) {
            uncertainKinds.add(kind)
          }
          continue
        }

        for (const entry of entries.getElements()) {
          const object = resolveObject({ node: entry })
          const slug = object && getValue({ name: 'slug', object })

          if (!object || !slug || !Node.isStringLiteral(slug)) {
            uncertainKinds.add(kind)
            continue
          }

          const key = `${kind}:${slug.getLiteralValue()}`
          const versions = unwrap({ node: getValue({ name: 'versions', object }) })
          const drafts =
            versions && Node.isObjectLiteralExpression(versions)
              ? unwrap({ node: getValue({ name: 'drafts', object: versions }) })
              : undefined
          const hasAmbiguousConfig =
            hasUnsafeMembers({ object }) ||
            hasUnsafeReferences({ object }) ||
            Boolean(getProperty({ name: 'versions', object }) && !versions) ||
            Boolean(
              versions &&
                Node.isObjectLiteralExpression(versions) &&
                getProperty({ name: 'drafts', object: versions }) &&
                !drafts,
            ) ||
            (versions &&
              Node.isObjectLiteralExpression(versions) &&
              hasUnsafeMembers({ object: versions })) ||
            (drafts &&
              Node.isObjectLiteralExpression(drafts) &&
              hasUnsafeMembers({ object: drafts }))
          const isDraftsEnabled =
            drafts?.getKind() === SyntaxKind.TrueKeyword ||
            Boolean(drafts && Node.isObjectLiteralExpression(drafts))
          const isDraftsDisabled =
            !versions ||
            versions.getKind() === SyntaxKind.FalseKeyword ||
            versions.getKind() === SyntaxKind.TrueKeyword ||
            (Node.isObjectLiteralExpression(versions) &&
              (!drafts || drafts.getKind() === SyntaxKind.FalseKeyword))
          const legacyLocalizedStatus =
            drafts && Node.isObjectLiteralExpression(drafts)
              ? getValue({ name: 'localizeStatus', object: drafts })
              : undefined
          const fields = getValue({ name: 'fields', object })
          const hasLocalizedField = getLocalizedFieldsState({ node: fields })
          const rootLocalization = getProperty({ name: 'localization', object: config })
          const isLocalizationDisabled =
            !rootLocalization ||
            getValue({ name: 'localization', object: config })?.getKind() ===
              SyntaxKind.FalseKeyword
          const localizedStatus =
            isLocalizationDisabled || hasLocalizedField === false
              ? false
              : localization &&
                  !hasUnsafeMembers({ object: localization }) &&
                  !hasUnsafeReferences({ object: localization }) &&
                  legacyLocalizedStatus?.getKind() === SyntaxKind.TrueKeyword &&
                  hasLocalizedField === true
                ? true
                : undefined

          // Duplicate registrations can resolve differently at runtime. Never choose one.
          targets.set(
            key,
            targets.has(key) || hasAmbiguousConfig
              ? {}
              : {
                  drafts: isDraftsEnabled ? true : isDraftsDisabled ? false : undefined,
                  localizedStatus,
                },
          )
        }
      }
    }
  }

  for (const key of targets.keys()) {
    if (uncertainKinds.has(key.split(':')[0]!)) {
      targets.set(key, {})
    }
  }

  return targets
}

export function isPayloadReceiver({ node }: { node: Node }): boolean {
  if (Node.isPropertyAccessExpression(node) && node.getName() === 'payload') {
    return hasImportedType({
      module: 'payload',
      names: ['PayloadRequest'],
      node: node.getExpression(),
    })
  }

  if (
    hasImportedType({ module: 'payload', names: ['Payload'], node }) ||
    hasImportedType({ module: '@payloadcms/sdk', names: ['PayloadSDK'], node })
  ) {
    return true
  }

  if (!Node.isIdentifier(node)) {
    return false
  }

  const declaration = node.getSymbol()?.getDeclarations().find(Node.isVariableDeclaration)

  if (
    !declaration ||
    declaration.getVariableStatement()?.getDeclarationKind() !== VariableDeclarationKind.Const
  ) {
    return false
  }

  let initializer = unwrap({ node: declaration.getInitializer() })

  if (initializer && Node.isAwaitExpression(initializer)) {
    initializer = unwrap({ node: initializer.getExpression() })
  }

  return Boolean(
    initializer &&
      ((Node.isCallExpression(initializer) &&
        isImported({ name: 'getPayload', module: 'payload', node: initializer.getExpression() })) ||
        (Node.isNewExpression(initializer) &&
          isImported({
            name: 'PayloadSDK',
            module: '@payloadcms/sdk',
            node: initializer.getExpression(),
          }))),
  )
}

export function hasUnsafeMembers({ object }: { object: ObjectLiteralExpression }): boolean {
  const names = new Set<string>()

  for (const property of object.getProperties()) {
    if (!Node.isPropertyAssignment(property) && !Node.isShorthandPropertyAssignment(property)) {
      return true
    }

    const name = property.getNameNode()

    if (!Node.isIdentifier(name) && !Node.isStringLiteral(name)) {
      return true
    }

    const key = Node.isStringLiteral(name) ? name.getLiteralValue() : name.getText()

    if (names.has(key)) {
      return true
    }

    names.add(key)
  }

  return false
}

export function getValue({
  name,
  object,
}: {
  name: string
  object: ObjectLiteralExpression
}): Expression | undefined {
  const property = getProperty({ name, object })

  return property && Node.isPropertyAssignment(property) ? property.getInitializer() : undefined
}

/** Normalize quoted keys before any option or configuration lookup. */
export function getProperty({ name, object }: { name: string; object: ObjectLiteralExpression }) {
  return object.getProperties().find((property) => {
    if (!Node.isPropertyAssignment(property) && !Node.isShorthandPropertyAssignment(property)) {
      return false
    }
    const key = property.getNameNode()

    return (Node.isStringLiteral(key) ? key.getLiteralValue() : key.getText()) === name
  })
}

export function unwrap({ node }: { node: Node | undefined }): Node | undefined {
  while (
    node &&
    (Node.isAsExpression(node) ||
      Node.isSatisfiesExpression(node) ||
      Node.isParenthesizedExpression(node))
  ) {
    node = node.getExpression()
  }

  return node
}

function resolveObject({
  node,
  visited = new Set<Node>(),
}: {
  node: Node | undefined
  visited?: Set<Node>
}): ObjectLiteralExpression | undefined {
  node = unwrap({ node })

  if (!node || visited.has(node)) {
    return undefined
  }

  visited.add(node)

  if (Node.isObjectLiteralExpression(node)) {
    return node
  }

  if (Node.isIdentifier(node)) {
    const declaration = node
      .getDefinitions()
      .map((definition) => definition.getDeclarationNode())
      .find(Node.isVariableDeclaration)

    if (
      declaration?.getVariableStatement()?.getDeclarationKind() === VariableDeclarationKind.Const
    ) {
      return resolveObject({ node: declaration.getInitializer(), visited })
    }
  }

  return undefined
}

function hasImportedType({
  module,
  names,
  node,
}: {
  module: string
  names: string[]
  node: Node
}): boolean {
  if (!Node.isIdentifier(node)) {
    return false
  }

  for (const declaration of node.getSymbol()?.getDeclarations() ?? []) {
    if (Node.isParameterDeclaration(declaration) || Node.isVariableDeclaration(declaration)) {
      const type = declaration.getTypeNode()

      if (
        type &&
        Node.isTypeReference(type) &&
        names.some((name) => isImported({ name, module, node: type.getTypeName() }))
      ) {
        return true
      }
    }
  }

  return false
}

function isImported({ name, module, node }: { module: string; name: string; node: Node }): boolean {
  return Boolean(
    Node.isIdentifier(node) &&
      node
        .getSymbol()
        ?.getDeclarations()
        .some(
          (declaration) =>
            Node.isImportSpecifier(declaration) &&
            declaration.getName() === name &&
            declaration.getImportDeclaration().getModuleSpecifierValue() === module,
        ),
  )
}

/** A const binding does not prove that its object cannot be changed or escape. */
function hasUnsafeReferences({ object }: { object: ObjectLiteralExpression }): boolean {
  let initializer: Node = object

  while (initializer.getParent() && unwrap({ node: initializer.getParent() }) === object) {
    initializer = initializer.getParentOrThrow()
  }
  const declaration = initializer.getParent()

  if (!declaration || !Node.isVariableDeclaration(declaration)) {
    return false
  }
  const name = declaration.getNameNode()

  if (!Node.isIdentifier(name)) {
    return true
  }

  return name.findReferencesAsNodes().some((reference) => {
    const parent = reference.getParent()

    if (
      parent &&
      (Node.isImportSpecifier(parent) ||
        Node.isExportSpecifier(parent) ||
        Node.isExportAssignment(parent))
    ) {
      return false
    }
    if (parent && Node.isArrayLiteralExpression(parent)) {
      const property = parent.getParent()
      const config = property?.getParent()
      const call = config?.getParent()

      return !(
        property &&
        Node.isPropertyAssignment(property) &&
        ['collections', 'globals'].includes(property.getName()) &&
        call &&
        Node.isCallExpression(call) &&
        isImported({ name: 'buildConfig', module: 'payload', node: call.getExpression() })
      )
    }
    if (parent && Node.isCallExpression(parent)) {
      return !isImported({ name: 'buildConfig', module: 'payload', node: parent.getExpression() })
    }

    return true
  })
}

/** Inspect field containers only; custom objects and callbacks are not fields. */
function getLocalizedFieldsState({ node }: { node: Node | undefined }): boolean | undefined {
  node = unwrap({ node })

  if (!node || !Node.isArrayLiteralExpression(node)) {
    return undefined
  }
  let hasUnknownField = false

  for (const element of node.getElements()) {
    const field = unwrap({ node: element })

    if (!field || !Node.isObjectLiteralExpression(field) || hasUnsafeMembers({ object: field })) {
      hasUnknownField = true
      continue
    }
    const localized = getValue({ name: 'localized', object: field })

    if (localized?.getKind() === SyntaxKind.TrueKeyword) {
      return true
    }
    if (
      getProperty({ name: 'localized', object: field }) &&
      localized?.getKind() !== SyntaxKind.FalseKeyword
    ) {
      hasUnknownField = true
    }
    for (const name of ['fields', 'tabs', 'blocks']) {
      if (getProperty({ name, object: field })) {
        const nested = getLocalizedFieldsState({ node: getValue({ name, object: field }) })

        if (nested === true) {
          return true
        }
        hasUnknownField ||= nested === undefined
      }
    }
  }

  return hasUnknownField ? undefined : false
}

function hasUnsafeConfigResult({ node }: { node: Node }): boolean {
  let initializer = node

  while (
    initializer.getParent() &&
    (Node.isAwaitExpression(initializer.getParentOrThrow()) ||
      unwrap({ node: initializer.getParent() }) === node)
  ) {
    initializer = initializer.getParentOrThrow()
  }
  const declaration = initializer.getParent()

  if (!declaration || !Node.isVariableDeclaration(declaration)) {
    return false
  }
  const name = declaration.getNameNode()

  if (
    !Node.isIdentifier(name) ||
    declaration.getVariableStatement()?.getDeclarationKind() !== VariableDeclarationKind.Const
  ) {
    return true
  }

  return name.findReferencesAsNodes().some((reference) => {
    const parent = reference.getParent()

    if (
      parent &&
      (Node.isImportSpecifier(parent) ||
        Node.isExportSpecifier(parent) ||
        Node.isExportAssignment(parent))
    ) {
      return false
    }
    if (
      parent &&
      (Node.isShorthandPropertyAssignment(parent) || Node.isPropertyAssignment(parent))
    ) {
      const options = parent.getParent()
      const call = options?.getParent()

      return !(
        parent.getName() === 'config' &&
        call &&
        Node.isCallExpression(call) &&
        isImported({ name: 'getPayload', module: 'payload', node: call.getExpression() })
      )
    }

    return true
  })
}

function hasConfigMutators({ object }: { object: ObjectLiteralExpression }): boolean {
  return ['plugins', 'storage', 'storageAdapters'].some((name) => {
    if (!getProperty({ name, object })) {
      return false
    }
    const value = unwrap({ node: getValue({ name, object }) })

    return !value || !Node.isArrayLiteralExpression(value) || value.getElements().length > 0
  })
}
