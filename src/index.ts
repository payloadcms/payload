import express, { Express, Router } from 'express';
import crypto from 'crypto';
import { Document, Model } from 'mongoose';
import {
  SanitizedConfig,
  EmailOptions,
  InitOptions,
} from './config/types';
import {
  Collection, PaginatedDocs,
} from './collections/config/types';
import Logger from './utilities/logger';
import bindOperations from './init/bindOperations';
import bindRequestHandlers, { RequestHandlers } from './init/bindRequestHandlers';
import loadConfig from './config/load';
import authenticate, { PayloadAuthenticate } from './express/middleware/authenticate';
import connectMongoose from './mongoose/connect';
import expressMiddleware from './express/middleware';
import initAdmin from './express/admin';
import initAuth from './auth/init';
import initCollections from './collections/init';
import initPreferences from './preferences/init';
import initGlobals from './globals/init';
import { Globals } from './globals/config/types';
import initGraphQLPlayground from './graphql/initPlayground';
import initStatic from './express/static';
import GraphQL from './graphql';
import bindResolvers, { GraphQLResolvers } from './graphql/bindResolvers';
import buildEmail from './email/build';
import identifyAPI from './express/middleware/identifyAPI';
import errorHandler, { ErrorHandler } from './express/middleware/errorHandler';
import performFieldOperations from './fields/performFieldOperations';
import localOperations from './collections/operations/local';
import localGlobalOperations from './globals/operations/local';
import { encrypt, decrypt } from './auth/crypto';
import { BuildEmailResult, Message } from './email/types';
import { PayloadRequest } from './express/types';
import sendEmail from './email/sendEmail';

import { Options as CreateOptions } from './collections/operations/local/create';
import { Options as FindOptions } from './collections/operations/local/find';
import { Options as FindByIDOptions } from './collections/operations/local/findByID';
import { Options as UpdateOptions } from './collections/operations/local/update';
import { Options as DeleteOptions } from './collections/operations/local/delete';
import { Preference } from './preferences/types';

require('isomorphic-fetch');

/**
 * @description Payload
 */
export class Payload {
  config: SanitizedConfig;

  collections: Collection[] = [];

  graphQL: {
    resolvers: GraphQLResolvers
  };

  preferences: { Model: Model<Document<Preference>> };

  globals: Globals;

  logger = Logger();

  express: Express

  router: Router;

  emailOptions: EmailOptions;

  email: BuildEmailResult;

  sendEmail: (message: Message) => Promise<unknown>;

  license: string;

  secret: string;

  mongoURL: string;

  local: boolean;

  encrypt = encrypt;

  decrypt = decrypt;

  operations: { [key: string]: any };

  errorHandler: ErrorHandler;

  authenticate: PayloadAuthenticate;

  performFieldOperations: typeof performFieldOperations;

  requestHandlers: RequestHandlers;

