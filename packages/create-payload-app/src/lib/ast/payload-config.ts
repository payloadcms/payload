import { type SourceFile, SyntaxKind } from 'ts-morph'

import type {
  DatabaseAdapter,
  DetectionResult,
  StorageAdapter,
  WriteOptions,
  WriteResult,
} from './types'

import { addImportDeclaration, formatError, removeImportDeclaration } from './utils'

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
  const config = DB_ADAPTER_CONFIG[adapter]

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

  // Add new db property at the beginning
  objLiteral.insertPropertyAssignment(0, {
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

  const config = STORAGE_ADAPTER_CONFIG[adapter]

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
