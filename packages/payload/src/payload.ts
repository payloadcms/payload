// BasePayload uses non-standard properties as functions
/* eslint-disable perfectionist/sort-classes */

import type { Express, Router } from 'express';
import type { ExecutionResult, GraphQLSchema, ValidationRule } from 'graphql';
// @ts-expect-error // TODO: Broke with pnpm/workspaces/esm. Fix this
import type { OperationArgs, Request as graphQLRequest } from 'graphql-http/lib/handler';
import type { SendMailOptions } from 'nodemailer';
import type { Config as GeneratedTypes } from 'payload/generated-types';
import type pino from 'pino';

import crypto from 'crypto';
import path from 'path';

import type { Result as ForgotPasswordResult } from './auth/operations/forgotPassword.js';
import type { Options as ForgotPasswordOptions } from './auth/operations/local/forgotPassword.js';
import type { Options as LoginOptions } from './auth/operations/local/login.js';
import type { Options as ResetPasswordOptions } from './auth/operations/local/resetPassword.js';
import type { Options as UnlockOptions } from './auth/operations/local/unlock.js';
import type { Options as VerifyEmailOptions } from './auth/operations/local/verifyEmail.js';
import type { Result as LoginResult } from './auth/operations/login.js';
import type { Result as ResetPasswordResult } from './auth/operations/resetPassword.js';
import type { BulkOperationResult, Collection } from './collections/config/types.js';
import type { Options as CreateOptions } from './collections/operations/local/create.js';
import type {
  ByIDOptions as DeleteByIDOptions,
  ManyOptions as DeleteManyOptions,
  Options as DeleteOptions,
} from './collections/operations/local/delete.js';
import type { Options as FindOptions } from './collections/operations/local/find.js';
import type { Options as FindByIDOptions } from './collections/operations/local/findByID.js';
import type { Options as FindVersionByIDOptions } from './collections/operations/local/findVersionByID.js';
import type { Options as FindVersionsOptions } from './collections/operations/local/findVersions.js';
import type { Options as RestoreVersionOptions } from './collections/operations/local/restoreVersion.js';
import type {
  ByIDOptions as UpdateByIDOptions,
  ManyOptions as UpdateManyOptions,
  Options as UpdateOptions,
} from './collections/operations/local/update.js';
import type { EmailOptions, InitOptions, SanitizedConfig } from './config/types.js';
import type { DatabaseAdapter } from './database/types.js';
import type { PaginatedDocs } from './database/types.js';
import type { BuildEmailResult } from './email/types.js';
import type { PayloadAuthenticate } from './express/middleware/authenticate.js';
import type { ErrorHandler } from './express/middleware/errorHandler.js';
import type { Globals } from './globals/config/types.js';
import type { Options as FindGlobalOptions } from './globals/operations/local/findOne.js';
import type { Options as FindGlobalVersionByIDOptions } from './globals/operations/local/findVersionByID.js';
import type { Options as FindGlobalVersionsOptions } from './globals/operations/local/findVersions.js';
import type { Options as RestoreGlobalVersionOptions } from './globals/operations/local/restoreVersion.js';
import type { Options as UpdateGlobalOptions } from './globals/operations/local/update.js';
import type { TypeWithVersion } from './versions/types.js';

import { decrypt, encrypt } from './auth/crypto.js';
import localOperations from './collections/operations/local/index.js';
import findConfig from './config/find.js';
import buildEmail from './email/build.js';
import { defaults as emailDefaults } from './email/defaults.js';
import sendEmail from './email/sendEmail.js';
import localGlobalOperations from './globals/operations/local/index.js';
import registerGraphQLSchema from './graphql/registerSchema.js';
import Logger from './utilities/logger.js';
import { serverInit as serverInitTelemetry } from './utilities/telemetry/events/serverInit.js';

/**
 * @description Payload
 */
export class BasePayload<TGeneratedTypes extends GeneratedTypes> {
  config: SanitizedConfig;

  db: DatabaseAdapter;

  collections: {
    [slug: number | string | symbol]: Collection;
  } = {};

  versions: {
    [slug: string]: any; // TODO: Type this
  } = {};

  globals: Globals;

  logger: pino.Logger;

  emailOptions: EmailOptions;

  email: BuildEmailResult;

  sendEmail: (message: SendMailOptions) => Promise<unknown>;

  secret: string;

  local: boolean;

  encrypt = encrypt;

  decrypt = decrypt;

  errorHandler: ErrorHandler;

  authenticate: PayloadAuthenticate;

  express?: Express;

  router?: Router;

  types: {
    arrayTypes: any;
    blockInputTypes: any;
    blockTypes: any;
    fallbackLocaleInputType?: any;
    groupTypes: any;
    localeInputType?: any;
    tabTypes: any;
  };

  Query: { fields: { [key: string]: any }; name: string } = { fields: {}, name: 'Query' };

