import { execSync } from 'child_process'
import path from 'path'
import { Project, QuoteKind, type SourceFile, SyntaxKind } from 'ts-morph'

import type {
  ConfigureOptions,
  DatabaseAdapter,
  DetectionResult,
  Modification,
  StorageAdapter,
  TransformationResult,
  WriteOptions,
  WriteResult,
} from './types.js'

import { debug } from '../../utils/log.js'
import { DB_ADAPTER_CONFIG, STORAGE_ADAPTER_CONFIG } from './adapter-config.js'
import {
  addImportDeclaration,
  cleanupOrphanedImports,
  formatError,
  removeImportDeclaration,
} from './utils.js'

export function detectPayloadConfigStructure(sourceFile: SourceFile): DetectionResult {
  debug(`[AST] Detecting payload config structure in ${sourceFile.getFilePath()}`)

  // First find the actual name being used (might be aliased)
  const payloadImport = sourceFile
    .getImportDeclarations()
    .find((imp) => imp.getModuleSpecifierValue() === 'payload')

  const buildConfigImportSpec = payloadImport
    ?.getNamedImports()
    .find((spec) => spec.getName() === 'buildConfig')

  const aliasNode = buildConfigImportSpec?.getAliasNode()
  const buildConfigName = aliasNode ? aliasNode.getText() : 'buildConfig'

  debug(`[AST] Looking for function call: ${buildConfigName}`)

  // Find buildConfig call expression (using actual name in code)
  const buildConfigCall = sourceFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .find((call) => {
      const expression = call.getExpression()
      return expression.getText() === buildConfigName
    })

  if (!buildConfigCall) {
    debug(`[AST] ✗ ${buildConfigName} call not found`)
    return {
      error: formatError({
        actual: `No ${buildConfigName} call found in file`,
        context: 'buildConfig call',
        expected: `export default ${buildConfigName}({ ... })`,
        technicalDetails: `Could not find CallExpression with identifier "${buildConfigName}"`,
      }),
      success: false,
    }
  }

  debug(`[AST] ✓ ${buildConfigName} call found`)

  // Get import statements
  const importStatements = sourceFile.getImportDeclarations()
  debug(`[AST] Found ${importStatements.length} import statements`)

  // Find db property if it exists
  const configObject = buildConfigCall.getArguments()[0]
  let dbProperty
  if (configObject && configObject.getKind() === SyntaxKind.ObjectLiteralExpression) {
    dbProperty = configObject
      .asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
      .getProperty('db')
      ?.asKind(SyntaxKind.PropertyAssignment)
  }

  debug(`[AST] db property: ${dbProperty ? '✓ found' : '✗ not found'}`)

  // Find plugins array if it exists
  let pluginsArray
  if (configObject && configObject.getKind() === SyntaxKind.ObjectLiteralExpression) {
    const objLiteral = configObject.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
    const pluginsProperty = objLiteral.getProperty('plugins')

    // Handle PropertyAssignment (e.g., plugins: [...])
    const propertyAssignment = pluginsProperty?.asKind(SyntaxKind.PropertyAssignment)
    if (propertyAssignment) {
      const initializer = propertyAssignment.getInitializer()
      if (initializer?.getKind() === SyntaxKind.ArrayLiteralExpression) {
        pluginsArray = initializer.asKind(SyntaxKind.ArrayLiteralExpression)
      }
    }
    // For ShorthandPropertyAssignment (e.g., plugins), we can't get the array directly
    // but we'll detect it in addStorageAdapter
  }

  debug(`[AST] plugins array: ${pluginsArray ? '✓ found' : '✗ not found'}`)

  // Find all buildConfig calls for edge case detection (using actual name)
  const allBuildConfigCalls = sourceFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter((call) => {
      const expression = call.getExpression()
      return expression.getText() === buildConfigName
    })

  const hasImportAlias = !!aliasNode

  // Check for other Payload imports
  const payloadImports = payloadImport?.getNamedImports() || []
  const hasOtherPayloadImports =
    payloadImports.length > 1 || payloadImports.some((imp) => imp.getName() !== 'buildConfig')

  // Track database adapter imports
  let dbAdapterImportInfo
  for (const [, config] of Object.entries(DB_ADAPTER_CONFIG)) {
    const importDecl = sourceFile
      .getImportDeclarations()
      .find((imp) => imp.getModuleSpecifierValue() === config.packageName)

    if (importDecl) {
      const namedImports = importDecl.getNamedImports()
      dbAdapterImportInfo = {
        hasOtherImports: namedImports.length > 1,
        importDeclaration: importDecl,
        packageName: config.packageName,
      }
      break
    }
  }

  // Track storage adapter imports
  const storageAdapterImports = []
  for (const [, config] of Object.entries(STORAGE_ADAPTER_CONFIG)) {
    if (!config.packageName || !config.adapterName) {
      continue
    }

    const importDecl = sourceFile
      .getImportDeclarations()
      .find((imp) => imp.getModuleSpecifierValue() === config.packageName)

    if (importDecl) {
      const namedImports = importDecl.getNamedImports()
      storageAdapterImports.push({
        hasOtherImports: namedImports.length > 1,
        importDeclaration: importDecl,
        packageName: config.packageName,
      })
    }
  }

  const needsManualIntervention = hasImportAlias || allBuildConfigCalls.length > 2

  debug(
    `[AST] Edge cases: alias=${hasImportAlias}, multiple=${allBuildConfigCalls.length > 1}, otherImports=${hasOtherPayloadImports}, manual=${needsManualIntervention}`,
  )

  return {
    edgeCases: {
      hasImportAlias,
      hasOtherPayloadImports,
      multipleBuildConfigCalls: allBuildConfigCalls.length > 1,
      needsManualIntervention,
    },
    importSources: {
      dbAdapter: dbAdapterImportInfo,
      storageAdapters: storageAdapterImports.length > 0 ? storageAdapterImports : undefined,
    },
    sourceFile,
    structures: {
      buildConfigCall,
      dbProperty,
      importStatements,
      pluginsArray,
    },
    success: true,
  }
}

