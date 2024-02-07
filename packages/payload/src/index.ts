import type { ExecutionResult, GraphQLSchema, ValidationRule } from 'graphql'
import type { OperationArgs, Request as graphQLRequest } from 'graphql-http'
import type { SendMailOptions } from 'nodemailer'
import type pino from 'pino'

import crypto from 'crypto'
import path from 'path'

import type { AuthStrategy } from './auth'
import type { Result as ForgotPasswordResult } from './auth/operations/forgotPassword'
import type { Options as ForgotPasswordOptions } from './auth/operations/local/forgotPassword'
import type { Options as LoginOptions } from './auth/operations/local/login'
import type { Options as ResetPasswordOptions } from './auth/operations/local/resetPassword'
import type { Options as UnlockOptions } from './auth/operations/local/unlock'
import type { Options as VerifyEmailOptions } from './auth/operations/local/verifyEmail'
import type { Result as LoginResult } from './auth/operations/login'
import type { Result as ResetPasswordResult } from './auth/operations/resetPassword'
import type { BulkOperationResult, Collection, TypeWithID } from './collections/config/types'
import type { Options as CreateOptions } from './collections/operations/local/create'
import type {
  ByIDOptions as DeleteByIDOptions,
  ManyOptions as DeleteManyOptions,
  Options as DeleteOptions,
} from './collections/operations/local/delete'
import type { Options as FindOptions } from './collections/operations/local/find'
import type { Options as FindByIDOptions } from './collections/operations/local/findByID'
import type { Options as FindVersionByIDOptions } from './collections/operations/local/findVersionByID'
import type { Options as FindVersionsOptions } from './collections/operations/local/findVersions'
import type { Options as RestoreVersionOptions } from './collections/operations/local/restoreVersion'
import type {
  ByIDOptions as UpdateByIDOptions,
  ManyOptions as UpdateManyOptions,
  Options as UpdateOptions,
} from './collections/operations/local/update'
import type { EmailOptions, InitOptions, SanitizedConfig } from './config/types'
import type { BaseDatabaseAdapter, PaginatedDocs } from './database/types'
import type { BuildEmailResult } from './email/types'
import type { TypeWithID as GlobalTypeWithID, Globals } from './globals/config/types'
import type { Options as FindGlobalOptions } from './globals/operations/local/findOne'
import type { Options as FindGlobalVersionByIDOptions } from './globals/operations/local/findVersionByID'
import type { Options as FindGlobalVersionsOptions } from './globals/operations/local/findVersions'
import type { Options as RestoreGlobalVersionOptions } from './globals/operations/local/restoreVersion'
import type { Options as UpdateGlobalOptions } from './globals/operations/local/update'
import type { TypeWithVersion } from './versions/types'

import { decrypt, encrypt } from './auth/crypto'
import { APIKeyAuthentication } from './auth/strategies/apiKey'
import { JWTAuthentication } from './auth/strategies/jwt'
import localOperations from './collections/operations/local'
import findConfig from './config/find'
import buildEmail from './email/build'
import { defaults as emailDefaults } from './email/defaults'
import sendEmail from './email/sendEmail'
import localGlobalOperations from './globals/operations/local'
import Logger from './utilities/logger'
import { serverInit as serverInitTelemetry } from './utilities/telemetry/events/serverInit'

/**
 * @description Payload
 */
export class BasePayload<TGeneratedTypes extends GeneratedTypes> {
  Mutation: { fields: { [key: string]: any }; name: string } = { name: 'Mutation', fields: {} }

  Query: { fields: { [key: string]: any }; name: string } = { name: 'Query', fields: {} }

  authStrategies: AuthStrategy[]

  collections: {
    [slug: number | string | symbol]: Collection
  } = {}

  config: SanitizedConfig

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

  db: BaseDatabaseAdapter

  decrypt = decrypt

  email: BuildEmailResult

  emailOptions: EmailOptions

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
  find = async <T extends keyof TGeneratedTypes['collections']>(
    options: FindOptions<T>,
  ): Promise<PaginatedDocs<TGeneratedTypes['collections'][T]>> => {
    const { find } = localOperations
    return find<T>(this, options)
  }

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

  local: boolean

  logger: pino.Logger

  login = async <T extends keyof TGeneratedTypes['collections']>(
    options: LoginOptions<T>,
  ): Promise<LoginResult & { user: TGeneratedTypes['collections'][T] }> => {
    const { login } = localOperations.auth
    return login<T>(this, options)
  }

  /**
   * @description Find document by ID
   * @param options
   * @returns document with specified ID
   */

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

  sendEmail: (message: SendMailOptions) => Promise<unknown>

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

  delete<T extends keyof TGeneratedTypes['collections']>(
    options: DeleteOptions<T>,
  ): Promise<BulkOperationResult<T> | TGeneratedTypes['collections'][T]> {
    const { deleteLocal } = localOperations
    return deleteLocal<T>(this, options)
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

  /**
   * @description Initializes Payload
   * @param options
   */
  // @ts-expect-error // TODO: TypeScript hallucinating again. fix later
  async init(options: InitOptions): Promise<Payload> {
    this.logger = Logger('payload', options.loggerOptions, options.loggerDestination)

    this.config = await options.config

    // TODO(JARROD/JAMES): can we keep this?
    const configPath = findConfig()
    this.config = {
      ...this.config,
      paths: {
        config: configPath,
        configDir: path.dirname(configPath),
        rawConfig: configPath,
      },
    }

    if (!this.config.secret) {
      throw new Error('Error: missing secret key. A secret key is needed to secure Payload.')
    }

    this.secret = crypto.createHash('sha256').update(this.config.secret).digest('hex').slice(0, 32)

    this.local = options.local

    this.globals = {
      config: this.config.globals,
    }
    this.config.collections.forEach((collection) => {
      this.collections[collection.slug] = {
        collectionConfig: collection,
      }
    })

    this.db = this.config.db.init({ payload: this })
    this.db.payload = this

    if (this.db?.init) {
      await this.db.init(this)
    }

    if (!options.disableDBConnect && this.db.connect) {
      await this.db.connect(this)
    }

    this.logger.info('Starting Payload...')

    // Configure email service
    const emailOptions = options.email ? { ...options.email } : this.config.email
    if (options.email && this.config.email) {
      this.logger.warn(
        'Email options provided in both init options and config. Using init options.',
      )
    }

    this.emailOptions = emailOptions ?? emailDefaults
    this.email = buildEmail(this.emailOptions, this.logger)
    this.sendEmail = sendEmail.bind(this)

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

export const getPayload = async (options?: InitOptions): Promise<BasePayload<GeneratedTypes>> => {
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
}

type Payload = BasePayload<GeneratedTypes>

interface RequestContext {
  [key: string]: unknown
}

// type DatabaseAdapter = BaseDatabaseAdapter

export type { GeneratedTypes, Payload, RequestContext }
