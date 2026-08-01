/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ExecutionResult, GraphQLSchema, ValidationRule } from 'graphql'
import type { Request as graphQLRequest, OperationArgs } from 'graphql-http'
import type { Logger } from 'pino'
import type { NonNever } from 'ts-essentials'

import { spawn } from 'child_process'
import crypto from 'crypto'
import { fileURLToPath } from 'node:url'
import path from 'path'
import WebSocket from 'ws'

import type { DevReloadStrategy } from './admin/adapters/devReload.js'
import type { AuthStrategy, UserSession } from './auth/types.js'
import type { Collection, TypeWithID } from './collections/config/types.js'
export type * from './admin/adapters/index.js'
import type { FindOptions } from './collections/operations/find.js'
import type { InitOptions, SanitizedConfig } from './config/types.js'
import type { BaseDatabaseAdapter } from './database/types.js'
import type { InitializedEmailAdapter } from './email/types.js'
import type { Globals } from './globals/config/types.js'
import type { JsonObject, SelectType } from './types/index.js'
import type { TraverseFieldsCallback } from './utilities/traverseFields.js'

export type { FindOptions }

export type { FieldState } from './admin/forms/Form.js'
export type * from './admin/types.js'
export { EntityType } from './admin/views/dashboard.js'
/**
 * Export of all base fields that could potentially be
 * useful as users wish to extend built-in fields with custom logic
 */
export { accountLockFields as baseAccountLockFields } from './auth/baseFields/accountLock.js'
import type { SupportedLanguages } from '@payloadcms/translations'

import { Cron } from 'croner'

import type { ClientConfig } from './config/client.js'
import type { KVAdapter } from './kv/index.js'
import type { PayloadLocalAPI } from './operations/index.js'
import type { JobLog, JobTaskStatus } from './queues/config/types/workflowTypes.js'

import { decrypt, encrypt } from './auth/crypto.js'
import { APIKeyAuthentication } from './auth/strategies/apiKey.js'
import { JWTAuthentication } from './auth/strategies/jwt.js'
import { generateImportMap, type ImportMap } from './bin/generateImportMap/index.js'
import { checkPayloadDependencies } from './checkPayloadDependencies.js'
import { consoleEmailAdapter } from './email/consoleEmailAdapter.js'
import { fieldAffectsData, type FlattenedBlock } from './fields/config/types.js'
import { operationsToLocalAPI, payloadOperations } from './operations/index.js'
import { getJobsLocalAPI } from './queues/localAPI.js'
import { _internal_jobSystemGlobals } from './queues/utilities/getCurrentDate.js'
import { formatAdminURL } from './utilities/formatAdminURL.js'
import { isNextBuild } from './utilities/isNextBuild.js'
import { getLogger } from './utilities/logger.js'
import { serverInit as serverInitTelemetry } from './utilities/telemetry/events/serverInit.js'
import { traverseFields } from './utilities/traverseFields.js'

export { createAPIKeyFields } from './auth/baseFields/apiKey.js'
export { baseAuthFields } from './auth/baseFields/auth.js'
export { emailFieldConfig as baseEmailField } from './auth/baseFields/email.js'
export { sessionsFieldConfig as baseSessionsField } from './auth/baseFields/sessions.js'
export { usernameFieldConfig as baseUsernameField } from './auth/baseFields/username.js'
export { verificationFields as baseVerificationFields } from './auth/baseFields/verification.js'
export { defaultUserCollection } from './auth/defaultUser.js'

export { executeAccess } from './auth/executeAccess.js'
export { executeAuthStrategies } from './auth/executeAuthStrategies.js'
export { extractAccessFromPermission } from './auth/extractAccessFromPermission.js'
export { getAccessResults } from './auth/getAccessResults.js'
export { getFieldsToSign } from './auth/getFieldsToSign.js'
export { getLoginOptions } from './auth/getLoginOptions.js'
export * from './auth/index.js'

/**
 * Shape constraint for PayloadTypes.
 * Matches the structure of generated Config types.
 *
 * By defining the actual shape, we can use simple property access (T['collections'])
 * instead of conditional types throughout the codebase.
 */
export interface PayloadTypesShape {
  auth: Record<string, unknown>
  blocks: Record<string, unknown>
  collections: Record<string, unknown>
  collectionsJoins: Record<string, unknown>
  collectionsSelect: Record<string, unknown>
  db: { defaultIDType: unknown }
  fallbackLocale: unknown
  globals: Record<string, unknown>
  globalsSelect: Record<string, unknown>
  jobs: unknown
  locale: unknown
  user: unknown
  widgets?: Record<string, unknown>
}

/**
 * Untyped fallback types. Uses the SAME property names as generated types.
 * PayloadTypes merges GeneratedTypes with these fallbacks.
 */
