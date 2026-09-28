import type { Expression, ImportDeclaration, SourceFile } from 'ts-morph'

import { Node, SyntaxKind } from 'ts-morph'

import type { Transform } from '../../types.js'

const FIELD_NAMES = [
  'Array',
  'Blocks',
  'Checkbox',
  'Code',
  'Collapsible',
  'Date',
  'Email',
  'Group',
  'Join',
  'JSON',
  'Number',
  'Point',
  'Radio',
  'Relationship',
  'RichText',
  'Row',
  'Select',
  'Tabs',
  'Text',
  'Textarea',
  'UI',
  'Upload',
] as const

const FIELDS_WITH_SPECIALIZED_COMPONENTS = [
  'Array',
  'Blocks',
  'Checkbox',
  'Code',
  'Collapsible',
  'Date',
  'Email',
  'Group',
  'Join',
  'JSON',
  'Number',
  'Point',
  'Radio',
  'Relationship',
  'RichText',
  'Row',
  'Select',
  'Tabs',
  'Text',
  'Textarea',
  'Upload',
] as const

const SPECIALIZED_COMPONENT_NAMES = [
  'FieldDescriptionClient',
  'FieldDescriptionServer',
  'FieldDiffClient',
  'FieldDiffServer',
  'FieldErrorClient',
  'FieldErrorServer',
  'FieldLabelClient',
  'FieldLabelServer',
] as const

const COMPONENT_TO_PROPS = new Map<string, string>([
  ['BlockRowLabelClientComponent', 'BlockRowLabelClientProps'],
  ['BlockRowLabelServerComponent', 'BlockRowLabelServerProps'],
  ['FieldClientComponent', 'FieldClientProps'],
  ['FieldDescriptionClientComponent', 'FieldDescriptionClientProps'],
  ['FieldDescriptionServerComponent', 'FieldDescriptionServerProps'],
  ['FieldDiffClientComponent', 'FieldDiffClientProps'],
  ['FieldDiffServerComponent', 'FieldDiffServerProps'],
  ['FieldErrorClientComponent', 'FieldErrorClientProps'],
  ['FieldErrorServerComponent', 'FieldErrorServerProps'],
  ['FieldLabelClientComponent', 'FieldLabelClientProps'],
  ['FieldLabelServerComponent', 'FieldLabelServerProps'],
  ['FieldServerComponent', 'FieldServerProps'],
  ...FIELD_NAMES.flatMap((fieldName) => [
    [`${fieldName}FieldClientComponent`, `${fieldName}FieldClientProps`] as const,
    [`${fieldName}FieldServerComponent`, `${fieldName}FieldServerProps`] as const,
  ]),
  ...FIELDS_WITH_SPECIALIZED_COMPONENTS.flatMap((fieldName) =>
    SPECIALIZED_COMPONENT_NAMES.map(
      (componentName) =>
        [`${fieldName}${componentName}Component`, `${fieldName}${componentName}Props`] as const,
    ),
  ),
  ['UIFieldDiffClientComponent', 'UIFieldDiffClientProps'],
  ['UIFieldDiffServerComponent', 'UIFieldDiffServerProps'],
])

const COMPONENT_GENERIC_DEFAULTS = new Map<string, readonly string[]>([
  ['FieldDiffClientComponent', ['ClientFieldWithOptionalType']],
  ['FieldDiffServerComponent', ['Field', 'ClientFieldWithOptionalType']],
  ['FieldErrorServerComponent', ['Field', 'ClientFieldWithOptionalType']],
  ['FieldLabelClientComponent', ['ClientFieldWithOptionalType']],
  ['FieldLabelServerComponent', ['Field', 'ClientFieldWithOptionalType']],
])

