import type {
  ArrayLiteralExpression,
  FunctionDeclaration,
  ImportDeclaration,
  JsxSelfClosingElement,
  Node as MorphNode,
  ObjectLiteralExpression,
  PropertyAssignment,
  SourceFile,
} from 'ts-morph'

import { Node, Project, QuoteKind, SyntaxKind } from 'ts-morph'

import type { TanStackAppDetails } from '../../types.js'
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

type NamedImport = { declaration: ImportDeclaration; localName: string }

const PAYLOAD_CLIENT_MODULE = '@payloadcms/tanstack-start/client'
const ROUTER_MODULE = '@tanstack/react-router'

export function transformTanStackRootRoute({
  content,
  kind,
}: {
  content: string
  kind: TanStackAppDetails['kind']
}): TextTransformResult {
  const project = new Project({
    manipulationSettings: { quoteKind: QuoteKind.Single },
    useInMemoryFileSystem: true,
  })
  const sourceFile = project.createSourceFile('__root.tsx', content)
  const createRootRouteImport = getNamedImport({
    importedName: 'createRootRoute',
    moduleSpecifier: ROUTER_MODULE,
    sourceFile,
  })

  if (!createRootRouteImport) {
    return failure('Could not identify the createRootRoute import.')
  }

  const createRootRouteCalls = sourceFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter((call) => call.getExpression().getText() === createRootRouteImport.localName)

  if (createRootRouteCalls.length !== 1) {
    return failure('Expected exactly one createRootRoute() call.')
  }

  const createRootRouteCall = createRootRouteCalls[0]!
  if (createRootRouteCall.getArguments().length !== 1) {
    return failure('createRootRoute() must receive exactly one argument.')
  }

  const rootObject = createRootRouteCall.getArguments()[0]
  if (!Node.isObjectLiteralExpression(rootObject)) {
    return failure('createRootRoute() must receive an object literal.')
  }

  if (rootObject.getProperties().some(Node.isSpreadAssignment)) {
    return failure('Root route object spreads cannot be transformed safely.')
  }

  return kind === 'start'
    ? transformStartRoot({ content, rootObject, sourceFile })
    : transformRouterOnlyRoot({ content, rootObject, sourceFile })
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

function ensureNamedImport({
  importedName,
  moduleSpecifier,
  sourceFile,
}: {
  importedName: string
  moduleSpecifier: string
  sourceFile: SourceFile
}) {
  const declaration = sourceFile
    .getImportDeclarations()
    .find(
      (candidate) =>
        candidate.getModuleSpecifierValue() === moduleSpecifier &&
        !candidate.isTypeOnly() &&
        !candidate.getNamespaceImport(),
    )

  if (
    declaration
      ?.getNamedImports()
      .some((namedImport) => namedImport.getName() === importedName && !namedImport.getAliasNode())
  ) {
    return
  }

  if (declaration) {
    declaration.addNamedImport(importedName)
  } else {
    sourceFile.addImportDeclaration({ moduleSpecifier, namedImports: [importedName] })
  }
}

function failure(reason: string): TextTransformResult {
  return { reason, success: false }
}

function getAppStylesheetImport({
  requireSideEffect,
  sourceFile,
}: {
  requireSideEffect: boolean
  sourceFile: SourceFile
}): { declaration: ImportDeclaration; localName?: string; moduleSpecifier: string } | undefined {
  const imports = sourceFile.getImportDeclarations().filter((declaration) => {
    const moduleSpecifier = declaration.getModuleSpecifierValue()
    const isStylesheet = requireSideEffect
      ? /\.css$/.test(moduleSpecifier)
      : /\.css\?url$/.test(moduleSpecifier)

    if (!isStylesheet) {
      return false
    }

    const hasNamedOrNamespaceImport =
      declaration.getNamedImports().length > 0 || Boolean(declaration.getNamespaceImport())
    return requireSideEffect
      ? !declaration.getDefaultImport() && !hasNamedOrNamespaceImport
      : Boolean(declaration.getDefaultImport()) && !hasNamedOrNamespaceImport
  })

  if (imports.length !== 1) {
    return undefined
  }

  const declaration = imports[0]!
  return {
    declaration,
    localName: declaration.getDefaultImport()?.getText(),
    moduleSpecifier: declaration.getModuleSpecifierValue(),
  }
}

function getFunction({
  functionName,
  sourceFile,
}: {
  functionName: string
  sourceFile: SourceFile
}): FunctionDeclaration | undefined {
  const functions = sourceFile
    .getFunctions()
    .filter((declaration) => declaration.getName() === functionName)

  return functions.length === 1 ? functions[0] : undefined
}

function getHeadContentNode({
  functionDeclaration,
  localName,
}: {
  functionDeclaration: FunctionDeclaration
  localName: string
}): JsxSelfClosingElement | undefined {
  const matches = functionDeclaration
    .getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
    .filter((element) => element.getTagNameNode().getText() === localName)

  return matches.length === 1 ? matches[0] : undefined
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
}): NamedImport | undefined {
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

function resolveRouterNamedImport({
  importedName,
  sourceFile,
}: {
  importedName: 'HeadContent' | 'Scripts'
  sourceFile: SourceFile
}):
  | { importedName: string; isPresent: boolean; localName: string; success: true }
  | { reason: string; success: false } {
  const matchingImports = sourceFile.getImportDeclarations().flatMap((declaration) =>
    declaration.getModuleSpecifierValue() === ROUTER_MODULE && !declaration.isTypeOnly()
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
      reason: `The TanStack router module imports ${importedName} more than once.`,
      success: false,
    }
  }

  const localName = matchingImports[0] ?? importedName
  const bindings = getLocalBindings({ localName, sourceFile })
  const binding = bindings[0]
  const isCompatible =
    binding?.kind === 'import' &&
    binding.importKind === 'named' &&
    binding.importedName === importedName &&
    !binding.isTypeOnly &&
    binding.moduleSpecifier === ROUTER_MODULE

  if (bindings.length > 0 && (bindings.length !== 1 || !isCompatible)) {
    return {
      reason: `Identifier "${localName}" is already bound incompatibly.`,
      success: false,
    }
  }

  return { importedName, isPresent: matchingImports.length === 1, localName, success: true }
}