export interface UntypedPayloadTypes {
  auth: {
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
  blocks: {
    [slug: string]: JsonObject
  }
  collections: {
    [slug: string]: JsonObject & TypeWithID
    'payload-jobs': {
      completedAt?: null | string
      /**
       * Used for concurrency control. Jobs with the same key are subject to exclusive/supersedes rules.
       */
      concurrencyKey?: null | string
      createdAt: string
      error?: unknown
      hasError?: boolean
      id: UntypedPayloadTypes['db']['defaultIDType']
      input: object
      log?: JobLog[]
      meta?: {
        [key: string]: unknown
        /**
         * If true, this job was queued by the scheduling system.
         */
        scheduled?: boolean
      }
      processingToken?: null | string
      processingUntil?: null | string
      queue?: string
      taskSlug?: null | StringKeyOf<UntypedPayloadTypes['jobs']['tasks']>
      taskStatus: JobTaskStatus
      totalTried: number
      updatedAt: string
      waitUntil?: null | string
      workflowSlug?: null | StringKeyOf<UntypedPayloadTypes['jobs']['workflows']>
    }
  }
  collectionsJoins: {
    [slug: string]: {
      [schemaPath: string]: string
    }
  }
  collectionsSelect: {
    [slug: string]: SelectType
  }
  db: {
    defaultIDType: number | string
  }
  fallbackLocale: 'false' | 'none' | 'null' | ({} & string)[] | ({} & string) | false | null
  globals: {
    [slug: string]: JsonObject
  }
  globalsSelect: {
    [slug: string]: SelectType
  }
  jobs: {
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
  locale: null | string
  /**
   * User shape used when generated types are unavailable.
   * Includes common document fields and fields managed by Payload auth. Custom fields and
   * collection features such as drafts, trash, and uploads require generated types. Runtime fields
   * `_strategy` and `_sid` belong to `AuthenticatedUser`.
   */
  user: {
    /** Email verification token. Hidden (needs `showHiddenFields`). Only with `auth.verify`, until verified. */
    _verificationToken?: null | string
    /** Whether the email is verified. Only with `auth.verify`. */
    _verified?: boolean | null
    /** The user's API key. Only with `auth.useAPIKey`, once enabled for this user. */
    apiKey?: null | string
    /** Internal lookup index for the API key. Hidden (needs `showHiddenFields`). Only with `auth.useAPIKey`. */
    apiKeyIndex?: null | string
    /** Slug of the auth collection this user belongs to. Always present; identifies the source collection. */
    collection: string
    /** When the user was created. Not present when timestamps are disabled. */
    createdAt?: string
    /** The user's email. Absent if email login is disabled via `auth.loginWithUsername`. */
    email?: null | string
    /** Whether API key auth is enabled for this user. Only with `auth.useAPIKey`. */
    enableAPIKey?: boolean | null
    /** Hashed password. Hidden (needs `showHiddenFields`). Only with the local strategy. */
    hash?: null | string
    /** The user's ID. Always present. */
    id: UntypedPayloadTypes['db']['defaultIDType']
    /** Locked-until timestamp. Hidden (needs `showHiddenFields`). Only with `auth.maxLoginAttempts`, while locked. */
    lockUntil?: null | string
    /** Failed login attempt count. Hidden (needs `showHiddenFields`). Only with `auth.maxLoginAttempts`. */
    loginAttempts?: null | number
    /** Plain-text password. Write-only: accepted on `create`/`update`, never returned on reads. */
    password?: null | string
    /** Reset-token expiry. Hidden (needs `showHiddenFields`). Only after `forgotPassword`, until reset. */
    resetPasswordExpiration?: null | string
    /** Active password-reset token. Hidden (needs `showHiddenFields`). Only after `forgotPassword`, until reset. */
    resetPasswordToken?: null | string
    /** Password salt. Hidden (needs `showHiddenFields`). Only with the local strategy. */
    salt?: null | string
    /** Active login sessions. Only with `auth.useSessions` (the default). */
    sessions?: Array<UserSession> | null
    /** When the user was last updated. Not present when timestamps are disabled. */
    updatedAt?: string
    /** The user's username. Only with `auth.loginWithUsername`. */
    username?: null | string
  }
  widgets: {
    [slug: string]: JsonObject
  }
}

/**
 * Interface to be module-augmented by the `payload-types.ts` file.
 * When augmented, its properties take precedence over UntypedPayloadTypes.
 */
export interface GeneratedTypes {}

/**
 * Interface to be module-augmented by plugin packages.
 * Maps plugin slug to plugin options type, enabling typed cross-plugin
 * discovery via the `plugins` map passed to `definePlugin` functions.
 *
 * @experimental
 *
 * @example
 * // In a plugin package's index.ts:
 * declare module 'payload' {
 *   interface RegisteredPlugins {
 *     'plugin-seo': SEOPluginOptions
 *   }
 * }
 */
export interface RegisteredPlugins {}

/**
 * Check if GeneratedTypes has been augmented (has any keys).
 */
type IsAugmented = keyof GeneratedTypes extends never ? false : true

/**
 * PayloadTypes merges GeneratedTypes with UntypedPayloadTypes.
 * - When augmented: uses augmented properties, fills gaps with untyped fallbacks
 * - When not augmented: uses only UntypedPayloadTypes
 */
export type PayloadTypes = IsAugmented extends true
  ? GeneratedTypes & Omit<UntypedPayloadTypes, keyof GeneratedTypes>
  : UntypedPayloadTypes

export type TypedCollection<T extends PayloadTypesShape = PayloadTypes> = T['collections']

export type TypedBlock = PayloadTypes['blocks']

export type TypedWidget<T extends PayloadTypesShape = PayloadTypes> = T extends {
  widgets: infer TWidgets
}
  ? TWidgets extends Record<string, unknown>
    ? TWidgets
    : Record<string, unknown>
  : Record<string, unknown>

export type TypedUploadCollection<T extends PayloadTypesShape = PayloadTypes> = NonNever<{
  [TSlug in keyof T['collections']]:
    | 'filename'
    | 'filesize'
    | 'mimeType'
    | 'url' extends keyof T['collections'][TSlug]
    ? T['collections'][TSlug]
    : never
}>

export type TypedCollectionSelect<T extends PayloadTypesShape = PayloadTypes> =
  T['collectionsSelect']

export type TypedCollectionJoins<T extends PayloadTypesShape = PayloadTypes> = T['collectionsJoins']

export type TypedGlobal<T extends PayloadTypesShape = PayloadTypes> = T['globals']

export type TypedGlobalSelect<T extends PayloadTypesShape = PayloadTypes> = T['globalsSelect']

// Extract string keys from the type
export type StringKeyOf<T> = Extract<keyof T, string>

// Define the types for slugs using the appropriate collections and globals
export type CollectionSlug<T extends PayloadTypesShape = PayloadTypes> = StringKeyOf<
  T['collections']
>

export type BlockSlug = StringKeyOf<TypedBlock>

export type WidgetSlug<T extends PayloadTypesShape = PayloadTypes> = StringKeyOf<TypedWidget<T>>

export type DataFromWidgetSlug<TSlug extends WidgetSlug> = TypedWidget[TSlug] extends {
  data?: infer TData
}
  ? TData
  : TypedWidget[TSlug]

export type UploadCollectionSlug<T extends PayloadTypesShape = PayloadTypes> = StringKeyOf<
  TypedUploadCollection<T>
>

export type DefaultDocumentIDType = PayloadTypes['db']['defaultIDType']

export type GlobalSlug<T extends PayloadTypesShape = PayloadTypes> = StringKeyOf<T['globals']>

export type TypedLocale<T extends PayloadTypesShape = PayloadTypes> = T['locale']

export type TypedFallbackLocale = PayloadTypes['fallbackLocale']

/**
 * User document type for auth-enabled collections.
 * Uses generated types when available and the auth-only fallback above otherwise. Generated types
 * include custom fields and can be a union when several collections support auth.
 *
 * Not the signed-in `req.user`, which also has `_strategy` and `_sid` - use `AuthenticatedUser`.
 */
export type User = PayloadTypes['user']

export type TypedAuthOperations<T extends PayloadTypesShape = PayloadTypes> = T['auth']

export type AuthCollectionSlug<T extends PayloadTypesShape = PayloadTypes> = StringKeyOf<T['auth']>

export type TypedJobs = PayloadTypes['jobs']

type JobDocument = PayloadTypes['collections'] extends {
  'payload-jobs': infer TJob
}
  ? TJob
  : UntypedPayloadTypes['collections']['payload-jobs']

/**
 * Represents a job in the `payload-jobs` collection, referencing a queued workflow or task (= Job).
 * Uses the generated collection type when available and the untyped collection fallback otherwise.
 *
 * `input` and `taskStatus` are always present here, as the job afterRead hook will always populate them.
 */
export type Job<TWorkflowSlugOrInput extends keyof TypedJobs['workflows'] | object = object> = {
  input: TWorkflowSlugOrInput extends keyof TypedJobs['workflows']
    ? TypedJobs['workflows'][TWorkflowSlugOrInput]['input']
    : TWorkflowSlugOrInput
  taskStatus: JobTaskStatus
} & Omit<JobDocument, 'input' | 'taskStatus'>

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let checkedDependencies = false

/**
 * @description Payload
 */
class BasePayloadCore {
  authStrategies!: AuthStrategy[]

  blocks: Record<BlockSlug, FlattenedBlock> = {}

  collections: Record<CollectionSlug, Collection> = {}

  config!: SanitizedConfig

  crons: Cron[] = []
  db!: DatabaseAdapter
  decrypt = decrypt

  destroy = async () => {
    if (this.crons.length) {
      // Remove all crons from the list before stopping them
      const cronsToStop = this.crons.splice(0, this.crons.length)
      await Promise.all(cronsToStop.map((cron) => cron.stop()))
    }

    if (this.db?.destroy && typeof this.db.destroy === 'function') {
      await this.db.destroy()
    }
  }

  email!: InitializedEmailAdapter

  encrypt = encrypt

  // TODO: re-implement or remove?
  // errorHandler: ErrorHandler

  extensions!: (args: {
    args: OperationArgs<any>
    req: graphQLRequest<unknown, unknown>
    result: ExecutionResult
  }) => Promise<any>

  getAdminURL = (): string =>
    formatAdminURL({
      adminRoute: this.config.routes.admin,
      path: '',
      serverURL: this.config.serverURL,
    })

  getAPIURL = (): string =>
    formatAdminURL({
      apiRoute: this.config.routes.api,
      path: '',
      serverURL: this.config.serverURL,
    })

  globals!: Globals

  importMap!: ImportMap

  jobs = getJobsLocalAPI(this as unknown as Payload)

  /**
   * Key Value storage
   */
  kv!: KVAdapter

  logger!: Logger

  readonly operations: readonly Readonly<{ action: string; target: string }>[] = payloadOperations

  schema!: GraphQLSchema

  secret!: string

  sendEmail!: InitializedEmailAdapter['sendEmail']

  types!: {
    arrayTypes: any
    blockInputTypes: any
    blockTypes: any
    fallbackLocaleInputType?: any
    groupTypes: any
    localeInputType?: any
    tabTypes: any
  }

  validationRules!: (args: OperationArgs<any>) => ValidationRule[]

  versions: {
    [slug: string]: any // TODO: Type this
  } = {}

  constructor() {
    Object.assign(this, operationsToLocalAPI({ context: this, operations: payloadOperations }))
  }

  async _initializeCrons() {
    const payload = this as unknown as Payload

    if (this.config.jobs.enabled && this.config.jobs.autoRun && !isNextBuild()) {
      const DEFAULT_CRON = '* * * * *'
      const DEFAULT_LIMIT = 10

      const cronJobs =
        typeof this.config.jobs.autoRun === 'function'
          ? await this.config.jobs.autoRun(payload)
          : this.config.jobs.autoRun

      await Promise.all(
        cronJobs.map((cronConfig) => {
          const jobAutorunCron = new Cron(
            cronConfig.cron ?? DEFAULT_CRON,
            async () => {
              if (
                _internal_jobSystemGlobals.shouldAutoSchedule &&
                !cronConfig.disableScheduling &&
                this.config.jobs.scheduling
              ) {
                await this.jobs.handleSchedules({
                  allQueues: cronConfig.allQueues,
                  queue: cronConfig.queue,
                })
              }

              if (!_internal_jobSystemGlobals.shouldAutoRun) {
                return
              }

              if (typeof this.config.jobs.shouldAutoRun === 'function') {
                const shouldAutoRun = await this.config.jobs.shouldAutoRun(payload)

                if (!shouldAutoRun) {
                  jobAutorunCron.stop()
                  return
                }
              }

              await this.jobs.run({
                allQueues: cronConfig.allQueues,
                limit: cronConfig.limit ?? DEFAULT_LIMIT,
                queue: cronConfig.queue,
                silent: cronConfig.silent,
              })
            },
            {
              catch: (err) => {
                this.logger.error({ err, msg: 'Error in job queue cron job handler' })
              },
              // Do not run consecutive crons if previous crons still ongoing
              protect: true,
            },
          )

          this.crons.push(jobAutorunCron)
        }),
      )
    }
  }

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
        resolve({ code: code! })
      })

