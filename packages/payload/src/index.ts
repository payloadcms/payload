import type { ExecutionResult, GraphQLSchema, ValidationRule } from 'graphql'
import type { OperationArgs, Request as graphQLRequest } from 'graphql-http'
import type { Logger } from 'pino'

import { spawn } from 'child_process'
import crypto from 'crypto'
import { fileURLToPath } from 'node:url'
import path from 'path'

import type { AuthArgs } from './auth/operations/auth.js'
import type { Result as ForgotPasswordResult } from './auth/operations/forgotPassword.js'
import type { Options as ForgotPasswordOptions } from './auth/operations/local/forgotPassword.js'
import type { Options as LoginOptions } from './auth/operations/local/login.js'
import type { Options as ResetPasswordOptions } from './auth/operations/local/resetPassword.js'
import type { Options as UnlockOptions } from './auth/operations/local/unlock.js'
import type { Options as VerifyEmailOptions } from './auth/operations/local/verifyEmail.js'
import type { Result as LoginResult } from './auth/operations/login.js'
import type { Result as ResetPasswordResult } from './auth/operations/resetPassword.js'
import type { AuthStrategy, User } from './auth/types.js'
import type { ImportMap } from './bin/generateImportMap/index.js'
import type {
  BulkOperationResult,
  Collection,
  DataFromCollectionSlug,
  TypeWithID,
} from './collections/config/types.js'
import type { Options as CountOptions } from './collections/operations/local/count.js'
import type { Options as CreateOptions } from './collections/operations/local/create.js'
import type {
  ByIDOptions as DeleteByIDOptions,
  ManyOptions as DeleteManyOptions,
  Options as DeleteOptions,
} from './collections/operations/local/delete.js'
import type { Options as DuplicateOptions } from './collections/operations/local/duplicate.js'
import type { Options as FindOptions } from './collections/operations/local/find.js'
import type { Options as FindByIDOptions } from './collections/operations/local/findByID.js'
import type { Options as FindVersionByIDOptions } from './collections/operations/local/findVersionByID.js'
import type { Options as FindVersionsOptions } from './collections/operations/local/findVersions.js'
import type { Options as RestoreVersionOptions } from './collections/operations/local/restoreVersion.js'
import type {
  ByIDOptions as UpdateByIDOptions,
  ManyOptions as UpdateManyOptions,
  Options as UpdateOptions,
} from './collections/operations/local/update.js'
import type { InitOptions, SanitizedConfig } from './config/types.js'
import type { BaseDatabaseAdapter, PaginatedDocs } from './database/types.js'
import type { InitializedEmailAdapter } from './email/types.js'
import type { DataFromGlobalSlug, Globals } from './globals/config/types.js'
import type { Options as FindGlobalOptions } from './globals/operations/local/findOne.js'
import type { Options as FindGlobalVersionByIDOptions } from './globals/operations/local/findVersionByID.js'
import type { Options as FindGlobalVersionsOptions } from './globals/operations/local/findVersions.js'
import type { Options as RestoreGlobalVersionOptions } from './globals/operations/local/restoreVersion.js'
import type { Options as UpdateGlobalOptions } from './globals/operations/local/update.js'
import type { JsonObject } from './types/index.js'
import type { TypeWithVersion } from './versions/types.js'

import { decrypt, encrypt } from './auth/crypto.js'
import { APIKeyAuthentication } from './auth/strategies/apiKey.js'
import { JWTAuthentication } from './auth/strategies/jwt.js'
import localOperations from './collections/operations/local/index.js'
import { consoleEmailAdapter } from './email/consoleEmailAdapter.js'
import { fieldAffectsData } from './fields/config/types.js'
import localGlobalOperations from './globals/operations/local/index.js'
import { getDependencies } from './utilities/dependencies/getDependencies.js'
import flattenFields from './utilities/flattenTopLevelFields.js'
import { getLogger } from './utilities/logger.js'
import { serverInit as serverInitTelemetry } from './utilities/telemetry/events/serverInit.js'

export interface GeneratedTypes {
  authUntyped: {
    [slug: string]: {
      forgotPassword: {
        email: string
      }
      login: {
        email: string
        password: string
      }
      registerFirstUser: {
        email: string
        password: string
      }
      unlock: {
        email: string
      }
    }
  }
  collectionsUntyped: {
    [slug: string]: JsonObject & TypeWithID
  }
  globalsUntyped: {
    [slug: string]: JsonObject
  }
  localeUntyped: null | string
  userUntyped: User
}