export function addDatabaseAdapter({
  adapter,
  envVarName = 'DATABASE_URL',
  sourceFile,
}: {
  adapter: DatabaseAdapter
  envVarName?: string
  sourceFile: SourceFile
}): TransformationResult {
  debug(`[AST] Adding database adapter: ${adapter} (envVar: ${envVarName})`)

  const modifications: Modification[] = []

  const detection = detectPayloadConfigStructure(sourceFile)

  if (!detection.success || !detection.structures) {
    return {
      error: detection.error,
      modifications: [],
      modified: false,
      success: false,
    }
  }

  const { buildConfigCall, dbProperty } = detection.structures
  const config = DB_ADAPTER_CONFIG[adapter]

  // Remove old db adapter imports and track position for replacement
  const oldAdapters = Object.values(DB_ADAPTER_CONFIG)
  const removedAdapters: string[] = []
  let importInsertIndex: number | undefined
  oldAdapters.forEach((oldConfig) => {
    if (oldConfig.packageName !== config.packageName) {
      const { removedIndex } = removeImportDeclaration({
        moduleSpecifier: oldConfig.packageName,
        sourceFile,
      })
      if (removedIndex !== undefined) {
        // Use the first removed adapter's position
        if (importInsertIndex === undefined) {
          importInsertIndex = removedIndex
        }
        removedAdapters.push(oldConfig.packageName)
        modifications.push({
          type: 'import-removed',
          description: `Removed import from '${oldConfig.packageName}'`,
        })
      }
    }
  })

  if (removedAdapters.length > 0) {
    debug(`[AST] Removed old adapter imports: ${removedAdapters.join(', ')}`)
  }

  // Add new import at the position of the removed one (or default position)
  addImportDeclaration({
    insertIndex: importInsertIndex,
    moduleSpecifier: config.packageName,
    namedImports: [config.adapterName],
    sourceFile,
  })
  modifications.push({
    type: 'import-added',
    description: `Added import: { ${config.adapterName} } from '${config.packageName}'`,
  })

  // Add special imports for specific adapters
  if (adapter === 'd1-sqlite') {
    debug('[AST] Adding special import: ./db/migrations')
    addImportDeclaration({
      defaultImport: 'migrations',
      moduleSpecifier: './db/migrations',
      sourceFile,
    })
    modifications.push({
      type: 'import-added',
      description: `Added import: migrations from './db/migrations'`,
    })
  }

  // Get config object
  const configObject = buildConfigCall.getArguments()[0]
  if (!configObject || configObject.getKind() !== SyntaxKind.ObjectLiteralExpression) {
    return {
      error: formatError({
        actual: 'buildConfig has no object literal argument',
        context: 'database adapter configuration',
        expected: 'buildConfig({ ... })',
        technicalDetails: 'buildConfig call must have an object literal as first argument',
      }),
      modifications: [],
      modified: false,
      success: false,
    }
  }

  const objLiteral = configObject.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)

  const newDbCode = `db: ${config.configTemplate(envVarName)}`

  if (dbProperty) {
    // Replace existing db property
    // NOTE: Using replaceWithText() instead of remove() + insertPropertyAssignment()
    // to avoid double comma issues. When remove() is called, ts-morph doesn't always
    // clean up trailing commas correctly, which can result in syntax like "},," when
    // inserting a new property at that position. replaceWithText() preserves the
    // surrounding punctuation correctly.
    debug(`[AST] Replacing existing db property`)
    dbProperty.replaceWithText(newDbCode)
    modifications.push({
      type: 'property-added',
      description: `Replaced db property with ${adapter} adapter`,
    })
  } else {
    // No existing db property - insert at end
    const insertIndex = objLiteral.getProperties().length
    debug(`[AST] Adding db property at index ${insertIndex}`)
    objLiteral.insertPropertyAssignment(insertIndex, {
      name: 'db',
      initializer: config.configTemplate(envVarName),
    })
    modifications.push({
      type: 'property-added',
      description: `Added db property with ${adapter} adapter`,
    })
  }

  debug(`[AST] ✓ Database adapter ${adapter} added successfully`)

  return {
    modifications,
    modified: true,
    success: true,
  }
}

