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
