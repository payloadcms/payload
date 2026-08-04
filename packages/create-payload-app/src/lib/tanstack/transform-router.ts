import type {
  ImportDeclaration,
  Node as MorphNode,
  ObjectLiteralExpression,
  SourceFile,
} from 'ts-morph'

import { Node, Project, QuoteKind, SyntaxKind } from 'ts-morph'

import type { TextTransformResult } from './transform-vite-config.js'

type LocalBinding =
  | {
      importedName?: string
      importKind: 'default' | 'named' | 'namespace'
      isTypeOnly: boolean
      kind: 'import'
      moduleSpecifier: string
    }
  | { kind: 'other' | 'variable' }

const PAYLOAD_SEARCH_MODULE = '@payloadcms/tanstack-start/shared'
const ROUTER_MODULE = '@tanstack/react-router'

export function transformTanStackRouter({ content }: { content: string }): TextTransformResult {
  const project = new Project({
    manipulationSettings: { quoteKind: QuoteKind.Single },
    useInMemoryFileSystem: true,
  })
  const sourceFile = project.createSourceFile('router.tsx', content)
  const createRouterImport = getNamedImport({
    importedName: 'createRouter',
    moduleSpecifier: ROUTER_MODULE,
    sourceFile,
  })

  if (!createRouterImport) {
    return failure('Could not identify the createRouter import.')
  }

  const createRouterCalls = sourceFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter((call) => call.getExpression().getText() === createRouterImport.localName)

  if (createRouterCalls.length !== 1) {
    return failure('Expected exactly one createRouter() call.')
  }

  const createRouterCall = createRouterCalls[0]!
  if (createRouterCall.getArguments().length !== 1) {
    return failure('createRouter() must receive exactly one argument.')
  }

  const routerObject = createRouterCall.getArguments()[0]
  if (!Node.isObjectLiteralExpression(routerObject)) {
    return failure('createRouter() must receive an object literal.')
  }

  if (routerObject.getProperties().some(Node.isSpreadAssignment)) {
    return failure('Router object spreads cannot be transformed safely.')
  }

  const routeTreeProperties = routerObject
    .getProperties()
    .filter((property) => getPropertyName(property) === 'routeTree')

  if (routeTreeProperties.length !== 1) {
    return failure('The router must contain exactly one routeTree option.')
  }

  const parseValidation = validateSearchProperty({
    expectedIdentifier: 'payloadParseSearch',
    propertyName: 'parseSearch',
    routerObject,
  })
  if (!parseValidation.success) {
    return parseValidation
  }

  const stringifyValidation = validateSearchProperty({
    expectedIdentifier: 'payloadStringifySearch',
    propertyName: 'stringifySearch',
    routerObject,
  })
  if (!stringifyValidation.success) {
    return stringifyValidation
  }

  for (const localName of ['payloadParseSearch', 'payloadStringifySearch']) {
    const validation = validateDestinationBinding({ localName, sourceFile })
    if (!validation.success) {
      return validation
    }
  }

  const hasPayloadParseSearchImport = hasCompatiblePayloadBinding({
    localName: 'payloadParseSearch',
    sourceFile,
  })
  const hasPayloadStringifySearchImport = hasCompatiblePayloadBinding({
    localName: 'payloadStringifySearch',
    sourceFile,
  })
  if (
    parseValidation.isConfigured &&
    stringifyValidation.isConfigured &&
    hasPayloadParseSearchImport &&
    hasPayloadStringifySearchImport
  ) {
    return { content, modified: false, success: true }
  }

  const routeTreeIndex = routerObject.getProperties().indexOf(routeTreeProperties[0]!)
  if (!parseValidation.isConfigured) {
    routerObject.insertPropertyAssignment(routeTreeIndex, {
      name: 'parseSearch',
      initializer: 'payloadParseSearch',
    })
  }

  const currentRouteTreeIndex = routerObject
    .getProperties()
    .findIndex((property) => getPropertyName(property) === 'routeTree')
  if (!stringifyValidation.isConfigured) {
    routerObject.insertPropertyAssignment(currentRouteTreeIndex + 1, {
      name: 'stringifySearch',
      initializer: 'payloadStringifySearch',
    })
  }

  ensurePayloadSearchImport(sourceFile)
  sourceFile.formatText({ indentSize: 2 })

  return { content: sourceFile.getFullText(), modified: true, success: true }
}

function bindingNameIncludes({ localName, node }: { localName: string; node: MorphNode }): boolean {
  if (Node.isIdentifier(node)) {
    return node.getText() === localName
  }

  if (Node.isArrayBindingPattern(node) || Node.isObjectBindingPattern(node)) {
    return node
      .getElements()
      .some(
        (element) =>
          Node.isBindingElement(element) &&
          bindingNameIncludes({ localName, node: element.getNameNode() }),
      )
  }

  return false
}

function ensurePayloadSearchImport(sourceFile: SourceFile) {
  const declaration = sourceFile
    .getImportDeclarations()
    .find(
      (candidate) =>
        candidate.getModuleSpecifierValue() === PAYLOAD_SEARCH_MODULE &&
        !candidate.isTypeOnly() &&
        !candidate.getNamespaceImport(),
    )
  const importedNames = new Set(
    declaration?.getNamedImports().map((namedImport) => namedImport.getName()) ?? [],
  )
  const missingNames = ['payloadParseSearch', 'payloadStringifySearch'].filter(
    (name) => !importedNames.has(name),
  )

  if (declaration) {
    declaration.addNamedImports(missingNames)
  } else {
    sourceFile.addImportDeclaration({
      moduleSpecifier: PAYLOAD_SEARCH_MODULE,
      namedImports: missingNames,
    })
  }
}