// Helper type to resolve the correct type using conditional types
type ResolveCollectionType<T> = 'collections' extends keyof T
  ? T['collections']
  : // @ts-expect-error
    T['collectionsUntyped']
// @ts-expect-error
type ResolveGlobalType<T> = 'globals' extends keyof T ? T['globals'] : T['globalsUntyped']

// Applying helper types to GeneratedTypes
export type TypedCollection = ResolveCollectionType<GeneratedTypes>
export type TypedGlobal = ResolveGlobalType<GeneratedTypes>

// Extract string keys from the type
type StringKeyOf<T> = Extract<keyof T, string>

// Define the types for slugs using the appropriate collections and globals
export type CollectionSlug = StringKeyOf<TypedCollection>
export type GlobalSlug = StringKeyOf<TypedGlobal>

// now for locale and user

// @ts-expect-error
type ResolveLocaleType<T> = 'locale' extends keyof T ? T['locale'] : T['localeUntyped']
// @ts-expect-error
type ResolveUserType<T> = 'user' extends keyof T ? T['user'] : T['userUntyped']

export type TypedLocale = ResolveLocaleType<GeneratedTypes>
export type TypedUser = ResolveUserType<GeneratedTypes>

// @ts-expect-error
type ResolveAuthOperationsType<T> = 'auth' extends keyof T ? T['auth'] : T['authUntyped']
export type TypedAuthOperations = ResolveAuthOperationsType<GeneratedTypes>

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * @description Payload
 */
export class BasePayload {
  /**
   * @description Authorization and Authentication using headers and cookies to run auth user strategies
   * @returns permissions: Permissions
   * @returns user: User
   */
  auth = async (options: AuthArgs) => {
    const { auth } = localOperations.auth
    return auth(this, options)
  }

  authStrategies: AuthStrategy[]

  collections: {
    [slug: string]: Collection
  } = {}

  config: SanitizedConfig
  /**
   * @description Performs count operation
   * @param options
   * @returns count of documents satisfying query
   */
  count = async <T extends CollectionSlug>(
    options: CountOptions<T>,
  ): Promise<{ totalDocs: number }> => {
    const { count } = localOperations
    return count(this, options)
  }

  /**
   * @description Performs create operation
   * @param options
   * @returns created document
   */
  create = async <TSlug extends CollectionSlug>(
    options: CreateOptions<TSlug>,
  ): Promise<DataFromCollectionSlug<TSlug>> => {
    const { create } = localOperations
    return create<TSlug>(this, options)
  }

  db: DatabaseAdapter
  decrypt = decrypt

  duplicate = async <TSlug extends CollectionSlug>(
    options: DuplicateOptions<TSlug>,
  ): Promise<DataFromCollectionSlug<TSlug>> => {
    const { duplicate } = localOperations
    return duplicate<TSlug>(this, options)
  }

  email: InitializedEmailAdapter

  encrypt = encrypt

  // TODO: re-implement or remove?
  // errorHandler: ErrorHandler

  extensions: (args: {
    args: OperationArgs<any>
    req: graphQLRequest<unknown, unknown>
    result: ExecutionResult
  }) => Promise<any>

  /**
   * @description Find documents with criteria
   * @param options
   * @returns documents satisfying query
   */
  find = async <TSlug extends CollectionSlug>(
    options: FindOptions<TSlug>,
  ): Promise<PaginatedDocs<DataFromCollectionSlug<TSlug>>> => {
    const { find } = localOperations
    return find<TSlug>(this, options)
  }

  /**
   * @description Find document by ID
   * @param options
   * @returns document with specified ID
   */
  findByID = async <TSlug extends CollectionSlug>(
    options: FindByIDOptions<TSlug>,
  ): Promise<DataFromCollectionSlug<TSlug>> => {
    const { findByID } = localOperations
    return findByID<TSlug>(this, options)
  }

  findGlobal = async <TSlug extends GlobalSlug>(
    options: FindGlobalOptions<TSlug>,
  ): Promise<DataFromGlobalSlug<TSlug>> => {
    const { findOne } = localGlobalOperations
    return findOne<TSlug>(this, options)
  }

