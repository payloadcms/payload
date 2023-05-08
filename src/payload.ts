import pino from 'pino';
import type { Express, Router } from 'express';
import { ExecutionResult, GraphQLSchema, ValidationRule } from 'graphql';
import crypto from 'crypto';
import path from 'path';
import mongoose from 'mongoose';
import { Config as GeneratedTypes } from 'payload/generated-types';
import { OperationArgs, Request as graphQLRequest } from 'graphql-http/lib/handler';
import { BulkOperationResult, Collection, CollectionModel } from './collections/config/types';
import { EmailOptions, InitOptions, SanitizedConfig } from './config/types';
import { TypeWithVersion } from './versions/types';
import { PaginatedDocs } from './mongoose/types';

import { PayloadAuthenticate } from './express/middleware/authenticate';
import { Globals } from './globals/config/types';
import { ErrorHandler } from './express/middleware/errorHandler';
import localOperations from './collections/operations/local';
import localGlobalOperations from './globals/operations/local';
import { decrypt, encrypt } from './auth/crypto';
import { BuildEmailResult, Message } from './email/types';
import { Preferences } from './preferences/types';

import { Options as CreateOptions } from './collections/operations/local/create';
import { Options as FindOptions } from './collections/operations/local/find';
import {
  ByIDOptions as UpdateByIDOptions,
  ManyOptions as UpdateManyOptions,
  Options as UpdateOptions,
} from './collections/operations/local/update';
import {
  ByIDOptions as DeleteByIDOptions,
  ManyOptions as DeleteManyOptions,
  Options as DeleteOptions,
} from './collections/operations/local/delete';
import { Options as FindByIDOptions } from './collections/operations/local/findByID';
import { Options as FindVersionsOptions } from './collections/operations/local/findVersions';
import { Options as FindVersionByIDOptions } from './collections/operations/local/findVersionByID';
import { Options as RestoreVersionOptions } from './collections/operations/local/restoreVersion';
import { Options as FindGlobalVersionsOptions } from './globals/operations/local/findVersions';
import { Options as FindGlobalVersionByIDOptions } from './globals/operations/local/findVersionByID';
import { Options as RestoreGlobalVersionOptions } from './globals/operations/local/restoreVersion';
import { Options as ForgotPasswordOptions } from './auth/operations/local/forgotPassword';
import { Options as LoginOptions } from './auth/operations/local/login';
import { Options as ResetPasswordOptions } from './auth/operations/local/resetPassword';
import { Options as UnlockOptions } from './auth/operations/local/unlock';
import { Options as VerifyEmailOptions } from './auth/operations/local/verifyEmail';
import { Result as ForgotPasswordResult } from './auth/operations/forgotPassword';
import { Result as ResetPasswordResult } from './auth/operations/resetPassword';
import { Result as LoginResult } from './auth/operations/login';
import { Options as FindGlobalOptions } from './globals/operations/local/findOne';
import { Options as UpdateGlobalOptions } from './globals/operations/local/update';

import connectMongoose from './mongoose/connect';
import initCollections from './collections/initLocal';
import initGlobals from './globals/initLocal';
import registerSchema from './graphql/registerSchema';
import buildEmail from './email/build';
import sendEmail from './email/sendEmail';

import { serverInit as serverInitTelemetry } from './utilities/telemetry/events/serverInit';
import Logger from './utilities/logger';
import PreferencesModel from './preferences/model';
import findConfig from './config/find';

import { defaults as emailDefaults } from './email/defaults';

/**
 * @description Payload
 */
export class BasePayload<TGeneratedTypes extends GeneratedTypes> {
  config: SanitizedConfig;

  collections: {
    [slug: string | number | symbol]: Collection;
  } = {};

  versions: {
    [slug: string]: CollectionModel;
  } = {};

  preferences: Preferences;

  globals: Globals;

  logger: pino.Logger;

  emailOptions: EmailOptions;

  email: BuildEmailResult;

  sendEmail: (message: Message) => Promise<unknown>;

  secret: string;

  mongoURL: string | false;

  mongoOptions: InitOptions['mongoOptions'];

  mongoMemoryServer: any;

  local: boolean;

  encrypt = encrypt;

  decrypt = decrypt;

  errorHandler: ErrorHandler;

  authenticate: PayloadAuthenticate;

  express?: Express;

  router?: Router;

  types: {
    blockTypes: any;
    blockInputTypes: any;
    localeInputType?: any;
    fallbackLocaleInputType?: any;
  };

  Query: { name: string; fields: { [key: string]: any } } = { name: 'Query', fields: {} };

  Mutation: { name: string; fields: { [key: string]: any } } = { name: 'Mutation', fields: {} };

  schema: GraphQLSchema;

  extensions: (args: {
    req: graphQLRequest<unknown, unknown>,
    args: OperationArgs<any>,
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
    this.logger = Logger('payload', options.loggerOptions);
    this.mongoURL = options.mongoURL;
    this.mongoOptions = options.mongoOptions;

    if (this.mongoURL) {
      mongoose.set('strictQuery', false);
      this.mongoMemoryServer = await connectMongoose(this.mongoURL, options.mongoOptions, this.logger);
    }

    this.logger.info('Starting Payload...');
    if (!options.secret) {
      throw new Error(
        'Error: missing secret key. A secret key is needed to secure Payload.',
      );
    }

    if (options.mongoURL !== false && typeof options.mongoURL !== 'string') {
      throw new Error('Error: missing MongoDB connection URL.');
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
          configDir: path.dirname(configPath),
          config: configPath,
          rawConfig: configPath,
        },
      };
    } else {
      // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
      const loadConfig = require('./config/load').default;
      this.config = await loadConfig(this.logger);
    }

    // Configure email service
    const emailOptions = options.email ? { ...(options.email) } : this.config.email;
    if (options.email && this.config.email) {
      this.logger.warn('Email options provided in both init options and config. Using init options.');
    }

    this.emailOptions = emailOptions ?? emailDefaults;
    this.email = buildEmail(this.emailOptions, this.logger);
    this.sendEmail = sendEmail.bind(this);

    // Initialize collections & globals
    initCollections(this);
    initGlobals(this);

    if (!this.config.graphQL.disable) {
      registerSchema(this);
    }

    this.preferences = { Model: PreferencesModel };

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
  update<T extends keyof TGeneratedTypes['collections']>(options: UpdateByIDOptions<T>):Promise<TGeneratedTypes['collections'][T]>

  update<T extends keyof TGeneratedTypes['collections']>(options: UpdateManyOptions<T>):Promise<BulkOperationResult<T>>

  update<T extends keyof TGeneratedTypes['collections']>(options: UpdateOptions<T>):Promise<TGeneratedTypes['collections'][T] | BulkOperationResult<T>> {
    const { update } = localOperations;
    return update<T>(this, options);
  }

  /**
   * @description delete one or more documents
   * @param options
   * @returns Updated document(s)
   */
  delete<T extends keyof TGeneratedTypes['collections']>(options: DeleteByIDOptions<T>):Promise<TGeneratedTypes['collections'][T]>

  delete<T extends keyof TGeneratedTypes['collections']>(options: DeleteManyOptions<T>):Promise<BulkOperationResult<T>>

  delete<T extends keyof TGeneratedTypes['collections']>(options: DeleteOptions<T>):Promise<TGeneratedTypes['collections'][T] | BulkOperationResult<T>> {
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