export const migrateFieldComponentTypes: Transform = {
  name: 'migrate-field-component-types',
  apply: ({ project }) => {
    const filesChanged = new Set<string>()
    const notes: string[] = []

    for (const file of project.getSourceFiles()) {
      collectUnsupportedImportNotes({ file, notes })

      let mutated = false
      let reactBinding: ResolvedReactBinding | undefined

      for (const importDeclaration of [...file.getImportDeclarations()]) {
        if (importDeclaration.getModuleSpecifierValue() !== 'payload') {
          continue
        }

        const componentImports = importDeclaration
          .getNamedImports()
          .filter((specifier) => COMPONENT_TO_PROPS.has(specifier.getName()))
          .map((specifier) => ({
            componentName: specifier.getName(),
            localName: specifier.getAliasNode()?.getText() ?? specifier.getName(),
          }))
        let importMutated = false

        for (const componentImport of componentImports) {
          const { componentName, localName } = componentImport
          const propsName = COMPONENT_TO_PROPS.get(componentName)

          if (!propsName) {
            continue
          }

          const specifier = importDeclaration
            .getNamedImports()
            .find(
              (namedImport) =>
                namedImport.getName() === componentName &&
                (namedImport.getAliasNode()?.getText() ?? namedImport.getName()) === localName,
            )

          if (!specifier) {
            continue
          }

          const binding = specifier.getAliasNode() ?? specifier.getNameNode()
          const references = binding
            .findReferencesAsNodes()
            .filter((node) => node !== binding && node.getSourceFile() === file)
          const unsupportedReference = references.find((reference) => {
            const parent = reference.getParent()

            return !Node.isTypeReference(parent) || parent.getTypeName() !== reference
          })

          if (unsupportedReference) {
            notes.push(
              `${file.getFilePath()}:${unsupportedReference.getStartLineNumber()}: Unsupported use of \`${componentName}\`. Replace it with the corresponding props type manually.`,
            )
            continue
          }

          const classDeclaration = references
            .map((reference) => reference.getFirstAncestorByKind(SyntaxKind.VariableDeclaration))
            .find((declaration, referenceIndex) => {
              const initializer = declaration?.getInitializer()
              const reference = references[referenceIndex]
              const componentPropertyPath = reference
                ? getComponentPropertyPath({ reference })
                : undefined

              return initializer
                ? initializerContainsClassComponent({ componentPropertyPath, initializer })
                : false
            })

          if (classDeclaration) {
            notes.push(
              `${file.getFilePath()}:${classDeclaration.getStartLineNumber()}: Cannot automatically migrate \`${componentName}\` because it types a class component. Replace it with a compatible props annotation manually.`,
            )
            continue
          }

          if (references.length === 0) {
            specifier.remove()
            importMutated = true
            mutated = true
            continue
          }

          const propsImport = resolvePropsImport({
            file,
            propsName,
          })

          reactBinding ??= resolveReactTypeBinding(file)

          for (const reference of references.reverse()) {
            const typeReference = reference.getParentIfKindOrThrow(SyntaxKind.TypeReference)
            const typeArguments = typeReference
              .getTypeArguments()
              .map((typeArgument) => typeArgument.getText())
            const propsTypeArguments = materializeGenericDefaults({
              componentName,
              file,
              importDeclaration,
              typeArguments,
            })
            const propsType =
              propsTypeArguments.length > 0
                ? `${propsImport.localName}<${propsTypeArguments.join(', ')}>`
                : propsImport.localName

            typeReference.replaceWithText(`${reactBinding.localName}.FC<${propsType}>`)
          }

          const currentSpecifier = importDeclaration
            .getNamedImports()
            .find(
              (namedImport) =>
                namedImport.getName() === componentName &&
                (namedImport.getAliasNode()?.getText() ?? namedImport.getName()) === localName,
            )

          if (propsImport.exists) {
            currentSpecifier?.remove()
          } else if (currentSpecifier) {
            currentSpecifier.setName(propsName)

            if (propsImport.localName === propsName) {
              currentSpecifier.removeAlias()
            } else {
              currentSpecifier.setAlias(propsImport.localName)
            }
          }

          importMutated = true
          mutated = true
        }

        if (importMutated) {
          removeEmptyImport(importDeclaration)
        }
      }

      if (reactBinding?.shouldAddImport) {
        addReactTypeImport({ file, reactName: reactBinding.localName })
      }

      if (mutated) {
        filesChanged.add(file.getFilePath())
      }
    }

    return {
      filesChanged: [...filesChanged],
      ...(notes.length > 0 ? { notes } : {}),
    }
  },
  description:
    'Replace field component aliases imported from `payload` with the corresponding props types wrapped in `React.FC`. Generic arguments are preserved. Explicit class components and unsupported import forms are left unchanged with notes for manual migration.',
}

