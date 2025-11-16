import type {
  ArrayLiteralExpression,
  CallExpression,
  ImportDeclaration,
  PropertyAssignment,
  SourceFile,
} from 'ts-morph'

export type DetectionError = {
  debugInfo?: Record<string, unknown>
  technicalDetails: string
  userMessage: string
}

export type PayloadConfigStructures = {
  buildConfigCall: CallExpression
  dbProperty?: PropertyAssignment
  importStatements: ImportDeclaration[]
  pluginsArray?: ArrayLiteralExpression
}

export type DetectionResult = {
  error?: DetectionError
  sourceFile?: SourceFile
  structures?: PayloadConfigStructures
  success: boolean
}
export type DatabaseAdapter = (typeof ALL_DATABASE_ADAPTERS)[number]

export const ALL_DATABASE_ADAPTERS = [
  'mongodb',
  'postgres',
  'sqlite',
  'vercel-postgres',
  'd1-sqlite',
] as const

export type StorageAdapter =
  | 'azureStorage'
  | 'gcsStorage'
  | 'localDisk'
  | 'r2Storage'
  | 's3Storage'
  | 'uploadthingStorage'
  | 'vercelBlobStorage'

export type TransformOptions = {
  databaseAdapter?: {
    envVarName?: string
    type: DatabaseAdapter
  }
  removeSharp?: boolean
  storageAdapter?: {
    type: StorageAdapter
  }
}

export type WriteOptions = {
  formatWithPrettier?: boolean
  validateStructure?: boolean
}

export type WriteResult = {
  error?: DetectionError
  success: boolean
}

export type ConfigureOptions = {
  db?: {
    envVarName?: string
    type: DatabaseAdapter
  }
  removeSharp?: boolean
  storage?: StorageAdapter
} & WriteOptions