export function addStorageAdapter({
  adapter,
  sourceFile,
}: {
  adapter: StorageAdapter
  sourceFile: SourceFile
}): TransformationResult {
  debug(`[AST] Adding storage adapter: ${adapter}`)

  const modifications: Modification[] = []

  const detection = detectPayloadConfigStructure(sourceFile)

  if (!detection.success || !detection.structures) {
    return {
      error: detection.error,
      modifications: [],
      modified: false,
      success: false,
    }
  }

  const config = STORAGE_ADAPTER_CONFIG[adapter]

  // Local disk doesn't need any imports or plugins
  if (adapter === 'localDisk') {
    debug('[AST] localDisk storage adapter - no imports or plugins needed')
    return {
      modifications: [],
      modified: false,
      success: true,
    }
  }

  // Add import
  if (config.packageName && config.adapterName) {
    addImportDeclaration({
      moduleSpecifier: config.packageName,
      namedImports: [config.adapterName],
      sourceFile,
    })
    modifications.push({
      type: 'import-added',
      description: `Added import: { ${config.adapterName} } from '${config.packageName}'`,
    })
  }

  const { buildConfigCall } = detection.structures
  const configObject = buildConfigCall.getArguments()[0]

  if (!configObject || configObject.getKind() !== SyntaxKind.ObjectLiteralExpression) {
    return {
      error: formatError({
        actual: 'buildConfig has no object literal argument',
        context: 'storage adapter configuration',
        expected: 'buildConfig({ ... })',
        technicalDetails: 'buildConfig call must have an object literal as first argument',
      }),
      modifications: [],
      modified: false,
      success: false,
    }
  }

  const objLiteral = configObject.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)

  // Find or create plugins array
  const pluginsPropertyRaw = objLiteral.getProperty('plugins')
  let pluginsProperty = pluginsPropertyRaw?.asKind(SyntaxKind.PropertyAssignment)

  // Check if it's a shorthand property (e.g., `plugins` referencing an imported variable)
  const shorthandProperty = pluginsPropertyRaw?.asKind(SyntaxKind.ShorthandPropertyAssignment)

  if (shorthandProperty) {
    debug('[AST] Found shorthand plugins property, converting to long form with spread')
    // Get the identifier name (usually 'plugins')
    const identifierName = shorthandProperty.getName()

    // Find insert position before removing
    const allProperties = objLiteral.getProperties()
    const insertIndex = allProperties.indexOf(shorthandProperty)

    // Remove the shorthand property
    shorthandProperty.remove()

    // Create new property with spread operator: plugins: [...plugins, newAdapter]
    objLiteral.insertPropertyAssignment(insertIndex, {
      name: 'plugins',
      initializer: `[...${identifierName}]`,
    })

    pluginsProperty = objLiteral.getProperty('plugins')?.asKind(SyntaxKind.PropertyAssignment)
    modifications.push({
      type: 'property-added',
      description: `Converted shorthand plugins property to array with spread syntax`,
    })
  } else if (!pluginsProperty) {
    debug('[AST] Creating new plugins array')
    // Create plugins array
    objLiteral.addPropertyAssignment({
      name: 'plugins',
      initializer: '[]',
    })
    pluginsProperty = objLiteral.getProperty('plugins')?.asKind(SyntaxKind.PropertyAssignment)
    modifications.push({
      type: 'property-added',
      description: `Created plugins array`,
    })
  } else {
    debug('[AST] Reusing existing plugins array')
  }

  if (!pluginsProperty) {
    return {
      error: formatError({
        actual: 'Failed to create or find plugins property',
        context: 'storage adapter configuration',
        expected: 'plugins array property',
        technicalDetails: 'Could not create or access plugins property',
      }),
      modifications: [],
      modified: false,
      success: false,
    }
  }

  const initializer = pluginsProperty.getInitializer()
  if (!initializer || initializer.getKind() !== SyntaxKind.ArrayLiteralExpression) {
    return {
      error: formatError({
        actual: 'plugins property is not an array',
        context: 'storage adapter configuration',
        expected: 'plugins: [...]',
        technicalDetails: 'plugins property must be an array literal expression',
      }),
      modifications: [],
      modified: false,
      success: false,
    }
  }

  const pluginsArray = initializer.asKindOrThrow(SyntaxKind.ArrayLiteralExpression)

  // Add storage adapter call
  const configText = config.configTemplate()
  if (configText) {
    pluginsArray.addElement(configText)
    modifications.push({
      type: 'property-added',
      description: `Added ${adapter} to plugins array`,
    })
  }

  debug(`[AST] ✓ Storage adapter ${adapter} added successfully`)

  return {
    modifications,
    modified: true,
    success: true,
  }
}