  /**
   * @description Find global version by ID
   * @param options
   * @returns global version with specified ID
   */
  findGlobalVersionByID = async <TSlug extends GlobalSlug>(
    options: FindGlobalVersionByIDOptions<TSlug>,
  ): Promise<TypeWithVersion<DataFromGlobalSlug<TSlug>>> => {
    const { findVersionByID } = localGlobalOperations
    return findVersionByID<TSlug>(this, options)
  }

  /**
   * @description Find global versions with criteria
   * @param options
   * @returns versions satisfying query
   */
  findGlobalVersions = async <TSlug extends GlobalSlug>(
    options: FindGlobalVersionsOptions<TSlug>,
  ): Promise<PaginatedDocs<TypeWithVersion<DataFromGlobalSlug<TSlug>>>> => {
    const { findVersions } = localGlobalOperations
    return findVersions<TSlug>(this, options)
  }

  /**
   * @description Find version by ID
   * @param options
   * @returns version with specified ID
   */
  findVersionByID = async <TSlug extends CollectionSlug>(
    options: FindVersionByIDOptions<TSlug>,
  ): Promise<TypeWithVersion<DataFromCollectionSlug<TSlug>>> => {
    const { findVersionByID } = localOperations
    return findVersionByID<TSlug>(this, options)
  }

  /**
   * @description Find versions with criteria
   * @param options
   * @returns versions satisfying query
   */
  findVersions = async <TSlug extends CollectionSlug>(
    options: FindVersionsOptions<TSlug>,
  ): Promise<PaginatedDocs<TypeWithVersion<DataFromCollectionSlug<TSlug>>>> => {
    const { findVersions } = localOperations
    return findVersions<TSlug>(this, options)
  }

  forgotPassword = async <TSlug extends CollectionSlug>(
    options: ForgotPasswordOptions<TSlug>,
  ): Promise<ForgotPasswordResult> => {
    const { forgotPassword } = localOperations.auth
    return forgotPassword<TSlug>(this, options)
  }

  getAPIURL = (): string => `${this.config.serverURL}${this.config.routes.api}`

  getAdminURL = (): string => `${this.config.serverURL}${this.config.routes.admin}`

  globals: Globals

  importMap: ImportMap

  logger: Logger

  login = async <TSlug extends CollectionSlug>(
    options: LoginOptions<TSlug>,
  ): Promise<{ user: DataFromCollectionSlug<TSlug> } & LoginResult> => {
    const { login } = localOperations.auth
    return login<TSlug>(this, options)
  }

  resetPassword = async <TSlug extends CollectionSlug>(
    options: ResetPasswordOptions<TSlug>,
  ): Promise<ResetPasswordResult> => {
    const { resetPassword } = localOperations.auth
    return resetPassword<TSlug>(this, options)
  }

  /**
   * @description Restore global version by ID
   * @param options
   * @returns version with specified ID
   */
  restoreGlobalVersion = async <TSlug extends GlobalSlug>(
    options: RestoreGlobalVersionOptions<TSlug>,
  ): Promise<DataFromGlobalSlug<TSlug>> => {
    const { restoreVersion } = localGlobalOperations
    return restoreVersion<TSlug>(this, options)
  }

  /**
   * @description Restore version by ID
   * @param options
   * @returns version with specified ID
   */
  restoreVersion = async <TSlug extends CollectionSlug>(
    options: RestoreVersionOptions<TSlug>,
  ): Promise<DataFromCollectionSlug<TSlug>> => {
    const { restoreVersion } = localOperations
    return restoreVersion<TSlug>(this, options)
  }

  schema: GraphQLSchema

  secret: string

  sendEmail: InitializedEmailAdapter['sendEmail']

  types: {
    arrayTypes: any
    blockInputTypes: any
    blockTypes: any
    fallbackLocaleInputType?: any
    groupTypes: any
    localeInputType?: any
    tabTypes: any
  }

  unlock = async <TSlug extends CollectionSlug>(
    options: UnlockOptions<TSlug>,
  ): Promise<boolean> => {
    const { unlock } = localOperations.auth
    return unlock<TSlug>(this, options)
  }

  updateGlobal = async <TSlug extends GlobalSlug>(
    options: UpdateGlobalOptions<TSlug>,
  ): Promise<DataFromGlobalSlug<TSlug>> => {
    const { update } = localGlobalOperations
    return update<TSlug>(this, options)
  }

