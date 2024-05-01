import type { Express, Router } from 'express'
import type { ExecutionResult, GraphQLSchema, ValidationRule } from 'graphql'
// @ts-expect-error // TODO Fix this - moduleResolution 16 breaks this import
import type { OperationArgs, Request as graphQLRequest } from 'graphql-http/lib/handler'
import type { SendMailOptions } from 'nodemailer'
import type pino from 'pino'

import crypto from 'crypto'
import path from 'path'

import type { DatabaseAdapter, GeneratedTypes } from './' // Must import from Payload to support declare module
import type { Result as ForgotPasswordResult } from './auth/operations/forgotPassword'
import type { Options as ForgotPasswordOptions } from './auth/operations/local/forgotPassword'
import type { Options as LoginOptions } from './auth/operations/local/login'
import type { Options as ResetPasswordOptions } from './auth/operations/local/resetPassword'
import type { Options as UnlockOptions } from './auth/operations/local/unlock'
import type { Options as VerifyEmailOptions } from './auth/operations/local/verifyEmail'
import type { Result as LoginResult } from './auth/operations/login'
import type { Result as ResetPasswordResult } from './auth/operations/resetPassword'
import type { BulkOperationResult, Collection } from './collections/config/types'
import type { Options as CountOptions } from './collections/operations/local/count'
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
import type { PaginatedDocs } from './database/types'
import type { BuildEmailResult } from './email/types'
import type { PayloadAuthenticate } from './express/middleware/authenticate'
import type { ErrorHandler } from './express/middleware/errorHandler'
import type { Globals } from './globals/config/types'
import type { Options as FindGlobalOptions } from './globals/operations/local/findOne'
import type { Options as FindGlobalVersionByIDOptions } from './globals/operations/local/findVersionByID'
import type { Options as FindGlobalVersionsOptions } from './globals/operations/local/findVersions'
import type { Options as RestoreGlobalVersionOptions } from './globals/operations/local/restoreVersion'
import type { Options as UpdateGlobalOptions } from './globals/operations/local/update'
import type { TypeWithVersion } from './versions/types'

import { decrypt, encrypt } from './auth/crypto'
import localOperations from './collections/operations/local'
import findConfig from './config/find'
import buildEmail from './email/build'
import { defaults as emailDefaults } from './email/defaults'
import sendEmail from './email/sendEmail'
import localGlobalOperations from './globals/operations/local'
import registerGraphQLSchema from './graphql/registerSchema'
import Logger from './utilities/logger'
import { serverInit as serverInitTelemetry } from './utilities/telemetry/events/serverInit'

/**
 * @description Payload
 */
export class BasePayload<TGeneratedTypes extends GeneratedTypes> {
  Mutation: { fields: { [key: string]: any }; name: string } = { name: 'Mutation', fields: {} }

  Query: { fields: { [key: string]: any }; name: string } = { name: 'Query', fields: {} }

  authenticate: PayloadAuthenticate

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

  email: BuildEmailResult

  emailOptions: EmailOptions

  encrypt = encrypt

  errorHandler: ErrorHandler

  express?: Express

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

  router?: Router

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
    this.logger =
      options.logger ?? Logger('payload', options.loggerOptions, options.loggerDestination)

    if (!options.secret) {
      throw new Error('Error: missing secret key. A secret key is needed to secure Payload.')
    }

    this.secret = crypto.createHash('sha256').update(options.secret).digest('hex').slice(0, 32)

    this.local = options.local

    if (options.config) {
      this.config = await options.config
      const configPath = findConfig()

      this.config = {
        ...this.config,
        paths: {
          config: configPath,
          configDir: path.dirname(configPath),
          rawConfig: configPath,
        },
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
      const loadConfig = require('./config/load').default
      this.config = await loadConfig(this.logger)
    }

    this.globals = {
      config: this.config.globals,
    }
    this.config.collections.forEach((collection) => {
      this.collections[collection.slug] = {
        config: collection,
      }
    })

    this.db = this.config.db({ payload: this })
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

    if (!this.config.graphQL.disable) {
      registerGraphQLSchema(this)
    }

    serverInitTelemetry(this)

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

export type Payload = BasePayload<GeneratedTypes>

let cached = global._payload

if (!cached) {
  // eslint-disable-next-line no-multi-assign
  cached = global._payload = { payload: null, promise: null }
}

export const getPayload = async (options: InitOptions): Promise<Payload> => {
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
