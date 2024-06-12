/**
 * WARNING: This file contains exports that can only be safely used on the server.
 */

export { generateTypes } from './bin/generateTypes.js'
export { loadEnv } from './bin/loadEnv.js'
export { findConfig } from './config/find.js'
export type {
  BaseDatabaseAdapter,
  BeginTransaction,
  CommitTransaction,
  Connect,
  Count,
  CountArgs,
  Create,
  CreateArgs,
  CreateGlobal,
  CreateGlobalArgs,
  CreateGlobalVersion,
  CreateGlobalVersionArgs,
  CreateMigration,
  CreateVersion,
  CreateVersionArgs,
  DBIdentifierName,
  DatabaseAdapterResult as DatabaseAdapterObj,
  DeleteMany,
  DeleteManyArgs,
  DeleteOne,
  DeleteOneArgs,
  DeleteVersions,
  DeleteVersionsArgs,
  Destroy,
  Find,
  FindArgs,
  FindGlobal,
  FindGlobalArgs,
  FindGlobalVersions,
  FindGlobalVersionsArgs,
  FindOne,
  FindOneArgs,
  FindVersions,
  FindVersionsArgs,
  Init,
  Migration,
  MigrationData,
  MigrationTemplateArgs,
  PaginatedDocs,
  QueryDrafts,
  QueryDraftsArgs,
  RollbackTransaction,
  Transaction,
  TypeWithVersion,
  UpdateGlobal,
  UpdateGlobalArgs,
  UpdateGlobalVersion,
  UpdateGlobalVersionArgs,
  UpdateOne,
  UpdateOneArgs,
  UpdateVersion,
  UpdateVersionArgs,
} from './database/types.js'

export { importConfig, importWithoutClientFiles } from './utilities/importWithoutClientFiles.js'

export type * from './database/queryValidation/types.js'

export { buildConfig } from './config/build.js'

export { combineQueries } from './database/combineQueries.js'

export { createDatabaseAdapter } from './database/createDatabaseAdapter.js'

export { default as flattenWhereToOperators } from './database/flattenWhereToOperators.js'

export { getLocalizedPaths } from './database/getLocalizedPaths.js'

export { createMigration } from './database/migrations/createMigration.js'

export { getMigrations } from './database/migrations/getMigrations.js'

export { getPredefinedMigration } from './database/migrations/getPredefinedMigration.js'

export { migrate } from './database/migrations/migrate.js'

export { migrateDown } from './database/migrations/migrateDown.js'

export { migrateRefresh } from './database/migrations/migrateRefresh.js'

export { migrateReset } from './database/migrations/migrateReset.js'

export { migrateStatus } from './database/migrations/migrateStatus.js'

export { migrationTemplate } from './database/migrations/migrationTemplate.js'

export { migrationsCollection } from './database/migrations/migrationsCollection.js'

export { readMigrationFiles } from './database/migrations/readMigrationFiles.js'

export type { EntityPolicies, PathToQuery } from './database/queryValidation/types.js'

export { validateQueryPaths } from './database/queryValidation/validateQueryPaths.js'

export { validateSearchParam } from './database/queryValidation/validateSearchParams.js'
export { commitTransaction } from './utilities/commitTransaction.js'
export { initTransaction } from './utilities/initTransaction.js'

export { killTransaction } from './utilities/killTransaction.js'
export * from './config/types.js'

export type { FieldTypes } from './admin/forms/FieldTypes.js'
export { default as executeAccess } from './auth/executeAccess.js'
export { executeAuthStrategies } from './auth/executeAuthStrategies.js'
export { getAccessResults } from './auth/getAccessResults.js'
export { getFieldsToSign } from './auth/getFieldsToSign.js'
export {
  extractJWT,
  generateCookie,
  generateExpiredPayloadCookie,
  generatePayloadCookie,
  getCookieExpiration,
  hasWhereAccessResult,
  parseCookies,
} from './auth/index.js'
export { accessOperation } from './auth/operations/access.js'
export { forgotPasswordOperation } from './auth/operations/forgotPassword.js'
export { initOperation } from './auth/operations/init.js'
export { loginOperation } from './auth/operations/login.js'
export { logoutOperation } from './auth/operations/logout.js'

export type { MeOperationResult } from './auth/operations/me.js'

export { meOperation } from './auth/operations/me.js'
export { refreshOperation } from './auth/operations/refresh.js'

export { registerFirstUserOperation } from './auth/operations/registerFirstUser.js'
export { resetPasswordOperation } from './auth/operations/resetPassword.js'
export { unlockOperation } from './auth/operations/unlock.js'
export { verifyEmailOperation } from './auth/operations/verifyEmail.js'
export { createClientCollectionConfig } from './collections/config/client.js'
export { defaults as collectionDefaults } from './collections/config/defaults.js'
export { createDataloaderCacheKey, getDataLoader } from './collections/dataloader.js'

export { countOperation } from './collections/operations/count.js'

export { createOperation } from './collections/operations/create.js'

export { deleteOperation } from './collections/operations/delete.js'

export { deleteByIDOperation } from './collections/operations/deleteByID.js'

export { docAccessOperation } from './collections/operations/docAccess.js'
export { duplicateOperation } from './collections/operations/duplicate.js'
export { findOperation } from './collections/operations/find.js'
export { findByIDOperation } from './collections/operations/findByID.js'

export { findVersionByIDOperation } from './collections/operations/findVersionByID.js'

export { findVersionsOperation } from './collections/operations/findVersions.js'
export { restoreVersionOperation } from './collections/operations/restoreVersion.js'

export { updateOperation } from './collections/operations/update.js'

export { updateByIDOperation } from './collections/operations/updateByID.js'
export { createClientConfig } from './config/client.js'
export { defaults } from './config/defaults.js'

export { sanitizeConfig } from './config/sanitize.js'

export { baseBlockFields } from './fields/baseFields/baseBlockFields.js'
export { baseIDField } from './fields/baseFields/baseIDField.js'

export { createClientFieldConfig } from './fields/config/client.js'
export { sanitizeFields } from './fields/config/sanitize.js'
export {
  array,
  blocks,
  checkbox,
  code,
  date,
  email,
  json,
  number,
  password,
  point,
  radio,
  relationship,
  richText,
  select,
  text,
  textarea,
  upload,
} from './fields/validations.js'

export { createClientGlobalConfig } from './globals/config/client.js'

export { docAccessOperation as docAccessOperationGlobal } from './globals/operations/docAccess.js'
export { findOneOperation } from './globals/operations/findOne.js'
export { findVersionByIDOperation as findVersionByIDOperationGlobal } from './globals/operations/findVersionByID.js'

export { findVersionsOperation as findVersionsOperationGlobal } from './globals/operations/findVersions.js'

export { restoreVersionOperation as restoreVersionOperationGlobal } from './globals/operations/restoreVersion.js'

export { updateOperation as updateOperationGlobal } from './globals/operations/update.js'

export { getFileByPath } from './uploads/getFileByPath.js'
