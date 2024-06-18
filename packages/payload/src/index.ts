import type { ExecutionResult, GraphQLSchema, ValidationRule } from 'graphql'
import type { OperationArgs, Request as graphQLRequest } from 'graphql-http'
import type pino from 'pino'

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
import type { BulkOperationResult, Collection, TypeWithID } from './collections/config/types.js'
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
import type { TypeWithID as GlobalTypeWithID, Globals } from './globals/config/types.js'
import type { Options as FindGlobalOptions } from './globals/operations/local/findOne.js'
import type { Options as FindGlobalVersionByIDOptions } from './globals/operations/local/findVersionByID.js'
import type { Options as FindGlobalVersionsOptions } from './globals/operations/local/findVersions.js'
import type { Options as RestoreGlobalVersionOptions } from './globals/operations/local/restoreVersion.js'
import type { Options as UpdateGlobalOptions } from './globals/operations/local/update.js'
import type { TypeWithVersion } from './versions/types.js'

import { decrypt, encrypt } from './auth/crypto.js'
import { APIKeyAuthentication } from './auth/strategies/apiKey.js'
import { JWTAuthentication } from './auth/strategies/jwt.js'
import localOperations from './collections/operations/local/index.js'
import { validateSchema } from './config/validate.js'
import { consoleEmailAdapter } from './email/consoleEmailAdapter.js'
import { fieldAffectsData } from './fields/config/types.js'
import localGlobalOperations from './globals/operations/local/index.js'
import { getDependencies } from './utilities/dependencies/getDependencies.js'
import flattenFields from './utilities/flattenTopLevelFields.js'
import Logger from './utilities/logger.js'
import { serverInit as serverInitTelemetry } from './utilities/telemetry/events/serverInit.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * @description Payload
 */
export class BasePayload<TGeneratedTypes extends GeneratedTypes> {
  /**
   * @description Authorization and Authentication using headers and cookies to run auth user strategies
   * @returns cookies: Map<string, string>
   * @returns permissions: Permissions
   * @returns user: User
   */
  auth = async (options: AuthArgs) => {
    const { auth } = localOperations.auth
    return auth(this, options)
  }

  authStrategies: AuthStrategy[]

  collections: {
    [slug: number | string | symbol]: Collection
  } = {}

  config: SanitizedConfig