      spawned.on('error', (error) => {
        reject(error)
      })
    })
  }

  /**
   * @description Initializes Payload
   * @param options
   */
  async init(options: InitOptions): Promise<Payload> {
    const payload = this as unknown as Payload

    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.PAYLOAD_DISABLE_DEPENDENCY_CHECKER !== 'true' &&
      !checkedDependencies
    ) {
      checkedDependencies = true
      void checkPayloadDependencies()
    }

    this.importMap = options.importMap!

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
      let customIDType: string | undefined = undefined
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

    this.blocks = this.config.blocks.reduce(
      (blocks, block) => {
        blocks[block.slug] = block
        return blocks
      },
      {} as Record<string, FlattenedBlock>,
    )

    // Generate types on startup
    if (process.env.NODE_ENV !== 'production' && this.config.typescript.autoGenerate !== false) {
      // We cannot run it directly here, as generate-types imports json-schema-to-typescript, which breaks on turbopack.
      // see: https://github.com/vercel/next.js/issues/66723
      void this.bin({
        args: ['generate:types'],
        log: false,
      })
    }

    this.db = this.config.db.init({ payload })
    this.db.payload = payload

    this.kv = this.config.kv.init({ payload })

    if (this.db?.init) {
      await this.db.init()
    }

    if (!options.disableDBConnect && this.db.connect) {
      await this.db.connect()
    }

    // Load email adapter
    if (this.config.email instanceof Promise) {
      const awaitedAdapter = await this.config.email
      this.email = awaitedAdapter({ payload })
    } else if (this.config.email) {
      this.email = this.config.email({ payload })
    } else {
      if (process.env.NEXT_PHASE !== 'phase-production-build') {
        this.logger.warn(
          `No email adapter provided. Email will be written to console. More info at https://payloadcms.com/docs/email/overview.`,
        )
      }

      this.email = consoleEmailAdapter({ payload })
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

    serverInitTelemetry(payload)

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
          await options.onInit(payload)
        }
        if (typeof this.config.onInit === 'function') {
          await this.config.onInit(payload)
        }
      }
    } catch (error) {
      this.logger.error({ err: error }, 'Error running onInit function')
      throw error
    }

    if (options.cron) {
      await this._initializeCrons()
    }

    return payload
  }
}

