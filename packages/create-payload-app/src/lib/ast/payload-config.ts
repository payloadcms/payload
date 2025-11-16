import { execSync } from 'child_process'
import path from 'path'
import { Project, QuoteKind, type SourceFile, SyntaxKind } from 'ts-morph'

import type {
  ConfigureOptions,
  DatabaseAdapter,
  DetectionResult,
  StorageAdapter,
  WriteOptions,
  WriteResult,
} from './types.js'

import { debug } from '../../utils/log.js'
import { DB_ADAPTER_CONFIG, STORAGE_ADAPTER_CONFIG } from './adapter-config.js'
import { addImportDeclaration, formatError, removeImportDeclaration } from './utils.js'

export function detectPayloadConfigStructure(sourceFile: SourceFile): DetectionResult {
  debug(`[AST] Detecting payload config structure in ${sourceFile.getFilePath()}`)

  // Find buildConfig call expression
  const buildConfigCall = sourceFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .find((call) => {
      const expression = call.getExpression()
      return expression.getText() === 'buildConfig'
    })

  if (!buildConfigCall) {
    debug('[AST] ✗ buildConfig call not found')
    return {
      error: formatError({
        actual: 'No buildConfig call found in file',
        context: 'buildConfig call',
        expected: 'export default buildConfig({ ... })',
        technicalDetails: 'Could not find CallExpression with identifier "buildConfig"',
      }),
      success: false,
    }
  }

  debug('[AST] ✓ buildConfig call found')

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
    const pluginsProperty = configObject
      .asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
      .getProperty('plugins')
      ?.asKind(SyntaxKind.PropertyAssignment)

    if (pluginsProperty) {
      const initializer = pluginsProperty.getInitializer()
      if (initializer?.getKind() === SyntaxKind.ArrayLiteralExpression) {
        pluginsArray = initializer.asKind(SyntaxKind.ArrayLiteralExpression)
      }
    }
  }

  debug(`[AST] plugins array: ${pluginsArray ? '✓ found' : '✗ not found'}`)

  return {
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
  envVarName = 'DATABASE_URI',
  sourceFile,
}: {
  adapter: DatabaseAdapter
  envVarName?: string
  sourceFile: SourceFile
}): void {
  debug(`[AST] Adding database adapter: ${adapter} (envVar: ${envVarName})`)

  const detection = detectPayloadConfigStructure(sourceFile)

  if (!detection.success || !detection.structures) {
    throw new Error('Cannot add database adapter: ' + detection.error?.userMessage)
  }

  const { buildConfigCall, dbProperty } = detection.structures
  const config = DB_ADAPTER_CONFIG[adapter]

  // Remove old db adapter imports and track position for replacement
  const oldAdapters = Object.values(DB_ADAPTER_CONFIG)
  const removedAdapters: string[] = []
  let importInsertIndex: number | undefined
  oldAdapters.forEach((oldConfig) => {
    if (oldConfig.packageName !== config.packageName) {
      const removedIndex = removeImportDeclaration({
        moduleSpecifier: oldConfig.packageName,
        sourceFile,
      })
      if (removedIndex !== undefined) {
        // Use the first removed adapter's position
        if (importInsertIndex === undefined) {
          importInsertIndex = removedIndex
        }
        removedAdapters.push(oldConfig.packageName)
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

  // Add special imports for specific adapters
  if (adapter === 'd1-sqlite') {
    debug('[AST] Adding special import: ./db/migrations')
    addImportDeclaration({
      defaultImport: 'migrations',
      moduleSpecifier: './db/migrations',
      sourceFile,
    })
  }

  // Get config object
  const configObject = buildConfigCall.getArguments()[0]
  if (!configObject || configObject.getKind() !== SyntaxKind.ObjectLiteralExpression) {
    throw new Error('buildConfig must have an object literal argument')
  }

  const objLiteral = configObject.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)

  // Determine insert position before removing existing property
  let insertIndex = 0
  if (dbProperty) {
    // Preserve position of existing db property
    const allProperties = objLiteral.getProperties()
    insertIndex = allProperties.indexOf(dbProperty)
    debug(`[AST] Replacing db property at index ${insertIndex}`)
    dbProperty.remove()
  } else {
    // No existing db property - insert at end
    insertIndex = objLiteral.getProperties().length
    debug(`[AST] Adding db property at index ${insertIndex}`)
  }

  objLiteral.insertPropertyAssignment(insertIndex, {
    name: 'db',
    initializer: config.configTemplate(envVarName),
  })

  debug(`[AST] ✓ Database adapter ${adapter} added successfully`)
}

export function addStorageAdapter({
  adapter,
  sourceFile,
}: {
  adapter: StorageAdapter
  sourceFile: SourceFile
}): void {
  debug(`[AST] Adding storage adapter: ${adapter}`)

  const detection = detectPayloadConfigStructure(sourceFile)

  if (!detection.success || !detection.structures) {
    throw new Error('Cannot add storage adapter: ' + detection.error?.userMessage)
  }

  const config = STORAGE_ADAPTER_CONFIG[adapter]

  // Local disk doesn't need any imports or plugins
  if (adapter === 'localDisk') {
    debug('[AST] localDisk storage adapter - no imports or plugins needed')
    return
  }

  // Add import
  if (config.packageName && config.adapterName) {
    addImportDeclaration({
      moduleSpecifier: config.packageName,
      namedImports: [config.adapterName],
      sourceFile,
    })
  }

  const { buildConfigCall } = detection.structures
  const configObject = buildConfigCall.getArguments()[0]

  if (!configObject || configObject.getKind() !== SyntaxKind.ObjectLiteralExpression) {
    throw new Error('buildConfig must have an object literal argument')
  }

  const objLiteral = configObject.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)

  // Find or create plugins array
  let pluginsProperty = objLiteral.getProperty('plugins')?.asKind(SyntaxKind.PropertyAssignment)

  if (!pluginsProperty) {
    debug('[AST] Creating new plugins array')
    // Create plugins array
    objLiteral.addPropertyAssignment({
      name: 'plugins',
      initializer: '[]',
    })
    pluginsProperty = objLiteral.getProperty('plugins')?.asKind(SyntaxKind.PropertyAssignment)
  } else {
    debug('[AST] Reusing existing plugins array')
  }

  if (!pluginsProperty) {
    throw new Error('Failed to create plugins property')
  }

  const initializer = pluginsProperty.getInitializer()
  if (!initializer || initializer.getKind() !== SyntaxKind.ArrayLiteralExpression) {
    throw new Error('plugins must be an array')
  }

  const pluginsArray = initializer.asKindOrThrow(SyntaxKind.ArrayLiteralExpression)

  // Add storage adapter call
  const configText = config.configTemplate()
  if (configText) {
    pluginsArray.addElement(configText)
  }

  debug(`[AST] ✓ Storage adapter ${adapter} added successfully`)
}

export function removeSharp(sourceFile: SourceFile): void {
  debug('[AST] Removing sharp import and property')

  // Remove import
  removeImportDeclaration({ moduleSpecifier: 'sharp', sourceFile })

  // Find and remove sharp property from buildConfig
  const detection = detectPayloadConfigStructure(sourceFile)

  if (!detection.success || !detection.structures) {
    return
  }

  const { buildConfigCall } = detection.structures
  const configObject = buildConfigCall.getArguments()[0]

  if (!configObject || configObject.getKind() !== SyntaxKind.ObjectLiteralExpression) {
    return
  }

  const objLiteral = configObject.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
  const sharpProperty = objLiteral.getProperty('sharp')

  if (sharpProperty) {
    sharpProperty.remove()
    debug('[AST] ✓ Sharp property removed from config')
  } else {
    debug('[AST] Sharp property not found (already absent)')
  }
}

export function removeCommentMarkers(sourceFile: SourceFile): void {
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

  try {
    // Create Project and load source file with proper settings
    const project = new Project({
      manipulationSettings: {
        quoteKind: QuoteKind.Single,
      },
    })
    const sourceFile = project.addSourceFileAtPath(filePath)

    // Run detection
    const detection = detectPayloadConfigStructure(sourceFile)
    if (!detection.success) {
      return detection
    }

    // Apply transformations based on options
    if (options.db) {
      debug('[AST] Applying database adapter transformation')
      addDatabaseAdapter({
        adapter: options.db.type,
        envVarName: options.db.envVarName,
        sourceFile,
      })
    }

    if (options.storage) {
      debug('[AST] Applying storage adapter transformation')
      addStorageAdapter({ adapter: options.storage, sourceFile })
    }

    if (options.removeSharp) {
      debug('[AST] Applying sharp removal')
      removeSharp(sourceFile)
    }

    // Remove comment markers from template
    removeCommentMarkers(sourceFile)

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
