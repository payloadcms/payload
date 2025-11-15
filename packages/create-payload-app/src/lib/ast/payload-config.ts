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

export function detectPayloadConfigStructure(
  sourceFile: SourceFile,
  debugMode = false,
): DetectionResult {
  if (debugMode) {
    debug(`[AST] Detecting payload config structure in ${sourceFile.getFilePath()}`)
  }

  // Find buildConfig call expression
  const buildConfigCall = sourceFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .find((call) => {
      const expression = call.getExpression()
      return expression.getText() === 'buildConfig'
    })

  if (!buildConfigCall) {
    if (debugMode) {
      debug('[AST] ✗ buildConfig call not found')
    }
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

  if (debugMode) {
    debug('[AST] ✓ buildConfig call found')
  }

  // Get import statements
  const importStatements = sourceFile.getImportDeclarations()
  if (debugMode) {
    debug(`[AST] Found ${importStatements.length} import statements`)
  }

  // Find db property if it exists
  const configObject = buildConfigCall.getArguments()[0]
  let dbProperty
  if (configObject && configObject.getKind() === SyntaxKind.ObjectLiteralExpression) {
    dbProperty = configObject
      .asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
      .getProperty('db')
      ?.asKind(SyntaxKind.PropertyAssignment)
  }

  if (debugMode) {
    debug(`[AST] db property: ${dbProperty ? '✓ found' : '✗ not found'}`)
  }

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

  if (debugMode) {
    debug(`[AST] plugins array: ${pluginsArray ? '✓ found' : '✗ not found'}`)
  }

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

export function addDatabaseAdapter(
  sourceFile: SourceFile,
  adapter: DatabaseAdapter,
  envVarName = 'DATABASE_URI',
  debugMode = false,
): void {
  if (debugMode) {
    debug(`[AST] Adding database adapter: ${adapter} (envVar: ${envVarName})`)
  }

  const detection = detectPayloadConfigStructure(sourceFile, debugMode)

  if (!detection.success || !detection.structures) {
    throw new Error('Cannot add database adapter: ' + detection.error?.userMessage)
  }

  const { buildConfigCall, dbProperty } = detection.structures
  const config = DB_ADAPTER_CONFIG[adapter]

  // Remove old db adapter imports
  const oldAdapters = Object.values(DB_ADAPTER_CONFIG)
  const removedAdapters: string[] = []
  oldAdapters.forEach((oldConfig) => {
    if (oldConfig.packageName !== config.packageName) {
      removeImportDeclaration(sourceFile, oldConfig.packageName, debugMode)
      removedAdapters.push(oldConfig.packageName)
    }
  })

  if (debugMode && removedAdapters.length > 0) {
    debug(`[AST] Removed old adapter imports: ${removedAdapters.join(', ')}`)
  }

  // Add new import
  addImportDeclaration(
    sourceFile,
    {
      moduleSpecifier: config.packageName,
      namedImports: [config.adapterName],
    },
    debugMode,
  )

  // Add special imports for specific adapters
  if (adapter === 'vercel-postgres') {
    if (debugMode) {
      debug('[AST] Adding special import: @vercel/postgres')
    }
    addImportDeclaration(
      sourceFile,
      {
        moduleSpecifier: '@vercel/postgres',
        namedImports: ['createPool'],
      },
      debugMode,
    )
  }
  if (adapter === 'd1-sqlite') {
    if (debugMode) {
      debug('[AST] Adding special import: ./db/migrations')
    }
    addImportDeclaration(
      sourceFile,
      {
        defaultImport: 'migrations',
        moduleSpecifier: './db/migrations',
      },
      debugMode,
    )
  }

  // Get config object
  const configObject = buildConfigCall.getArguments()[0]
  if (!configObject || configObject.getKind() !== SyntaxKind.ObjectLiteralExpression) {
    throw new Error('buildConfig must have an object literal argument')
  }

  const objLiteral = configObject.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)

  // Remove existing db property if present
  if (dbProperty) {
    if (debugMode) {
      debug('[AST] Removing existing db property')
    }
    dbProperty.remove()
  }

  // Add new db property - insert after first property to match expected format
  // Find first property to determine insert position
  const firstProperty = objLiteral.getProperties()[0]
  const insertIndex = firstProperty ? 0 : 0

  objLiteral.insertPropertyAssignment(insertIndex, {
    name: 'db',
    initializer: config.configTemplate(envVarName),
  })

  if (debugMode) {
    debug(`[AST] ✓ Database adapter ${adapter} added successfully`)
  }
}

export function addStorageAdapter(
  sourceFile: SourceFile,
  adapter: StorageAdapter,
  debugMode = false,
): void {
  if (debugMode) {
    debug(`[AST] Adding storage adapter: ${adapter}`)
  }

  const detection = detectPayloadConfigStructure(sourceFile, debugMode)

  if (!detection.success || !detection.structures) {
    throw new Error('Cannot add storage adapter: ' + detection.error?.userMessage)
  }

  const config = STORAGE_ADAPTER_CONFIG[adapter]

  // Local disk doesn't need any imports or plugins
  if (adapter === 'localDisk') {
    if (debugMode) {
      debug('[AST] localDisk storage adapter - no imports or plugins needed')
    }
    return
  }

  // Add import
  if (config.packageName && config.adapterName) {
    addImportDeclaration(
      sourceFile,
      {
        moduleSpecifier: config.packageName,
        namedImports: [config.adapterName],
      },
      debugMode,
    )
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
    if (debugMode) {
      debug('[AST] Creating new plugins array')
    }
    // Create plugins array
    objLiteral.addPropertyAssignment({
      name: 'plugins',
      initializer: '[]',
    })
    pluginsProperty = objLiteral.getProperty('plugins')?.asKind(SyntaxKind.PropertyAssignment)
  } else if (debugMode) {
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

  if (debugMode) {
    debug(`[AST] ✓ Storage adapter ${adapter} added successfully`)
  }
}

export function removeSharp(sourceFile: SourceFile, debugMode = false): void {
  if (debugMode) {
    debug('[AST] Removing sharp import and property')
  }

  // Remove import
  removeImportDeclaration(sourceFile, 'sharp', debugMode)

  // Find and remove sharp property from buildConfig
  const detection = detectPayloadConfigStructure(sourceFile, debugMode)

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
    if (debugMode) {
      debug('[AST] ✓ Sharp property removed from config')
    }
  } else if (debugMode) {
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

export function validateStructure(sourceFile: SourceFile, debugMode = false): WriteResult {
  if (debugMode) {
    debug('[AST] Validating payload config structure')
  }

  const detection = detectPayloadConfigStructure(sourceFile, debugMode)

  if (!detection.success) {
    if (debugMode) {
      debug('[AST] ✗ Validation failed: detection unsuccessful')
    }
    return {
      error: detection.error,
      success: false,
    }
  }

  const { structures } = detection

  // Validate db property exists
  if (!structures?.dbProperty) {
    if (debugMode) {
      debug('[AST] ✗ Validation failed: db property missing')
    }
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

  if (debugMode) {
    debug('[AST] ✓ Validation passed')
  }
  return { success: true }
}

export async function writeTransformedFile(
  sourceFile: SourceFile,
  options: WriteOptions = {},
): Promise<WriteResult> {
  const {
    debugMode = false,
    formatWithPrettier = true,
    validateStructure: shouldValidate = true,
  } = options

  if (debugMode) {
    debug(`[AST] Writing transformed file: ${sourceFile.getFilePath()}`)
  }

  // Validate if requested
  if (shouldValidate) {
    const validation = validateStructure(sourceFile, debugMode)
    if (!validation.success) {
      return validation
    }
  }

  // Get file path and content
  const filePath = sourceFile.getFilePath()
  let content = sourceFile.getText()

  // Fix quote style (ts-morph sometimes uses double quotes, convert to single)
  if (debugMode) {
    debug('[AST] Normalizing quote style to single quotes')
  }
  content = content.replace(/from "([^"]+)"/g, "from '$1'")
  content = content.replace(/import "([^"]+)"/g, "import '$1'")

  // Normalize indentation: ts-morph adds base indentation, but our template strings also have indentation
  // This causes double indentation. We need to reduce indentation in property initializers.
  // Match patterns like: "  db: adapter({\n      content" and reduce the excess indentation
  if (debugMode) {
    debug('[AST] Normalizing indentation')
  }

  const lines = content.split('\n')
  const normalized: string[] = []
  let inPropertyInitializer = false
  let baseIndent = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check if this line starts a property assignment in buildConfig
    if (line && /^\s+\w+:\s+\w+\(\{$/.test(line)) {
      inPropertyInitializer = true
      const match = line.match(/^(\s+)/)
      baseIndent = match?.[1]?.length || 0
      normalized.push(line)
      continue
    }

    // Check if we're closing the property initializer
    if (line && inPropertyInitializer && /^\s+\}\),$/.test(line)) {
      // Fix closing brace indentation to match base
      const properLine = ' '.repeat(baseIndent) + '}),'
      normalized.push(properLine)
      inPropertyInitializer = false
      continue
    }

    // If we're in a property initializer, reduce indentation by 2 spaces
    if (line && inPropertyInitializer && line.trim()) {
      const match = line.match(/^(\s+)/)
      const currentIndent = match?.[1]?.length || 0
      if (currentIndent > baseIndent) {
        const reducedIndent = Math.max(baseIndent + 2, currentIndent - 2)
        normalized.push(' '.repeat(reducedIndent) + line.trim())
        continue
      }
    }

    normalized.push(line || '')
  }

  content = normalized.join('\n')

  // Format with prettier if requested
  if (formatWithPrettier) {
    if (debugMode) {
      debug('[AST] Running prettier formatting')
    }
    try {
      // Use prettier's format API with dynamic import for v3+
      const prettier = await import('prettier')
      content = await prettier.format(content, {
        filepath: filePath,
        semi: false,
        singleQuote: true,
        trailingComma: 'all',
      })
      if (debugMode) {
        debug('[AST] ✓ Prettier formatting successful')
      }
    } catch (error) {
      // Log but don't fail if prettier fails
      if (debugMode) {
        debug('[AST] ⚠ Prettier formatting failed, continuing with normalized output')
      }
    }
  } else if (debugMode) {
    debug('[AST] Skipping prettier formatting (disabled)')
  }

  // Write file
  if (debugMode) {
    debug('[AST] Writing file to disk')
  }
  await sourceFile.getProject().getFileSystem().writeFile(filePath, content)

  if (debugMode) {
    debug('[AST] ✓ File written successfully')
  }

  return { success: true }
}

export async function configurePayloadConfig(
  filePath: string,
  options: ConfigureOptions = {},
): Promise<WriteResult> {
  const { debugMode = false } = options

  if (debugMode) {
    debug(`[AST] Configuring payload config: ${filePath}`)
    debug(
      `[AST] Options: db=${options.db?.type}, storage=${options.storage}, removeSharp=${options.removeSharp}`,
    )
  }

  try {
    // Create Project and load source file with proper settings
    const project = new Project({
      manipulationSettings: {
        quoteKind: QuoteKind.Single,
      },
    })
    const sourceFile = project.addSourceFileAtPath(filePath)

    // Run detection
    const detection = detectPayloadConfigStructure(sourceFile, debugMode)
    if (!detection.success) {
      return detection
    }

    // Apply transformations based on options
    if (options.db) {
      if (debugMode) {
        debug('[AST] Applying database adapter transformation')
      }
      addDatabaseAdapter(sourceFile, options.db.type, options.db.envVarName, debugMode)
    }

    if (options.storage) {
      if (debugMode) {
        debug('[AST] Applying storage adapter transformation')
      }
      addStorageAdapter(sourceFile, options.storage, debugMode)
    }

    if (options.removeSharp) {
      if (debugMode) {
        debug('[AST] Applying sharp removal')
      }
      removeSharp(sourceFile, debugMode)
    }

    // Remove comment markers from template
    removeCommentMarkers(sourceFile)

    // Write transformed file with validation and formatting
    return await writeTransformedFile(sourceFile, {
      debugMode: options.debugMode,
      formatWithPrettier: options.formatWithPrettier,
      validateStructure: options.validateStructure ?? true,
    })
  } catch (error) {
    if (debugMode) {
      debug(
        `[AST] ✗ Configuration failed: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
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