export type BasePayload = BasePayloadCore & PayloadLocalAPI

export const BasePayload = BasePayloadCore as unknown as {
  new (): BasePayload
  prototype: BasePayloadCore
}

const initialized: BasePayload = new BasePayload()

// eslint-disable-next-line no-restricted-exports
export default initialized

export const reload = async (
  config: SanitizedConfig,
  payload: Payload,
  skipImportMapGeneration?: boolean,
  options?: InitOptions,
): Promise<void> => {
  if (typeof payload.db.destroy === 'function') {
    // Only destroy db, as we then later only call payload.db.init and not payload.init
    await payload.db.destroy()
  }
  payload.config = config

  payload.collections = config.collections.reduce(
    (collections, collection) => {
      collections[collection.slug] = {
        config: collection,
        customIDType: payload.collections[collection.slug]?.customIDType,
      }
      return collections
    },
    {} as Record<string, any>,
  )

  payload.blocks = config.blocks.reduce(
    (blocks, block) => {
      blocks[block.slug] = block
      return blocks
    },
    {} as Record<string, FlattenedBlock>,
  )

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

  // Generate import map
  if (skipImportMapGeneration !== true && config.admin?.importMap?.autoGenerate !== false) {
    // This may run outside of the admin panel, e.g. in the user's frontend, where we don't have an import map file.
    // We don't want to throw an error in this case, as it would break the user's frontend.
    // => just skip it => ignoreResolveError: true
    await generateImportMap(config, {
      ignoreResolveError: true,
      log: true,
    })
  }

  if (payload.db?.init) {
    await payload.db.init()
  }

  if (!options?.disableDBConnect && payload.db.connect) {
    await payload.db.connect({ hotReload: true })
  }

  ;(global as any)._payload_clientConfigs = {} as Record<keyof SupportedLanguages, ClientConfig>
  ;(global as any)._payload_schemaMap = null
  ;(global as any)._payload_clientSchemaMap = null
  ;(global as any)._payload_doNotCacheClientConfig = true // This will help refreshing the client config cache more reliably. If you remove this, please test HMR + client config refreshing (do new fields appear in the document?)
  ;(global as any)._payload_doNotCacheSchemaMap = true
  ;(global as any)._payload_doNotCacheClientSchemaMap = true
}

