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

import type { AuthArgs } from './auth/operations/auth.js'
import type { Result as ForgotPasswordResult } from './auth/operations/forgotPassword.js'
import type { Result as LoginResult } from './auth/operations/login.js'
import type { Result as ResetPasswordResult } from './auth/operations/resetPassword.js'
import type { AuthStrategy, UntypedUser } from './auth/types.js'
import type {
  BulkOperationResult,
  Collection,
  DataFromCollectionSlug,
  SelectFromCollectionSlug,
  TypeWithID,
} from './collections/config/types.js'

import {
  forgotPasswordLocal,
  type Options as ForgotPasswordOptions,
} from './auth/operations/local/forgotPassword.js'
import { loginLocal, type Options as LoginOptions } from './auth/operations/local/login.js'
import {
  resetPasswordLocal,
  type Options as ResetPasswordOptions,
} from './auth/operations/local/resetPassword.js'
import { unlockLocal, type Options as UnlockOptions } from './auth/operations/local/unlock.js'
import {
  verifyEmailLocal,
  type Options as VerifyEmailOptions,
} from './auth/operations/local/verifyEmail.js'
export type { FieldState } from './admin/forms/Form.js'
import type { InitOptions, SanitizedConfig } from './config/types.js'
import type { BaseDatabaseAdapter, PaginatedDistinctDocs, PaginatedDocs } from './database/types.js'
import type { InitializedEmailAdapter } from './email/types.js'
import type { DataFromGlobalSlug, Globals, SelectFromGlobalSlug } from './globals/config/types.js'
import type {
  ApplyDisableErrors,
  DraftTransformCollectionWithSelect,
  JsonObject,
  SelectType,
  TransformCollectionWithSelect,
  TransformGlobalWithSelect,
} from './types/index.js'
import type { TraverseFieldsCallback } from './utilities/traverseFields.js'

import { countLocal, type Options as CountOptions } from './collections/operations/local/count.js'
import {
  createLocal,
  type Options as CreateOptions,
} from './collections/operations/local/create.js'
import {
  type ByIDOptions as DeleteByIDOptions,
  deleteLocal,
  type ManyOptions as DeleteManyOptions,
  type Options as DeleteOptions,
} from './collections/operations/local/delete.js'
import {
  duplicateLocal,
  type Options as DuplicateOptions,
} from './collections/operations/local/duplicate.js'
import { findLocal, type Options as FindOptions } from './collections/operations/local/find.js'
import {
  findByIDLocal,
  type Options as FindByIDOptions,
} from './collections/operations/local/findByID.js'
import {
  findDistinct as findDistinctLocal,
  type Options as FindDistinctOptions,
} from './collections/operations/local/findDistinct.js'
import {
  findVersionByIDLocal,
  type Options as FindVersionByIDOptions,
} from './collections/operations/local/findVersionByID.js'
import {
  findVersionsLocal,
  type Options as FindVersionsOptions,
} from './collections/operations/local/findVersions.js'
import {
  restoreVersionLocal,
  type Options as RestoreVersionOptions,
} from './collections/operations/local/restoreVersion.js'
import {
  type ByIDOptions as UpdateByIDOptions,
  updateLocal,
  type ManyOptions as UpdateManyOptions,
  type Options as UpdateOptions,
} from './collections/operations/local/update.js'
import {
  countGlobalVersionsLocal,
  type CountGlobalVersionsOptions,
} from './globals/operations/local/countVersions.js'
import {
  type Options as FindGlobalOptions,
  findOneGlobalLocal,
} from './globals/operations/local/findOne.js'
import {
  findGlobalVersionByIDLocal,
  type Options as FindGlobalVersionByIDOptions,
} from './globals/operations/local/findVersionByID.js'
import {
  findGlobalVersionsLocal,
  type Options as FindGlobalVersionsOptions,
} from './globals/operations/local/findVersions.js'
import {
  restoreGlobalVersionLocal,
  type Options as RestoreGlobalVersionOptions,
} from './globals/operations/local/restoreVersion.js'
import {
  updateGlobalLocal,
  type Options as UpdateGlobalOptions,
} from './globals/operations/local/update.js'
export type * from './admin/types.js'
export { EntityType } from './admin/views/dashboard.js'
import type { SupportedLanguages } from '@payloadcms/translations'

import { Cron } from 'croner'

