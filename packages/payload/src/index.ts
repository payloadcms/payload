// @ts-strict-ignore
import type { ExecutionResult, GraphQLSchema, ValidationRule } from 'graphql'
import type { Request as graphQLRequest, OperationArgs } from 'graphql-http'
import type { Logger } from 'pino'
import type { NonNever } from 'ts-essentials'

import { spawn } from 'child_process'
import crypto from 'crypto'
import { fileURLToPath } from 'node:url'
import path from 'path'
import WebSocket from 'ws'

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
import type {
  BulkOperationResult,
  Collection,
  DataFromCollectionSlug,
  SelectFromCollectionSlug,
  TypeWithID,
} from './collections/config/types.js'
export type { FieldState } from './admin/forms/Form.js'
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
import type { DataFromGlobalSlug, Globals, SelectFromGlobalSlug } from './globals/config/types.js'
import type { CountGlobalVersionsOptions } from './globals/operations/local/countGlobalVersions.js'
import type { Options as FindGlobalOptions } from './globals/operations/local/findOne.js'
import type { Options as FindGlobalVersionByIDOptions } from './globals/operations/local/findVersionByID.js'
import type { Options as FindGlobalVersionsOptions } from './globals/operations/local/findVersions.js'
import type { Options as RestoreGlobalVersionOptions } from './globals/operations/local/restoreVersion.js'
import type { Options as UpdateGlobalOptions } from './globals/operations/local/update.js'
import type {
  ApplyDisableErrors,
  JsonObject,
  SelectType,
  TransformCollectionWithSelect,
  TransformGlobalWithSelect,
} from './types/index.js'
import type { TraverseFieldsCallback } from './utilities/traverseFields.js'
export type * from './admin/types.js'
import type { SupportedLanguages } from '@payloadcms/translations'

import { Cron } from 'croner'

import type { ClientConfig } from './config/client.js'
import type { TypeWithVersion } from './versions/types.js'

import { decrypt, encrypt } from './auth/crypto.js'
import { APIKeyAuthentication } from './auth/strategies/apiKey.js'
import { JWTAuthentication } from './auth/strategies/jwt.js'
import { generateImportMap, type ImportMap } from './bin/generateImportMap/index.js'
import { checkPayloadDependencies } from './checkPayloadDependencies.js'
import localOperations from './collections/operations/local/index.js'
import { consoleEmailAdapter } from './email/consoleEmailAdapter.js'
import { fieldAffectsData, type FlattenedBlock } from './fields/config/types.js'
import localGlobalOperations from './globals/operations/local/index.js'
import { getJobsLocalAPI } from './queues/localAPI.js'
import { isNextBuild } from './utilities/isNextBuild.js'
import { getLogger } from './utilities/logger.js'
import { serverInit as serverInitTelemetry } from './utilities/telemetry/events/serverInit.js'
import { traverseFields } from './utilities/traverseFields.js'

export { default as executeAccess } from './auth/executeAccess.js'
export { executeAuthStrategies } from './auth/executeAuthStrategies.js'

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

  blocksUntyped: {
    [slug: string]: JsonObject
  }
  collectionsJoinsUntyped: {
    [slug: string]: {
      [schemaPath: string]: CollectionSlug
    }
  }
  collectionsSelectUntyped: {
    [slug: string]: SelectType
  }

  collectionsUntyped: {
    [slug: string]: JsonObject & TypeWithID
  }
  dbUntyped: {
    defaultIDType: number | string
  }
  globalsSelectUntyped: {
    [slug: string]: SelectType
  }

  globalsUntyped: {
    [slug: string]: JsonObject
  }
  jobsUntyped: {
    tasks: {
      [slug: string]: {
        input?: JsonObject
        output?: JsonObject
      }
    }
    workflows: {
      [slug: string]: {
        input: JsonObject
      }
    }
  }
  localeUntyped: null | string
  userUntyped: User
}