export function removeSharp(sourceFile: SourceFile): TransformationResult {
  debug('[AST] Removing sharp import and property')

  const modifications: Modification[] = []

  // Remove import
  const { removedIndex } = removeImportDeclaration({ moduleSpecifier: 'sharp', sourceFile })
  if (removedIndex !== undefined) {
    modifications.push({
      type: 'import-removed',
      description: `Removed import from 'sharp'`,
    })
  }

  // Find and remove sharp property from buildConfig
  const detection = detectPayloadConfigStructure(sourceFile)

  if (!detection.success || !detection.structures) {
    // If detection failed but we removed import, still count as partial success
    if (modifications.length > 0) {
      return {
        modifications,
        modified: true,
        success: true,
        warnings: ['Could not detect config structure to remove sharp property'],
      }
    }
    return {
      error: detection.error,
      modifications: [],
      modified: false,
      success: false,
    }
  }

  const { buildConfigCall } = detection.structures
  const configObject = buildConfigCall.getArguments()[0]

  if (!configObject || configObject.getKind() !== SyntaxKind.ObjectLiteralExpression) {
    return {
      modifications,
      modified: modifications.length > 0,
      success: true,
      warnings: ['buildConfig has no object literal argument - could not remove sharp property'],
    }
  }

  const objLiteral = configObject.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
  const sharpProperty = objLiteral.getProperty('sharp')

  if (sharpProperty) {
    sharpProperty.remove()
    modifications.push({
      type: 'property-removed',
      description: `Removed sharp property from config`,
    })
    debug('[AST] ✓ Sharp property removed from config')
  } else {
    debug('[AST] Sharp property not found (already absent)')
  }

  return {
    modifications,
    modified: modifications.length > 0,
    success: true,
  }
}

