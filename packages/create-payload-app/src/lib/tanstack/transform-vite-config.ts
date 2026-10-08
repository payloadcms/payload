import type {
  ArrayLiteralExpression,
  CallExpression,
  Expression,
  ImportDeclaration,
  Node as MorphNode,
  SourceFile,
} from 'ts-morph'

import { Node, Project, QuoteKind, SyntaxKind } from 'ts-morph'

import type { TanStackAppDetails } from '../../types.js'

export type TextTransformResult =
  | { content: string; modified: boolean; success: true }
  | { reason: string; success: false }

type LocalBinding =
  | {
      declaration: ImportDeclaration
      importedName?: string
      importKind: 'default' | 'named' | 'namespace'
      isTypeOnly: boolean
      kind: 'import'
      moduleSpecifier: string
    }
  | { kind: 'other' | 'variable' }

const PAYLOAD_CONFIG_PATH = "path.resolve(__dirname, 'src', 'payload.config.ts')"

export function transformTanStackViteConfig({
  appDetails,
  content,
}: {
  appDetails: TanStackAppDetails
  content: string
}): TextTransformResult {
  const project = new Project({
    manipulationSettings: { quoteKind: QuoteKind.Single },
    useInMemoryFileSystem: true,
  })
  const sourceFile = project.createSourceFile('vite.config.ts', content)
  const defineConfigCalls = sourceFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter((call) => call.getExpression().getText() === 'defineConfig')

  if (defineConfigCalls.length !== 1) {
    return failure('Expected exactly one defineConfig() call.')
  }

  const defineConfigCall = defineConfigCalls[0]!
  if (defineConfigCall.getArguments().length !== 1) {
    return failure('defineConfig() must receive exactly one argument.')
  }

  const configArgument = defineConfigCall.getArguments()[0]

  if (
    Node.isCallExpression(configArgument) &&
    configArgument.getExpression().getText() === 'withPayload'
  ) {
    if (isCompatiblePayloadConfig({ sourceFile, withPayloadCall: configArgument })) {
      return { content, modified: false, success: true }
    }

    return failure('The existing withPayload() call does not match the supported configuration.')
  }

  if (!Node.isObjectLiteralExpression(configArgument)) {
    return failure('defineConfig() must receive an object literal.')
  }

  if (configArgument.getProperties().some(Node.isSpreadAssignment)) {
    return failure('Config object spreads cannot be transformed safely.')
  }

  const pluginsProperties = configArgument
    .getProperties()
    .filter(Node.isPropertyAssignment)
    .filter((property) => property.getName() === 'plugins')
  const pluginsProperty = pluginsProperties[0]
  if (pluginsProperties.length !== 1 || !pluginsProperty) {
    return failure('The Vite config must contain a plugins array.')
  }

  const pluginsArray = pluginsProperty.getInitializer()
  if (!Node.isArrayLiteralExpression(pluginsArray)) {
    return failure('The Vite config must contain a plugins array.')
  }

  if (pluginsArray.getElements().some(Node.isSpreadElement)) {
    return failure('Plugin array spreads cannot be transformed safely.')
  }

  const frameworkImport = getFrameworkImport({ appDetails, sourceFile })
  if (!frameworkImport) {
    return failure('Could not identify the TanStack framework plugin import.')
  }

  const reactPluginName = getDefaultImportLocalName({
    moduleSpecifier: '@vitejs/plugin-react',
    sourceFile,
  })

  if (!reactPluginName) {
    return failure('Could not identify the React plugin import.')
  }

  const pluginCalls = pluginsArray
    .getElements()
    .map((element) =>
      Node.isCallExpression(element)
        ? { name: element.getExpression().getText(), element }
        : { name: undefined, element },
    )
  const frameworkCalls = pluginCalls.filter(({ name }) => name === frameworkImport.localName)
  const reactCalls = pluginCalls.filter(({ name }) => name === reactPluginName)

  if (frameworkCalls.length !== 1) {
    return failure('Expected exactly one TanStack framework plugin call.')
  }

  if (reactCalls.length !== 1) {
    return failure('Expected exactly one React plugin call.')
  }

  const frameworkIndex = pluginCalls.indexOf(frameworkCalls[0]!)
  const reactIndex = pluginCalls.indexOf(reactCalls[0]!)

  if (reactIndex !== frameworkIndex + 1) {
    return failure('Framework and React plugin calls must be adjacent and ordered.')
  }

  const frameworkCall = frameworkCalls[0]!.element
  const reactCall = reactCalls[0]!.element
  if (
    !Node.isCallExpression(frameworkCall) ||
    !Node.isCallExpression(reactCall) ||
    frameworkCall.getArguments().length > 1 ||
    reactCall.getArguments().length > 1
  ) {
    return failure('Framework and React plugin calls must receive at most one argument.')
  }

  const destinationValidation = validateDestinationBindings({ sourceFile })
  if (!destinationValidation.success) {
    return destinationValidation
  }

  replacePluginCalls({
    frameworkCall,
    frameworkIndex,
    pluginsArray,
    preserveFrameworkOptions: appDetails.kind === 'start',
    reactCall,
    reactIndex,
    reactPluginName,
  })

  const transformedConfig = configArgument.getText()
  defineConfigCall.replaceWithText(`defineConfig(
  withPayload(
    ({ pluginOptions }) => (${transformedConfig}),
    {
      payloadConfigPath: ${PAYLOAD_CONFIG_PATH},
      routesDirectory: 'routes',
    },
  ),
)`)

  if (appDetails.kind === 'router-only') {
    removeNamedImport({
      declaration: frameworkImport.declaration,
      importedName: 'tanstackRouter',
    })
  }

  ensureNamedImport({
    importedName: 'withPayload',
    moduleSpecifier: '@payloadcms/tanstack-start',
    sourceFile,
  })
  ensureNamedImport({
    importedName: 'tanstackStart',
    moduleSpecifier: '@tanstack/react-start/plugin/vite',
    sourceFile,
  })
  ensureDefaultImport({
    defaultImport: 'rsc',
    moduleSpecifier: '@vitejs/plugin-rsc',
    sourceFile,
  })
  ensurePathImport(sourceFile)

  if (destinationValidation.shouldAddDirname) {
    ensureNamedImport({
      importedName: 'fileURLToPath',
      moduleSpecifier: 'node:url',
      sourceFile,
    })
    sourceFile.insertStatements(
      sourceFile.getImportDeclarations().length,
      `const __dirname = path.dirname(fileURLToPath(import.meta.url))`,
    )
  }

  sourceFile.formatText({ indentSize: 2 })

  return { content: sourceFile.getFullText(), modified: true, success: true }
}