// Helper type to resolve the correct type using conditional types
type ResolveCollectionType<T> = 'collections' extends keyof T
  ? T['collections']
  : // @ts-expect-error
    T['collectionsUntyped']

type ResolveBlockType<T> = 'blocks' extends keyof T
  ? T['blocks']
  : // @ts-expect-error
    T['blocksUntyped']

type ResolveCollectionSelectType<T> = 'collectionsSelect' extends keyof T
  ? T['collectionsSelect']
  : // @ts-expect-error
    T['collectionsSelectUntyped']

type ResolveCollectionJoinsType<T> = 'collectionsJoins' extends keyof T
  ? T['collectionsJoins']
  : // @ts-expect-error
    T['collectionsJoinsUntyped']

type ResolveGlobalType<T> = 'globals' extends keyof T
  ? T['globals']
  : // @ts-expect-error
    T['globalsUntyped']

type ResolveGlobalSelectType<T> = 'globalsSelect' extends keyof T
  ? T['globalsSelect']
  : // @ts-expect-error
    T['globalsSelectUntyped']

// Applying helper types to GeneratedTypes
export type TypedCollection = ResolveCollectionType<GeneratedTypes>

export type TypedBlock = ResolveBlockType<GeneratedTypes>

export type TypedUploadCollection = NonNever<{
  [K in keyof TypedCollection]:
    | 'filename'
    | 'filesize'
    | 'mimeType'
    | 'url' extends keyof TypedCollection[K]
    ? TypedCollection[K]
    : never
}>

export type TypedCollectionSelect = ResolveCollectionSelectType<GeneratedTypes>

export type TypedCollectionJoins = ResolveCollectionJoinsType<GeneratedTypes>

export type TypedGlobal = ResolveGlobalType<GeneratedTypes>

export type TypedGlobalSelect = ResolveGlobalSelectType<GeneratedTypes>

// Extract string keys from the type
export type StringKeyOf<T> = Extract<keyof T, string>

// Define the types for slugs using the appropriate collections and globals
export type CollectionSlug = StringKeyOf<TypedCollection>

export type BlockSlug = StringKeyOf<TypedBlock>

export type UploadCollectionSlug = StringKeyOf<TypedUploadCollection>

type ResolveDbType<T> = 'db' extends keyof T
  ? T['db']
  : // @ts-expect-error
    T['dbUntyped']

export type DefaultDocumentIDType = ResolveDbType<GeneratedTypes>['defaultIDType']
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

