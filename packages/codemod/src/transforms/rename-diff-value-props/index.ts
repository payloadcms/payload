import type {
  ArrowFunction,
  BindingElement,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  ObjectBindingPattern,
  SourceFile,
  TypeNode,
} from 'ts-morph'

import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

const RENAMED_PROPS = new Map([
  ['comparisonValue', 'valueFrom'],
  ['versionValue', 'valueTo'],
])

/**
 * Matches every Diff component type exported from `payload`, in both the v3 component-alias
 * form (`TextFieldDiffClientComponent`) and the props form (`TextFieldDiffClientProps`), so this
 * transform works regardless of whether `migrate-field-component-types` has already run.
 */
const DIFF_TYPE_NAME_PATTERN = /^[A-Za-z]*FieldDiff(?:Client|Server)(?:Component|Props)$/

/**
 * Every rewrite removes one old prop name, so the per-file loop always terminates. This cap only
 * guards against an unexpected regression turning it into an infinite loop.
 */
const MAX_REWRITES_PER_FILE = 1000

type ComponentFunction = ArrowFunction | FunctionDeclaration | FunctionExpression

export const renameDiffValueProps: Transform = {
  name: 'rename-diff-value-props',
  apply: ({ project }) => {
    const filesChanged: string[] = []
    const notes: string[] = []

    for (const sourceFile of project.getSourceFiles()) {
      if (sourceFile.isDeclarationFile() || sourceFile.isInNodeModules()) {
        continue
      }

      const diffTypeNames = collectDiffTypeNames({ sourceFile })

      if (diffTypeNames.size === 0) {
        continue
      }

      let rewriteCount = 0

      while (
        rewriteCount < MAX_REWRITES_PER_FILE &&
        rewriteNextOccurrence({ diffTypeNames, sourceFile })
      ) {
        rewriteCount++
      }

      if (rewriteCount > 0) {
        filesChanged.push(sourceFile.getFilePath())
      }

      notes.push(...collectLeftoverNotes({ sourceFile }))
    }

    return {
      filesChanged,
      ...(notes.length > 0 ? { notes } : {}),
    }
  },
  description:
    'Rename the `comparisonValue` and `versionValue` props read by custom Diff components to `valueFrom` and `valueTo`.',
}

/**
 * Returns the local names of Diff component types imported from `payload`, plus same-file type
 * aliases and interfaces built from them (e.g. `type Props = TextFieldDiffClientProps & { ... }`).
 */
function collectDiffTypeNames({ sourceFile }: { sourceFile: SourceFile }): Set<string> {
  const diffTypeNames = new Set<string>()

  for (const importDeclaration of sourceFile.getImportDeclarations()) {
    if (importDeclaration.getModuleSpecifierValue() !== 'payload') {
      continue
    }

    for (const namedImport of importDeclaration.getNamedImports()) {
      if (DIFF_TYPE_NAME_PATTERN.test(namedImport.getName())) {
        diffTypeNames.add(namedImport.getAliasNode()?.getText() ?? namedImport.getName())
      }
    }
  }

  if (diffTypeNames.size === 0) {
    return diffTypeNames
  }

  let hasFoundNewName = true

  while (hasFoundNewName) {
    hasFoundNewName = false

    const derivedTypeNames = [
      ...sourceFile
        .getTypeAliases()
        .filter((typeAlias) =>
          referencesDiffType({ diffTypeNames, typeNode: typeAlias.getTypeNodeOrThrow() }),
        ),
      ...sourceFile
        .getInterfaces()
        .filter((declaration) =>
          declaration
            .getExtends()
            .some((heritage) => diffTypeNames.has(heritage.getExpression().getText())),
        ),
    ].map((declaration) => declaration.getName())

    for (const typeName of derivedTypeNames) {
      if (!diffTypeNames.has(typeName)) {
        diffTypeNames.add(typeName)
        hasFoundNewName = true
      }
    }
  }

  return diffTypeNames
}

/**
 * Applies a single rewrite and reports whether one was made. Renames replace source text, which
 * invalidates previously queried nodes, so the caller re-scans the file after every rewrite.
 */
