import type {
  ArrayLiteralExpression,
  CallExpression,
  ImportDeclaration,
  SourceFile,
} from 'ts-morph'

import { Node, Project, QuoteKind, SyntaxKind } from 'ts-morph'

import type { TanStackAppDetails } from '../../types.js'

export type TextTransformResult =
  | { content: string; modified: boolean; success: true }
  | { reason: string; success: false }

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
  const configArgument = defineConfigCall.getArguments()[0]

  if (
    Node.isCallExpression(configArgument) &&
    configArgument.getExpression().getText() === 'withPayload'
  ) {
    if (isCompatiblePayloadConfig(configArgument)) {
      return { content, modified: false, success: true }
    }

    return failure('The existing withPayload() call does not match the supported configuration.')
  }

  if (!Node.isObjectLiteralExpression(configArgument)) {
    return failure('defineConfig() must receive an object literal.')
  }

  const pluginsProperty = configArgument.getProperty('plugins')
  if (!Node.isPropertyAssignment(pluginsProperty)) {
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

  const reactImport = sourceFile
    .getImportDeclarations()
    .find((declaration) => declaration.getModuleSpecifierValue() === '@vitejs/plugin-react')
  const reactPluginName = reactImport?.getDefaultImport()?.getText()

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

  replacePluginCalls({
    frameworkIndex,
    pluginsArray,
    reactIndex,
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
  ensureDefaultImport({ defaultImport: 'path', moduleSpecifier: 'node:path', sourceFile })

  if (!hasDirnameDeclaration(sourceFile)) {
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

function failure(reason: string): TextTransformResult {
  return { reason, success: false }
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

function hasDirnameDeclaration(sourceFile: SourceFile): boolean {
  return sourceFile
    .getDescendantsOfKind(SyntaxKind.VariableDeclaration)
    .some((declaration) => declaration.getName() === '__dirname')
}

function isCompatiblePayloadConfig(withPayloadCall: CallExpression): boolean {
  const [callback, options] = withPayloadCall.getArguments()

  if (!Node.isArrowFunction(callback) || !Node.isObjectLiteralExpression(options)) {
    return false
  }

  const callbackParameter = callback.getParameters()[0]
  if (
    callback.getParameters().length !== 1 ||
    !callbackParameter ||
    callbackParameter.getNameNode().getText() !== '{ pluginOptions }'
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

  const pluginsProperty = configObject.getProperty('plugins')
  const pluginsArray = Node.isPropertyAssignment(pluginsProperty)
    ? pluginsProperty.getInitializer()
    : undefined

  if (!Node.isArrayLiteralExpression(pluginsArray)) {
    return false
  }

  const requiredCalls = new Map([
    ['rsc', 'pluginOptions.rsc'],
    ['tanstackStart', 'pluginOptions.tanstackStart'],
    ['viteReact', 'pluginOptions.react'],
  ])

  for (const element of pluginsArray.getElements()) {
    if (!Node.isCallExpression(element)) {
      continue
    }

    const expectedArgument = requiredCalls.get(element.getExpression().getText())
    if (expectedArgument && element.getArguments()[0]?.getText() === expectedArgument) {
      requiredCalls.delete(element.getExpression().getText())
    }
  }

  if (requiredCalls.size > 0) {
    return false
  }

  const payloadConfigPath = options.getProperty('payloadConfigPath')
  const routesDirectory = options.getProperty('routesDirectory')

  return (
    Node.isPropertyAssignment(payloadConfigPath) &&
    payloadConfigPath.getInitializer()?.getText() === PAYLOAD_CONFIG_PATH &&
    Node.isPropertyAssignment(routesDirectory) &&
    routesDirectory.getInitializer()?.getText() === "'routes'"
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
  frameworkIndex,
  pluginsArray,
  reactIndex,
}: {
  frameworkIndex: number
  pluginsArray: ArrayLiteralExpression
  reactIndex: number
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
    'tanstackStart(pluginOptions.tanstackStart)',
    'viteReact(pluginOptions.react)',
  )

  pluginsArray.replaceWithText(`[${retainedPlugins.join(', ')}]`)
}