// @ts-expect-error
type ResolveJobOperationsType<T> = 'jobs' extends keyof T ? T['jobs'] : T['jobsUntyped']
export type TypedJobs = ResolveJobOperationsType<GeneratedTypes>

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let checkedDependencies = false

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

  blocks: Record<BlockSlug, FlattenedBlock> = {}

  collections: Record<CollectionSlug, Collection> = {}

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
   * @description Performs countGlobalVersions operation
   * @param options
   * @returns count of global document versions satisfying query
   */
  countGlobalVersions = async <T extends GlobalSlug>(
    options: CountGlobalVersionsOptions<T>,
  ): Promise<{ totalDocs: number }> => {
    const { countGlobalVersions } = localGlobalOperations
    return countGlobalVersions(this, options)
  }

  /**
   * @description Performs countVersions operation
   * @param options
   * @returns count of document versions satisfying query
   */
  countVersions = async <T extends CollectionSlug>(
    options: CountOptions<T>,
  ): Promise<{ totalDocs: number }> => {
    const { countVersions } = localOperations
    return countVersions(this, options)
  }

  /**
   * @description Performs create operation
   * @param options
   * @returns created document
   */
  create = async <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(
    options: CreateOptions<TSlug, TSelect>,
  ): Promise<TransformCollectionWithSelect<TSlug, TSelect>> => {
    const { create } = localOperations
    return create<TSlug, TSelect>(this, options)
  }

  db: DatabaseAdapter
  decrypt = decrypt

  duplicate = async <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(
    options: DuplicateOptions<TSlug, TSelect>,
  ): Promise<TransformCollectionWithSelect<TSlug, TSelect>> => {
    const { duplicate } = localOperations
    return duplicate<TSlug, TSelect>(this, options)
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
  find = async <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(
    options: FindOptions<TSlug, TSelect>,
  ): Promise<PaginatedDocs<TransformCollectionWithSelect<TSlug, TSelect>>> => {
    const { find } = localOperations
    return find<TSlug, TSelect>(this, options)
  }

  /**
   * @description Find document by ID
   * @param options
   * @returns document with specified ID
   */
  findByID = async <
    TSlug extends CollectionSlug,
    TDisableErrors extends boolean,
    TSelect extends SelectFromCollectionSlug<TSlug>,
  >(
    options: FindByIDOptions<TSlug, TDisableErrors, TSelect>,
  ): Promise<ApplyDisableErrors<TransformCollectionWithSelect<TSlug, TSelect>, TDisableErrors>> => {
    const { findByID } = localOperations
    return findByID<TSlug, TDisableErrors, TSelect>(this, options)
  }

  findGlobal = async <TSlug extends GlobalSlug, TSelect extends SelectFromGlobalSlug<TSlug>>(
    options: FindGlobalOptions<TSlug, TSelect>,
  ): Promise<TransformGlobalWithSelect<TSlug, TSelect>> => {
    const { findOne } = localGlobalOperations
    return findOne<TSlug, TSelect>(this, options)
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

  getAdminURL = (): string => `${this.config.serverURL}${this.config.routes.admin}`

  getAPIURL = (): string => `${this.config.serverURL}${this.config.routes.api}`

  globals: Globals

  importMap: ImportMap

  jobs = getJobsLocalAPI(this)

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

  updateGlobal = async <TSlug extends GlobalSlug, TSelect extends SelectFromGlobalSlug<TSlug>>(
    options: UpdateGlobalOptions<TSlug, TSelect>,
  ): Promise<TransformGlobalWithSelect<TSlug, TSelect>> => {
    const { update } = localGlobalOperations
    return update<TSlug, TSelect>(this, options)
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
  delete<TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(
    options: DeleteByIDOptions<TSlug, TSelect>,
  ): Promise<TransformCollectionWithSelect<TSlug, TSelect>>

  delete<TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(
    options: DeleteManyOptions<TSlug, TSelect>,
  ): Promise<BulkOperationResult<TSlug, TSelect>>

  delete<TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(
    options: DeleteOptions<TSlug, TSelect>,
  ): Promise<BulkOperationResult<TSlug, TSelect> | TransformCollectionWithSelect<TSlug, TSelect>> {
    const { deleteLocal } = localOperations
    return deleteLocal<TSlug, TSelect>(this, options)
  }

  /**
   * @description Initializes Payload
   * @param options
   */
  async init(options: InitOptions): Promise<Payload> {
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.PAYLOAD_DISABLE_DEPENDENCY_CHECKER !== 'true' &&
      !checkedDependencies
    ) {
      checkedDependencies = true
      void checkPayloadDependencies()
    }

    this.importMap = options.importMap

    if (!options?.config) {
      throw new Error('Error: the payload config is required to initialize payload.')
    }

    this.config = await options.config
    this.logger = getLogger('payload', this.config.logger)

    if (!this.config.secret) {
      throw new Error('Error: missing secret key. A secret key is needed to secure Payload.')
    }

    this.secret = crypto.createHash('sha256').update(this.config.secret).digest('hex').slice(0, 32)

    this.globals = {
      config: this.config.globals,
    }

    for (const collection of this.config.collections) {
      let customIDType = undefined
      const findCustomID: TraverseFieldsCallback = ({ field }) => {
        if (
          ['array', 'blocks', 'group'].includes(field.type) ||
          (field.type === 'tab' && 'name' in field)
        ) {
          return true
        }

        if (!fieldAffectsData(field)) {
          return
        }

        if (field.name === 'id') {
          customIDType = field.type
          return true
        }
      }

      traverseFields({
        callback: findCustomID,
        config: this.config,
        fields: collection.fields,
        parentIsLocalized: false,
      })

      this.collections[collection.slug] = {
        config: collection,
        customIDType,
      }
    }

    this.blocks = this.config.blocks.reduce((blocks, block) => {
      blocks[block.slug] = block
      return blocks
    }, {})

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

    // Warn if user is deploying to Vercel, and any upload collection is missing a storage adapter
    if (process.env.VERCEL) {
      const uploadCollWithoutAdapter = this.config.collections.filter(
        (c) => c.upload && c.upload.adapter === undefined, // Uploads enabled, but no storage adapter provided
      )

      if (uploadCollWithoutAdapter.length) {
        const slugs = uploadCollWithoutAdapter.map((c) => c.slug).join(', ')
        this.logger.warn(
          `Collections with uploads enabled require a storage adapter when deploying to Vercel. Collection(s) without storage adapters: ${slugs}. See https://payloadcms.com/docs/upload/storage-adapters for more info.`,
        )
      }
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

    try {
      if (!options.disableOnInit) {
        if (typeof options.onInit === 'function') {
          await options.onInit(this)
        }
        if (typeof this.config.onInit === 'function') {
          await this.config.onInit(this)
        }
      }
    } catch (error) {
      this.logger.error({ err: error }, 'Error running onInit function')
      throw error
    }

    if (this.config.jobs.autoRun && !isNextBuild()) {
      const DEFAULT_CRON = '* * * * *'
      const DEFAULT_LIMIT = 10

      const cronJobs =
        typeof this.config.jobs.autoRun === 'function'
          ? await this.config.jobs.autoRun(this)
          : this.config.jobs.autoRun

      await Promise.all(
        cronJobs.map((cronConfig) => {
          const job = new Cron(cronConfig.cron ?? DEFAULT_CRON, async () => {
            if (typeof this.config.jobs.shouldAutoRun === 'function') {
              const shouldAutoRun = await this.config.jobs.shouldAutoRun(this)

              if (!shouldAutoRun) {
                job.stop()

                return false
              }
            }

            await this.jobs.run({
              limit: cronConfig.limit ?? DEFAULT_LIMIT,
              queue: cronConfig.queue,
            })
          })
        }),
      )
    }

    return this
  }

  update<TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(
    options: UpdateManyOptions<TSlug, TSelect>,
  ): Promise<BulkOperationResult<TSlug, TSelect>>

  /**
   * @description Update one or more documents
   * @param options
   * @returns Updated document(s)
   */
  update<TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(
    options: UpdateByIDOptions<TSlug, TSelect>,
  ): Promise<TransformCollectionWithSelect<TSlug, TSelect>>

  update<TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(
    options: UpdateOptions<TSlug, TSelect>,
  ): Promise<BulkOperationResult<TSlug, TSelect> | TransformCollectionWithSelect<TSlug, TSelect>> {
    const { update } = localOperations
    return update<TSlug, TSelect>(this, options)
  }
}

const initialized = new BasePayload()

export default initialized

let cached: {
  payload: null | Payload
  promise: null | Promise<Payload>
  reload: boolean | Promise<void>
  ws: null | WebSocket
} = global._payload

if (!cached) {
  cached = global._payload = { payload: null, promise: null, reload: false, ws: null }
}

export const reload = async (
  config: SanitizedConfig,
  payload: Payload,
  skipImportMapGeneration?: boolean,
): Promise<void> => {
  if (typeof payload.db.destroy === 'function') {
    await payload.db.destroy()
  }

  payload.config = config

  payload.collections = config.collections.reduce((collections, collection) => {
    collections[collection.slug] = {
      config: collection,
      customIDType: payload.collections[collection.slug]?.customIDType,
    }
    return collections
  }, {})

  payload.blocks = config.blocks.reduce((blocks, block) => {
    blocks[block.slug] = block
    return blocks
  }, {})

  payload.globals = {
    config: config.globals,
  }

  // TODO: support HMR for other props in the future (see payload/src/index init()) that may change on Payload singleton

  // Generate types
  if (config.typescript.autoGenerate !== false) {
    // We cannot run it directly here, as generate-types imports json-schema-to-typescript, which breaks on turbopack.
    // see: https://github.com/vercel/next.js/issues/66723
    void payload.bin({
      args: ['generate:types'],
      log: false,
    })
  }

  // Generate component map
  if (skipImportMapGeneration !== true && config.admin?.importMap?.autoGenerate !== false) {
    await generateImportMap(config, {
      log: true,
    })
  }

  await payload.db.init()

  if (payload.db.connect) {
    await payload.db.connect({ hotReload: true })
  }

  global._payload_clientConfigs = {} as Record<keyof SupportedLanguages, ClientConfig>
  global._payload_schemaMap = null
  global._payload_clientSchemaMap = null
  global._payload_doNotCacheClientConfig = true // This will help refreshing the client config cache more reliably. If you remove this, please test HMR + client config refreshing (do new fields appear in the document?)
  global._payload_doNotCacheSchemaMap = true
  global._payload_doNotCacheClientSchemaMap = true
}

export const getPayload = async (
  options: Pick<InitOptions, 'config' | 'importMap'>,
): Promise<Payload> => {
  if (!options?.config) {
    throw new Error('Error: the payload config is required for getPayload to work.')
  }

  if (cached.payload) {
    if (cached.reload === true) {
      let resolve: () => void

      // getPayload is called multiple times, in parallel. However, we only want to run `await reload` once. By immediately setting cached.reload to a promise,
      // we can ensure that all subsequent calls will wait for the first reload to finish. So if we set it here, the 2nd call of getPayload
      // will reach `if (cached.reload instanceof Promise) {` which then waits for the first reload to finish.
      cached.reload = new Promise((res) => (resolve = res))
      const config = await options.config
      await reload(config, cached.payload, !options.importMap)

      resolve()
    }

    if (cached.reload instanceof Promise) {
      await cached.reload
    }
    if (options?.importMap) {
      cached.payload.importMap = options.importMap
    }
    return cached.payload
  }

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  if (!cached.promise) {
    // no need to await options.config here, as it's already awaited in the BasePayload.init
    cached.promise = new BasePayload().init(options)
  }

  try {
    cached.payload = await cached.promise

    if (
      !cached.ws &&
      process.env.NODE_ENV !== 'production' &&
      process.env.NODE_ENV !== 'test' &&
      process.env.DISABLE_PAYLOAD_HMR !== 'true'
    ) {
      try {
        const port = process.env.PORT || '3000'

        const path = '/_next/webpack-hmr'
        // The __NEXT_ASSET_PREFIX env variable is set for both assetPrefix and basePath (tested in Next.js 15.1.6)
        const prefix = process.env.__NEXT_ASSET_PREFIX ?? ''

        cached.ws = new WebSocket(
          process.env.PAYLOAD_HMR_URL_OVERRIDE ?? `ws://localhost:${port}${prefix}${path}`,
        )

        cached.ws.onmessage = (event) => {
          if (typeof event.data === 'string') {
            const data = JSON.parse(event.data)

            if ('action' in data && data.action === 'serverComponentChanges') {
              cached.reload = true
            }
          }
        }

        cached.ws.onerror = (_) => {
          // swallow any websocket connection error
        }
      } catch (_) {
        // swallow e
      }
    }
  } catch (e) {
    cached.promise = null
    // add identifier to error object, so that our error logger in routeError.ts does not attempt to re-initialize getPayload
    e.payloadInitError = true
    throw e
  }

  if (options?.importMap) {
    cached.payload.importMap = options.importMap
  }

  return cached.payload
}

type Payload = BasePayload

interface RequestContext {
  [key: string]: unknown
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DatabaseAdapter extends BaseDatabaseAdapter {}
export type { Payload, RequestContext }
export { extractAccessFromPermission } from './auth/extractAccessFromPermission.js'
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
export { JWTAuthentication } from './auth/strategies/jwt.js'
export type {
  AuthStrategyFunction,
  AuthStrategyFunctionArgs,
  AuthStrategyResult,
  CollectionPermission,
  DocumentPermissions,
  FieldPermissions,
  GlobalPermission,
  IncomingAuthType,
  Permission,
  Permissions,
  SanitizedCollectionPermission,
  SanitizedDocumentPermissions,
  SanitizedFieldPermissions,
  SanitizedGlobalPermission,
  SanitizedPermissions,
  User,
  VerifyConfig,
} from './auth/types.js'
export { generateImportMap } from './bin/generateImportMap/index.js'

export type { ImportMap } from './bin/generateImportMap/index.js'
export { genImportMapIterateFields } from './bin/generateImportMap/iterateFields.js'
export {
  type ClientCollectionConfig,
  createClientCollectionConfig,
  createClientCollectionConfigs,
  type ServerOnlyCollectionAdminProperties,
  type ServerOnlyCollectionProperties,
  type ServerOnlyUploadProperties,
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
  BaseListFilter,
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
  SanitizedJoins,
  TypeWithID,
  TypeWithTimestamps,
} from './collections/config/types.js'

export type { CompoundIndex } from './collections/config/types.js'

export type { SanitizedCompoundIndex } from './collections/config/types.js'
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

export {
  type ClientConfig,
  createClientConfig,
  serverOnlyAdminConfigProperties,
  serverOnlyConfigProperties,
  type UnsanitizedClientConfig,
} from './config/client.js'

export { defaults } from './config/defaults.js'
export { type OrderableEndpointBody } from './config/orderable/index.js'
export { sanitizeConfig } from './config/sanitize.js'
export type * from './config/types.js'
export { combineQueries } from './database/combineQueries.js'
export { createDatabaseAdapter } from './database/createDatabaseAdapter.js'
export { defaultBeginTransaction } from './database/defaultBeginTransaction.js'
export { flattenWhereToOperators } from './database/flattenWhereToOperators.js'
export { getLocalizedPaths } from './database/getLocalizedPaths.js'
export { createMigration } from './database/migrations/createMigration.js'
export { getMigrations } from './database/migrations/getMigrations.js'
export { getPredefinedMigration } from './database/migrations/getPredefinedMigration.js'
export { migrate } from './database/migrations/migrate.js'
export { migrateDown } from './database/migrations/migrateDown.js'
export { migrateRefresh } from './database/migrations/migrateRefresh.js'
export { migrateReset } from './database/migrations/migrateReset.js'
export { migrateStatus } from './database/migrations/migrateStatus.js'
export { migrationsCollection } from './database/migrations/migrationsCollection.js'
export { migrationTemplate } from './database/migrations/migrationTemplate.js'
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
  CountGlobalVersionArgs,
  CountGlobalVersions,
  CountVersions,
  Create,
  CreateArgs,
  CreateGlobal,
  CreateGlobalArgs,
  CreateGlobalVersion,
  CreateGlobalVersionArgs,
  CreateMigration,
  CreateVersion,
  CreateVersionArgs,
  DatabaseAdapterResult as DatabaseAdapterObj,
  DBIdentifierName,
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
  GenerateSchema,
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
  UpdateJobs,
  UpdateJobsArgs,
  UpdateMany,
  UpdateManyArgs,
  UpdateOne,
  UpdateOneArgs,
  UpdateVersion,
  UpdateVersionArgs,
  Upsert,
  UpsertArgs,
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
  Locked,
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
export type { ValidationFieldError } from './errors/index.js'

export { baseBlockFields } from './fields/baseFields/baseBlockFields.js'
export { baseIDField } from './fields/baseFields/baseIDField.js'
export {
  createClientField,
  createClientFields,
  type ServerOnlyFieldAdminProperties,
  type ServerOnlyFieldProperties,
} from './fields/config/client.js'

export { sanitizeFields } from './fields/config/sanitize.js'
export type {
  AdminClient,
  ArrayField,
  ArrayFieldClient,
  BaseValidateOptions,
  Block,
  BlockJSX,
  BlocksField,
  BlocksFieldClient,
  CheckboxField,
  CheckboxFieldClient,
  ClientBlock,
  ClientField,
  ClientFieldProps,
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
  FlattenedArrayField,
  FlattenedBlock,
  FlattenedBlocksField,
  FlattenedField,
  FlattenedGroupField,
  FlattenedJoinField,
  FlattenedTabAsField,
  GroupField,
  GroupFieldClient,
  HookName,
  JoinField,
  JoinFieldClient,
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
  OptionLabel,
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
  TextareaField,
  TextareaFieldClient,
  TextField,
  TextFieldClient,
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

export { validations } from './fields/validations.js'
export type {
  ArrayFieldValidation,
  BlocksFieldValidation,
  CheckboxFieldValidation,
  CodeFieldValidation,
  ConfirmPasswordFieldValidation,
  DateFieldValidation,
  EmailFieldValidation,
  JSONFieldValidation,
  NumberFieldManyValidation,
  NumberFieldSingleValidation,
  NumberFieldValidation,
  PasswordFieldValidation,
  PointFieldValidation,
  RadioFieldValidation,
  RelationshipFieldManyValidation,
  RelationshipFieldSingleValidation,
  RelationshipFieldValidation,
  RichTextFieldValidation,
  SelectFieldManyValidation,
  SelectFieldSingleValidation,
  SelectFieldValidation,
  TextareaFieldValidation,
  TextFieldManyValidation,
  TextFieldSingleValidation,
  TextFieldValidation,
  UploadFieldManyValidation,
  UploadFieldSingleValidation,
  UploadFieldValidation,
  UsernameFieldValidation,
} from './fields/validations.js'
export {
  type ClientGlobalConfig,
  createClientGlobalConfig,
  createClientGlobalConfigs,
  type ServerOnlyGlobalAdminProperties,
  type ServerOnlyGlobalProperties,
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
  ColumnPreference,
  DocumentPreferences,
  FieldsPreferences,
  InsideFieldsPreferences,
  ListPreferences,
  PreferenceRequest,
  PreferenceUpdateRequest,
  TabsPreferences,
} from './preferences/types.js'
export type { QueryPreset } from './query-presets/types.js'
export { jobAfterRead } from './queues/config/index.js'
export type { JobsConfig, RunJobAccess, RunJobAccessArgs } from './queues/config/types/index.js'

export type {
  RunInlineTaskFunction,
  RunTaskFunction,
  RunTaskFunctions,
  TaskConfig,
  TaskHandler,
  TaskHandlerArgs,
  TaskHandlerResult,
  TaskHandlerResults,
  TaskInput,
  TaskOutput,
  TaskType,
} from './queues/config/types/taskTypes.js'
export type {
  BaseJob,
  JobLog,
  JobTaskStatus,
  RunningJob,
  SingleTaskStatus,
  WorkflowConfig,
  WorkflowHandler,
  WorkflowTypes,
} from './queues/config/types/workflowTypes.js'
export { importHandlerPath } from './queues/operations/runJobs/runJob/importHandlerPath.js'
export { getLocalI18n } from './translations/getLocalI18n.js'
export * from './types/index.js'
export { getFileByPath } from './uploads/getFileByPath.js'
export type * from './uploads/types.js'

export { addDataAndFileToRequest } from './utilities/addDataAndFileToRequest.js'

export { addLocalesToRequestFromData, sanitizeLocales } from './utilities/addLocalesToRequest.js'
export { commitTransaction } from './utilities/commitTransaction.js'
export {
  configToJSONSchema,
  entityToJSONSchema,
  fieldsToJSONSchema,
  withNullableJSONSchemaType,
} from './utilities/configToJSONSchema.js'
export { createArrayFromCommaDelineated } from './utilities/createArrayFromCommaDelineated.js'
export { createLocalReq } from './utilities/createLocalReq.js'
export { createPayloadRequest } from './utilities/createPayloadRequest.js'
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
export {
  checkDependencies,
  type CustomVersionParser,
} from './utilities/dependencies/dependencyChecker.js'
export { getDependencies } from './utilities/dependencies/getDependencies.js'
export type { FieldSchemaJSON } from './utilities/fieldSchemaToJSON.js'
export {
  findUp,
  findUpSync,
  pathExistsAndIsAccessible,
  pathExistsAndIsAccessibleSync,
} from './utilities/findUp.js'
export { flattenAllFields } from './utilities/flattenAllFields.js'
export { default as flattenTopLevelFields } from './utilities/flattenTopLevelFields.js'
export { formatErrors } from './utilities/formatErrors.js'
export { formatLabels, formatNames, toWords } from './utilities/formatLabels.js'
export { getBlockSelect } from './utilities/getBlockSelect.js'
export { getCollectionIDFieldTypes } from './utilities/getCollectionIDFieldTypes.js'
export { getFieldByPath } from './utilities/getFieldByPath.js'
export { getObjectDotNotation } from './utilities/getObjectDotNotation.js'
export { getRequestLanguage } from './utilities/getRequestLanguage.js'
export { handleEndpoints } from './utilities/handleEndpoints.js'
export { headersWithCors } from './utilities/headersWithCors.js'
export { initTransaction } from './utilities/initTransaction.js'
export { isEntityHidden } from './utilities/isEntityHidden.js'
export { default as isolateObjectProperty } from './utilities/isolateObjectProperty.js'
export { isPlainObject } from './utilities/isPlainObject.js'
export { isValidID } from './utilities/isValidID.js'
export { killTransaction } from './utilities/killTransaction.js'
export { logError } from './utilities/logError.js'
export { defaultLoggerOptions } from './utilities/logger.js'
export { mapAsync } from './utilities/mapAsync.js'
export { mergeHeaders } from './utilities/mergeHeaders.js'
export { sanitizeFallbackLocale } from './utilities/sanitizeFallbackLocale.js'
export { sanitizeJoinParams } from './utilities/sanitizeJoinParams.js'
export { sanitizePopulateParam } from './utilities/sanitizePopulateParam.js'
export { sanitizeSelectParam } from './utilities/sanitizeSelectParam.js'
export { stripUnselectedFields } from './utilities/stripUnselectedFields.js'
export { traverseFields } from './utilities/traverseFields.js'
export type { TraverseFieldsCallback } from './utilities/traverseFields.js'
export { buildVersionCollectionFields } from './versions/buildCollectionFields.js'
export { buildVersionGlobalFields } from './versions/buildGlobalFields.js'
export { buildVersionCompoundIndexes } from './versions/buildVersionCompoundIndexes.js'
export { versionDefaults } from './versions/defaults.js'
export { deleteCollectionVersions } from './versions/deleteCollectionVersions.js'
export { appendVersionToQueryKey } from './versions/drafts/appendVersionToQueryKey.js'
export { getQueryDraftsSort } from './versions/drafts/getQueryDraftsSort.js'
export { enforceMaxVersions } from './versions/enforceMaxVersions.js'
export { getLatestCollectionVersion } from './versions/getLatestCollectionVersion.js'
export { getLatestGlobalVersion } from './versions/getLatestGlobalVersion.js'
export { saveVersion } from './versions/saveVersion.js'
export type { SchedulePublishTaskInput } from './versions/schedule/types.js'
export type { SchedulePublish, TypeWithVersion } from './versions/types.js'
export { deepMergeSimple } from '@payloadcms/translations/utilities'