function rewriteNextOccurrence({
  diffTypeNames,
  sourceFile,
}: {
  diffTypeNames: Set<string>
  sourceFile: SourceFile
}): boolean {
  for (const component of findDiffComponents({ diffTypeNames, sourceFile })) {
    const propsParameterName = component.getParameters()[0]!.getNameNode()
    const propsBindingPatterns: ObjectBindingPattern[] = []
    const propsIdentifiers: Identifier[] = []

    if (Node.isObjectBindingPattern(propsParameterName)) {
      propsBindingPatterns.push(propsParameterName)

      const restElementName = propsParameterName
        .getElements()
        .find((element) => element.getDotDotDotToken())
        ?.getNameNode()

      if (restElementName && Node.isIdentifier(restElementName)) {
        propsIdentifiers.push(restElementName)
      }
    } else if (Node.isIdentifier(propsParameterName)) {
      propsIdentifiers.push(propsParameterName)
    }

    const readsProps = (node: Node): boolean =>
      Node.isIdentifier(node) &&
      propsIdentifiers.some((propsIdentifier) =>
        isReferenceTo({ declaration: propsIdentifier, identifier: node }),
      )

    for (const declaration of component.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
      const declarationName = declaration.getNameNode()
      const initializer = declaration.getInitializer()

      if (Node.isObjectBindingPattern(declarationName) && initializer && readsProps(initializer)) {
        propsBindingPatterns.push(declarationName)
      }
    }

    for (const pattern of propsBindingPatterns) {
      for (const element of pattern.getElements()) {
        if (rewriteBindingElement({ component, element })) {
          return true
        }
      }
    }

    for (const access of component.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)) {
      const newName = RENAMED_PROPS.get(access.getName())

      if (newName && readsProps(access.getExpression())) {
        access.getNameNode().replaceWithText(newName)
        return true
      }
    }

    for (const access of component.getDescendantsOfKind(SyntaxKind.ElementAccessExpression)) {
      const argument = access.getArgumentExpression()

      if (!argument || !Node.isStringLiteral(argument) || !readsProps(access.getExpression())) {
        continue
      }

      const newName = RENAMED_PROPS.get(argument.getLiteralValue())

      if (newName) {
        argument.setLiteralValue(newName)
        return true
      }
    }
  }

  for (const indexedAccess of sourceFile.getDescendantsOfKind(SyntaxKind.IndexedAccessType)) {
    const indexType = indexedAccess.getIndexTypeNode()
    const literal = Node.isLiteralTypeNode(indexType) ? indexType.getLiteral() : undefined

    if (
      !literal ||
      !Node.isStringLiteral(literal) ||
      !referencesDiffType({ diffTypeNames, typeNode: indexedAccess.getObjectTypeNode() })
    ) {
      continue
    }

    const newName = RENAMED_PROPS.get(literal.getLiteralValue())

    if (newName) {
      literal.setLiteralValue(newName)
      return true
    }
  }

  return false
}

/**
 * Finds functions whose first parameter is typed with a Diff type, either directly
 * (`(props: TextFieldDiffClientProps) => ...`) or through the variable they are assigned to
 * (`const Diff: React.FC<TextFieldDiffClientProps> = (props) => ...`).
 */
function findDiffComponents({
  diffTypeNames,
  sourceFile,
}: {
  diffTypeNames: Set<string>
  sourceFile: SourceFile
}): ComponentFunction[] {
  const functions: ComponentFunction[] = [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.FunctionExpression),
  ]

  return functions.filter((component) => {
    const propsParameter = component.getParameters()[0]

    if (!propsParameter) {
      return false
    }

    const parent = component.getParent()
    const typeNodes = [
      propsParameter.getTypeNode(),
      Node.isVariableDeclaration(parent) ? parent.getTypeNode() : undefined,
    ]

    return typeNodes.some((typeNode) => typeNode && referencesDiffType({ diffTypeNames, typeNode }))
  })
}

function referencesDiffType({
  diffTypeNames,
  typeNode,
}: {
  diffTypeNames: Set<string>
  typeNode: TypeNode
}): boolean {
  return [typeNode, ...typeNode.getDescendantsOfKind(SyntaxKind.TypeReference)].some(
    (node) =>
      Node.isTypeReference(node) &&
      diffTypeNames.has(node.getTypeName().getText()) &&
      !isWrappedWithin({ node, root: typeNode }),
  )
}

/**
 * Whether `node` sits inside a type that wraps the props rather than describing them, such as
 * `{ diff: TextFieldDiffClientProps }` or `TextFieldDiffClientProps['valueFrom']`.
 */
function isWrappedWithin({ node, root }: { node: Node; root: TypeNode }): boolean {
  const stopAt = root.getParent()

  for (
    let ancestor = node.getParent();
    ancestor && ancestor !== stopAt;
    ancestor = ancestor.getParent()
  ) {
    if (Node.isPropertySignature(ancestor) || Node.isIndexedAccessTypeNode(ancestor)) {
      return true
    }
  }

  return false
}

/**
 * Renames the destructured key of a single binding element. Returns `false` when the element
 * doesn't destructure one of the renamed props.
 */