  validationRules: (args: OperationArgs<any>) => ValidationRule[]

  verifyEmail = async <TSlug extends CollectionSlug>(
    options: VerifyEmailOptions<TSlug>,
  ): Promise<boolean> => {
    const { verifyEmail } = localOperations.auth
    return verifyEmail(this, options)
  }

  versions: {
    [slug: string]: any // TODO: Type this
  } = {}

  async bin({
    args,
    cwd,
    log,
  }: {
    args: string[]
    cwd?: string
    log?: boolean
  }): Promise<{ code: number }> {
    return new Promise((resolve, reject) => {
      const spawned = spawn('node', [path.resolve(dirname, '../bin.js'), ...args], {
        cwd,
        stdio: log || log === undefined ? 'inherit' : 'ignore',
      })

      spawned.on('exit', (code) => {
        resolve({ code })
      })

      spawned.on('error', (error) => {
        reject(error)
      })
    })
  }

  /**
   * @description delete one or more documents
   * @param options
   * @returns Updated document(s)
   */
  delete<TSlug extends CollectionSlug>(
    options: DeleteByIDOptions<TSlug>,
  ): Promise<DataFromCollectionSlug<TSlug>>

  delete<TSlug extends CollectionSlug>(
    options: DeleteManyOptions<TSlug>,
  ): Promise<BulkOperationResult<TSlug>>

  delete<TSlug extends CollectionSlug>(
    options: DeleteOptions<TSlug>,
  ): Promise<BulkOperationResult<TSlug> | DataFromCollectionSlug<TSlug>> {
    const { deleteLocal } = localOperations
    return deleteLocal<TSlug>(this, options)
  }

