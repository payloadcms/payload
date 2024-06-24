import type { ExecutionResult, GraphQLSchema, ValidationRule } from 'graphql'
import type { OperationArgs, Request as graphQLRequest } from 'graphql-http'
import type pino from 'pino'

import crypto from 'crypto'

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

type GeneratedTypes = {
  collections: {
    [slug: string]: TypeWithID & Record<string, unknown>
  }
  globals: {
    [slug: string]: Record<string, unknown>
  }
  locale: null | string
  user: User
}

type StringKeyOf<T> = Extract<keyof T, string>

export type CollectionSlug = StringKeyOf<GeneratedTypes['collections']>

export type GlobalSlug = StringKeyOf<GeneratedTypes['globals']>

/**
 * @description Payload
 */
export class BasePayload {
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

  logger: pino.Logger

  login = async <TSlug extends CollectionSlug>(
    options: LoginOptions<TSlug>,
  ): Promise<LoginResult & { user: DataFromCollectionSlug<TSlug> }> => {
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
    return unlock(this, options)
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
  // eslint-disable-next-line no-multi-assign
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

type DatabaseAdapter = BaseDatabaseAdapter

export type { DatabaseAdapter, GeneratedTypes, Payload, RequestContext }
