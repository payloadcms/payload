export * from './index.js'

/**
 * Error names that can be thrown by Payload during runtime
 */
export type ErrorName =
  | 'APIError'
  | 'AuthenticationError'
  | 'ErrorDeletingFile'
  | 'FileRetrievalError'
  | 'FileUploadError'
  | 'Forbidden'
  | 'Locked'
  | 'LockedAuth'
  | 'MissingFile'
  | 'NotFound'
  | 'QueryError'
  | 'UnverifiedEmail'
  | 'ValidationError'