  /**
   * @description Initializes Payload
   * @param options
   */
  async init(options: InitOptions): Promise<Payload> {
    if (process.env.NODE_ENV !== 'production') {
      // First load. First check if there are mismatching dependency versions of payload packages
      const resolvedDependencies = await getDependencies(dirname, [
        '@payloadcms/ui/shared',
        'payload',
        '@payloadcms/next/utilities',
        '@payloadcms/richtext-lexical',
        '@payloadcms/richtext-slate',
        '@payloadcms/graphql',
        '@payloadcms/plugin-cloud',
        '@payloadcms/db-mongodb',
        '@payloadcms/db-postgres',
        '@payloadcms/plugin-form-builder',
        '@payloadcms/plugin-nested-docs',
        '@payloadcms/plugin-seo',
        '@payloadcms/plugin-search',
        '@payloadcms/plugin-cloud-storage',
        '@payloadcms/plugin-stripe',
        '@payloadcms/plugin-zapier',
        '@payloadcms/plugin-redirects',
        '@payloadcms/plugin-sentry',
        '@payloadcms/bundler-webpack',
        '@payloadcms/bundler-vite',
        '@payloadcms/live-preview',
        '@payloadcms/live-preview-react',
        '@payloadcms/translations',
        '@payloadcms/email-nodemailer',
        '@payloadcms/email-resend',
        '@payloadcms/storage-azure',
        '@payloadcms/storage-s3',
        '@payloadcms/storage-gcs',
        '@payloadcms/storage-vercel-blob',
        '@payloadcms/storage-uploadthing',
      ])

      // Go through each resolved dependency. If any dependency has a mismatching version, throw an error
      const foundVersions: {
        [version: string]: string
      } = {}
      for (const [_pkg, { version }] of resolvedDependencies.resolved) {
        if (!Object.keys(foundVersions).includes(version)) {
          foundVersions[version] = _pkg
        }
      }
      if (Object.keys(foundVersions).length > 1) {
        const formattedVersionsWithPackageNameString = Object.entries(foundVersions)
          .map(([version, pkg]) => `${pkg}@${version}`)
          .join(', ')

        throw new Error(
          `Mismatching payload dependency versions found: ${formattedVersionsWithPackageNameString}. All payload and @payloadcms/* packages must have the same version. This is an error with your set-up, caused by you, not a bug in payload. Please go to your package.json and ensure all payload and @payloadcms/* packages have the same version.`,
        )
      }
    }

    this.importMap = options.importMap

    if (!options?.config) {
      throw new Error('Error: the payload config is required to initialize payload.')
    }

    this.logger = getLogger('payload', options.loggerOptions, options.loggerDestination)

    this.config = await options.config

    if (!this.config.secret) {
      throw new Error('Error: missing secret key. A secret key is needed to secure Payload.')
    }

    this.secret = crypto.createHash('sha256').update(this.config.secret).digest('hex').slice(0, 32)

    this.globals = {
      config: this.config.globals,
    }

    this.config.collections.forEach((collection) => {
      const customID = flattenFields(collection.fields).find(
        (field) => fieldAffectsData(field) && field.name === 'id',
      )

      let customIDType

      if (customID?.type === 'number' || customID?.type === 'text') customIDType = customID.type

      this.collections[collection.slug] = {
        config: collection,
        customIDType,
      }
    })

    // Generate types on startup
    if (process.env.NODE_ENV !== 'production' && this.config.typescript.autoGenerate !== false) {
      // We cannot run it directly here, as generate-types imports json-schema-to-typescript, which breaks on turbopack.
      // see: https://github.com/vercel/next.js/issues/66723
      void this.bin({
        args: ['generate:types'],
        log: false,
      })
    }

    this.db = this.config.db.init({ payload: this })
    this.db.payload = this

    if (this.db?.init) {
      await this.db.init()
    }

    if (!options.disableDBConnect && this.db.connect) {
      await this.db.connect()
    }

    // Load email adapter
    if (this.config.email instanceof Promise) {
      const awaitedAdapter = await this.config.email
      this.email = awaitedAdapter({ payload: this })
    } else if (this.config.email) {
      this.email = this.config.email({ payload: this })
    } else {
      if (process.env.NEXT_PHASE !== 'phase-production-build') {
        this.logger.warn(
          `No email adapter provided. Email will be written to console. More info at https://payloadcms.com/docs/email/overview.`,
        )
      }

      this.email = consoleEmailAdapter({ payload: this })
    }

    // Warn if image resizing is enabled but sharp is not installed
    if (
      !this.config.sharp &&
      this.config.collections.some((c) => c.upload.imageSizes || c.upload.formatOptions)
    ) {
      this.logger.warn(
        `Image resizing is enabled for one or more collections, but sharp not installed. Please install 'sharp' and pass into the config.`,
      )
    }

    this.sendEmail = this.email['sendEmail']

    serverInitTelemetry(this)

    // 1. loop over collections, if collection has auth strategy, initialize and push to array
    let jwtStrategyEnabled = false
    this.authStrategies = this.config.collections.reduce((authStrategies, collection) => {
      if (collection?.auth) {
        if (collection.auth.strategies.length > 0) {
          authStrategies.push(...collection.auth.strategies)
        }

        // 2. if api key enabled, push api key strategy into the array
        if (collection.auth?.useAPIKey) {
          authStrategies.push({
            name: `${collection.slug}-api-key`,
            authenticate: APIKeyAuthentication(collection),
          })
        }

        // 3. if localStrategy flag is true
        if (!collection.auth.disableLocalStrategy && !jwtStrategyEnabled) {
          jwtStrategyEnabled = true
        }
      }

      return authStrategies
    }, [] as AuthStrategy[])

    // 4. if enabled, push jwt strategy into authStrategies last
    if (jwtStrategyEnabled) {
      this.authStrategies.push({
        name: 'local-jwt',
        authenticate: JWTAuthentication,
      })
    }

    if (!options.disableOnInit) {
      if (typeof options.onInit === 'function') await options.onInit(this)
      if (typeof this.config.onInit === 'function') await this.config.onInit(this)
    }

    return this
  }

  update<TSlug extends CollectionSlug>(
    options: UpdateManyOptions<TSlug>,
  ): Promise<BulkOperationResult<TSlug>>

  /**
   * @description Update one or more documents
   * @param options
   * @returns Updated document(s)
   */
  update<TSlug extends CollectionSlug>(
    options: UpdateByIDOptions<TSlug>,
  ): Promise<DataFromCollectionSlug<TSlug>>

  update<TSlug extends CollectionSlug>(
    options: UpdateOptions<TSlug>,
  ): Promise<BulkOperationResult<TSlug> | DataFromCollectionSlug<TSlug>> {
    const { update } = localOperations
    return update<TSlug>(this, options)
  }
}

const initialized = new BasePayload()

export default initialized

let cached = global._payload

