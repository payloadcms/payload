import express, { Express, Router } from 'express';
import crypto from 'crypto';
import { TestAccount } from 'nodemailer';
import { AuthenticateOptions } from 'passport';
import {
  Config,
  EmailOptions,
  InitOptions,
} from './config/types';
import {
  Collection,
} from './collections/config/types';
import {
  CreateOptions,
  FindOptions,
  FindGlobalOptions,
  UpdateGlobalOptions,
  FindByIDOptions,
  UpdateOptions,
  DeleteOptions,
  FindResponse,
} from './types';
import Logger from './utilities/logger';
import bindOperations from './init/bindOperations';
import bindRequestHandlers from './init/bindRequestHandlers';
import bindResolvers from './init/bindResolvers';
import loadConfig from './config/load';
import authenticate from './express/middleware/authenticate';
import connectMongoose from './mongoose/connect';
import expressMiddleware from './express/middleware';
import initAdmin from './express/admin';
import initAuth from './auth/init';
import initCollections from './collections/init';
import initGlobals from './globals/init';
import initGraphQLPlayground from './graphql/initPlayground';
import initStatic from './express/static';
import GraphQL from './graphql';
import buildEmail from './email/build';
import identifyAPI from './express/middleware/identifyAPI';
import errorHandler from './express/middleware/errorHandler';
import performFieldOperations from './fields/performFieldOperations';
import localOperations from './collections/operations/local';
import localGlobalOperations from './globals/operations/local';
import { encrypt, decrypt } from './auth/crypto';
import { MockEmailHandler, BuildEmailResult, Message } from './email/types';
import { PayloadRequest } from './express/types/payloadRequest';

require('isomorphic-fetch');

/**
 * @description Payload
 */
export class Payload {
  config: Config = loadConfig();

  collections: Collection[] = [];

  graphQL: any;

  globals: any;

  logger = Logger();

  express: Express

  router: Router;

  emailOptions: EmailOptions;

  email: BuildEmailResult;

  license: string;

  secret: string;

  mongoURL: string;

  local: boolean;

  encrypt = encrypt;

  decrypt = decrypt;

  operations: { [key: string]: any };

  errorHandler: any;

  authenticate: (strategy: string | string[], options: AuthenticateOptions, callback?: (...args: any[]) => any) => any;

  performFieldOperations: typeof performFieldOperations;

  requestHandlers: { [key: string]: any };

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
    this.emailOptions = { ...(options.email || {}) };
    this.secret = crypto
      .createHash('sha256')
      .update(options.secret)
      .digest('hex')
      .slice(0, 32);

    this.mongoURL = options.mongoURL;
    this.local = options.local;

    if (typeof this.config.paths === 'undefined') this.config.paths = {};

    bindOperations(this);
    bindRequestHandlers(this);
    bindResolvers(this);

    this.performFieldOperations = performFieldOperations.bind(this);

    // If not initializing locally, scaffold router
    if (!this.config.local) {
      this.router = express.Router();
      this.router.use(...expressMiddleware(this));
      initAuth(this);
    }

    // Configure email service
    this.email = buildEmail(this.config.email);

    // Initialize collections & globals
    initCollections(this);
    initGlobals(this);

    // Connect to database
    connectMongoose(this.mongoURL);

    options.express.use((req: PayloadRequest, res, next) => {
      req.payload = this;
      next();
    });

    // If not initializing locally, set up HTTP routing
    if (!this.config.local) {
      this.express = options.express;
      if (this.config.rateLimit && this.config.rateLimit.trustProxy) {
        this.express.set('trust proxy', 1);
      }

      initAdmin(this);

      this.router.get('/access', this.requestHandlers.collections.auth.access);

      const graphQLHandler = new GraphQL(this);

      this.router.use(
        this.config.routes.graphQL,
        identifyAPI('GraphQL'),
        (req, res) => graphQLHandler.init(req, res)(req, res),
      );

      initGraphQLPlayground(this);

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

  sendEmail = async (message: Message): Promise<any> => {
    const email = await this.email;
    const result = email.transport.sendMail(message);
    return result;
  }

  getMockEmailCredentials = async (): Promise<TestAccount> => {
    const email = await this.email as MockEmailHandler;
    return email.account;
  }

  /**
   * @description Performs create operation
   * @param options
   * @returns created document
   */
  async create(options: CreateOptions): Promise<any> {
    let { create } = localOperations;
    create = create.bind(this);
    return create(options);
  }

  /**
   * @description Find documents with criteria
   * @param options
   * @returns documents satisfying query
   */
  async find(options: FindOptions): Promise<FindResponse> {
    let { find } = localOperations;
    find = find.bind(this);
    return find(options);
  }

  async findGlobal(options: FindGlobalOptions): Promise<any> {
    let { findOne } = localGlobalOperations;
    findOne = findOne.bind(this);
    return findOne(options);
  }

  async updateGlobal(options: UpdateGlobalOptions): Promise<any> {
    let { update } = localGlobalOperations;
    update = update.bind(this);
    return update(options);
  }

  /**
   * @description Find document by ID
   * @param options
   * @returns document with specified ID
   */
  async findByID(options: FindByIDOptions): Promise<any> {
    let { findByID } = localOperations;
    findByID = findByID.bind(this);
    return findByID(options);
  }

  /**
   * @description Update document
   * @param options
   * @returns Updated document
   */
  async update(options: UpdateOptions): Promise<any> {
    let { update } = localOperations;
    update = update.bind(this);
    return update(options);
  }

  async delete(options: DeleteOptions): Promise<any> {
    let { delete: deleteOperation } = localOperations;
    deleteOperation = deleteOperation.bind(this);
    return deleteOperation(options);
  }

  async login(options): Promise<any> {
    let { login } = localOperations.auth;
    login = login.bind(this);
    return login(options);
  }

  async forgotPassword(options): Promise<any> {
    let { forgotPassword } = localOperations.auth;
    forgotPassword = forgotPassword.bind(this);
    return forgotPassword(options);
  }

  async resetPassword(options): Promise<any> {
    let { resetPassword } = localOperations.auth;
    resetPassword = resetPassword.bind(this);
    return resetPassword(options);
  }

  async unlock(options): Promise<any> {
    let { unlock } = localOperations.auth;
    unlock = unlock.bind(this);
    return unlock(options);
  }

  async verifyEmail(options): Promise<any> {
    let { verifyEmail } = localOperations.auth;
    verifyEmail = verifyEmail.bind(this);
    return verifyEmail(options);
  }
}

const payload = new Payload();

export default payload;
module.exports = payload;