let _cached: Map<
  string,
  {
    devReloadCleanup: (() => void) | null
    initializedCrons: boolean
    payload: null | Payload
    promise: null | Promise<Payload>
    reload: boolean | Promise<void>
  }
> = (global as any)._payload

if (!_cached) {
  _cached = (global as any)._payload = new Map()
}

/**
 * Get a payload instance.
 * This function is a wrapper around new BasePayload().init() that adds the following functionality on top of that:
 *
 * - smartly caches Payload instance on the module scope. That way, we prevent unnecessarily initializing Payload over and over again
 * when calling getPayload multiple times or from multiple locations.
 * - adds HMR support and reloads the payload instance when the config changes.
 */
/**
 * Default HMR reload strategy using Next.js webpack-hmr WebSocket.
 * Used as fallback when no custom devReloadStrategy is provided.
 */
function defaultNextJsDevReloadStrategy(): DevReloadStrategy | null {
  try {
    const port = process.env.PORT || '3000'
    const hasHTTPS =
      process.env.USE_HTTPS === 'true' || process.argv.includes('--experimental-https')
    const protocol = hasHTTPS ? 'wss' : 'ws'

    const hmrPath = '/_next/webpack-hmr'
    const prefix = process.env.__NEXT_ASSET_PREFIX ?? ''

    const url =
      process.env.PAYLOAD_HMR_URL_OVERRIDE ?? `${protocol}://localhost:${port}${prefix}${hmrPath}`

    return {
      connect(onReload) {
        const ws = new WebSocket(url)

        ws.onmessage = (event) => {
          if (typeof event.data === 'string') {
            const data = JSON.parse(event.data)
            if (
              data.type === 'serverComponentChanges' ||
              data.action === 'serverComponentChanges'
            ) {
              onReload()
            }
          }
        }

        ws.onerror = () => {
          // swallow any websocket connection error
        }

        return () => {
          ws.close()
        }
      },
    }
  } catch (_) {
    return null
  }
}