  Mutation: { fields: { [key: string]: any }; name: string } = { fields: {}, name: 'Mutation' };

  schema: GraphQLSchema;

  extensions: (args: {
    args: OperationArgs<any>,
    req: graphQLRequest<unknown, unknown>,
    result: ExecutionResult
  }) => Promise<any>;

  validationRules: (args: OperationArgs<any>) => ValidationRule[];

  getAdminURL = (): string => `${this.config.serverURL}${this.config.routes.admin}`;

  getAPIURL = (): string => `${this.config.serverURL}${this.config.routes.api}`;

  /**
   * @description Initializes Payload
   * @param options
   */
  async init(options: InitOptions): Promise<Payload> {
    this.logger = Logger('payload', options.loggerOptions, options.loggerDestination);

    this.logger.info('Starting Payload...');
    if (!options.secret) {
      throw new Error(
        'Error: missing secret key. A secret key is needed to secure Payload.',
      );
    }

    this.secret = crypto
      .createHash('sha256')
      .update(options.secret)
      .digest('hex')
      .slice(0, 32);

    this.local = options.local;

    if (options.config) {
      this.config = await options.config;
      const configPath = findConfig();

      this.config = {
        ...this.config,
        paths: {
          config: configPath,
          configDir: path.dirname(configPath),
          rawConfig: configPath,
        },
      };
    } else {
      const loadConfigImport = (await import('./config/load.js'));
      const loadConfig = 'default' in loadConfigImport ? loadConfigImport.default : loadConfigImport;
      this.config = await loadConfig(this.logger);
    }

    this.globals = {
      config: this.config.globals,
    };
    this.config.collections.forEach((collection) => {
      this.collections[collection.slug] = {
        config: collection,
      };
    });

    this.db = this.config.db({ payload: this });
    this.db.payload = this;

    if (this.db?.init) {
      await this.db.init(this);
    }

    if (this.db.connect) {
      await this.db.connect(this);
    }

    // Configure email service
    const emailOptions = options.email ? { ...options.email } : this.config.email;
    if (options.email && this.config.email) {
      this.logger.warn(
        'Email options provided in both init options and config. Using init options.',
      );
    }

    this.emailOptions = emailOptions ?? emailDefaults;
    this.email = buildEmail(this.emailOptions, this.logger);
    this.sendEmail = sendEmail.bind(this);

    if (!this.config.graphQL.disable) {
      registerGraphQLSchema(this);
    }

    serverInitTelemetry(this);

    if (options.local !== false) {
      if (typeof options.onInit === 'function') await options.onInit(this);
      if (typeof this.config.onInit === 'function') await this.config.onInit(this);
    }

    return this;
  }

  /**
   * @description Performs create operation
   * @param options
   * @returns created document
   */
  create = async <T extends keyof TGeneratedTypes['collections']>(
    options: CreateOptions<T>,
  ): Promise<TGeneratedTypes['collections'][T]> => {
    const { create } = localOperations;
    return create<T>(this, options);
  };

  /**
   * @description Find documents with criteria
   * @param options
   * @returns documents satisfying query
   */
  find = async <T extends keyof TGeneratedTypes['collections']>(
    options: FindOptions<T>,
  ): Promise<PaginatedDocs<TGeneratedTypes['collections'][T]>> => {
    const { find } = localOperations;
    return find<T>(this, options);
  };

  /**
   * @description Find document by ID
   * @param options
   * @returns document with specified ID
   */

  findByID = async <T extends keyof TGeneratedTypes['collections']>(
    options: FindByIDOptions<T>,
  ): Promise<TGeneratedTypes['collections'][T]> => {
    const { findByID } = localOperations;
    return findByID<T>(this, options);
  };

  /**
   * @description Update one or more documents
   * @param options
   * @returns Updated document(s)
   */
  update<T extends keyof TGeneratedTypes['collections']>(options: UpdateByIDOptions<T>): Promise<TGeneratedTypes['collections'][T]>

  update<T extends keyof TGeneratedTypes['collections']>(options: UpdateManyOptions<T>): Promise<BulkOperationResult<T>>

  update<T extends keyof TGeneratedTypes['collections']>(options: UpdateOptions<T>): Promise<BulkOperationResult<T> | TGeneratedTypes['collections'][T]> {
    const { update } = localOperations;
    return update<T>(this, options);
  }

  /**
   * @description delete one or more documents
   * @param options
   * @returns Updated document(s)
   */
  delete<T extends keyof TGeneratedTypes['collections']>(options: DeleteByIDOptions<T>): Promise<TGeneratedTypes['collections'][T]>

  delete<T extends keyof TGeneratedTypes['collections']>(options: DeleteManyOptions<T>): Promise<BulkOperationResult<T>>

  delete<T extends keyof TGeneratedTypes['collections']>(options: DeleteOptions<T>): Promise<BulkOperationResult<T> | TGeneratedTypes['collections'][T]> {
    const { deleteLocal } = localOperations;
    return deleteLocal<T>(this, options);
  }