type ResolvePropsImportArgs = {
  file: SourceFile
  propsName: string
}

type MaterializeGenericDefaultsArgs = {
  componentName: string
  file: SourceFile
  importDeclaration: ImportDeclaration
  typeArguments: string[]
}

function materializeGenericDefaults({
  componentName,
  file,
  importDeclaration,
  typeArguments,
}: MaterializeGenericDefaultsArgs): string[] {
  const genericDefaults = COMPONENT_GENERIC_DEFAULTS.get(componentName)

  if (!genericDefaults || typeArguments.length >= genericDefaults.length) {
    return typeArguments
  }

  return [
    ...typeArguments,
    ...genericDefaults.slice(typeArguments.length).map((typeName) =>
      resolvePayloadTypeImport({
        file,
        importDeclaration,
        typeName,
      }),
    ),
  ]
}

type ResolvePayloadTypeImportArgs = {
  file: SourceFile
  importDeclaration: ImportDeclaration
  typeName: string
}

function resolvePayloadTypeImport({
  file,
  importDeclaration,
  typeName,
}: ResolvePayloadTypeImportArgs): string {
  for (const declaration of file.getImportDeclarations()) {
    if (declaration.getModuleSpecifierValue() !== 'payload') {
      continue
    }

    const existing = declaration
      .getNamedImports()
      .find((namedImport) => namedImport.getName() === typeName)

    if (existing) {
      const localName = existing.getAliasNode()?.getText() ?? typeName

      if (
        !hasCompetingDeclaration({
          file,
          importDeclaration: declaration,
          localName,
        })
      ) {
        return localName
      }
    }
  }

  const localName = getAvailableName({ file, preferredName: typeName, suffix: 'Type' })

  importDeclaration.addNamedImport({
    name: typeName,
    alias: localName === typeName ? undefined : localName,
    isTypeOnly: !importDeclaration.isTypeOnly(),
  })

  return localName
}

type ResolvedPropsImport = {
  exists: boolean
  localName: string
}

function resolvePropsImport({ file, propsName }: ResolvePropsImportArgs): ResolvedPropsImport {
  for (const declaration of file.getImportDeclarations()) {
    if (declaration.getModuleSpecifierValue() !== 'payload') {
      continue
    }

    const existing = declaration
      .getNamedImports()
      .find((namedImport) => namedImport.getName() === propsName)

    if (existing) {
      const localName = existing.getAliasNode()?.getText() ?? propsName

      if (
        !hasCompetingDeclaration({
          file,
          importDeclaration: declaration,
          localName,
        })
      ) {
        return {
          exists: true,
          localName,
        }
      }
    }
  }

  const localName = getAvailableName({ file, preferredName: propsName, suffix: 'Type' })

  return { exists: false, localName }
}

type ResolvedReactBinding = {
  localName: string
  shouldAddImport: boolean
}