export const getPayload = async (
  options: {
    /**
     * Custom dev reload strategy. If provided, replaces the default
     * Next.js HMR WebSocket listener. The strategy's `connect` function
     * receives a callback to trigger config reload.
     */
    devReloadStrategy?: DevReloadStrategy
    /**
     * A unique key to identify the payload instance. You can pass your own key if you want to cache this payload instance separately.
     * This is useful if you pass a different payload config for each instance.
     *
     * @default 'default'
     */
    key?: string
  } & InitOptions,
): Promise<Payload> => {
  if (!options?.config) {
    throw new Error('Error: the payload config is required for getPayload to work.')
  }

  let alreadyCachedSameConfig = false

  let cached = _cached.get(options.key ?? 'default')
  if (!cached) {
    cached = {
      devReloadCleanup: null,
      initializedCrons: Boolean(options.cron),
      payload: null,
      promise: null,
      reload: false,
    }
    _cached.set(options.key ?? 'default', cached)
  } else {
    alreadyCachedSameConfig = true
  }

  if (alreadyCachedSameConfig) {
    // alreadyCachedSameConfig => already called onInit once, but same config => no need to call onInit again.
    // calling onInit again would only make sense if a different config was passed.
    options.disableOnInit = true
  }

  if (cached.payload) {
    if (options.cron && !cached.initializedCrons) {
      // getPayload called with crons enabled, but existing cached version does not have crons initialized. => Initialize crons in existing cached version
      cached.initializedCrons = true
      await cached.payload._initializeCrons()
    }

    if (cached.reload === true) {
      let resolve!: () => void

      // getPayload is called multiple times, in parallel. However, we only want to run `await reload` once. By immediately setting cached.reload to a promise,
      // we can ensure that all subsequent calls will wait for the first reload to finish. So if we set it here, the 2nd call of getPayload
      // will reach `if (cached.reload instanceof Promise) {` which then waits for the first reload to finish.
      cached.reload = new Promise((res) => (resolve = res))
      const config = await options.config

      // Reload the payload instance after a config change (triggered by HMR in development).
      // The second parameter (false) forces import map regeneration rather than deciding based on options.importMap.
      //
      // Why we always regenerate import map: getPayload() may be called from multiple sources (admin panel, frontend, etc.)
      // that share the same cache but may pass different importMap values. Since call order is unpredictable,
      // we cannot rely on options.importMap to determine if regeneration is needed.
      //
      // Example scenario: If the frontend calls getPayload() without importMap first, followed by the admin
      // panel calling it with importMap, we'd incorrectly skip generation for the admin panel's needs.
      // By always regenerating on reload, we ensure the import map stays in sync with the updated config.
      await reload(config, cached.payload, false, options)

      resolve()
      cached.reload = false
    }

    if (cached.reload instanceof Promise) {
      await cached.reload
    }
    if (options?.importMap) {
      cached.payload.importMap = options.importMap
    }
    return cached.payload
  }

  try {
    if (!cached.promise) {
      // no need to await options.config here, as it's already awaited in the BasePayload.init
      cached.promise = new BasePayload().init(options)
    }

    cached.payload = await cached.promise

    if (
      !cached.devReloadCleanup &&
      process.env.NODE_ENV !== 'production' &&
      process.env.NODE_ENV !== 'test' &&
      process.env.DISABLE_PAYLOAD_HMR !== 'true'
    ) {
      const strategy = options.devReloadStrategy ?? defaultNextJsDevReloadStrategy()

      if (strategy) {
        try {
          cached.devReloadCleanup = strategy.connect(() => {
            if (cached.reload instanceof Promise) {
              return
            }
            cached.reload = true
          })
        } catch (_) {
          // swallow connection errors
        }
      }
    }
  } catch (e) {
    cached.promise = null
    // add identifier to error object, so that our error logger in routeError.ts does not attempt to re-initialize getPayload
    ;(e as { payloadInitError?: boolean }).payloadInitError = true
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
export { jwtSign } from './auth/jwt.js'
export type { LoginResult } from './auth/operations/login.js'
export { checkLoginPermission } from './auth/operations/login.js'
export type { MeOperationResult } from './auth/operations/me.js'
export { JWTAuthentication } from './auth/strategies/jwt.js'
export { incrementLoginAttempts } from './auth/strategies/local/incrementLoginAttempts.js'
export { resetLoginAttempts } from './auth/strategies/local/resetLoginAttempts.js'
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
  VerifyConfig,
} from './auth/types.js'
export { generateImportMap } from './bin/generateImportMap/index.js'
export type { ImportMap } from './bin/generateImportMap/index.js'
export { genImportMapIterateFields } from './bin/generateImportMap/iterateFields.js'

export { migrate as migrateCLI } from './bin/migrate.js'
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
  BaseFilter,
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
  IDTypeForCollectionSlug,
  MeHook as CollectionMeHook,
  RefreshHook as CollectionRefreshHook,
  RequiredDataFromCollection,
  RequiredDataFromCollectionSlug,
  SanitizedCollectionConfig,
  SanitizedJoins,
  TypeWithID,
  TypeWithTimestamps,
} from './collections/config/types.js'

export type { CompoundIndex, FoldersConfig, TagsConfig } from './collections/config/types.js'

export type { SanitizedCompoundIndex } from './collections/config/types.js'

export { createDataloaderCacheKey, getDataLoader } from './collections/dataloader.js'
export { buildConfig } from './config/build.js'
export {
  type ClientConfig,
  createClientConfig,
  type CreateClientConfigArgs,
  createUnauthenticatedClientConfig,
  serverOnlyAdminConfigProperties,
  serverOnlyConfigProperties,
  type UnauthenticatedClientConfig,
} from './config/client.js'
export { addDefaultsToConfig } from './config/defaults.js'
export { definePlugin } from './config/definePlugin.js'
export { type OrderableEndpointBody } from './config/orderable/index.js'

export { sanitizeConfig } from './config/sanitize.js'

export type * from './config/types.js'
export { combineQueries } from './database/combineQueries.js'
export { createDatabaseAdapter } from './database/createDatabaseAdapter.js'
export { defaultBeginTransaction } from './database/defaultBeginTransaction.js'
export { flattenWhereToOperators } from './database/flattenWhereToOperators.js'
export { getLocalizedPaths } from './database/getLocalizedPaths.js'
export { createMigration } from './database/migrations/createMigration.js'
export { findMigrationDir } from './database/migrations/findMigrationDir.js'
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
  FindDistinct,
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
  PaginatedDistinctDocs,
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
export type { DynamicMigrationTemplate } from './database/types.js'
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
  UnauthorizedError,
  UnverifiedEmail,
  ValidationError,
  ValidationErrorName,
} from './errors/index.js'