import type { ClientConfig } from './config/client.js'
import type { KVAdapter } from './kv/index.js'
import type { BaseJob } from './queues/config/types/workflowTypes.js'
import type { TypeWithVersion } from './versions/types.js'

import { decrypt, encrypt } from './auth/crypto.js'
import { authLocal } from './auth/operations/local/auth.js'
import { APIKeyAuthentication } from './auth/strategies/apiKey.js'
import { JWTAuthentication } from './auth/strategies/jwt.js'
import { generateImportMap, type ImportMap } from './bin/generateImportMap/index.js'
import { checkPayloadDependencies } from './checkPayloadDependencies.js'
import { countVersionsLocal } from './collections/operations/local/countVersions.js'
import { consoleEmailAdapter } from './email/consoleEmailAdapter.js'
import { fieldAffectsData, type FlattenedBlock } from './fields/config/types.js'
import { getJobsLocalAPI } from './queues/localAPI.js'
import { _internal_jobSystemGlobals } from './queues/utilities/getCurrentDate.js'
import { formatAdminURL } from './utilities/formatAdminURL.js'
import { isNextBuild } from './utilities/isNextBuild.js'
import { getLogger } from './utilities/logger.js'
import { serverInit as serverInitTelemetry } from './utilities/telemetry/events/serverInit.js'
import { traverseFields } from './utilities/traverseFields.js'

/**
 * Export of all base fields that could potentially be
 * useful as users wish to extend built-in fields with custom logic
 */
export { accountLockFields as baseAccountLockFields } from './auth/baseFields/accountLock.js'
export { apiKeyFields as baseAPIKeyFields } from './auth/baseFields/apiKey.js'
export { baseAuthFields } from './auth/baseFields/auth.js'
export { emailFieldConfig as baseEmailField } from './auth/baseFields/email.js'
export { sessionsFieldConfig as baseSessionsField } from './auth/baseFields/sessions.js'
export { usernameFieldConfig as baseUsernameField } from './auth/baseFields/username.js'

export { verificationFields as baseVerificationFields } from './auth/baseFields/verification.js'
export { executeAccess } from './auth/executeAccess.js'
export { executeAuthStrategies } from './auth/executeAuthStrategies.js'
export { extractAccessFromPermission } from './auth/extractAccessFromPermission.js'
export { getAccessResults } from './auth/getAccessResults.js'
export { getFieldsToSign } from './auth/getFieldsToSign.js'
export { getLoginOptions } from './auth/getLoginOptions.js'

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
  user: UntypedUser
}

/**
 * Interface to be module-augmented by the `payload-types.ts` file.
 * When augmented, its properties take precedence over UntypedPayloadTypes.
 */
export interface GeneratedTypes {}

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

export type UploadCollectionSlug<T extends PayloadTypesShape = PayloadTypes> = StringKeyOf<
  TypedUploadCollection<T>
>

export type DefaultDocumentIDType = PayloadTypes['db']['defaultIDType']

export type GlobalSlug<T extends PayloadTypesShape = PayloadTypes> = StringKeyOf<T['globals']>

export type TypedLocale<T extends PayloadTypesShape = PayloadTypes> = T['locale']

export type TypedFallbackLocale = PayloadTypes['fallbackLocale']

/**
 * @todo rename to `User` in 4.0
 */
export type TypedUser = PayloadTypes['user']

export type TypedAuthOperations<T extends PayloadTypesShape = PayloadTypes> = T['auth']

export type AuthCollectionSlug<T extends PayloadTypesShape> = StringKeyOf<T['auth']>

export type TypedJobs = PayloadTypes['jobs']

// Check if payload-jobs exists in the AUGMENTED types (not the fallback with index signature)
type HasPayloadJobsType = GeneratedTypes extends { collections: infer C }
  ? 'payload-jobs' extends keyof C
    ? true
    : false
  : false

/**
 * Represents a job in the `payload-jobs` collection, referencing a queued workflow or task (= Job).
 * If a generated type for the `payload-jobs` collection is not available, falls back to the BaseJob type.
 *
 * `input` and `taksStatus` are always present here, as the job afterRead hook will always populate them.
 */
export type Job<
  TWorkflowSlugOrInput extends false | keyof TypedJobs['workflows'] | object = false,