/** This shouldn't be necessary once the templates are updated. Can't hurt to keep in, though */
export function removeCommentMarkers(sourceFile: SourceFile): SourceFile {
  // Get the full text and replace comment markers
  let text = sourceFile.getFullText()

  // Remove inline comment markers from imports
  text = text.replace(/\s*\/\/\s*database-adapter-import\s*$/gm, '')
  text = text.replace(/\s*\/\/\s*storage-adapter-import-placeholder\s*$/gm, '')

  // Remove standalone comment lines
  text = text.replace(/^\s*\/\/\s*database-adapter-config-start\s*\n/gm, '')
  text = text.replace(/^\s*\/\/\s*database-adapter-config-end\s*\n/gm, '')
  text = text.replace(/^\s*\/\/\s*storage-adapter-placeholder\s*\n/gm, '')

  // Also remove the placeholder line from template (storage-adapter-import-placeholder at top)
  text = text.replace(/^\/\/\s*storage-adapter-import-placeholder\s*\n/gm, '')

  // Replace the entire source file content
  sourceFile.replaceWithText(text)

  return sourceFile
}

/**
 * Validates payload config structure has required elements after transformation.
 * Checks that buildConfig() call exists and has a db property configured.
 */
export function validateStructure(sourceFile: SourceFile): WriteResult {
  debug('[AST] Validating payload config structure')

  const detection = detectPayloadConfigStructure(sourceFile)

  if (!detection.success) {
    debug('[AST] ✗ Validation failed: detection unsuccessful')
    return {
      error: detection.error,
      success: false,
    }
  }

  const { structures } = detection

  // Validate db property exists
  if (!structures?.dbProperty) {
    debug('[AST] ✗ Validation failed: db property missing')
    return {
      error: formatError({
        actual: 'No db property found',
        context: 'database configuration',
        expected: 'buildConfig must have a db property',
        technicalDetails: 'PropertyAssignment with name "db" not found in buildConfig object',
      }),
      success: false,
    }
  }

  debug('[AST] ✓ Validation passed')
  return { success: true }
}