function rewriteBindingElement({
  component,
  element,
}: {
  component: ComponentFunction
  element: BindingElement
}): boolean {
  if (element.getDotDotDotToken()) {
    return false
  }

  const nameNode = element.getNameNode()
  const propertyNameNode = element.getPropertyNameNode()
  const propertyName = propertyNameNode
    ? getPropertyNameText({ node: propertyNameNode })
    : nameNode.getText()
  const newName = propertyName ? RENAMED_PROPS.get(propertyName) : undefined

  if (!propertyName || !newName) {
    return false
  }

  const initializer = element.getInitializer()
  const initializerText = initializer ? ` = ${initializer.getText()}` : ''

  if (propertyNameNode) {
    const localName = nameNode.getText()

    element.replaceWithText(
      localName === newName
        ? `${newName}${initializerText}`
        : `${newName}: ${localName}${initializerText}`,
    )
    return true
  }

  // A shorthand `{ comparisonValue }` also declares a local variable. Renaming it through the
  // language service updates every reference, and `usePrefixAndSuffixText` leaves the element as
  // `comparisonValue: valueFrom`, which the next pass collapses to `valueFrom`.
  if (Node.isIdentifier(nameNode) && !containsIdentifierNamed({ name: newName, node: component })) {
    const sourceFile = element.getSourceFile()
    const textBeforeRename = sourceFile.getFullText()

    try {
      nameNode.rename(newName, { usePrefixAndSuffixText: true })
    } catch {
      // Fall back to keeping the local variable name below
    }

    if (sourceFile.getFullText() !== textBeforeRename) {
      return true
    }
  }

  element.replaceWithText(`${newName}: ${propertyName}${initializerText}`)
  return true
}

function getPropertyNameText({ node }: { node: Node }): string | undefined {
  if (Node.isIdentifier(node)) {
    return node.getText()
  }

  if (Node.isStringLiteral(node)) {
    return node.getLiteralValue()
  }

  return undefined
}

function containsIdentifierNamed({ name, node }: { name: string; node: Node }): boolean {
  return node
    .getDescendantsOfKind(SyntaxKind.Identifier)
    .some((identifier) => identifier.getText() === name)
}

/**
 * Compares symbols so an inner variable that shadows the props parameter isn't mistaken for it.
 * Falls back to comparing names when the type checker can't resolve a symbol.
 */
function isReferenceTo({
  declaration,
  identifier,
}: {
  declaration: Identifier
  identifier: Identifier
}): boolean {
  if (identifier.getText() !== declaration.getText()) {
    return false
  }

  const declarationSymbol = declaration.getSymbol()

  return !declarationSymbol || identifier.getSymbol() === declarationSymbol
}

/**
 * Flags old prop names that remain in a property position, e.g. a JSX attribute passing
 * `comparisonValue` to another component, or `Pick<Props, 'versionValue'>`. Local variables that
 * merely share the old name are left alone.
 */
function collectLeftoverNotes({ sourceFile }: { sourceFile: SourceFile }): string[] {
  const notedLocations = new Set<string>()
  const notes: string[] = []
  const candidates = [
    ...sourceFile
      .getDescendantsOfKind(SyntaxKind.Identifier)
      .filter((identifier) => isPropertyNamePosition({ identifier })),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral),
  ].sort((a, b) => a.getStart() - b.getStart())

  for (const candidate of candidates) {
    const oldName = Node.isStringLiteral(candidate)
      ? candidate.getLiteralValue()
      : candidate.getText()
    const newName = RENAMED_PROPS.get(oldName)
    const location = `${sourceFile.getFilePath()}:${candidate.getStartLineNumber()}`

    if (!newName || notedLocations.has(`${location}:${oldName}`)) {
      continue
    }

    notedLocations.add(`${location}:${oldName}`)
    notes.push(
      `${location}: \`${oldName}\` was not migrated. If it refers to a Diff component prop, rename it to \`${newName}\`.`,
    )
  }

  return notes
}

function isPropertyNamePosition({ identifier }: { identifier: Identifier }): boolean {
  const parent = identifier.getParent()

  if (Node.isShorthandPropertyAssignment(parent) || Node.isJsxAttribute(parent)) {
    return true
  }

  if (Node.isBindingElement(parent)) {
    const propertyNameNode = parent.getPropertyNameNode()

    return propertyNameNode ? propertyNameNode === identifier : !parent.getDotDotDotToken()
  }

  if (
    Node.isPropertyAccessExpression(parent) ||
    Node.isPropertyAssignment(parent) ||
    Node.isPropertySignature(parent)
  ) {
    return parent.getNameNode() === identifier
  }

  return false
}
