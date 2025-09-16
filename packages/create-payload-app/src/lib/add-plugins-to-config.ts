import { Project, QuoteKind, SyntaxKind } from 'ts-morph'

import type { PluginPackageName } from './ast-replacements.js'

import { pluginReplacements } from './ast-replacements.js'

export async function addPluginsToConfig({
  configPath,
  plugins,
  saveConfig = true,
}: {
  configPath: string
  plugins: PluginPackageName[]
  /** Save modifications to the config. Set to false for unit testing */
  saveConfig?: boolean
}) {
  const project = new Project({
    manipulationSettings: {
      quoteKind: QuoteKind.Single,
    },
  })

  project.addSourceFilesAtPaths(configPath)
  const sourceFile = project.getSourceFileOrThrow(configPath)

  // Find the default export assignment
  const exportAssignment = sourceFile.getExportAssignmentOrThrow(
    (e) => e.isExportEquals() === false,
  )

  // Get the buildConfig call expression
  const buildConfigCall = exportAssignment.getExpressionIfKindOrThrow(SyntaxKind.CallExpression)

  // Get the first argument of buildConfig, which should be an object literal
  const configObject = buildConfigCall
    ?.getArguments?.()?.[0]
    ?.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)

  // Find the plugins property on the config object
  const pluginsProperty = configObject?.getPropertyOrThrow('plugins')

  const pluginsArray = pluginsProperty
    ?.asKindOrThrow(SyntaxKind.PropertyAssignment)
    ?.getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression)

  const pluginsToAdd = plugins.map((name) => pluginReplacements[name]).filter(Boolean)

  pluginsToAdd.forEach((plugin) => {
    console.log(`Adding plugin: ${plugin.packageName}`)
    pluginsArray?.addElement(plugin.pluginCode.join('\n')) // Questionable

    sourceFile.addImportDeclaration({
      moduleSpecifier: plugin.importModule,
      namedImports: [plugin.importName],
    })
  })

  // Save changes
  if (saveConfig) {
    await project.save()
  }

  console.log('Project changes saved.')

  // TODO: Add plugin packages to package.json

  return { configContent: sourceFile.getFullText() }
}
