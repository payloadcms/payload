import { type SourceFile, SyntaxKind } from 'ts-morph'

import type { DatabaseAdapter, DetectionResult } from './types'

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