export async function writeTransformedFile(
  sourceFile: SourceFile,
  options: WriteOptions = {},
): Promise<WriteResult> {
  const { formatWithPrettier = true, validateStructure: shouldValidate = true } = options

  debug(`[AST] Writing transformed file: ${sourceFile.getFilePath()}`)

  // Validate if requested
  if (shouldValidate) {
    const validation = validateStructure(sourceFile)
    if (!validation.success) {
      return validation
    }
  }

  // Get file path and save to disk
  const filePath = sourceFile.getFilePath()

  // Format with ts-morph before saving (fixes trailing commas, indentation)
  debug('[AST] Formatting with ts-morph')
  sourceFile.formatText()

  // Write file
  debug('[AST] Writing file to disk')
  await sourceFile.save()

  // Format with prettier if requested
  if (formatWithPrettier) {
    debug('[AST] Running prettier formatting via CLI')
    try {
      // Detect project directory (go up from file until we find package.json or use dirname)
      const projectDir = path.dirname(filePath)

      // Run prettier via CLI (avoids Jest/ESM compatibility issues)
      const prettierCmd = `npx prettier --write "${filePath}"`

      debug(`[AST] Executing: ${prettierCmd}`)
      execSync(prettierCmd, {
        cwd: projectDir,
        stdio: 'pipe', // Suppress output
      })
      debug('[AST] ✓ Prettier formatting successful')
    } catch (error) {
      // Log but don't fail if prettier fails (might not be installed)
      debug(
        `[AST] ⚠ Prettier formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
      debug('[AST] Continuing with unformatted output')
    }
  } else {
    debug('[AST] Skipping prettier formatting (disabled)')
  }

  debug('[AST] ✓ File written successfully')

  return { success: true }
}

export async function configurePayloadConfig(
  filePath: string,
  options: ConfigureOptions = {},
): Promise<WriteResult> {
  debug(`[AST] Configuring payload config: ${filePath}`)
  debug(
    `[AST] Options: db=${options.db?.type}, storage=${options.storage}, removeSharp=${options.removeSharp}`,
  )

  const allModifications: Modification[] = []
  const allWarnings: string[] = []

  try {
    // Create Project and load source file with proper settings
    const project = new Project({
      manipulationSettings: {
        quoteKind: QuoteKind.Single,
      },
    })
    let sourceFile = project.addSourceFileAtPath(filePath)

    // Run detection
    const detection = detectPayloadConfigStructure(sourceFile)
    if (!detection.success) {
      return detection
    }

    // Apply transformations based on options
    if (options.db) {
      debug('[AST] Applying database adapter transformation')
      const result = addDatabaseAdapter({
        adapter: options.db.type,
        envVarName: options.db.envVarName,
        sourceFile,
      })

      if (!result.success) {
        return {
          error: result.error,
          success: false,
        }
      }

      allModifications.push(...result.modifications)
      if (result.warnings) {
        allWarnings.push(...result.warnings)
      }
    }

    if (options.storage) {
      debug('[AST] Applying storage adapter transformation')
      const result = addStorageAdapter({ adapter: options.storage, sourceFile })

      if (!result.success) {
        return {
          error: result.error,
          success: false,
        }
      }

      allModifications.push(...result.modifications)
      if (result.warnings) {
        allWarnings.push(...result.warnings)
      }
    }

    if (options.removeSharp) {
      debug('[AST] Applying sharp removal')
      const result = removeSharp(sourceFile)

      if (!result.success) {
        return {
          error: result.error,
          success: false,
        }
      }

      allModifications.push(...result.modifications)
      if (result.warnings) {
        allWarnings.push(...result.warnings)
      }
    }

    // Remove comment markers from template
    sourceFile = removeCommentMarkers(sourceFile)

    // Cleanup orphaned imports after all transformations
    debug('[AST] Cleaning up orphaned imports')

    // Cleanup database adapter imports if db was removed
    for (const [, config] of Object.entries(DB_ADAPTER_CONFIG)) {
      if (options.db && config.packageName !== DB_ADAPTER_CONFIG[options.db.type].packageName) {
        const cleanup = cleanupOrphanedImports({
          importNames: [config.adapterName],
          moduleSpecifier: config.packageName,
          sourceFile,
        })
        if (cleanup.removed.length > 0) {
          cleanup.removed.forEach((importName) => {
            allModifications.push({
              type: 'import-removed',
              description: `Cleaned up unused import '${importName}' from '${config.packageName}'`,
            })
          })
        }
      }
    }

    // Log summary of modifications
    if (allModifications.length > 0) {
      debug(`[AST] Applied ${allModifications.length} modification(s):`)
      allModifications.forEach((mod) => {
        debug(`[AST]   - ${mod.type}: ${mod.description}`)
      })
    }

    if (allWarnings.length > 0) {
      debug(`[AST] ${allWarnings.length} warning(s):`)
      allWarnings.forEach((warning) => {
        debug(`[AST]   - ${warning}`)
      })
    }

    // Write transformed file with validation and formatting
    return await writeTransformedFile(sourceFile, {
      formatWithPrettier: options.formatWithPrettier,
      validateStructure: options.validateStructure ?? true,
    })
  } catch (error) {
    debug(`[AST] ✗ Configuration failed: ${error instanceof Error ? error.message : String(error)}`)
    return {
      error: formatError({
        actual: error instanceof Error ? error.message : String(error),
        context: 'configurePayloadConfig',
        expected: 'Successful file transformation',
        technicalDetails: error instanceof Error ? error.stack || error.message : String(error),
      }),
      success: false,
    }
  }
}