  /**
   * @description Find versions with criteria
   * @param options
   * @returns versions satisfying query
   */
  findVersions = async <T extends keyof TGeneratedTypes['collections']>(
    options: FindVersionsOptions<T>,
  ): Promise<PaginatedDocs<TypeWithVersion<TGeneratedTypes['collections'][T]>>> => {
    const { findVersions } = localOperations;
    return findVersions<T>(this, options);
  };

  /**
   * @description Find version by ID
   * @param options
   * @returns version with specified ID
   */
  findVersionByID = async <T extends keyof TGeneratedTypes['collections']>(
    options: FindVersionByIDOptions<T>,
  ): Promise<TypeWithVersion<TGeneratedTypes['collections'][T]>> => {
    const { findVersionByID } = localOperations;
    return findVersionByID<T>(this, options);
  };

  /**
   * @description Restore version by ID
   * @param options
   * @returns version with specified ID
   */
  restoreVersion = async <T extends keyof TGeneratedTypes['collections']>(
    options: RestoreVersionOptions<T>,
  ): Promise<TGeneratedTypes['collections'][T]> => {
    const { restoreVersion } = localOperations;
    return restoreVersion<T>(this, options);
  };

  login = async <T extends keyof TGeneratedTypes['collections']>(
    options: LoginOptions<T>,
  ): Promise<LoginResult & { user: TGeneratedTypes['collections'][T] }> => {
    const { login } = localOperations.auth;
    return login<T>(this, options);
  };

  forgotPassword = async <T extends keyof TGeneratedTypes['collections']>(
    options: ForgotPasswordOptions<T>,
  ): Promise<ForgotPasswordResult> => {
    const { forgotPassword } = localOperations.auth;
    return forgotPassword<T>(this, options);
  };

  resetPassword = async <T extends keyof TGeneratedTypes['collections']>(
    options: ResetPasswordOptions<T>,
  ): Promise<ResetPasswordResult> => {
    const { resetPassword } = localOperations.auth;
    return resetPassword<T>(this, options);
  };

  unlock = async <T extends keyof TGeneratedTypes['collections']>(
    options: UnlockOptions<T>,
  ): Promise<boolean> => {
    const { unlock } = localOperations.auth;
    return unlock(this, options);
  };

  verifyEmail = async <T extends keyof TGeneratedTypes['collections']>(
    options: VerifyEmailOptions<T>,
  ): Promise<boolean> => {
    const { verifyEmail } = localOperations.auth;
    return verifyEmail(this, options);
  };

  findGlobal = async <T extends keyof TGeneratedTypes['globals']>(
    options: FindGlobalOptions<T>,
  ): Promise<TGeneratedTypes['globals'][T]> => {
    const { findOne } = localGlobalOperations;
    return findOne<T>(this, options);
  };

  updateGlobal = async <T extends keyof TGeneratedTypes['globals']>(
    options: UpdateGlobalOptions<T>,
  ): Promise<TGeneratedTypes['globals'][T]> => {
    const { update } = localGlobalOperations;
    return update<T>(this, options);
  };

  /**
   * @description Find global versions with criteria
   * @param options
   * @returns versions satisfying query
   */
  findGlobalVersions = async <T extends keyof TGeneratedTypes['globals']>(
    options: FindGlobalVersionsOptions<T>,
  ): Promise<PaginatedDocs<TypeWithVersion<TGeneratedTypes['globals'][T]>>> => {
    const { findVersions } = localGlobalOperations;
    return findVersions<T>(this, options);
  };

  /**
   * @description Find global version by ID
   * @param options
   * @returns global version with specified ID
   */
  findGlobalVersionByID = async <T extends keyof TGeneratedTypes['globals']>(
    options: FindGlobalVersionByIDOptions<T>,
  ): Promise<TypeWithVersion<TGeneratedTypes['globals'][T]>> => {
    const { findVersionByID } = localGlobalOperations;
    return findVersionByID<T>(this, options);
  };

  /**
   * @description Restore global version by ID
   * @param options
   * @returns version with specified ID
   */
  restoreGlobalVersion = async <T extends keyof TGeneratedTypes['globals']>(
    options: RestoreGlobalVersionOptions<T>,
  ): Promise<TGeneratedTypes['globals'][T]> => {
    const { restoreVersion } = localGlobalOperations;
    return restoreVersion<T>(this, options);
  };
}

export type Payload = BasePayload<GeneratedTypes>

let cached = global._payload;

if (!cached) {
  // eslint-disable-next-line no-multi-assign
  cached = global._payload = { payload: null, promise: null };
}

export const getPayload = async (options: InitOptions): Promise<Payload> => {
  if (cached.payload) {
    return cached.payload;
  }

  if (!cached.promise) {
    cached.promise = new BasePayload<GeneratedTypes>().init(options);
  }

  try {
    cached.payload = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.payload;
};