  /**
   * @description Initializes Payload
   * @param options
   */
  init(options: InitOptions): void {
    this.logger.info('Starting Payload...');
    if (!options.secret) {
      throw new Error(
        'Error: missing secret key. A secret key is needed to secure Payload.',
      );
    }

    if (!options.mongoURL) {
      throw new Error('Error: missing MongoDB connection URL.');
    }

    this.license = options.license;
    this.emailOptions = { ...(options.email) };
    this.secret = crypto
      .createHash('sha256')
      .update(options.secret)
      .digest('hex')
      .slice(0, 32);

    this.mongoURL = options.mongoURL;
    this.local = options.local;

    this.config = loadConfig();

    bindOperations(this);
    bindRequestHandlers(this);
    bindResolvers(this);

    this.performFieldOperations = performFieldOperations.bind(this);

    // If not initializing locally, scaffold router
    if (!this.local) {
      this.router = express.Router();
      this.router.use(...expressMiddleware(this));
      initAuth(this);
    }

    // Configure email service
    this.email = buildEmail(this.emailOptions);
    this.sendEmail = sendEmail.bind(this);

    // Initialize collections & globals
    initCollections(this);
    initGlobals(this);
    initPreferences(this);

    // Connect to database
    connectMongoose(this.mongoURL, options.mongoOptions, options.local);

    // If not initializing locally, set up HTTP routing
    if (!this.local) {
      options.express.use((req: PayloadRequest, res, next) => {
        req.payload = this;
        next();
      });

      this.express = options.express;
      if (this.config.rateLimit.trustProxy) {
        this.express.set('trust proxy', 1);
      }

      initAdmin(this);

      this.router.get('/access', this.requestHandlers.collections.auth.access);

      const graphQLHandler = new GraphQL(this);

      if (!this.config.graphQL.disable) {
        this.router.use(
          this.config.routes.graphQL,
          identifyAPI('GraphQL'),
          (req, res) => graphQLHandler.init(req, res)(req, res),
        );
        initGraphQLPlayground(this);
      }


      // Bind router to API
      this.express.use(this.config.routes.api, this.router);

      // Enable static routes for all collections permitting upload
      initStatic(this);

      this.errorHandler = errorHandler(this.config, this.logger);
      this.router.use(this.errorHandler);

      this.authenticate = authenticate(this.config);
    }

    if (typeof options.onInit === 'function') options.onInit(this);
  }

  getAdminURL = (): string => `${this.config.serverURL}${this.config.routes.admin}`;

  getAPIURL = (): string => `${this.config.serverURL}${this.config.routes.api}`;

  /**
   * @description Performs create operation
   * @param options
   * @returns created document
   */
  create = async (options: CreateOptions): Promise<Document> => {
    let { create } = localOperations;
    create = create.bind(this);
    return create(options);
  }

  /**
   * @description Find documents with criteria
   * @param options
   * @returns documents satisfying query
   */
  find = async (options: FindOptions): Promise<PaginatedDocs> => {
    let { find } = localOperations;
    find = find.bind(this);
    return find(options);
  }

  findGlobal = async (options): Promise<any> => {
    let { findOne } = localGlobalOperations;
    findOne = findOne.bind(this);
    return findOne(options);
  }

  updateGlobal = async (options): Promise<any> => {
    let { update } = localGlobalOperations;
    update = update.bind(this);
    return update(options);
  }

  /**
   * @description Find document by ID
   * @param options
   * @returns document with specified ID
   */
  findByID = async (options: FindByIDOptions): Promise<Document> => {
    let { findByID } = localOperations;
    findByID = findByID.bind(this);
    return findByID(options);
  }

  /**
   * @description Update document
   * @param options
   * @returns Updated document
   */
  update = async (options: UpdateOptions): Promise<Document> => {
    let { update } = localOperations;
    update = update.bind(this);
    return update(options);
  }

  delete = async (options: DeleteOptions): Promise<Document> => {
    let { localDelete: deleteOperation } = localOperations;
    deleteOperation = deleteOperation.bind(this);
    return deleteOperation(options);
  }

  login = async (options): Promise<any> => {
    let { login } = localOperations.auth;
    login = login.bind(this);
    return login(options);
  }

  forgotPassword = async (options): Promise<any> => {
    let { forgotPassword } = localOperations.auth;
    forgotPassword = forgotPassword.bind(this);
    return forgotPassword(options);
  }

  resetPassword = async (options): Promise<any> => {
    let { resetPassword } = localOperations.auth;
    resetPassword = resetPassword.bind(this);
    return resetPassword(options);
  }

  unlock = async (options): Promise<any> => {
    let { unlock } = localOperations.auth;
    unlock = unlock.bind(this);
    return unlock(options);
  }

  verifyEmail = async (options): Promise<any> => {
    let { verifyEmail } = localOperations.auth;
    verifyEmail = verifyEmail.bind(this);
    return verifyEmail(options);
  }
}

const payload = new Payload();

export default payload;
module.exports = payload;