function getSideEffectStylesheetImports(sourceFile: SourceFile): ImportDeclaration[] {
  return sourceFile
    .getImportDeclarations()
    .filter(
      (declaration) =>
        /\.css$/.test(declaration.getModuleSpecifierValue()) &&
        !declaration.getDefaultImport() &&
        !declaration.getNamespaceImport() &&
        declaration.getNamedImports().length === 0,
    )
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

function getPropertyAssignment({
  object,
  propertyName,
}: {
  object: ObjectLiteralExpression
  propertyName: string
}) {
  const properties = object
    .getProperties()
    .filter((property) => getPropertyName(property) === propertyName)

  return properties.length === 1 && Node.isPropertyAssignment(properties[0])
    ? properties[0]
    : undefined
}

function getRootHeadLinks(
  rootObject: ObjectLiteralExpression,
): { links: ArrayLiteralExpression; success: true } | { reason: string; success: false } {
  const headProperty = getPropertyAssignment({ object: rootObject, propertyName: 'head' })
  const headInitializer = headProperty?.getInitializer()
  if (!headInitializer || !Node.isArrowFunction(headInitializer)) {
    return { reason: 'The root head declaration cannot be transformed safely.', success: false }
  }

  const body = headInitializer.getBody()
  const headObject = Node.isParenthesizedExpression(body) ? body.getExpression() : body
  if (!Node.isObjectLiteralExpression(headObject)) {
    return { reason: 'The root head declaration cannot be transformed safely.', success: false }
  }

  const linksProperty = getPropertyAssignment({ object: headObject, propertyName: 'links' })
  const links = linksProperty?.getInitializer()
  if (
    !links ||
    !Node.isArrayLiteralExpression(links) ||
    links.getElements().some(Node.isSpreadElement)
  ) {
    return { reason: 'The root head links cannot be transformed safely.', success: false }
  }

  return { links, success: true }
}

function getShellState({
  expectedComponent,
  rootObject,
}: {
  expectedComponent?: string
  rootObject: ObjectLiteralExpression
}):
  | { componentName: string; isWrapped: boolean; property?: PropertyAssignment; success: true }
  | { reason: string; success: false } {
  const properties = rootObject
    .getProperties()
    .filter((property) => getPropertyName(property) === 'shellComponent')

  if (properties.length === 0) {
    if (!expectedComponent) {
      return { componentName: 'RootDocument', isWrapped: false, success: true }
    }

    return {
      reason: 'The existing shellComponent cannot be transformed safely.',
      success: false,
    }
  }

  const property = properties[0]
  if (properties.length !== 1 || !property || !Node.isPropertyAssignment(property)) {
    return {
      reason: 'The existing shellComponent cannot be transformed safely.',
      success: false,
    }
  }

  const initializer = property.getInitializer()
  if (
    Node.isIdentifier(initializer) &&
    (!expectedComponent || initializer.getText() === expectedComponent)
  ) {
    return {
      componentName: initializer.getText(),
      isWrapped: false,
      property,
      success: true,
    }
  }

  if (
    Node.isCallExpression(initializer) &&
    initializer.getExpression().getText() === 'withPayloadRoot' &&
    initializer.getArguments().length === 1 &&
    Node.isIdentifier(initializer.getArguments()[0]) &&
    (!expectedComponent || initializer.getArguments()[0]!.getText() === expectedComponent)
  ) {
    return {
      componentName: initializer.getArguments()[0]!.getText(),
      isWrapped: true,
      property,
      success: true,
    }
  }

  return {
    reason: 'The existing shellComponent cannot be transformed safely.',
    success: false,
  }
}

function getStylesheetAttribute({
  name,
  element,
}: {
  element: JsxSelfClosingElement
  name: string
}): string | undefined {
  const attribute = element
    .getAttributes()
    .find(
      (candidate) => Node.isJsxAttribute(candidate) && candidate.getNameNode().getText() === name,
    )

  if (!attribute || !Node.isJsxAttribute(attribute)) {
    return undefined
  }

  const initializer = attribute.getInitializer()
  if (Node.isStringLiteral(initializer)) {
    return initializer.getLiteralValue()
  }

  if (Node.isJsxExpression(initializer)) {
    return initializer.getExpression()?.getText()
  }
}

function transformRouterOnlyRoot({
  content,
  rootObject,
  sourceFile,
}: {
  content: string
  rootObject: ObjectLiteralExpression
  sourceFile: SourceFile
}): TextTransformResult {
  const shellState = getShellState({ rootObject })
  if (!shellState.success) {
    return shellState
  }

  if (shellState.property && !shellState.isWrapped) {
    return failure('The existing shellComponent cannot be transformed safely.')
  }

  if (shellState.isWrapped && getSideEffectStylesheetImports(sourceFile).length > 0) {
    return failure('Side-effect stylesheet imports cannot be isolated from admin.')
  }

  const headContentImport = resolveRouterNamedImport({
    importedName: 'HeadContent',
    sourceFile,
  })
  if (!headContentImport.success) {
    return headContentImport
  }

  const scriptsImport = resolveRouterNamedImport({ importedName: 'Scripts', sourceFile })
  if (!scriptsImport.success) {
    return scriptsImport
  }

  const destinationValidation = validateRouterOnlyDestinations({
    isAlreadyWrapped: shellState.isWrapped,
    sourceFile,
  })
  if (!destinationValidation.success) {
    return destinationValidation
  }

  if (shellState.isWrapped) {
    const stylesheetImport = getAppStylesheetImport({ requireSideEffect: false, sourceFile })
    const rootDocument = getFunction({ functionName: 'RootDocument', sourceFile })
    if (
      !stylesheetImport ||
      stylesheetImport.localName !== 'appCss' ||
      !rootDocument ||
      !hasValidAppStylesheetLink({
        functionDeclaration: rootDocument,
        headContentLocalName: headContentImport.localName,
        localName: 'appCss',
      })
    ) {
      return failure('The existing Payload root shell does not match the supported configuration.')
    }

    const hasWithPayloadImport = Boolean(
      getNamedImport({
        importedName: 'withPayloadRoot',
        moduleSpecifier: PAYLOAD_CLIENT_MODULE,
        sourceFile,
      }),
    )
    const hasAllRequiredImports =
      hasWithPayloadImport && headContentImport.isPresent && scriptsImport.isPresent

    if (!hasAllRequiredImports) {
      if (!hasWithPayloadImport) {
        ensureNamedImport({
          importedName: 'withPayloadRoot',
          moduleSpecifier: PAYLOAD_CLIENT_MODULE,
          sourceFile,
        })
      }
      if (!headContentImport.isPresent) {
        ensureNamedImport({
          importedName: 'HeadContent',
          moduleSpecifier: ROUTER_MODULE,
          sourceFile,
        })
      }
      if (!scriptsImport.isPresent) {
        ensureNamedImport({
          importedName: 'Scripts',
          moduleSpecifier: ROUTER_MODULE,
          sourceFile,
        })
      }
      sourceFile.formatText({ indentSize: 2 })

      return { content: sourceFile.getFullText(), modified: true, success: true }
    }

    return { content, modified: false, success: true }
  }

  const sideEffectStylesheets = getSideEffectStylesheetImports(sourceFile)

  if (sideEffectStylesheets.length !== 1) {
    return failure('Expected exactly one side-effect stylesheet import.')
  }

  const stylesheetImport = sideEffectStylesheets[0]!
  const componentProperties = rootObject
    .getProperties()
    .filter((property) => getPropertyName(property) === 'component')
  if (componentProperties.length !== 1) {
    return failure('The Router-only root must contain exactly one component option.')
  }

  stylesheetImport.setDefaultImport('appCss')
  stylesheetImport.setModuleSpecifier(`${stylesheetImport.getModuleSpecifierValue()}?url`)
  rootObject.addPropertyAssignment({
    name: 'shellComponent',
    initializer: 'withPayloadRoot(RootDocument)',
  })
  ensureNamedImport({
    importedName: 'withPayloadRoot',
    moduleSpecifier: PAYLOAD_CLIENT_MODULE,
    sourceFile,
  })
  if (!headContentImport.isPresent) {
    ensureNamedImport({ importedName: 'HeadContent', moduleSpecifier: ROUTER_MODULE, sourceFile })
  }
  if (!scriptsImport.isPresent) {
    ensureNamedImport({ importedName: 'Scripts', moduleSpecifier: ROUTER_MODULE, sourceFile })
  }
  sourceFile.addStatements(`
function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href={appCss} rel="stylesheet" />
        <${headContentImport.localName} />
      </head>
      <body>
        {children}
        <${scriptsImport.localName} />
      </body>
    </html>
  )
}`)
  sourceFile.formatText({ indentSize: 2 })

  return { content: sourceFile.getFullText(), modified: true, success: true }
}

function transformStartRoot({
  content,
  rootObject,
  sourceFile,
}: {
  content: string
  rootObject: ObjectLiteralExpression
  sourceFile: SourceFile
}): TextTransformResult {
  if (getSideEffectStylesheetImports(sourceFile).length > 0) {
    return failure('Side-effect stylesheet imports cannot be isolated from admin.')
  }

  const shellState = getShellState({ expectedComponent: undefined, rootObject })
  if (!shellState.success || !shellState.property) {
    return shellState.success
      ? failure('The existing shellComponent cannot be transformed safely.')
      : shellState
  }

  const withPayloadValidation = validateNamedDestination({
    importedName: 'withPayloadRoot',
    localName: 'withPayloadRoot',
    moduleSpecifier: PAYLOAD_CLIENT_MODULE,
    sourceFile,
  })
  if (!withPayloadValidation.success) {
    return withPayloadValidation
  }
  const hasWithPayloadImport = Boolean(
    getNamedImport({
      importedName: 'withPayloadRoot',
      moduleSpecifier: PAYLOAD_CLIENT_MODULE,
      sourceFile,
    }),
  )

  const headContentImport = getNamedImport({
    importedName: 'HeadContent',
    moduleSpecifier: ROUTER_MODULE,
    sourceFile,
  })
  const scriptsImport = getNamedImport({
    importedName: 'Scripts',
    moduleSpecifier: ROUTER_MODULE,
    sourceFile,
  })
  if (!headContentImport || !scriptsImport) {
    return failure('Could not identify the Start document imports.')
  }

  const stylesheetImport = getAppStylesheetImport({ requireSideEffect: false, sourceFile })
  if (!stylesheetImport?.localName) {
    return failure('Could not identify the app stylesheet import.')
  }

  const stylesheetBindings = getLocalBindings({ localName: stylesheetImport.localName, sourceFile })
  const stylesheetBinding = stylesheetBindings[0]
  if (
    stylesheetBindings.length !== 1 ||
    stylesheetBinding?.kind !== 'import' ||
    stylesheetBinding.importKind !== 'default' ||
    stylesheetBinding.isTypeOnly ||
    stylesheetBinding.moduleSpecifier !== stylesheetImport.moduleSpecifier
  ) {
    return failure(`Identifier "${stylesheetImport.localName}" is already bound incompatibly.`)
  }

  const rootDocument = getFunction({ functionName: shellState.componentName, sourceFile })
  if (!rootDocument) {
    return failure('Could not identify the Start root document component.')
  }

  const headContentNode = getHeadContentNode({
    functionDeclaration: rootDocument,
    localName: headContentImport.localName,
  })
  if (!headContentNode) {
    return failure('Could not identify HeadContent in the Start root document.')
  }

  const headLinks = getRootHeadLinks(rootObject)
  if (!headLinks.success) {
    return headLinks
  }

  let stylesheetIndex = -1
  for (const [index, element] of headLinks.links.getElements().entries()) {
    if (!Node.isObjectLiteralExpression(element)) {
      return failure('The app stylesheet link cannot be relocated safely.')
    }

    if (element.getProperties().some(Node.isSpreadAssignment)) {
      return failure('The app stylesheet link cannot be relocated safely.')
    }

    const rel = getStaticObjectPropertyValue({ object: element, propertyName: 'rel' })
    if (rel !== 'stylesheet') {
      continue
    }

    const hrefProperty = getPropertyAssignment({ object: element, propertyName: 'href' })
    if (
      hrefProperty?.getInitializer()?.getText() !== stylesheetImport.localName ||
      stylesheetIndex !== -1
    ) {
      return failure('The app stylesheet link cannot be relocated safely.')
    }

    stylesheetIndex = index
  }

  const hasStylesheetLink = hasValidAppStylesheetLink({
    functionDeclaration: rootDocument,
    headContentLocalName: headContentImport.localName,
    localName: stylesheetImport.localName,
  })
  if (stylesheetIndex === -1 && !hasStylesheetLink) {
    return failure('The app stylesheet link cannot be relocated safely.')
  }

  if (shellState.isWrapped && stylesheetIndex === -1 && hasStylesheetLink && hasWithPayloadImport) {
    return { content, modified: false, success: true }
  }

  if (stylesheetIndex !== -1) {
    headLinks.links.removeElement(stylesheetIndex)
  }
  if (!hasStylesheetLink) {
    headContentNode.replaceWithText(
      `<link href={${stylesheetImport.localName}} rel="stylesheet" />\n<${headContentImport.localName} />`,
    )
  }
  if (!shellState.isWrapped) {
    shellState.property.setInitializer(`withPayloadRoot(${shellState.componentName})`)
  }
  ensureNamedImport({
    importedName: 'withPayloadRoot',
    moduleSpecifier: PAYLOAD_CLIENT_MODULE,
    sourceFile,
  })
  sourceFile.formatText({ indentSize: 2 })

  return { content: sourceFile.getFullText(), modified: true, success: true }
}

function getStaticObjectPropertyValue({
  object,
  propertyName,
}: {
  object: ObjectLiteralExpression
  propertyName: string
}): string | undefined {
  const property = getPropertyAssignment({ object, propertyName })
  const initializer = property?.getInitializer()

  return Node.isStringLiteral(initializer) ? initializer.getLiteralValue() : undefined
}

function hasValidAppStylesheetLink({
  functionDeclaration,
  headContentLocalName,
  localName,
}: {
  functionDeclaration: FunctionDeclaration
  headContentLocalName: string
  localName: string
}): boolean {
  const links = functionDeclaration
    .getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
    .filter(
      (element) =>
        element.getTagNameNode().getText() === 'link' &&
        getStylesheetAttribute({ name: 'href', element }) === localName &&
        getStylesheetAttribute({ name: 'rel', element }) === 'stylesheet',
    )

  const headContentElements = functionDeclaration
    .getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
    .filter((element) => element.getTagNameNode().getText() === headContentLocalName)

  if (links.length !== 1 || headContentElements.length !== 1) {
    return false
  }

  const link = links[0]!
  const headContent = headContentElements[0]!
  const linkParent = link.getFirstAncestorByKind(SyntaxKind.JsxElement)
  const headContentParent = headContent.getFirstAncestorByKind(SyntaxKind.JsxElement)

  return (
    linkParent?.getStart() === headContentParent?.getStart() &&
    linkParent?.getOpeningElement().getTagNameNode().getText() === 'head' &&
    link.getStart() < headContent.getStart()
  )
}

function validateNamedDestination({
  importedName,
  localName,
  moduleSpecifier,
  sourceFile,
}: {
  importedName: string
  localName: string
  moduleSpecifier: string
  sourceFile: SourceFile
}): { reason: string; success: false } | { success: true } {
  const bindings = getLocalBindings({ localName, sourceFile })
  const binding = bindings[0]
  const isCompatible =
    binding?.kind === 'import' &&
    binding.importKind === 'named' &&
    binding.importedName === importedName &&
    !binding.isTypeOnly &&
    binding.moduleSpecifier === moduleSpecifier

  if (bindings.length > 0 && (bindings.length !== 1 || !isCompatible)) {
    return {
      reason: `Identifier "${localName}" is already bound incompatibly.`,
      success: false,
    }
  }

  return { success: true }
}

function validateRouterOnlyDestinations({
  isAlreadyWrapped,
  sourceFile,
}: {
  isAlreadyWrapped: boolean
  sourceFile: SourceFile
}): { reason: string; success: false } | { success: true } {
  const destinations = [
    {
      importedName: 'withPayloadRoot',
      localName: 'withPayloadRoot',
      moduleSpecifier: PAYLOAD_CLIENT_MODULE,
    },
  ]

  for (const destination of destinations) {
    const validation = validateNamedDestination({ ...destination, sourceFile })
    if (!validation.success) {
      return validation
    }
  }

  for (const localName of ['appCss', 'RootDocument']) {
    const bindings = getLocalBindings({ localName, sourceFile })
    if (bindings.length === 0) {
      continue
    }

    const binding = bindings[0]
    const isCompatible =
      isAlreadyWrapped &&
      bindings.length === 1 &&
      (localName === 'RootDocument'
        ? binding?.kind === 'other'
        : binding?.kind === 'import' &&
          binding.importKind === 'default' &&
          !binding.isTypeOnly &&
          /\.css\?url$/.test(binding.moduleSpecifier))

    if (!isCompatible) {
      return {
        reason: `Identifier "${localName}" is already bound incompatibly.`,
        success: false,
      }
    }
  }

  return { success: true }
}
