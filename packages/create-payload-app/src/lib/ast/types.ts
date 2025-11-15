import type {
  ArrayLiteralExpression,
  CallExpression,
  ImportDeclaration,
  PropertyAssignment,
  SourceFile,
} from 'ts-morph'

export interface DetectionError {
  debugInfo?: Record<string, unknown>
  technicalDetails: string
  userMessage: string
}

export interface PayloadConfigStructures {
  buildConfigCall: CallExpression
  dbProperty?: PropertyAssignment
  importStatements: ImportDeclaration[]
  pluginsArray?: ArrayLiteralExpression
}

export interface DetectionResult {
  error?: DetectionError
  sourceFile?: SourceFile
  structures?: PayloadConfigStructures
  success: boolean
}

export type DatabaseAdapter = 'd1-sqlite' | 'mongodb' | 'postgres' | 'sqlite' | 'vercel-postgres'

export type StorageAdapter =
  | 'azureStorage'
  | 'gcsStorage'
  | 'localDisk'
  | 'r2Storage'
  | 's3Storage'
  | 'uploadthingStorage'
  | 'vercelBlobStorage'

export interface TransformOptions {
  databaseAdapter?: {
    envVarName?: string
    type: DatabaseAdapter
  }
  removeSharp?: boolean
  storageAdapter?: {
    type: StorageAdapter
  }
}

export interface WriteOptions {
  debugMode?: boolean
  formatWithPrettier?: boolean
  validateStructure?: boolean
}

export interface WriteResult {
  error?: DetectionError
  success: boolean
}

export interface ConfigureOptions extends WriteOptions {
  db?: {
    envVarName?: string
    type: DatabaseAdapter
  }
  removeSharp?: boolean
  storage?: StorageAdapter
}