if (!cached) {
  cached = global._payload = { payload: null, promise: null }
}

export const getPayload = async (options: InitOptions): Promise<BasePayload> => {
  if (!options?.config) {
    throw new Error('Error: the payload config is required for getPayload to work.')
  }

  if (cached.payload) {
    return cached.payload
  }

  if (!cached.promise) {
    cached.promise = new BasePayload().init(options)
  }

  try {
    cached.payload = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.payload
}

type Payload = BasePayload

interface RequestContext {
  [key: string]: unknown
}

export interface DatabaseAdapter extends BaseDatabaseAdapter {}
export type { Payload, RequestContext }
export type * from './admin/types.js'
export type { MappedView } from './admin/views/types.js'
export { default as executeAccess } from './auth/executeAccess.js'
export { executeAuthStrategies } from './auth/executeAuthStrategies.js'
export { getAccessResults } from './auth/getAccessResults.js'
export { getFieldsToSign } from './auth/getFieldsToSign.js'
export * from './auth/index.js'
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
export type {
  AuthStrategyFunction,
  AuthStrategyFunctionArgs,
  CollectionPermission,
  DocumentPermissions,
  FieldPermissions,
  GlobalPermission,
  IncomingAuthType,
  Permission,
  Permissions,
  User,
  VerifyConfig,
} from './auth/types.js'
export { generateImportMap } from './bin/generateImportMap/index.js'

export type { ImportMap } from './bin/generateImportMap/index.js'
export { genImportMapIterateFields } from './bin/generateImportMap/iterateFields.js'
export type { ClientCollectionConfig } from './collections/config/client.js'
export type {
  ServerOnlyCollectionAdminProperties,
  ServerOnlyCollectionProperties,
} from './collections/config/client.js'
export type {
  AfterChangeHook as CollectionAfterChangeHook,
  AfterDeleteHook as CollectionAfterDeleteHook,
  AfterErrorHook as CollectionAfterErrorHook,
  AfterForgotPasswordHook as CollectionAfterForgotPasswordHook,
  AfterLoginHook as CollectionAfterLoginHook,
  AfterLogoutHook as CollectionAfterLogoutHook,
  AfterMeHook as CollectionAfterMeHook,
  AfterOperationHook as CollectionAfterOperationHook,
  AfterReadHook as CollectionAfterReadHook,
  AfterRefreshHook as CollectionAfterRefreshHook,
  AuthCollection,
  AuthOperationsFromCollectionSlug,
  BeforeChangeHook as CollectionBeforeChangeHook,
  BeforeDeleteHook as CollectionBeforeDeleteHook,
  BeforeLoginHook as CollectionBeforeLoginHook,
  BeforeOperationHook as CollectionBeforeOperationHook,
  BeforeReadHook as CollectionBeforeReadHook,
  BeforeValidateHook as CollectionBeforeValidateHook,
  BulkOperationResult,
  Collection,
  CollectionAdminOptions,
  CollectionConfig,
  DataFromCollectionSlug,
  HookOperationType,
  MeHook as CollectionMeHook,
  RefreshHook as CollectionRefreshHook,
  RequiredDataFromCollection,
  RequiredDataFromCollectionSlug,
  SanitizedCollectionConfig,
  TypeWithID,
  TypeWithTimestamps,
} from './collections/config/types.js'
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
export { buildConfig } from './config/build.js'
export type { ClientConfig } from './config/client.js'

export { serverOnlyConfigProperties } from './config/client.js'
export { defaults } from './config/defaults.js'
export { sanitizeConfig } from './config/sanitize.js'
export type * from './config/types.js'
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
export { writeMigrationIndex } from './database/migrations/writeMigrationIndex.js'
export type * from './database/queryValidation/types.js'
export type { EntityPolicies, PathToQuery } from './database/queryValidation/types.js'
export { validateQueryPaths } from './database/queryValidation/validateQueryPaths.js'
export { validateSearchParam } from './database/queryValidation/validateSearchParams.js'
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
  UpdateGlobal,
  UpdateGlobalArgs,
  UpdateGlobalVersion,
  UpdateGlobalVersionArgs,
  UpdateOne,
  UpdateOneArgs,
  UpdateVersion,
  UpdateVersionArgs,
} from './database/types.js'
export type { EmailAdapter as PayloadEmailAdapter, SendEmailOptions } from './email/types.js'
export {
  APIError,
  APIErrorName,
  AuthenticationError,
  DuplicateCollection,
  DuplicateFieldName,
  DuplicateGlobal,
  ErrorDeletingFile,
  FileRetrievalError,
  FileUploadError,
  Forbidden,
  InvalidConfiguration,
  InvalidFieldName,
  InvalidFieldRelationship,
  LockedAuth,
  MissingCollectionLabel,
  MissingEditorProp,
  MissingFieldInputOptions,
  MissingFieldType,
  MissingFile,
  NotFound,
  QueryError,
  ValidationError,
  ValidationErrorName,
} from './errors/index.js'
export { baseBlockFields } from './fields/baseFields/baseBlockFields.js'
export { baseIDField } from './fields/baseFields/baseIDField.js'
export type { ServerOnlyFieldProperties } from './fields/config/client.js'
export type { ServerOnlyFieldAdminProperties } from './fields/config/client.js'
export { sanitizeFields } from './fields/config/sanitize.js'
export type {
  AdminClient,
  ArrayField,
  ArrayFieldClient,
  BaseValidateOptions,
  Block,
  BlockField,
  BlockFieldClient,
  CheckboxField,
  CheckboxFieldClient,
  ClientBlock,
  ClientField,
  CodeField,
  CodeFieldClient,
  CollapsibleField,
  CollapsibleFieldClient,
  Condition,
  DateField,
  DateFieldClient,
  EmailField,
  EmailFieldClient,
  Field,
  FieldAccess,
  FieldAffectingData,
  FieldAffectingDataClient,
  FieldBase,
  FieldBaseClient,
  FieldHook,
  FieldHookArgs,
  FieldPresentationalOnly,
  FieldPresentationalOnlyClient,
  FieldTypes,
  FieldWithMany,
  FieldWithManyClient,
  FieldWithMaxDepth,
  FieldWithMaxDepthClient,
  FieldWithPath,
  FieldWithPathClient,
  FieldWithSubFields,
  FieldWithSubFieldsClient,
  FilterOptions,
  FilterOptionsProps,
  GroupField,
  GroupFieldClient,
  HookName,
  JSONField,
  JSONFieldClient,
  Labels,
  LabelsClient,
  NamedTab,
  NonPresentationalField,
  NonPresentationalFieldClient,
  NumberField,
  NumberFieldClient,
  Option,
  OptionObject,
  PointField,
  PointFieldClient,
  PolymorphicRelationshipField,
  PolymorphicRelationshipFieldClient,
  RadioField,
  RadioFieldClient,
  RelationshipField,
  RelationshipFieldClient,
  RelationshipValue,
  RichTextField,
  RichTextFieldClient,
  RowField,
  RowFieldClient,
  SelectField,
  SelectFieldClient,
  SingleRelationshipField,
  SingleRelationshipFieldClient,
  Tab,
  TabAsField,
  TabAsFieldClient,
  TabsField,
  TabsFieldClient,
  TextField,
  TextFieldClient,
  TextareaField,
  TextareaFieldClient,
  UIField,
  UIFieldClient,
  UnnamedTab,
  UploadField,
  UploadFieldClient,
  Validate,
  ValidateOptions,
  ValueWithRelation,
} from './fields/config/types.js'

