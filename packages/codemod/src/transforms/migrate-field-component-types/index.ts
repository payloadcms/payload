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

const COMPONENT_TO_PROPS = new Map<string, string>(
  FIELD_NAMES.flatMap((fieldName) => [
    [`${fieldName}FieldClientComponent`, `${fieldName}FieldClientProps`],
    [`${fieldName}FieldServerComponent`, `${fieldName}FieldServerProps`],
  ]),
)

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
          const references = binding.findReferencesAsNodes().filter((node) => node !== binding)
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
            .find((declaration) => {
              const initializer = declaration?.getInitializer()

              return initializer ? isClassComponentInitializer(initializer) : false
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
            reference.replaceWithText(`${reactBinding.localName}.FC<${propsImport.localName}>`)
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
    'Replace concrete field client/server component aliases imported from `payload` with the corresponding props types wrapped in `React.FC`. Explicit class components and unsupported import forms are left unchanged with notes for manual migration.',
}

type ResolvePropsImportArgs = {
  file: SourceFile
  propsName: string
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
  file.insertStatements(
    file.getImportDeclarations().length,
    `import type ${reactName} from 'react'`,
  )
}

function isClassComponentInitializer(initializer: Expression): boolean {
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

  if (Node.isClassExpression(expression)) {
    return true
  }

  return (
    Node.isIdentifier(expression) &&
    expression
      .getDefinitions()
      .some((definition) => Node.isClassDeclaration(definition.getDeclarationNode()))
  )
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
    const match = importType.getText().match(/^import\(['"]payload['"]\)\.([A-Za-z][A-Za-z0-9]*)$/)

    if (match?.[1] && COMPONENT_TO_PROPS.has(match[1])) {
      notes.push(
        `${file.getFilePath()}:${importType.getStartLineNumber()}: Unsupported inline import of \`${match[1]}\`. Replace it with the corresponding props type manually.`,
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