export type { ValidationFieldError } from './errors/index.js'
export { baseBlockFields } from './fields/baseFields/baseBlockFields.js'

export { baseIDField } from './fields/baseFields/baseIDField.js'
export { getSlugFallbackValue } from './fields/baseFields/slug/getSlugFallbackValue.js'
export type { SlugFieldClientProps } from './fields/baseFields/slug/types.js'

export {
  createClientBlocks,
  createClientField,
  createClientFields,
  type ServerOnlyFieldAdminProperties,
  type ServerOnlyFieldProperties,
} from './fields/config/client.js'

export interface FieldCustom extends Record<string, any> {}

export interface CollectionCustom extends Record<string, any> {}

export interface CollectionAdminCustom extends Record<string, any> {}

export interface GlobalCustom extends Record<string, any> {}

export interface GlobalAdminCustom extends Record<string, any> {}

export { sanitizeField, sanitizeFields } from './fields/config/sanitize.js'
export type { SanitizeFieldArgs } from './fields/config/sanitize.js'

export type {
  AdminClient,
  ArrayField,
  ArrayFieldClient,
  BaseValidateOptions,
  Block,
  BlockJSX,
  BlocksField,
  BlocksFieldClient,
  BrowserAutoComplete,
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
  FieldAccessArgs,
  FieldAffectingData,
  FieldAffectingDataClient,
  FieldBase,
  FieldBaseClient,
  FieldHook,
  FieldHookArgs,
  FieldPosition,
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
  NamedGroupField,
  NamedGroupFieldClient,
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
  SlugField,
  SlugFieldClient,
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
  UnnamedGroupField,
  UnnamedGroupFieldClient,
  UnnamedTab,
  UploadField,
  UploadFieldClient,
  Validate,
  ValidateOptions,
  ValueWithRelation,
} from './fields/config/types.js'

export interface FieldCustom extends Record<string, any> {}

export interface CollectionCustom extends Record<string, any> {}

export interface CollectionAdminCustom extends Record<string, any> {}

export interface GlobalCustom extends Record<string, any> {}

export interface GlobalAdminCustom extends Record<string, any> {}

export { getDefaultValue } from './fields/getDefaultValue.js'
export { traverseFields as afterChangeTraverseFields } from './fields/hooks/afterChange/traverseFields.js'

export { promise as afterReadPromise } from './fields/hooks/afterRead/promise.js'
export { traverseFields as afterReadTraverseFields } from './fields/hooks/afterRead/traverseFields.js'

export { traverseFields as beforeChangeTraverseFields } from './fields/hooks/beforeChange/traverseFields.js'
export { traverseFields as beforeValidateTraverseFields } from './fields/hooks/beforeValidate/traverseFields.js'
export { sortableFieldTypes } from './fields/sortableFieldTypes.js'
export { validateBlocksFilterOptions, validations } from './fields/validations.js'

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
  BeforeOperationHook as GlobalBeforeOperationHook,
  BeforeReadHook as GlobalBeforeReadHook,
  BeforeValidateHook as GlobalBeforeValidateHook,
  DataFromGlobalSlug,
  GlobalAdminOptions,
  GlobalConfig,
  SanitizedGlobalConfig,
} from './globals/config/types.js'

export {
  DEFAULT_ALLOW_HAS_MANY,
  DEFAULT_HIERARCHY_TREE_LIMIT,
  getHierarchyFieldName,
  HIERARCHY_DEFAULT_LOCALE,
  HIERARCHY_SLUG_PATH_FIELD,
  HIERARCHY_TITLE_PATH_FIELD,
} from './hierarchy/constants.js'
export { createFolderField } from './hierarchy/createFolderField.js'
export type { CreateFolderFieldOptions } from './hierarchy/createFolderField.js'
export { createTagField } from './hierarchy/createTagField.js'
export type { CreateTagFieldOptions } from './hierarchy/createTagField.js'
export { getInitialTreeData } from './hierarchy/getInitialTreeData.js'
export type { GetInitialTreeDataArgs, InitialTreeData } from './hierarchy/getInitialTreeData.js'
export { injectHierarchyButton } from './hierarchy/injectHierarchyButton.js'
export { resolveHierarchyCollections } from './hierarchy/resolveHierarchyCollections.js'
export type {
  HierarchyConfig,
  SanitizedHierarchyConfig,
  SanitizedHierarchyRelatedCollection,
} from './hierarchy/types.js'
export type { Ancestor } from './hierarchy/utils/getAncestors.js'
export { getAncestors } from './hierarchy/utils/getAncestors.js'
export * from './kv/adapters/DatabaseKVAdapter.js'
export * from './kv/adapters/InMemoryKVAdapter.js'
export * from './kv/index.js'