function resolveReactTypeBinding(file: SourceFile): ResolvedReactBinding {
  const reactImports = file
    .getImportDeclarations()
    .filter((declaration) => declaration.getModuleSpecifierValue() === 'react')

  for (const declaration of reactImports) {
    const namespaceImport = declaration.getNamespaceImport()
    if (
      namespaceImport &&
      !hasCompetingDeclaration({
        file,
        importDeclaration: declaration,
        localName: namespaceImport.getText(),
      })
    ) {
      return { localName: namespaceImport.getText(), shouldAddImport: false }
    }

    const defaultImport = declaration.getDefaultImport()
    if (
      defaultImport &&
      !hasCompetingDeclaration({
        file,
        importDeclaration: declaration,
        localName: defaultImport.getText(),
      })
    ) {
      return { localName: defaultImport.getText(), shouldAddImport: false }
    }
  }

  return {
    localName: getAvailableName({ file, preferredName: 'React', suffix: 'Type' }),
    shouldAddImport: true,
  }
}

type HasCompetingDeclarationArgs = {
  file: SourceFile
  importDeclaration: ImportDeclaration
  localName: string
}

function hasCompetingDeclaration({
  file,
  importDeclaration,
  localName,
}: HasCompetingDeclarationArgs): boolean {
  return file.getDescendantsOfKind(SyntaxKind.Identifier).some((identifier) => {
    if (
      identifier.getText() !== localName ||
      identifier.getFirstAncestorByKind(SyntaxKind.ImportDeclaration) === importDeclaration
    ) {
      return false
    }

    const parent = identifier.getParent()

    return (
      (Node.isTypeParameterDeclaration(parent) ||
        Node.isParameterDeclaration(parent) ||
        Node.isVariableDeclaration(parent) ||
        Node.isFunctionDeclaration(parent) ||
        Node.isClassDeclaration(parent) ||
        Node.isTypeAliasDeclaration(parent) ||
        Node.isInterfaceDeclaration(parent)) &&
      parent.getNameNode() === identifier
    )
  })
}

type AddReactTypeImportArgs = {
  file: SourceFile
  reactName: string
}

function addReactTypeImport({ file, reactName }: AddReactTypeImportArgs): void {
  const importDeclarations = file.getImportDeclarations()
  const lastImport = importDeclarations.at(-1)
  const statements = file.getStatements()
  const insertionIndex = lastImport ? statements.indexOf(lastImport) + 1 : 0
  const nextStatement = statements.at(insertionIndex)
  const needsTerminator =
    lastImport && nextStatement
      ? lastImport.getEndLineNumber() === nextStatement.getStartLineNumber()
      : false

  file.insertStatements(
    insertionIndex,
    `import type ${reactName} from 'react'${needsTerminator ? ';' : ''}`,
  )
}

type InitializerContainsClassComponentArgs = {
  componentPropertyPath?: string[]
  initializer: Expression
  visitedExpressions?: Set<Expression>
}