> = HasPayloadJobsType extends true
  ? {
      input: BaseJob<TWorkflowSlugOrInput>['input']
      taskStatus: BaseJob<TWorkflowSlugOrInput>['taskStatus']
    } & Omit<TypedCollection['payload-jobs'], 'input' | 'taskStatus'>
  : BaseJob<TWorkflowSlugOrInput>

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
    return authLocal(this, options)
  }

  authStrategies!: AuthStrategy[]

  blocks: Record<BlockSlug, FlattenedBlock> = {}

  collections: Record<CollectionSlug, Collection> = {}

  config!: SanitizedConfig
  /**
   * @description Performs count operation
   * @param options
   * @returns count of documents satisfying query
   */
  count = async <T extends CollectionSlug>(
    options: CountOptions<T>,
  ): Promise<{ totalDocs: number }> => {
    return countLocal(this, options)
  }

  /**
   * @description Performs countGlobalVersions operation
   * @param options
   * @returns count of global document versions satisfying query
   */
  countGlobalVersions = async <T extends GlobalSlug>(
    options: CountGlobalVersionsOptions<T>,
  ): Promise<{ totalDocs: number }> => {
    return countGlobalVersionsLocal(this, options)
  }

  /**
   * @description Performs countVersions operation
   * @param options
   * @returns count of document versions satisfying query
   */
  countVersions = async <T extends CollectionSlug>(
    options: CountOptions<T>,
  ): Promise<{ totalDocs: number }> => {
    return countVersionsLocal(this, options)
  }

  /**
   * @description Performs create operation
   * @param options
   * @returns created document
   */
  create = async <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(
    options: CreateOptions<TSlug, TSelect>,
  ): Promise<TransformCollectionWithSelect<TSlug, TSelect>> => {
    return createLocal<TSlug, TSelect>(this, options)
  }

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

  duplicate = async <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug>>(
    options: DuplicateOptions<TSlug, TSelect>,
  ): Promise<TransformCollectionWithSelect<TSlug, TSelect>> => {
    return duplicateLocal<TSlug, TSelect>(this, options)
  }

  email!: InitializedEmailAdapter

  // TODO: re-implement or remove?
  // errorHandler: ErrorHandler

  encrypt = encrypt

  extensions!: (args: {
    args: OperationArgs<any>
    req: graphQLRequest<unknown, unknown>
    result: ExecutionResult
  }) => Promise<any>

  /**
   * @description Find documents with criteria
   * @param options
   * @returns documents satisfying query
   */
  find = async <
    TSlug extends CollectionSlug,
    TSelect extends SelectFromCollectionSlug<TSlug>,
    TDraft extends boolean = false,
  >(
    options: { draft?: TDraft } & FindOptions<TSlug, TSelect>,
  ): Promise<
    PaginatedDocs<
      TDraft extends true
        ? PayloadTypes extends { strictDraftTypes: true }
          ? DraftTransformCollectionWithSelect<TSlug, TSelect>
          : TransformCollectionWithSelect<TSlug, TSelect>
        : TransformCollectionWithSelect<TSlug, TSelect>
    >
  > => {
    return findLocal<TSlug, TSelect, TDraft>(this, options)
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
    return findByIDLocal<TSlug, TDisableErrors, TSelect>(this, options)
  }

  /**
   * @description Find distinct field values
   * @param options
   * @returns result with distinct field values
   */
  findDistinct = async <
    TSlug extends CollectionSlug,
    TField extends keyof DataFromCollectionSlug<TSlug> & string,
  >(
    options: FindDistinctOptions<TSlug, TField>,
  ): Promise<PaginatedDistinctDocs<Record<TField, DataFromCollectionSlug<TSlug>[TField]>>> => {
    return findDistinctLocal(this, options)
  }

  findGlobal = async <TSlug extends GlobalSlug, TSelect extends SelectFromGlobalSlug<TSlug>>(
    options: FindGlobalOptions<TSlug, TSelect>,
  ): Promise<TransformGlobalWithSelect<TSlug, TSelect>> => {
    return findOneGlobalLocal<TSlug, TSelect>(this, options)
  }

  /**
   * @description Find global version by ID
   * @param options
   * @returns global version with specified ID
   */
  findGlobalVersionByID = async <TSlug extends GlobalSlug>(
    options: FindGlobalVersionByIDOptions<TSlug>,
  ): Promise<TypeWithVersion<DataFromGlobalSlug<TSlug>>> => {
    return findGlobalVersionByIDLocal<TSlug>(this, options)
  }

  /**
   * @description Find global versions with criteria
   * @param options
   * @returns versions satisfying query
   */
  findGlobalVersions = async <TSlug extends GlobalSlug>(
    options: FindGlobalVersionsOptions<TSlug>,
  ): Promise<PaginatedDocs<TypeWithVersion<DataFromGlobalSlug<TSlug>>>> => {
    return findGlobalVersionsLocal<TSlug>(this, options)
  }

  /**
   * @description Find version by ID
   * @param options
   * @returns version with specified ID
   */
  findVersionByID = async <TSlug extends CollectionSlug>(
    options: FindVersionByIDOptions<TSlug>,
  ): Promise<TypeWithVersion<DataFromCollectionSlug<TSlug>>> => {
    return findVersionByIDLocal<TSlug>(this, options)
  }

  /**
   * @description Find versions with criteria
   * @param options
   * @returns versions satisfying query
   */
  findVersions = async <TSlug extends CollectionSlug>(
    options: FindVersionsOptions<TSlug>,
  ): Promise<PaginatedDocs<TypeWithVersion<DataFromCollectionSlug<TSlug>>>> => {
    return findVersionsLocal<TSlug>(this, options)
  }

  forgotPassword = async <TSlug extends CollectionSlug>(
    options: ForgotPasswordOptions<TSlug>,
  ): Promise<ForgotPasswordResult> => {
    return forgotPasswordLocal<TSlug>(this, options)
  }

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

  jobs = getJobsLocalAPI(this)

  /**
   * Key Value storage
   */
  kv!: KVAdapter

  logger!: Logger

  login = async <TSlug extends CollectionSlug>(
    options: LoginOptions<TSlug>,
  ): Promise<{ user: DataFromCollectionSlug<TSlug> } & LoginResult> => {
    return loginLocal<TSlug>(this, options)
  }

  resetPassword = async <TSlug extends CollectionSlug>(
    options: ResetPasswordOptions<TSlug>,
  ): Promise<ResetPasswordResult> => {
    return resetPasswordLocal<TSlug>(this, options)
  }

  /**
   * @description Restore global version by ID
   * @param options
   * @returns version with specified ID
   */
  restoreGlobalVersion = async <TSlug extends GlobalSlug>(
    options: RestoreGlobalVersionOptions<TSlug>,
  ): Promise<DataFromGlobalSlug<TSlug>> => {
    return restoreGlobalVersionLocal<TSlug>(this, options)
  }

  /**
   * @description Restore version by ID
   * @param options
   * @returns version with specified ID
   */
  restoreVersion = async <TSlug extends CollectionSlug>(
    options: RestoreVersionOptions<TSlug>,
  ): Promise<DataFromCollectionSlug<TSlug>> => {
    return restoreVersionLocal<TSlug>(this, options)
  }

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

  unlock = async <TSlug extends CollectionSlug>(
    options: UnlockOptions<TSlug>,
  ): Promise<boolean> => {
    return unlockLocal<TSlug>(this, options)
  }

  updateGlobal = async <TSlug extends GlobalSlug, TSelect extends SelectFromGlobalSlug<TSlug>>(
    options: UpdateGlobalOptions<TSlug, TSelect>,
  ): Promise<TransformGlobalWithSelect<TSlug, TSelect>> => {
    return updateGlobalLocal<TSlug, TSelect>(this, options)
  }

  validationRules!: (args: OperationArgs<any>) => ValidationRule[]

  verifyEmail = async <TSlug extends CollectionSlug>(
    options: VerifyEmailOptions<TSlug>,
  ): Promise<boolean> => {
    return verifyEmailLocal(this, options)
  }

  versions: {
    [slug: string]: any // TODO: Type this
  } = {}

  async _initializeCrons() {
    if (this.config.jobs.enabled && this.config.jobs.autoRun && !isNextBuild()) {
      const DEFAULT_CRON = '* * * * *'
      const DEFAULT_LIMIT = 10

      const cronJobs =
        typeof this.config.jobs.autoRun === 'function'
          ? await this.config.jobs.autoRun(this)
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
                const shouldAutoRun = await this.config.jobs.shouldAutoRun(this)

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

    this.blocks = this.config.blocks!.reduce(
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

    this.db = this.config.db.init({ payload: this })
    this.db.payload = this

    this.kv = this.config.kv.init({ payload: this })

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

    if (options.cron) {
      await this._initializeCrons()
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
    return updateLocal<TSlug, TSelect>(this, options)
  }
}

const initialized = new BasePayload()

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

  payload.blocks = config.blocks!.reduce(
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
    initializedCrons: boolean
    payload: null | Payload
    promise: null | Promise<Payload>
    reload: boolean | Promise<void>
    ws: null | WebSocket
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
export const getPayload = async (
  options: {
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
      initializedCrons: Boolean(options.cron),
      payload: null,
      promise: null,
      reload: false,
      ws: null,
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
      !cached.ws &&
      process.env.NODE_ENV !== 'production' &&
      process.env.NODE_ENV !== 'test' &&
      process.env.DISABLE_PAYLOAD_HMR !== 'true'
    ) {
      try {
        const port = process.env.PORT || '3000'
        const hasHTTPS =
          process.env.USE_HTTPS === 'true' || process.argv.includes('--experimental-https')
        const protocol = hasHTTPS ? 'wss' : 'ws'

        const path = '/_next/webpack-hmr'
        // The __NEXT_ASSET_PREFIX env variable is set for both assetPrefix and basePath (tested in Next.js 15.1.6)
        const prefix = process.env.__NEXT_ASSET_PREFIX ?? ''

        cached.ws = new WebSocket(
          process.env.PAYLOAD_HMR_URL_OVERRIDE ?? `${protocol}://localhost:${port}${prefix}${path}`,
        )

        cached.ws.onmessage = (event) => {
          if (cached.reload instanceof Promise) {
            // If there is an in-progress reload in the same getPayload
            // cache instance, do not set reload to true again, which would
            // trigger another reload.
            // Instead, wait for the in-progress reload to finish.
            return
          }

          if (typeof event.data === 'string') {
            const data = JSON.parse(event.data)

            if (
              // On Next.js 15, we need to check for data.action. On Next.js 16, we need to check for data.type.
              data.type === 'serverComponentChanges' ||
              data.action === 'serverComponentChanges'
            ) {
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
export * from './auth/index.js'
export { jwtSign } from './auth/jwt.js'
export { accessOperation } from './auth/operations/access.js'
export { forgotPasswordOperation } from './auth/operations/forgotPassword.js'
export { initOperation } from './auth/operations/init.js'
export { checkLoginPermission } from './auth/operations/login.js'
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
  UntypedUser as User,
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
  type CreateClientConfigArgs,
  createUnauthenticatedClientConfig,
  serverOnlyAdminConfigProperties,
  serverOnlyConfigProperties,
  type UnauthenticatedClientConfig,
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
export { slugField, type SlugFieldClientProps } from './fields/baseFields/slug/index.js'

export { type SlugField } from './fields/baseFields/slug/index.js'

export {
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
export type { FolderSortKeys } from './folders/types.js'
export { getFolderData } from './folders/utils/getFolderData.js'
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
export { docAccessOperation as docAccessOperationGlobal } from './globals/operations/docAccess.js'
export { findOneOperation } from './globals/operations/findOne.js'

export { findVersionByIDOperation as findVersionByIDOperationGlobal } from './globals/operations/findVersionByID.js'

export { findVersionsOperation as findVersionsOperationGlobal } from './globals/operations/findVersions.js'
export { restoreVersionOperation as restoreVersionOperationGlobal } from './globals/operations/restoreVersion.js'
export { updateOperation as updateOperationGlobal } from './globals/operations/update.js'
export * from './kv/adapters/DatabaseKVAdapter.js'
export * from './kv/adapters/InMemoryKVAdapter.js'
export * from './kv/index.js'
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
  TaskType,
} from './queues/config/types/taskTypes.js'
export type {
  BaseJob,
  ConcurrencyConfig,
  JobLog,
  JobTaskStatus,
  RunningJob,
  SingleTaskStatus,
  WorkflowConfig,
  WorkflowHandler,
  WorkflowTypes,
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
export { dynamicImport } from './utilities/dynamicImport.js'
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
export { mapAsync } from './utilities/mapAsync.js'
export { mergeHeaders } from './utilities/mergeHeaders.js'
export { parseDocumentID } from './utilities/parseDocumentID.js'
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
export { localizeStatus } from './versions/migrations/localizeStatus/index.js'
export type {
  MongoLocalizeStatusArgs,
  SqlLocalizeStatusArgs,
} from './versions/migrations/localizeStatus/index.js'
export { saveVersion } from './versions/saveVersion.js'
export type { SchedulePublishTaskInput } from './versions/schedule/types.js'

export type { SchedulePublish, TypeWithVersion } from './versions/types.js'
export { deepMergeSimple } from '@payloadcms/translations/utilities'
