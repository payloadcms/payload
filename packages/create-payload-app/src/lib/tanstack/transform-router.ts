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

  if (!isGeneratedRouteTreeProperty({ property: routeTreeProperties[0]!, sourceFile })) {
    return failure('The routeTree option must reference the generated route tree import.')
  }

  const parseImport = resolvePayloadSearchImport({
    importedName: 'payloadParseSearch',
    sourceFile,
  })
  if (!parseImport.success) {
    return parseImport
  }

  const stringifyImport = resolvePayloadSearchImport({
    importedName: 'payloadStringifySearch',
    sourceFile,
  })
  if (!stringifyImport.success) {
    return stringifyImport
  }

  const parseValidation = validateSearchProperty({
    expectedIdentifier: parseImport.localName,
    propertyName: 'parseSearch',
    routerObject,
  })
  if (!parseValidation.success) {
    return parseValidation
  }

  const stringifyValidation = validateSearchProperty({
    expectedIdentifier: stringifyImport.localName,
    propertyName: 'stringifySearch',
    routerObject,
  })
  if (!stringifyValidation.success) {
    return stringifyValidation
  }

  if (
    parseValidation.isConfigured &&
    stringifyValidation.isConfigured &&
    parseImport.isPresent &&
    stringifyImport.isPresent
  ) {
    return { content, modified: false, success: true }
  }

  const routeTreeIndex = routerObject.getProperties().indexOf(routeTreeProperties[0]!)
  if (!parseValidation.isConfigured) {
    routerObject.insertPropertyAssignment(routeTreeIndex, {
      name: 'parseSearch',
      initializer: parseImport.localName,
    })
  }

  const currentRouteTreeIndex = routerObject
    .getProperties()
    .findIndex((property) => getPropertyName(property) === 'routeTree')
  if (!stringifyValidation.isConfigured) {
    routerObject.insertPropertyAssignment(currentRouteTreeIndex + 1, {
      name: 'stringifySearch',
      initializer: stringifyImport.localName,
    })
  }

  ensurePayloadSearchImports({
    importedNames: [parseImport, stringifyImport]
      .filter((resolvedImport) => !resolvedImport.isPresent)
      .map((resolvedImport) => resolvedImport.importedName),
    sourceFile,
  })
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

function ensurePayloadSearchImports({
  importedNames,
  sourceFile,
}: {
  importedNames: string[]
  sourceFile: SourceFile
}) {
  if (importedNames.length === 0) {
    return
  }

  const declaration = sourceFile
    .getImportDeclarations()
    .find(
      (candidate) =>
        candidate.getModuleSpecifierValue() === PAYLOAD_SEARCH_MODULE &&
        !candidate.isTypeOnly() &&
        !candidate.getNamespaceImport(),
    )
  if (declaration) {
    declaration.addNamedImports(importedNames)
  } else {
    sourceFile.addImportDeclaration({
      moduleSpecifier: PAYLOAD_SEARCH_MODULE,
      namedImports: importedNames,
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

function isGeneratedRouteTreeProperty({
  property,
  sourceFile,
}: {
  property: MorphNode
  sourceFile: SourceFile
}): boolean {
  const initializer = Node.isShorthandPropertyAssignment(property)
    ? property.getName()
    : Node.isPropertyAssignment(property) && Node.isIdentifier(property.getInitializer())
      ? property.getInitializer()!.getText()
      : undefined

  if (!initializer) {
    return false
  }

  const generatedImports = sourceFile.getImportDeclarations().flatMap((declaration) => {
    const moduleSpecifier = declaration.getModuleSpecifierValue()
    if (
      declaration.isTypeOnly() ||
      !/^\.\/routeTree\.gen(?:\.(?:js|jsx|ts|tsx|mjs|cjs|mts|cts))?$/.test(moduleSpecifier)
    ) {
      return []
    }

    return declaration
      .getNamedImports()
      .filter(
        (namedImport) =>
          !namedImport.isTypeOnly() &&
          namedImport.getName() === 'routeTree' &&
          (namedImport.getAliasNode()?.getText() ?? namedImport.getName()) === initializer,
      )
      .map(() => moduleSpecifier)
  })

  if (generatedImports.length !== 1) {
    return false
  }

  const bindings = getLocalBindings({ localName: initializer, sourceFile })
  const binding = bindings[0]

  return (
    bindings.length === 1 &&
    binding?.kind === 'import' &&
    binding.importKind === 'named' &&
    binding.importedName === 'routeTree' &&
    !binding.isTypeOnly &&
    binding.moduleSpecifier === generatedImports[0]
  )
}

function isCompatiblePayloadBinding({
  binding,
  importedName,
}: {
  binding: LocalBinding
  importedName: string
}) {
  return (
    binding.kind === 'import' &&
    binding.importKind === 'named' &&
    !binding.isTypeOnly &&
    binding.importedName === importedName &&
    binding.moduleSpecifier === PAYLOAD_SEARCH_MODULE
  )
}

function resolvePayloadSearchImport({
  importedName,
  sourceFile,
}: {
  importedName: 'payloadParseSearch' | 'payloadStringifySearch'
  sourceFile: SourceFile
}):
  | { importedName: string; isPresent: boolean; localName: string; success: true }
  | { reason: string; success: false } {
  const matchingImports = sourceFile.getImportDeclarations().flatMap((declaration) =>
    declaration.getModuleSpecifierValue() === PAYLOAD_SEARCH_MODULE && !declaration.isTypeOnly()
      ? declaration
          .getNamedImports()
          .filter(
            (namedImport) => namedImport.getName() === importedName && !namedImport.isTypeOnly(),
          )
          .map((namedImport) => namedImport.getAliasNode()?.getText() ?? namedImport.getName())
      : [],
  )

  if (matchingImports.length > 1) {
    return {
      reason: `The Payload search module imports ${importedName} more than once.`,
      success: false,
    }
  }

  const localName = matchingImports[0] ?? importedName
  const bindings = getLocalBindings({ localName, sourceFile })

  if (
    bindings.length > 0 &&
    (bindings.length !== 1 || !isCompatiblePayloadBinding({ binding: bindings[0]!, importedName }))
  ) {
    return {
      reason: `Identifier "${localName}" is already bound incompatibly.`,
      success: false,
    }
  }

  return { importedName, isPresent: matchingImports.length === 1, localName, success: true }
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