function initializerContainsClassComponent({
  componentPropertyPath,
  initializer,
  visitedExpressions = new Set<Expression>(),
}: InitializerContainsClassComponentArgs): boolean {
  let expression = initializer

  while (
    Node.isParenthesizedExpression(expression) ||
    Node.isAsExpression(expression) ||
    Node.isSatisfiesExpression(expression) ||
    Node.isTypeAssertion(expression) ||
    Node.isNonNullExpression(expression)
  ) {
    expression = expression.getExpression()
  }

  if (visitedExpressions.has(expression)) {
    return false
  }

  visitedExpressions.add(expression)

  if (Node.isClassExpression(expression)) {
    return true
  }

  if (Node.isArrayLiteralExpression(expression)) {
    return expression.getElements().some((element) => {
      const nestedExpression = Node.isSpreadElement(element) ? element.getExpression() : element

      return Node.isExpression(nestedExpression)
        ? initializerContainsClassComponent({
            componentPropertyPath,
            initializer: nestedExpression,
            visitedExpressions,
          })
        : false
    })
  }

  if (Node.isConditionalExpression(expression)) {
    return [expression.getWhenTrue(), expression.getWhenFalse()].some((nestedExpression) =>
      initializerContainsClassComponent({
        componentPropertyPath,
        initializer: nestedExpression,
        visitedExpressions,
      }),
    )
  }

  if (Node.isObjectLiteralExpression(expression)) {
    const properties = expression.getProperties()
    const componentPropertyName = componentPropertyPath?.[0]
    const remainingComponentPropertyPath = componentPropertyPath?.slice(1)
    const propertiesToInspect = componentPropertyName
      ? properties.filter(
          (property) =>
            ((Node.isPropertyAssignment(property) ||
              Node.isShorthandPropertyAssignment(property)) &&
              getStaticPropertyName({ nameNode: property.getNameNode() }) ===
                componentPropertyName) ||
            Node.isSpreadAssignment(property),
        )
      : properties

    return propertiesToInspect.some((property) => {
      if (Node.isPropertyAssignment(property)) {
        const propertyInitializer = property.getInitializer()

        return propertyInitializer && Node.isExpression(propertyInitializer)
          ? initializerContainsClassComponent({
              componentPropertyPath: remainingComponentPropertyPath,
              initializer: propertyInitializer,
              visitedExpressions,
            })
          : false
      }

      if (Node.isShorthandPropertyAssignment(property)) {
        return initializerContainsClassComponent({
          componentPropertyPath: remainingComponentPropertyPath,
          initializer: property.getNameNode(),
          visitedExpressions,
        })
      }

      return Node.isSpreadAssignment(property)
        ? initializerContainsClassComponent({
            componentPropertyPath,
            initializer: property.getExpression(),
            visitedExpressions,
          })
        : false
    })
  }

  if (!Node.isIdentifier(expression)) {
    return false
  }

  return expression.getDefinitions().some((definition) => {
    const declaration = definition.getDeclarationNode()

    if (Node.isClassDeclaration(declaration)) {
      return true
    }

    if (Node.isVariableDeclaration(declaration)) {
      const referencedInitializer = declaration.getInitializer()

      return referencedInitializer
        ? initializerContainsClassComponent({
            componentPropertyPath,
            initializer: referencedInitializer,
            visitedExpressions,
          })
        : false
    }

    return false
  })
}

type GetComponentPropertyPathArgs = {
  reference: Node
}

function getComponentPropertyPath({
  reference,
}: GetComponentPropertyPathArgs): string[] | undefined {
  const propertySignatures = reference.getAncestors().filter(Node.isPropertySignature).reverse()

  if (propertySignatures.length === 0) {
    return undefined
  }

  const propertyPath = propertySignatures.map((property) =>
    getStaticPropertyName({ nameNode: property.getNameNode() }),
  )

  return propertyPath.every((propertyName): propertyName is string => propertyName !== undefined)
    ? propertyPath
    : undefined
}

type GetStaticPropertyNameArgs = {
  nameNode: Node
}

function getStaticPropertyName({ nameNode }: GetStaticPropertyNameArgs): string | undefined {
  if (Node.isComputedPropertyName(nameNode)) {
    return getStaticComputedPropertyName({ expression: nameNode.getExpression() })
  }

  if (Node.isStringLiteral(nameNode) || Node.isNoSubstitutionTemplateLiteral(nameNode)) {
    return nameNode.getLiteralText()
  }

  if (Node.isNumericLiteral(nameNode)) {
    return String(nameNode.getLiteralValue())
  }

  return Node.isIdentifier(nameNode) ? nameNode.getText() : undefined
}

type GetStaticComputedPropertyNameArgs = {
  expression: Expression
  visitedExpressions?: Set<Expression>
}