  /**
   * @description Performs count operation
   * @param options
   * @returns count of documents satisfying query
   */
  count = async <T extends keyof TGeneratedTypes['collections']>(
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
  create = async <T extends keyof TGeneratedTypes['collections']>(
    options: CreateOptions<T>,
  ): Promise<TGeneratedTypes['collections'][T]> => {
    const { create } = localOperations
    return create<T>(this, options)
  }
  db: DatabaseAdapter

  decrypt = decrypt

  duplicate = async <T extends keyof TGeneratedTypes['collections']>(
    options: DuplicateOptions<T>,
  ): Promise<TGeneratedTypes['collections'][T]> => {
    const { duplicate } = localOperations
    return duplicate<T>(this, options)
  }

  email: InitializedEmailAdapter

  // TODO: re-implement or remove?
  // errorHandler: ErrorHandler

  encrypt = encrypt

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
  find = async <T extends keyof TGeneratedTypes['collections']>(
    options: FindOptions<T>,
  ): Promise<PaginatedDocs<TGeneratedTypes['collections'][T]>> => {
    const { find } = localOperations
    return find<T>(this, options)
  }

  /**
   * @description Find document by ID
   * @param options
   * @returns document with specified ID
   */
  findByID = async <T extends keyof TGeneratedTypes['collections']>(
    options: FindByIDOptions<T>,
  ): Promise<TGeneratedTypes['collections'][T]> => {
    const { findByID } = localOperations
    return findByID<T>(this, options)
  }

  findGlobal = async <T extends keyof TGeneratedTypes['globals']>(
    options: FindGlobalOptions<T>,
  ): Promise<TGeneratedTypes['globals'][T]> => {
    const { findOne } = localGlobalOperations
    return findOne<T>(this, options)
  }

  /**
   * @description Find global version by ID
   * @param options
   * @returns global version with specified ID
   */
  findGlobalVersionByID = async <T extends keyof TGeneratedTypes['globals']>(
    options: FindGlobalVersionByIDOptions<T>,
  ): Promise<TypeWithVersion<TGeneratedTypes['globals'][T]>> => {
    const { findVersionByID } = localGlobalOperations
    return findVersionByID<T>(this, options)
  }

  /**
   * @description Find global versions with criteria
   * @param options
   * @returns versions satisfying query
   */
  findGlobalVersions = async <T extends keyof TGeneratedTypes['globals']>(
    options: FindGlobalVersionsOptions<T>,
  ): Promise<PaginatedDocs<TypeWithVersion<TGeneratedTypes['globals'][T]>>> => {
    const { findVersions } = localGlobalOperations
    return findVersions<T>(this, options)
  }

  /**
   * @description Find version by ID
   * @param options
   * @returns version with specified ID
   */
  findVersionByID = async <T extends keyof TGeneratedTypes['collections']>(
    options: FindVersionByIDOptions<T>,
  ): Promise<TypeWithVersion<TGeneratedTypes['collections'][T]>> => {
    const { findVersionByID } = localOperations
    return findVersionByID<T>(this, options)
  }

  /**
   * @description Find versions with criteria
   * @param options
   * @returns versions satisfying query
   */
  findVersions = async <T extends keyof TGeneratedTypes['collections']>(
    options: FindVersionsOptions<T>,
  ): Promise<PaginatedDocs<TypeWithVersion<TGeneratedTypes['collections'][T]>>> => {
    const { findVersions } = localOperations
    return findVersions<T>(this, options)
  }

  forgotPassword = async <T extends keyof TGeneratedTypes['collections']>(
    options: ForgotPasswordOptions<T>,
  ): Promise<ForgotPasswordResult> => {
    const { forgotPassword } = localOperations.auth
    return forgotPassword<T>(this, options)
  }

  getAPIURL = (): string => `${this.config.serverURL}${this.config.routes.api}`

  getAdminURL = (): string => `${this.config.serverURL}${this.config.routes.admin}`

  globals: Globals

  logger: pino.Logger

  login = async <T extends keyof TGeneratedTypes['collections']>(
    options: LoginOptions<T>,
  ): Promise<LoginResult & { user: TGeneratedTypes['collections'][T] }> => {
    const { login } = localOperations.auth
    return login<T>(this, options)
  }

  resetPassword = async <T extends keyof TGeneratedTypes['collections']>(
    options: ResetPasswordOptions<T>,
  ): Promise<ResetPasswordResult> => {
    const { resetPassword } = localOperations.auth
    return resetPassword<T>(this, options)
  }

  /**
   * @description Restore global version by ID
   * @param options
   * @returns version with specified ID
   */
  restoreGlobalVersion = async <T extends keyof TGeneratedTypes['globals']>(
    options: RestoreGlobalVersionOptions<T>,
  ): Promise<TGeneratedTypes['globals'][T]> => {
    const { restoreVersion } = localGlobalOperations
    return restoreVersion<T>(this, options)
  }

  /**
   * @description Restore version by ID
   * @param options
   * @returns version with specified ID
   */
  restoreVersion = async <T extends keyof TGeneratedTypes['collections']>(
    options: RestoreVersionOptions<T>,
  ): Promise<TGeneratedTypes['collections'][T]> => {
    const { restoreVersion } = localOperations
    return restoreVersion<T>(this, options)
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

  unlock = async <T extends keyof TGeneratedTypes['collections']>(
    options: UnlockOptions<T>,
  ): Promise<boolean> => {
    const { unlock } = localOperations.auth
    return unlock(this, options)
  }

  updateGlobal = async <T extends keyof TGeneratedTypes['globals']>(
    options: UpdateGlobalOptions<T>,
  ): Promise<TGeneratedTypes['globals'][T]> => {
    const { update } = localGlobalOperations
    return update<T>(this, options)
  }

  validationRules: (args: OperationArgs<any>) => ValidationRule[]

  verifyEmail = async <T extends keyof TGeneratedTypes['collections']>(
    options: VerifyEmailOptions<T>,
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
  delete<T extends keyof TGeneratedTypes['collections']>(
    options: DeleteByIDOptions<T>,
  ): Promise<TGeneratedTypes['collections'][T]>

  delete<T extends keyof TGeneratedTypes['collections']>(
    options: DeleteManyOptions<T>,
  ): Promise<BulkOperationResult<T>>

  delete<T extends keyof TGeneratedTypes['collections']>(
    options: DeleteOptions<T>,
  ): Promise<BulkOperationResult<T> | TGeneratedTypes['collections'][T]> {
    const { deleteLocal } = localOperations
    return deleteLocal<T>(this, options)
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
      if (Object.keys(foundVersions).length !== 1) {
        const formattedVersionsWithPackageNameString = Object.entries(foundVersions)
          .map(([version, pkg]) => `${pkg}@${version}`)
          .join(', ')

        throw new Error(
          `Mismatching payload dependency versions found: ${formattedVersionsWithPackageNameString}. All payload and @payloadcms/* packages must have the same version.`,
        )
      }
    }

    if (!options?.config) {
      throw new Error('Error: the payload config is required to initialize payload.')
    }

    this.logger = Logger('payload', options.loggerOptions, options.loggerDestination)

    this.config = await options.config

    if (process.env.NODE_ENV !== 'production') {
      validateSchema(this.config, this.logger)
    }

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
      this.logger.warn(
        `No email adapter provided. Email will be written to console. More info at https://payloadcms.com/docs/email/overview.`,
      )

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

  update<T extends keyof TGeneratedTypes['collections']>(
    options: UpdateManyOptions<T>,
  ): Promise<BulkOperationResult<T>>

  /**
   * @description Update one or more documents
   * @param options
   * @returns Updated document(s)
   */
  update<T extends keyof TGeneratedTypes['collections']>(
    options: UpdateByIDOptions<T>,
  ): Promise<TGeneratedTypes['collections'][T]>

  update<T extends keyof TGeneratedTypes['collections']>(
    options: UpdateOptions<T>,
  ): Promise<BulkOperationResult<T> | TGeneratedTypes['collections'][T]> {
    const { update } = localOperations
    return update<T>(this, options)
  }
}

const initialized = new BasePayload()

export default initialized

let cached = global._payload

if (!cached) {
  // eslint-disable-next-line no-multi-assign
  cached = global._payload = { payload: null, promise: null }
}

export const getPayload = async (options: InitOptions): Promise<BasePayload<GeneratedTypes>> => {
  if (!options?.config) {
    throw new Error('Error: the payload config is required for getPayload to work.')
  }

  if (cached.payload) {
    return cached.payload
  }

  if (!cached.promise) {
    cached.promise = new BasePayload<GeneratedTypes>().init(options)
  }

  try {
    cached.payload = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.payload
}

type GeneratedTypes = {
  collections: {
    [slug: number | string | symbol]: TypeWithID & Record<string, unknown>
  }
  globals: {
    [slug: number | string | symbol]: GlobalTypeWithID & Record<string, unknown>
  }
  locale: null | string
  user: User
}

type Payload = BasePayload<GeneratedTypes>

interface RequestContext {
  [key: string]: unknown
}

type DatabaseAdapter = BaseDatabaseAdapter

export type { DatabaseAdapter, GeneratedTypes, Payload, RequestContext }

export * from './types/index.js'
export type * from './admin/types.js'
export type * from './uploads/types.js'

export type { MeOperationResult } from './auth/operations/me.js'

export type { ClientCollectionConfig } from './collections/config/client.js'

export type {
  AfterChangeHook as CollectionAfterChangeHook,
  AfterDeleteHook as CollectionAfterDeleteHook,
  AfterErrorHook as CollectionAfterErrorHook,
  AfterForgotPasswordHook as CollectionAfterForgotPasswordHook,
  AfterLoginHook as CollectionAfterLoginHook,
  AfterOperationHook as CollectionAfterOperationHook,
  AfterReadHook as CollectionAfterReadHook,
  BeforeChangeHook as CollectionBeforeChangeHook,
  BeforeDeleteHook as CollectionBeforeDeleteHook,
  BeforeLoginHook as CollectionBeforeLoginHook,
  BeforeOperationHook as CollectionBeforeOperationHook,
  BeforeReadHook as CollectionBeforeReadHook,
  BeforeValidateHook as CollectionBeforeValidateHook,
  Collection,
  CollectionConfig,
  SanitizedCollectionConfig,
  TypeWithID,
  TypeWithTimestamps,
} from './collections/config/types.js'

export { createDataloaderCacheKey, getDataLoader } from './collections/dataloader.js'

export { buildConfig } from './config/build.js'
export type { ClientConfig } from './config/client.js'
export type {
  Access,
  AccessArgs,
  EditViewComponent,
  EntityDescription,
  EntityDescriptionComponent,
  EntityDescriptionFunction,
  SanitizedConfig,
} from './config/types.js'

export type { EmailAdapter as PayloadEmailAdapter, SendEmailOptions } from './email/types.js'

export {
  APIError,
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
} from './errors/index.js'

export type { ClientFieldConfig } from './fields/config/client.js'

export type {
  ArrayField,
  Block,
  BlockField,
  CheckboxField,
  ClientValidate,
  CodeField,
  CollapsibleField,
  Condition,
  DateField,
  EmailField,
  Field,
  FieldAccess,
  FieldAffectingData,
  FieldBase,
  FieldHook,
  FieldHookArgs,
  FieldPresentationalOnly,
  FieldWithMany,
  FieldWithMaxDepth,
  FieldWithPath,
  FieldWithSubFields,
  FilterOptions,
  FilterOptionsProps,
  GroupField,
  HookName,
  JSONField,
  Labels,
  NamedTab,
  NonPresentationalField,
  NumberField,
  Option,
  OptionObject,
  PointField,
  PolymorphicRelationshipField,
  RadioField,
  RelationshipField,
  RelationshipValue,
  RichTextField,
  RowAdmin,
  RowField,
  SelectField,
  SingleRelationshipField,
  Tab,
  TabAsField,
  TabsAdmin,
  TabsField,
  TextField,
  TextareaField,
  UIField,
  UnnamedTab,
  UploadField,
  Validate,
  ValidateOptions,
  ValueWithRelation,
} from './fields/config/types.js'
export { traverseFields as afterChangeTraverseFields } from './fields/hooks/afterChange/traverseFields.js'

export { promise as afterReadPromise } from './fields/hooks/afterRead/promise.js'
export { traverseFields as afterReadTraverseFields } from './fields/hooks/afterRead/traverseFields.js'
export { traverseFields as beforeChangeTraverseFields } from './fields/hooks/beforeChange/traverseFields.js'
export { traverseFields as beforeValidateTraverseFields } from './fields/hooks/beforeValidate/traverseFields.js'

export type { ClientGlobalConfig } from './globals/config/client.js'
export type {
  AfterChangeHook as GlobalAfterChangeHook,
  AfterReadHook as GlobalAfterReadHook,
  BeforeChangeHook as GlobalBeforeChangeHook,
  BeforeReadHook as GlobalBeforeReadHook,
  BeforeValidateHook as GlobalBeforeValidateHook,
  GlobalConfig,
  SanitizedGlobalConfig,
} from './globals/config/types.js'

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

export { combineMerge } from './utilities/combineMerge.js'

export {
  configToJSONSchema,
  entityToJSONSchema,
  fieldsToJSONSchema,
  withNullableJSONSchemaType,
} from './utilities/configToJSONSchema.js'

export { createArrayFromCommaDelineated } from './utilities/createArrayFromCommaDelineated.js'
export { createLocalReq } from './utilities/createLocalReq.js'

export { default as flattenTopLevelFields } from './utilities/flattenTopLevelFields.js'

export { formatLabels, formatNames, toWords } from './utilities/formatLabels.js'

export { getCollectionIDFieldTypes } from './utilities/getCollectionIDFieldTypes.js'
export { getObjectDotNotation } from './utilities/getObjectDotNotation.js'
export { isEntityHidden } from './utilities/isEntityHidden.js'
export { isPlainObject } from './utilities/isPlainObject.js'
export { isValidID } from './utilities/isValidID.js'
export { default as isolateObjectProperty } from './utilities/isolateObjectProperty.js'
export { mapAsync } from './utilities/mapAsync.js'

export { mergeListSearchAndWhere } from './utilities/mergeListSearchAndWhere.js'
export { buildVersionCollectionFields } from './versions/buildCollectionFields.js'
export { buildVersionGlobalFields } from './versions/buildGlobalFields.js'
export { versionDefaults } from './versions/defaults.js'
export { deleteCollectionVersions } from './versions/deleteCollectionVersions.js'
export { enforceMaxVersions } from './versions/enforceMaxVersions.js'
export { getLatestCollectionVersion } from './versions/getLatestCollectionVersion.js'
export { getLatestGlobalVersion } from './versions/getLatestGlobalVersion.js'

export { saveVersion } from './versions/saveVersion.js'
export type { TypeWithVersion } from './versions/types.js'
export * from './config/types.js'

export type { FieldTypes } from './admin/forms/FieldTypes.js'
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
export { createClientCollectionConfig } from './collections/config/client.js'
export { createClientConfig } from './config/client.js'

export { defaults } from './config/defaults.js'
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
export { baseBlockFields } from './fields/baseFields/baseBlockFields.js'
export { baseIDField } from './fields/baseFields/baseIDField.js'
export { createClientFieldConfig } from './fields/config/client.js'
export { sanitizeFields } from './fields/config/sanitize.js'

export { createClientGlobalConfig } from './globals/config/client.js'

export type * from './database/queryValidation/types.js'

export { accessOperation } from './auth/operations/access.js'
export { forgotPasswordOperation } from './auth/operations/forgotPassword.js'
export { initOperation } from './auth/operations/init.js'
export { loginOperation } from './auth/operations/login.js'

export { logoutOperation } from './auth/operations/logout.js'
export { meOperation } from './auth/operations/me.js'
export { refreshOperation } from './auth/operations/refresh.js'
export { registerFirstUserOperation } from './auth/operations/registerFirstUser.js'
export { resetPasswordOperation } from './auth/operations/resetPassword.js'
export { unlockOperation } from './auth/operations/unlock.js'
export { verifyEmailOperation } from './auth/operations/verifyEmail.js'
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
export { sanitizeConfig } from './config/sanitize.js'
export type { EntityPolicies, PathToQuery } from './database/queryValidation/types.js'
export { default as getDefaultValue } from './fields/getDefaultValue.js'
export { default as sortableFieldTypes } from './fields/sortableFieldTypes.js'

export { docAccessOperation as docAccessOperationGlobal } from './globals/operations/docAccess.js'
export { findOneOperation } from './globals/operations/findOne.js'
export { findVersionByIDOperation as findVersionByIDOperationGlobal } from './globals/operations/findVersionByID.js'
export { findVersionsOperation as findVersionsOperationGlobal } from './globals/operations/findVersions.js'
export { restoreVersionOperation as restoreVersionOperationGlobal } from './globals/operations/restoreVersion.js'
export { updateOperation as updateOperationGlobal } from './globals/operations/update.js'

export * from './auth/index.js'
export { default as executeAccess } from './auth/executeAccess.js'
export { executeAuthStrategies } from './auth/executeAuthStrategies.js'
export { getAccessResults } from './auth/getAccessResults.js'
export { getFieldsToSign } from './auth/getFieldsToSign.js'
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

export { validateQueryPaths } from './database/queryValidation/validateQueryPaths.js'

export { validateSearchParam } from './database/queryValidation/validateSearchParams.js'

export { getFileByPath } from './uploads/getFileByPath.js'

export { commitTransaction } from './utilities/commitTransaction.js'

export { getDependencies }

export { initTransaction } from './utilities/initTransaction.js'

export { killTransaction } from './utilities/killTransaction.js'
