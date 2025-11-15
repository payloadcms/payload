import { Project, type SourceFile, SyntaxKind } from 'ts-morph'

import type {
  ConfigureOptions,
  DatabaseAdapter,
  DetectionResult,
  StorageAdapter,
  WriteOptions,
  WriteResult,
} from './types.js'

import { addImportDeclaration, formatError, removeImportDeclaration } from './utils.js'

export function detectPayloadConfigStructure(sourceFile: SourceFile): DetectionResult {
  // Find buildConfig call expression
  const buildConfigCall = sourceFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .find((call) => {
      const expression = call.getExpression()
      return expression.getText() === 'buildConfig'
    })

  if (!buildConfigCall) {
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

  // Get import statements
  const importStatements = sourceFile.getImportDeclarations()

  // Find db property if it exists
  const configObject = buildConfigCall.getArguments()[0]
  let dbProperty
  if (configObject && configObject.getKind() === SyntaxKind.ObjectLiteralExpression) {
    dbProperty = configObject
      .asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
      .getProperty('db')
      ?.asKind(SyntaxKind.PropertyAssignment)
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

const DB_ADAPTER_CONFIG = {
  'd1-sqlite': {
    adapterName: 'sqliteAdapter',
    configTemplate: () => `sqliteAdapter({
  client: {
    url: getD1Database()!,
  },
  prodMigrations: migrations,
})`,
    packageName: '@payloadcms/db-sqlite',
  },
  mongodb: {
    adapterName: 'mongooseAdapter',
    configTemplate: (envVar: string) => `mongooseAdapter({
  url: process.env.${envVar} || '',
})`,
    packageName: '@payloadcms/db-mongodb',
  },
  postgres: {
    adapterName: 'postgresAdapter',
    configTemplate: (envVar: string) => `postgresAdapter({
  pool: {
    connectionString: process.env.${envVar} || '',
  },
})`,
    packageName: '@payloadcms/db-postgres',
  },
  sqlite: {
    adapterName: 'sqliteAdapter',
    configTemplate: () => `sqliteAdapter({
  client: {
    url: process.env.DATABASE_URI || '',
  },
})`,
    packageName: '@payloadcms/db-sqlite',
  },
  'vercel-postgres': {
    adapterName: 'vercelPostgresAdapter',
    configTemplate: () => `vercelPostgresAdapter({
  pool: createPool({
    connectionString: process.env.POSTGRES_URL || '',
  }),
})`,
    packageName: '@payloadcms/db-vercel-postgres',
  },
} as const

export function addDatabaseAdapter(
  sourceFile: SourceFile,
  adapter: DatabaseAdapter,
  envVarName = 'DATABASE_URI',
): void {
  const detection = detectPayloadConfigStructure(sourceFile)

  if (!detection.success || !detection.structures) {
    throw new Error('Cannot add database adapter: ' + detection.error?.userMessage)
  }

  const { buildConfigCall, dbProperty } = detection.structures
  const config = DB_ADAPTER_CONFIG[adapter as keyof typeof DB_ADAPTER_CONFIG]

  // Remove old db adapter imports
  const oldAdapters = Object.values(DB_ADAPTER_CONFIG)
  oldAdapters.forEach((oldConfig) => {
    if (oldConfig.packageName !== config.packageName) {
      removeImportDeclaration(sourceFile, oldConfig.packageName)
    }
  })

  // Add new import
  addImportDeclaration(sourceFile, {
    moduleSpecifier: config.packageName,
    namedImports: [config.adapterName],
  })

  // Add special imports for specific adapters
  if (adapter === 'vercel-postgres') {
    addImportDeclaration(sourceFile, {
      moduleSpecifier: '@vercel/postgres',
      namedImports: ['createPool'],
    })
  }
  if (adapter === 'd1-sqlite') {
    addImportDeclaration(sourceFile, {
      defaultImport: 'migrations',
      moduleSpecifier: './db/migrations',
    })
  }

  // Get config object
  const configObject = buildConfigCall.getArguments()[0]
  if (!configObject || configObject.getKind() !== SyntaxKind.ObjectLiteralExpression) {
    throw new Error('buildConfig must have an object literal argument')
  }

  const objLiteral = configObject.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)

  // Remove existing db property if present
  if (dbProperty) {
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
}

const STORAGE_ADAPTER_CONFIG = {
  azureStorage: {
    adapterName: 'azureStorage',
    configTemplate: () => `azureStorage({
  collections: {
    media: true,
  },
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
  containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || '',
})`,
    packageName: '@payloadcms/storage-azure',
  },
  gcsStorage: {
    adapterName: 'gcsStorage',
    configTemplate: () => `gcsStorage({
  collections: {
    media: true,
  },
  bucket: process.env.GCS_BUCKET || '',
})`,
    packageName: '@payloadcms/storage-gcs',
  },
  localDisk: {
    adapterName: null,
    configTemplate: () => null,
    packageName: null,
  },
  r2Storage: {
    adapterName: 'r2Storage',
    configTemplate: () => `r2Storage({
  collections: {
    media: true,
  },
  bucket: process.env.R2_BUCKET || '',
  accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
})`,
    packageName: '@payloadcms/storage-cloudflare-r2',
  },
  s3Storage: {
    adapterName: 's3Storage',
    configTemplate: () => `s3Storage({
  collections: {
    media: true,
  },
  bucket: process.env.S3_BUCKET || '',
  config: {
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    region: process.env.S3_REGION || '',
  },
})`,
    packageName: '@payloadcms/storage-s3',
  },
  uploadthingStorage: {
    adapterName: 'uploadthingStorage',
    configTemplate: () => `uploadthingStorage({
  collections: {
    media: true,
  },
  token: process.env.UPLOADTHING_SECRET || '',
})`,
    packageName: '@payloadcms/storage-uploadthing',
  },
  vercelBlobStorage: {
    adapterName: 'vercelBlobStorage',
    configTemplate: () => `vercelBlobStorage({
  collections: {
    media: true,
  },
  token: process.env.BLOB_READ_WRITE_TOKEN || '',
})`,
    packageName: '@payloadcms/storage-vercel-blob',
  },
} as const

export function addStorageAdapter(sourceFile: SourceFile, adapter: StorageAdapter): void {
  const detection = detectPayloadConfigStructure(sourceFile)

  if (!detection.success || !detection.structures) {
    throw new Error('Cannot add storage adapter: ' + detection.error?.userMessage)
  }

  const config = STORAGE_ADAPTER_CONFIG[adapter as keyof typeof STORAGE_ADAPTER_CONFIG]

  // Local disk doesn't need any imports or plugins
  if (adapter === 'localDisk') {
    return
  }

  // Add import
  if (config.packageName && config.adapterName) {
    addImportDeclaration(sourceFile, {
      moduleSpecifier: config.packageName,
      namedImports: [config.adapterName],
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
    // Create plugins array
    objLiteral.addPropertyAssignment({
      name: 'plugins',
      initializer: '[]',
    })
    pluginsProperty = objLiteral.getProperty('plugins')?.asKind(SyntaxKind.PropertyAssignment)
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
}

export function removeSharp(sourceFile: SourceFile): void {
  // Remove import
  removeImportDeclaration(sourceFile, 'sharp')

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

export function validateStructure(sourceFile: SourceFile): WriteResult {
  const detection = detectPayloadConfigStructure(sourceFile)

  if (!detection.success) {
    return {
      error: detection.error,
      success: false,
    }
  }

  const { structures } = detection

  // Validate db property exists
  if (!structures?.dbProperty) {
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

  return { success: true }
}

export async function writeTransformedFile(
  sourceFile: SourceFile,
  options: WriteOptions = {},
): Promise<WriteResult> {
  const { formatWithPrettier = true, validateStructure: shouldValidate = true } = options

  // Validate if requested
  if (shouldValidate) {
    const validation = validateStructure(sourceFile)
    if (!validation.success) {
      return validation
    }
  }

  // Get file path and content
  const filePath = sourceFile.getFilePath()
  let content = sourceFile.getText()

  // Fix quote style (ts-morph sometimes uses double quotes, convert to single)
  content = content.replace(/from "([^"]+)"/g, "from '$1'")
  content = content.replace(/import "([^"]+)"/g, "import '$1'")

  // Normalize indentation: ts-morph adds base indentation, but our template strings also have indentation
  // This causes double indentation. We need to reduce indentation in property initializers.
  // Match patterns like: "  db: adapter({\n      content" and reduce the excess indentation
  const lines = content.split('\n')
  const normalized: string[] = []
  let inPropertyInitializer = false
  let baseIndent = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check if this line starts a property assignment in buildConfig
    if (/^\s+\w+:\s+\w+\(\{$/.test(line)) {
      inPropertyInitializer = true
      baseIndent = line.match(/^(\s+)/)?.[1].length || 0
      normalized.push(line)
      continue
    }

    // Check if we're closing the property initializer
    if (inPropertyInitializer && /^\s+\}\),$/.test(line)) {
      // Fix closing brace indentation to match base
      const properLine = ' '.repeat(baseIndent) + '}),'
      normalized.push(properLine)
      inPropertyInitializer = false
      continue
    }

    // If we're in a property initializer, reduce indentation by 2 spaces
    if (inPropertyInitializer && line.trim()) {
      const currentIndent = line.match(/^(\s+)/)?.[1].length || 0
      if (currentIndent > baseIndent) {
        const reducedIndent = Math.max(baseIndent + 2, currentIndent - 2)
        normalized.push(' '.repeat(reducedIndent) + line.trim())
        continue
      }
    }

    normalized.push(line)
  }

  content = normalized.join('\n')

  // Format with prettier if requested
  if (formatWithPrettier) {
    try {
      // Use prettier's format API with dynamic import for v3+
      const prettier = await import('prettier')
      content = await prettier.format(content, {
        filepath: filePath,
        semi: false,
        singleQuote: true,
        trailingComma: 'all',
      })
    } catch (error) {
      // Log but don't fail if prettier fails
      if (options.debugMode) {
        console.warn('Prettier formatting failed:', error)
      }
    }
  }

  // Write file
  await sourceFile.getProject().getFileSystem().writeFile(filePath, content)

  return { success: true }
}

export async function configurePayloadConfig(
  filePath: string,
  options: ConfigureOptions = {},
): Promise<WriteResult> {
  try {
    // Create Project and load source file with proper settings
    const project = new Project({
      manipulationSettings: {
        indentationText: '  ', // 2 spaces
        quoteKind: 1, // Single quotes (QuoteKind.Single = 1)
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
      addDatabaseAdapter(sourceFile, options.db.type, options.db.envVarName)
    }

    if (options.storage) {
      addStorageAdapter(sourceFile, options.storage)
    }

    if (options.removeSharp) {
      removeSharp(sourceFile)
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