export {
  defineLocalAPI,
  defineOperation,
  getCollectionOperationInputSchema,
  getGlobalOperationInputSchema,
  getPayloadOperation,
  invokeOperation,
  type LocalAPIFromDefinitions,
  type LocalAPIFromOperations,
  type LocalAPIOptions,
  type OperationEntityInputSchema,
  type OperationExposures,
  type OperationHandler,
  type OperationInvocationOptions,
  type OperationLocalAfterHandlerArgs,
  type OperationLocalDefinition,
  type OperationRESTExposure,
  operationsToLocalAPI,
  operationsToRESTEndpoints,
  type OperationTarget,
  OperationValidationError,
  operationWhereSchema,
  type PayloadLocalAPI,
  type PayloadOperation,
  type PayloadOperationAction,
  type PayloadOperationByTargetAndAction,
  payloadOperations,
  type PayloadOperationTarget,
  validateCollectionOperationData,
  validateGlobalOperationData,
} from './operations/index.js'
export type {
  CollapsedPreferences,
  CollectionPreferences,
  /**
   * @deprecated Use `CollectionPreferences` instead.
   */
  CollectionPreferences as ListPreferences,
  ColumnPreference,
  DocumentPreferences,
  FieldsPreferences,
  InsideFieldsPreferences,
  PreferenceRequest,
  PreferenceUpdateRequest,
  RecentlyViewedItem,
  RecentlyViewedPreferences,
  TabsPreferences,
} from './preferences/types.js'
export type { QueryPreset } from './query-presets/types.js'
export { jobAfterRead } from './queues/config/collection.js'
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
  TaskSlug,
} from './queues/config/types/taskTypes.js'

export type {
  ConcurrencyConfig,
  JobLog,
  JobTaskStatus,
  SingleTaskStatus,
  WorkflowConfig,
  WorkflowHandler,
  WorkflowSlug,
} from './queues/config/types/workflowTypes.js'
export { JobCancelledError } from './queues/errors/index.js'
export { countRunnableOrActiveJobsForQueue } from './queues/operations/handleSchedules/countRunnableOrActiveJobsForQueue.js'

export { importHandlerPath } from './queues/operations/runJobs/runJob/importHandlerPath.js'
export {
  _internal_jobSystemGlobals,
  _internal_resetJobSystemGlobals,
  getCurrentDate,
} from './queues/utilities/getCurrentDate.js'
export { getLocalI18n } from './translations/getLocalI18n.js'

export * from './types/index.js'
export { getFileByPath } from './uploads/getFileByPath.js'
export { _internal_safeFetchGlobal } from './uploads/safeFetch.js'
export type * from './uploads/types.js'
export { addDataAndFileToRequest } from './utilities/addDataAndFileToRequest.js'
export { addLocalesToRequestFromData, sanitizeLocales } from './utilities/addLocalesToRequest.js'
export { canAccessAdmin } from './utilities/canAccessAdmin.js'
export { commitTransaction } from './utilities/commitTransaction.js'
export {
  configToJSONSchema,
  entityToJSONSchema,
  entityToStandaloneJSONSchema,
  fieldsToJSONSchema,
  type FieldsToJSONSchemaArgs,
  registerBlockInterface,
  type SchemaVariant,
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
export { dynamicImport } from './utilities/dynamicImport.js'
export { escapeRegExp } from './utilities/escapeRegExp.js'
export {
  findUp,
  findUpSync,
  pathExistsAndIsAccessible,
  pathExistsAndIsAccessibleSync,
} from './utilities/findUp.js'
export { flattenAllFields } from './utilities/flattenAllFields.js'
export { flattenTopLevelFields } from './utilities/flattenTopLevelFields.js'
export { formatErrors } from './utilities/formatErrors.js'
export { formatLabels, formatNames, toWords } from './utilities/formatLabels.js'
export { getBlockSelect } from './utilities/getBlockSelect.js'
export { getCollectionIDFieldTypes } from './utilities/getCollectionIDFieldTypes.js'
export { getFieldByPath } from './utilities/getFieldByPath.js'
export { getObjectDotNotation } from './utilities/getObjectDotNotation.js'
export { getRequestLanguage } from './utilities/getRequestLanguage.js'
export { getUniqueFieldValue } from './utilities/getUniqueFieldValue.js'
export { hasDraftsEnabled } from './utilities/getVersionsConfig.js'
export { handleEndpoints } from './utilities/handleEndpoints.js'
export { headersWithCors } from './utilities/headersWithCors.js'
export { initTransaction } from './utilities/initTransaction.js'
export { isEntityHidden } from './utilities/isEntityHidden.js'
export { isolateObjectProperty } from './utilities/isolateObjectProperty.js'
export { isPlainObject } from './utilities/isPlainObject.js'
export { isValidID } from './utilities/isValidID.js'
export { killTransaction } from './utilities/killTransaction.js'
export { logError } from './utilities/logError.js'
export { defaultLoggerOptions } from './utilities/logger.js'
export type { PayloadLogger } from './utilities/logger.js'
export { mapAsync } from './utilities/mapAsync.js'
export { mergeHeaders } from './utilities/mergeHeaders.js'
export { parseDocumentID } from './utilities/parseDocumentID.js'
export { parseParams } from './utilities/parseParams/index.js'
export type { ParsedParams, RawParams } from './utilities/parseParams/index.js'
export { sanitizeFallbackLocale } from './utilities/sanitizeFallbackLocale.js'
export { sanitizeJoinParams } from './utilities/sanitizeJoinParams.js'
export type { JoinParams } from './utilities/sanitizeJoinParams.js'
export { sanitizePopulateParam } from './utilities/sanitizePopulateParam.js'
export { sanitizeSelectParam } from './utilities/sanitizeSelectParam.js'
export { sanitizeSortParams } from './utilities/sanitizeSortParams.js'
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