function failure(reason: string): TextTransformResult {
  return { reason, success: false }
}

function getLocalBindings({
  localName,
  sourceFile,
}: {
  localName: string
  sourceFile: SourceFile
}): LocalBinding[] {
  const bindings: LocalBinding[] = []

  for (const declaration of sourceFile.getImportDeclarations()) {
    const moduleSpecifier = declaration.getModuleSpecifierValue()
    const defaultImport = declaration.getDefaultImport()
    if (defaultImport?.getText() === localName) {
      bindings.push({
        importKind: 'default',
        isTypeOnly: declaration.isTypeOnly(),
        kind: 'import',
        moduleSpecifier,
      })
    }

    const namespaceImport = declaration.getNamespaceImport()
    if (namespaceImport?.getText() === localName) {
      bindings.push({
        importKind: 'namespace',
        isTypeOnly: declaration.isTypeOnly(),
        kind: 'import',
        moduleSpecifier,
      })
    }

    for (const namedImport of declaration.getNamedImports()) {
      const namedImportLocalName = namedImport.getAliasNode()?.getText() ?? namedImport.getName()
      if (namedImportLocalName === localName) {
        bindings.push({
          importedName: namedImport.getName(),
          importKind: 'named',
          isTypeOnly: declaration.isTypeOnly() || namedImport.isTypeOnly(),
          kind: 'import',
          moduleSpecifier,
        })
      }
    }
  }

  for (const declaration of sourceFile.getVariableDeclarations()) {
    if (bindingNameIncludes({ localName, node: declaration.getNameNode() })) {
      bindings.push({ kind: 'variable' })
    }
  }

  const hasOtherDeclaration = [
    ...sourceFile.getClasses(),
    ...sourceFile.getEnums(),
    ...sourceFile.getFunctions(),
    ...sourceFile.getModules(),
  ].some((declaration) => declaration.getName() === localName)

  if (hasOtherDeclaration) {
    bindings.push({ kind: 'other' })
  }

  return bindings
}

function getNamedImport({
  importedName,
  moduleSpecifier,
  sourceFile,
}: {
  importedName: string
  moduleSpecifier: string
  sourceFile: SourceFile
}): { declaration: ImportDeclaration; localName: string } | undefined {
  const imports = sourceFile.getImportDeclarations().flatMap((declaration) =>
    declaration.getModuleSpecifierValue() === moduleSpecifier
      ? declaration
          .getNamedImports()
          .filter((namedImport) => namedImport.getName() === importedName)
          .map((namedImport) => ({
            declaration,
            localName: namedImport.getAliasNode()?.getText() ?? namedImport.getName(),
          }))
      : [],
  )

  if (imports.length !== 1) {
    return undefined
  }

  const imported = imports[0]!
  const bindings = getLocalBindings({ localName: imported.localName, sourceFile })
  const binding = bindings[0]

  if (
    bindings.length !== 1 ||
    binding?.kind !== 'import' ||
    binding.importKind !== 'named' ||
    binding.importedName !== importedName ||
    binding.isTypeOnly ||
    binding.moduleSpecifier !== moduleSpecifier
  ) {
    return undefined
  }

  return imported
}

function getPropertyName(node: MorphNode): string | undefined {
  if (
    Node.isPropertyAssignment(node) ||
    Node.isShorthandPropertyAssignment(node) ||
    Node.isMethodDeclaration(node) ||
    Node.isGetAccessorDeclaration(node) ||
    Node.isSetAccessorDeclaration(node)
  ) {
    return node.getName()
  }
}

function isCompatiblePayloadBinding({
  binding,
  localName,
}: {
  binding: LocalBinding
  localName: string
}) {
  return (
    binding.kind === 'import' &&
    binding.importKind === 'named' &&
    !binding.isTypeOnly &&
    binding.importedName === localName &&
    binding.moduleSpecifier === PAYLOAD_SEARCH_MODULE
  )
}

function hasCompatiblePayloadBinding({
  localName,
  sourceFile,
}: {
  localName: string
  sourceFile: SourceFile
}): boolean {
  const bindings = getLocalBindings({ localName, sourceFile })

  return bindings.length === 1 && isCompatiblePayloadBinding({ binding: bindings[0]!, localName })
}

function validateDestinationBinding({
  localName,
  sourceFile,
}: {
  localName: string
  sourceFile: SourceFile
}): { reason: string; success: false } | { success: true } {
  const bindings = getLocalBindings({ localName, sourceFile })

  if (
    bindings.length > 0 &&
    (bindings.length !== 1 || !isCompatiblePayloadBinding({ binding: bindings[0]!, localName }))
  ) {
    return {
      reason: `Identifier "${localName}" is already bound incompatibly.`,
      success: false,
    }
  }

  return { success: true }
}

function validateSearchProperty({
  expectedIdentifier,
  propertyName,
  routerObject,
}: {
  expectedIdentifier: string
  propertyName: 'parseSearch' | 'stringifySearch'
  routerObject: ObjectLiteralExpression
}): { isConfigured: boolean; success: true } | { reason: string; success: false } {
  const properties = routerObject
    .getProperties()
    .filter((property) => getPropertyName(property) === propertyName)

  if (properties.length === 0) {
    return { isConfigured: false, success: true }
  }

  const property = properties[0]
  if (
    properties.length !== 1 ||
    !property ||
    !Node.isPropertyAssignment(property) ||
    property.getInitializer()?.getText() !== expectedIdentifier
  ) {
    return {
      reason: `The router already defines a non-Payload ${propertyName} option.`,
      success: false,
    }
  }

  return { isConfigured: true, success: true }
}