function ensureDefaultImport({
  defaultImport,
  moduleSpecifier,
  sourceFile,
}: {
  defaultImport: string
  moduleSpecifier: string
  sourceFile: SourceFile
}) {
  const matchingImport = sourceFile
    .getImportDeclarations()
    .find(
      (declaration) =>
        declaration.getModuleSpecifierValue() === moduleSpecifier &&
        declaration.getDefaultImport()?.getText() === defaultImport,
    )

  if (!matchingImport) {
    sourceFile.addImportDeclaration({ defaultImport, moduleSpecifier })
  }
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
  const imports = sourceFile
    .getImportDeclarations()
    .filter((declaration) => declaration.getModuleSpecifierValue() === moduleSpecifier)
  const hasImport = imports.some((declaration) =>
    declaration
      .getNamedImports()
      .some((namedImport) => namedImport.getName() === importedName && !namedImport.getAliasNode()),
  )

  if (hasImport) {
    return
  }

  const extensibleImport = imports.find((declaration) => !declaration.getNamespaceImport())
  if (extensibleImport) {
    extensibleImport.addNamedImport(importedName)
  } else {
    sourceFile.addImportDeclaration({ moduleSpecifier, namedImports: [importedName] })
  }
}

function ensurePathImport(sourceFile: SourceFile) {
  const hasCompatibleImport = sourceFile.getImportDeclarations().some((declaration) => {
    if (declaration.getModuleSpecifierValue() !== 'node:path') {
      return false
    }

    return (
      declaration.getDefaultImport()?.getText() === 'path' ||
      declaration.getNamespaceImport()?.getText() === 'path'
    )
  })

  if (!hasCompatibleImport) {
    sourceFile.addImportDeclaration({ defaultImport: 'path', moduleSpecifier: 'node:path' })
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
        declaration,
        importKind: 'default',
        isTypeOnly: declaration.isTypeOnly(),
        kind: 'import',
        moduleSpecifier,
      })
    }

    const namespaceImport = declaration.getNamespaceImport()
    if (namespaceImport?.getText() === localName) {
      bindings.push({
        declaration,
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
          declaration,
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

function getNamedPluginCalls({
  elements,
  localName,
}: {
  elements: Expression[]
  localName: string
}): CallExpression[] {
  return elements.filter(
    (element): element is CallExpression =>
      Node.isCallExpression(element) && element.getExpression().getText() === localName,
  )
}

function hasCompatibleDirnameBinding(sourceFile: SourceFile): boolean {
  const bindings = getLocalBindings({ localName: '__dirname', sourceFile })

  return bindings.length === 1 && bindings[0]?.kind === 'variable'
}

function hasOnlyCompatibleBinding({
  localName,
  predicate,
  sourceFile,
}: {
  localName: string
  predicate: (binding: LocalBinding) => boolean
  sourceFile: SourceFile
}): boolean {
  const bindings = getLocalBindings({ localName, sourceFile })

  return bindings.length === 1 && predicate(bindings[0]!)
}

function isCompatiblePathBinding(binding: LocalBinding): boolean {
  return (
    binding.kind === 'import' &&
    !binding.isTypeOnly &&
    binding.moduleSpecifier === 'node:path' &&
    (binding.importKind === 'default' || binding.importKind === 'namespace')
  )
}

function isExactPluginCall({
  call,
  expectedArgument,
}: {
  call: CallExpression
  expectedArgument: string
}): boolean {
  return call.getArguments().length === 1 && call.getArguments()[0]?.getText() === expectedArgument
}

function isMergedPluginCall({
  call,
  expectedArgument,
}: {
  call: CallExpression
  expectedArgument: string
}): boolean {
  if (isExactPluginCall({ call, expectedArgument })) {
    return true
  }

  const argument = call.getArguments()[0]
  if (call.getArguments().length !== 1 || !Node.isObjectLiteralExpression(argument)) {
    return false
  }

  const firstProperty = argument.getProperties()[0]
  return (
    Node.isSpreadAssignment(firstProperty) &&
    firstProperty.getExpression().getText() === expectedArgument
  )
}

function isImportBinding({
  binding,
  importedName,
  importKind,
  moduleSpecifier,
}: {
  binding: LocalBinding
  importedName?: string
  importKind: 'default' | 'named' | 'namespace'
  moduleSpecifier: string
}): boolean {
  return (
    binding.kind === 'import' &&
    !binding.isTypeOnly &&
    binding.importKind === importKind &&
    binding.moduleSpecifier === moduleSpecifier &&
    (importedName === undefined || binding.importedName === importedName)
  )
}

function validateDestinationBindings({
  sourceFile,
}: {
  sourceFile: SourceFile
}): { reason: string; success: false } | { shouldAddDirname: boolean; success: true } {
  const destinations: Array<{
    localName: string
    predicate: (binding: LocalBinding) => boolean
  }> = [
    {
      localName: 'withPayload',
      predicate: (binding) =>
        isImportBinding({
          binding,
          importedName: 'withPayload',
          importKind: 'named',
          moduleSpecifier: '@payloadcms/tanstack-start',
        }),
    },
    {
      localName: 'tanstackStart',
      predicate: (binding) =>
        isImportBinding({
          binding,
          importedName: 'tanstackStart',
          importKind: 'named',
          moduleSpecifier: '@tanstack/react-start/plugin/vite',
        }),
    },
    {
      localName: 'rsc',
      predicate: (binding) =>
        isImportBinding({
          binding,
          importKind: 'default',
          moduleSpecifier: '@vitejs/plugin-rsc',
        }),
    },
    { localName: 'path', predicate: isCompatiblePathBinding },
  ]

  for (const destination of destinations) {
    const bindings = getLocalBindings({ localName: destination.localName, sourceFile })
    if (bindings.length > 0 && (bindings.length !== 1 || !destination.predicate(bindings[0]!))) {
      return {
        reason: `Identifier "${destination.localName}" is already bound incompatibly.`,
        success: false,
      }
    }
  }

  const dirnameBindings = getLocalBindings({ localName: '__dirname', sourceFile })
  if (
    dirnameBindings.length > 0 &&
    (dirnameBindings.length !== 1 || dirnameBindings[0]?.kind !== 'variable')
  ) {
    return { reason: 'Identifier "__dirname" is already bound incompatibly.', success: false }
  }

  const shouldAddDirname = dirnameBindings.length === 0
  if (shouldAddDirname) {
    const fileURLToPathBindings = getLocalBindings({ localName: 'fileURLToPath', sourceFile })
    if (
      fileURLToPathBindings.length > 0 &&
      (fileURLToPathBindings.length !== 1 ||
        !isImportBinding({
          binding: fileURLToPathBindings[0]!,
          importedName: 'fileURLToPath',
          importKind: 'named',
          moduleSpecifier: 'node:url',
        }))
    ) {
      return {
        reason: 'Identifier "fileURLToPath" is already bound incompatibly.',
        success: false,
      }
    }
  }

  return { shouldAddDirname, success: true }
}

function getDefaultImportLocalName({
  moduleSpecifier,
  sourceFile,
}: {
  moduleSpecifier: string
  sourceFile: SourceFile
}): string | undefined {
  const imports = sourceFile
    .getImportDeclarations()
    .filter((declaration) => declaration.getModuleSpecifierValue() === moduleSpecifier)
    .map((declaration) => declaration.getDefaultImport()?.getText())
    .filter((name): name is string => Boolean(name))

  if (imports.length !== 1) {
    return undefined
  }

  const localName = imports[0]!
  return hasOnlyCompatibleBinding({
    localName,
    predicate: (binding) => isImportBinding({ binding, importKind: 'default', moduleSpecifier }),
    sourceFile,
  })
    ? localName
    : undefined
}

function getFrameworkImport({
  appDetails,
  sourceFile,
}: {
  appDetails: TanStackAppDetails
  sourceFile: SourceFile
}): { declaration: ImportDeclaration; localName: string } | undefined {
  const importedName = appDetails.kind === 'start' ? 'tanstackStart' : 'tanstackRouter'
  const moduleSpecifier =
    appDetails.kind === 'start'
      ? '@tanstack/react-start/plugin/vite'
      : '@tanstack/router-plugin/vite'

  for (const declaration of sourceFile.getImportDeclarations()) {
    if (declaration.getModuleSpecifierValue() !== moduleSpecifier) {
      continue
    }

    const namedImport = declaration
      .getNamedImports()
      .find((specifier) => specifier.getName() === importedName)

    if (namedImport) {
      return {
        declaration,
        localName: namedImport.getAliasNode()?.getText() ?? namedImport.getName(),
      }
    }
  }
}

function isCompatiblePayloadConfig({
  sourceFile,
  withPayloadCall,
}: {
  sourceFile: SourceFile
  withPayloadCall: CallExpression
}): boolean {
  if (
    withPayloadCall.getArguments().length !== 2 ||
    !hasOnlyCompatibleBinding({
      localName: 'withPayload',
      predicate: (binding) =>
        isImportBinding({
          binding,
          importedName: 'withPayload',
          importKind: 'named',
          moduleSpecifier: '@payloadcms/tanstack-start',
        }),
      sourceFile,
    })
  ) {
    return false
  }

  const [callback, options] = withPayloadCall.getArguments()

  if (!Node.isArrowFunction(callback) || !Node.isObjectLiteralExpression(options)) {
    return false
  }

  const callbackParameters = callback.getParameters()
  const callbackParameter = callbackParameters[0]
  const callbackBinding = callbackParameter?.getNameNode()
  if (
    callbackParameters.length !== 1 ||
    !callbackParameter ||
    !Node.isObjectBindingPattern(callbackBinding) ||
    callbackBinding.getElements().length !== 1 ||
    callbackBinding.getElements()[0]?.getName() !== 'pluginOptions' ||
    callbackBinding.getElements()[0]?.getPropertyNameNode() ||
    callbackBinding.getElements()[0]?.getInitializer() ||
    callbackBinding.getElements()[0]?.getDotDotDotToken()
  ) {
    return false
  }

  const callbackBody = callback.getBody()
  const configObject = Node.isParenthesizedExpression(callbackBody)
    ? callbackBody.getExpression()
    : callbackBody

  if (!Node.isObjectLiteralExpression(configObject)) {
    return false
  }

  if (configObject.getProperties().some(Node.isSpreadAssignment)) {
    return false
  }

  const pluginsProperties = configObject
    .getProperties()
    .filter(Node.isPropertyAssignment)
    .filter((property) => property.getName() === 'plugins')
  const pluginsArray = pluginsProperties[0]?.getInitializer()

  if (
    pluginsProperties.length !== 1 ||
    !Node.isArrayLiteralExpression(pluginsArray) ||
    pluginsArray.getElements().some(Node.isSpreadElement)
  ) {
    return false
  }

  const reactPluginName = getDefaultImportLocalName({
    moduleSpecifier: '@vitejs/plugin-react',
    sourceFile,
  })
  if (
    !reactPluginName ||
    !hasOnlyCompatibleBinding({
      localName: 'rsc',
      predicate: (binding) =>
        isImportBinding({
          binding,
          importKind: 'default',
          moduleSpecifier: '@vitejs/plugin-rsc',
        }),
      sourceFile,
    }) ||
    !hasOnlyCompatibleBinding({
      localName: 'tanstackStart',
      predicate: (binding) =>
        isImportBinding({
          binding,
          importedName: 'tanstackStart',
          importKind: 'named',
          moduleSpecifier: '@tanstack/react-start/plugin/vite',
        }),
      sourceFile,
    }) ||
    !hasOnlyCompatibleBinding({
      localName: 'path',
      predicate: isCompatiblePathBinding,
      sourceFile,
    }) ||
    !hasCompatibleDirnameBinding(sourceFile)
  ) {
    return false
  }

  const dirnameInitializer = sourceFile
    .getVariableDeclaration('__dirname')
    ?.getInitializer()
    ?.getText()
  if (
    dirnameInitializer === 'path.dirname(fileURLToPath(import.meta.url))' &&
    !hasOnlyCompatibleBinding({
      localName: 'fileURLToPath',
      predicate: (binding) =>
        isImportBinding({
          binding,
          importedName: 'fileURLToPath',
          importKind: 'named',
          moduleSpecifier: 'node:url',
        }),
      sourceFile,
    })
  ) {
    return false
  }

  const elements = pluginsArray.getElements()
  const rscCalls = getNamedPluginCalls({ elements, localName: 'rsc' })
  const frameworkCalls = getNamedPluginCalls({ elements, localName: 'tanstackStart' })
  const reactCalls = getNamedPluginCalls({ elements, localName: reactPluginName })

  if (
    rscCalls.length !== 1 ||
    frameworkCalls.length !== 1 ||
    reactCalls.length !== 1 ||
    !isExactPluginCall({ call: rscCalls[0]!, expectedArgument: 'pluginOptions.rsc' }) ||
    !isMergedPluginCall({
      call: frameworkCalls[0]!,
      expectedArgument: 'pluginOptions.tanstackStart',
    }) ||
    !isMergedPluginCall({ call: reactCalls[0]!, expectedArgument: 'pluginOptions.react' })
  ) {
    return false
  }

  const rscIndex = elements.indexOf(rscCalls[0]!)
  const frameworkIndex = elements.indexOf(frameworkCalls[0]!)
  const reactIndex = elements.indexOf(reactCalls[0]!)
  if (frameworkIndex !== rscIndex + 1 || reactIndex !== frameworkIndex + 1) {
    return false
  }

  const optionProperties = options.getProperties().filter(Node.isPropertyAssignment)
  if (optionProperties.length !== 2 || options.getProperties().length !== 2) {
    return false
  }

  const payloadConfigPath = optionProperties.find(
    (property) => property.getName() === 'payloadConfigPath',
  )
  const routesDirectory = optionProperties.find(
    (property) => property.getName() === 'routesDirectory',
  )
  const routesDirectoryInitializer = routesDirectory?.getInitializer()

  return (
    payloadConfigPath?.getInitializer()?.getText() === PAYLOAD_CONFIG_PATH &&
    Node.isStringLiteral(routesDirectoryInitializer) &&
    routesDirectoryInitializer.getLiteralValue() === 'routes'
  )
}

function removeNamedImport({
  declaration,
  importedName,
}: {
  declaration: ImportDeclaration
  importedName: string
}) {
  const namedImport = declaration
    .getNamedImports()
    .find((specifier) => specifier.getName() === importedName)

  namedImport?.remove()

  if (
    declaration.getNamedImports().length === 0 &&
    !declaration.getDefaultImport() &&
    !declaration.getNamespaceImport()
  ) {
    declaration.remove()
  }
}

function replacePluginCalls({
  frameworkCall,
  frameworkIndex,
  pluginsArray,
  preserveFrameworkOptions,
  reactCall,
  reactIndex,
  reactPluginName,
}: {
  frameworkCall: CallExpression
  frameworkIndex: number
  pluginsArray: ArrayLiteralExpression
  preserveFrameworkOptions: boolean
  reactCall: CallExpression
  reactIndex: number
  reactPluginName: string
}) {
  const retainedPlugins = pluginsArray
    .getElements()
    .filter((_, index) => index !== frameworkIndex && index !== reactIndex)
    .map((element) => element.getText())
  const insertionIndex = Math.min(frameworkIndex, reactIndex)

  retainedPlugins.splice(
    insertionIndex,
    0,
    'rsc(pluginOptions.rsc)',
    getPluginCallWithMergedOptions({
      call: frameworkCall,
      localName: 'tanstackStart',
      pluginOptions: 'pluginOptions.tanstackStart',
      shouldPreserveOptions: preserveFrameworkOptions,
    }),
    getPluginCallWithMergedOptions({
      call: reactCall,
      localName: reactPluginName,
      pluginOptions: 'pluginOptions.react',
      shouldPreserveOptions: true,
    }),
  )

  pluginsArray.replaceWithText(`[${retainedPlugins.join(', ')}]`)
}

function getPluginCallWithMergedOptions({
  call,
  localName,
  pluginOptions,
  shouldPreserveOptions,
}: {
  call: CallExpression
  localName: string
  pluginOptions: string
  shouldPreserveOptions: boolean
}): string {
  const existingOptions = shouldPreserveOptions ? call.getArguments()[0] : undefined
  if (!existingOptions) {
    return `${localName}(${pluginOptions})`
  }

  if (Node.isObjectLiteralExpression(existingOptions)) {
    const properties = existingOptions.getText().slice(1, -1).trim()
    return `${localName}({ ...${pluginOptions}${properties ? `, ${properties}` : ''} })`
  }

  return `${localName}({ ...${pluginOptions}, ...(${existingOptions.getText()}) })`
}