function getStaticComputedPropertyName({
  expression: initialExpression,
  visitedExpressions = new Set<Expression>(),
}: GetStaticComputedPropertyNameArgs): string | undefined {
  let expression = initialExpression

  while (
    Node.isParenthesizedExpression(expression) ||
    Node.isAsExpression(expression) ||
    Node.isSatisfiesExpression(expression) ||
    Node.isTypeAssertion(expression) ||
    Node.isNonNullExpression(expression)
  ) {
    expression = expression.getExpression()
  }

  if (visitedExpressions.has(expression)) {
    return undefined
  }

  visitedExpressions.add(expression)

  if (Node.isStringLiteral(expression) || Node.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.getLiteralText()
  }

  if (Node.isNumericLiteral(expression)) {
    return String(expression.getLiteralValue())
  }

  if (!Node.isIdentifier(expression)) {
    return undefined
  }

  for (const definition of expression.getDefinitions()) {
    const declaration = definition.getDeclarationNode()

    if (Node.isVariableDeclaration(declaration)) {
      const initializer = declaration.getInitializer()
      const propertyName =
        initializer && Node.isExpression(initializer)
          ? getStaticComputedPropertyName({ expression: initializer, visitedExpressions })
          : undefined

      if (propertyName !== undefined) {
        return propertyName
      }
    }
  }

  return undefined
}

type GetAvailableNameArgs = {
  file: SourceFile
  preferredName: string
  suffix: string
}

function getAvailableName({ file, preferredName, suffix }: GetAvailableNameArgs): string {
  const usedNames = new Set(
    file.getDescendantsOfKind(SyntaxKind.Identifier).map((identifier) => identifier.getText()),
  )

  if (!usedNames.has(preferredName)) {
    return preferredName
  }

  let candidate = `${preferredName}${suffix}`
  let index = 2

  while (usedNames.has(candidate)) {
    candidate = `${preferredName}${suffix}${index}`
    index++
  }

  return candidate
}

type CollectUnsupportedImportNotesArgs = {
  file: SourceFile
  notes: string[]
}

function collectUnsupportedImportNotes({ file, notes }: CollectUnsupportedImportNotesArgs): void {
  for (const exportDeclaration of file.getExportDeclarations()) {
    if (exportDeclaration.getModuleSpecifierValue() !== 'payload') {
      continue
    }

    for (const namedExport of exportDeclaration.getNamedExports()) {
      if (COMPONENT_TO_PROPS.has(namedExport.getName())) {
        notes.push(
          `${file.getFilePath()}:${namedExport.getStartLineNumber()}: Unsupported re-export of \`${namedExport.getName()}\`. Replace it with the corresponding props type manually.`,
        )
      }
    }
  }

  for (const importDeclaration of file.getImportDeclarations()) {
    if (importDeclaration.getModuleSpecifierValue() !== 'payload') {
      continue
    }

    const namespaceImport = importDeclaration.getNamespaceImport()
    if (!namespaceImport) {
      continue
    }

    const namespaceName = namespaceImport.getText()
    for (const qualifiedName of file.getDescendantsOfKind(SyntaxKind.QualifiedName)) {
      const componentName = qualifiedName.getRight().getText()

      if (
        qualifiedName.getLeft().getText() === namespaceName &&
        COMPONENT_TO_PROPS.has(componentName)
      ) {
        notes.push(
          `${file.getFilePath()}:${qualifiedName.getStartLineNumber()}: Unsupported namespace reference to \`${componentName}\`. Replace it with the corresponding props type manually.`,
        )
      }
    }
  }

  for (const importType of file.getDescendantsOfKind(SyntaxKind.ImportType)) {
    const argument = importType.getArgument()
    const literal = Node.isLiteralTypeNode(argument) ? argument.getLiteral() : undefined
    const qualifier = importType.getQualifier()

    if (
      Node.isStringLiteral(literal) &&
      literal.getLiteralText() === 'payload' &&
      qualifier &&
      COMPONENT_TO_PROPS.has(qualifier.getText())
    ) {
      const componentName = qualifier.getText()

      notes.push(
        `${file.getFilePath()}:${importType.getStartLineNumber()}: Unsupported inline import of \`${componentName}\`. Replace it with the corresponding props type manually.`,
      )
    }
  }
}

function removeEmptyImport(importDeclaration: ImportDeclaration): void {
  if (
    importDeclaration.wasForgotten() ||
    importDeclaration.getNamedImports().length > 0 ||
    importDeclaration.getDefaultImport() ||
    importDeclaration.getNamespaceImport()
  ) {
    return
  }

  importDeclaration.remove()
}