export { getDefaultValue } from './fields/getDefaultValue.js'
export { traverseFields as afterChangeTraverseFields } from './fields/hooks/afterChange/traverseFields.js'
export { promise as afterReadPromise } from './fields/hooks/afterRead/promise.js'
export { traverseFields as afterReadTraverseFields } from './fields/hooks/afterRead/traverseFields.js'
export { traverseFields as beforeChangeTraverseFields } from './fields/hooks/beforeChange/traverseFields.js'
export { traverseFields as beforeValidateTraverseFields } from './fields/hooks/beforeValidate/traverseFields.js'
export { default as sortableFieldTypes } from './fields/sortableFieldTypes.js'
export type {
  ArrayFieldValidation,
  BlockFieldValidation,
  CheckboxFieldValidation,
  CodeFieldValidation,
  ConfirmPasswordFieldValidation,
  DateFieldValidation,
  EmailFieldValidation,
  JSONFieldValidation,
  NumberFieldValidation,
  PasswordFieldValidation,
  PointFieldValidation,
  RadioFieldValidation,
  RelationshipFieldValidation,
  RichTextFieldValidation,
  SelectFieldValidation,
  TextFieldValidation,
  TextareaFieldValidation,
  UploadFieldValidation,
  UsernameFieldValidation,
} from './fields/validations.js'
export type { ClientGlobalConfig } from './globals/config/client.js'
export type {
  ServerOnlyGlobalAdminProperties,
  ServerOnlyGlobalProperties,
} from './globals/config/client.js'
export type {
  AfterChangeHook as GlobalAfterChangeHook,
  AfterReadHook as GlobalAfterReadHook,
  BeforeChangeHook as GlobalBeforeChangeHook,
  BeforeReadHook as GlobalBeforeReadHook,
  BeforeValidateHook as GlobalBeforeValidateHook,
  DataFromGlobalSlug,
  GlobalAdminOptions,
  GlobalConfig,
  SanitizedGlobalConfig,
} from './globals/config/types.js'
export { docAccessOperation as docAccessOperationGlobal } from './globals/operations/docAccess.js'
export { findOneOperation } from './globals/operations/findOne.js'
export { findVersionByIDOperation as findVersionByIDOperationGlobal } from './globals/operations/findVersionByID.js'
export { findVersionsOperation as findVersionsOperationGlobal } from './globals/operations/findVersions.js'
export { restoreVersionOperation as restoreVersionOperationGlobal } from './globals/operations/restoreVersion.js'
export { updateOperation as updateOperationGlobal } from './globals/operations/update.js'
export type {
  CollapsedPreferences,
  DocumentPreferences,
  FieldsPreferences,
  InsideFieldsPreferences,
  PreferenceRequest,
  PreferenceUpdateRequest,
  TabsPreferences,
} from './preferences/types.js'
export { getLocalI18n } from './translations/getLocalI18n.js'
export * from './types/index.js'
export { getFileByPath } from './uploads/getFileByPath.js'
export type * from './uploads/types.js'
export { commitTransaction } from './utilities/commitTransaction.js'
export {
  configToJSONSchema,
  entityToJSONSchema,
  fieldsToJSONSchema,
  withNullableJSONSchemaType,
} from './utilities/configToJSONSchema.js'
export { createArrayFromCommaDelineated } from './utilities/createArrayFromCommaDelineated.js'
export { createLocalReq } from './utilities/createLocalReq.js'
export {
  deepCopyObject,
  deepCopyObjectComplex,
  deepCopyObjectSimple,
} from './utilities/deepCopyObject.js'
export {
  deepMerge,
  deepMergeWithCombinedArrays,
  deepMergeWithReactComponents,
  deepMergeWithSourceArrays,
} from './utilities/deepMerge.js'
export { default as flattenTopLevelFields } from './utilities/flattenTopLevelFields.js'
export { formatLabels, formatNames, toWords } from './utilities/formatLabels.js'
export { getCollectionIDFieldTypes } from './utilities/getCollectionIDFieldTypes.js'
export { getObjectDotNotation } from './utilities/getObjectDotNotation.js'
export { initTransaction } from './utilities/initTransaction.js'
export { isEntityHidden } from './utilities/isEntityHidden.js'
export { isPlainObject } from './utilities/isPlainObject.js'
export { isValidID } from './utilities/isValidID.js'
export { default as isolateObjectProperty } from './utilities/isolateObjectProperty.js'
export { killTransaction } from './utilities/killTransaction.js'
export { mapAsync } from './utilities/mapAsync.js'
export { mergeListSearchAndWhere } from './utilities/mergeListSearchAndWhere.js'
export { buildVersionCollectionFields } from './versions/buildCollectionFields.js'
export { buildVersionGlobalFields } from './versions/buildGlobalFields.js'
export { getDependencies }
export { versionDefaults } from './versions/defaults.js'
export { deleteCollectionVersions } from './versions/deleteCollectionVersions.js'
export { enforceMaxVersions } from './versions/enforceMaxVersions.js'
export { getLatestCollectionVersion } from './versions/getLatestCollectionVersion.js'
export { getLatestGlobalVersion } from './versions/getLatestGlobalVersion.js'
export { saveVersion } from './versions/saveVersion.js'
export type { TypeWithVersion } from './versions/types.js'

export { deepMergeSimple } from '@payloadcms/translations/utilities'
