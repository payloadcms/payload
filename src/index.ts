import express, { Express, Router } from 'express';
import crypto from 'crypto';

import { TestAccount } from 'nodemailer';
import {
  Config,
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

require('isomorphic-fetch');

class Payload {
  config: Config;

  collections: Collection[] = [];

  logger: typeof Logger;

  express: Express

  router: Router;

  emailOptions: any;

  email: BuildEmailResult;

  license: string;

  secret: string;

  mongoURL: string;

  local: boolean;

  initAuth: typeof initAuth;

  encrypt: typeof encrypt;

  decrypt: typeof decrypt;

  initCollections: typeof initCollections;

  initGlobals: typeof initGlobals;

  initGraphQLPlayground: typeof initGraphQLPlayground;

  initStatic: typeof initStatic;

  initAdmin: typeof initAdmin;

  performFieldOperations: typeof performFieldOperations;

  init(options: InitOptions) {
    this.logger = Logger();
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

    this.config = loadConfig();

    if (typeof this.config.paths === 'undefined') this.config.paths = {};

    // this.collections = {};

    bindOperations(this);
    bindRequestHandlers(this);
    bindResolvers(this);

    this.initAuth = initAuth.bind(this);
    this.encrypt = encrypt.bind(this);
    this.decrypt = decrypt.bind(this);
    this.initCollections = initCollections.bind(this);
    this.initGlobals = initGlobals.bind(this);
    this.initGraphQLPlayground = initGraphQLPlayground.bind(this);
    // this.buildEmail = buildEmail.bind(this);
    this.sendEmail = this.sendEmail.bind(this);
    this.getMockEmailCredentials = this.getMockEmailCredentials.bind(this);
    this.initStatic = initStatic.bind(this);
    this.initAdmin = initAdmin.bind(this);
    this.performFieldOperations = performFieldOperations.bind(this);

    this.create = this.create.bind(this);
    this.find = this.find.bind(this);
    this.findGlobal = this.findGlobal.bind(this);
    this.updateGlobal = this.updateGlobal.bind(this);
    this.findByID = this.findByID.bind(this);
    this.update = this.update.bind(this);
    this.login = this.login.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.unlock = this.unlock.bind(this);
    this.verifyEmail = this.verifyEmail.bind(this);

    // If not initializing locally, scaffold router
    if (!this.config.local) {
      this.router = express.Router();
      this.router.use(...expressMiddleware(this));
      this.initAuth();
    }

    // Configure email service
    this.email = buildEmail(this.emailOptions);

    // Initialize collections & globals
    this.initCollections();
    this.initGlobals();

    // Connect to database
    connectMongoose(this.mongoURL);

    options.express.use((req, res, next) => {
      req.payload = this;
      next();
    });

    // If not initializing locally, set up HTTP routing
    if (!this.config.local) {
      this.express = options.express;
      if (this.config.rateLimit && this.config.rateLimit.trustProxy) { this.express.set('trust proxy', 1); }

      this.initAdmin();

      this.router.get('/access', this.requestHandlers.collections.auth.access);

      const graphQLHandler = new GraphQL(this);

      this.router.use(
        this.config.routes.graphQL,
        identifyAPI('GraphQL'),
        (req, res) => graphQLHandler.init(req, res)(req, res),
      );

      this.initGraphQLPlayground();

      // Bind router to API
      this.express.use(this.config.routes.api, this.router);

      // Enable static routes for all collections permitting upload
      this.initStatic();

      this.errorHandler = errorHandler(this.config, this.logger);
      this.router.use(this.errorHandler);

      this.authenticate = authenticate(this.config);
    }

    if (typeof options.onInit === 'function') options.onInit();
  }

  async sendEmail(message: Message) {
    const email = await this.email;
    const result = email.transport.sendMail(message);
    return result;
  }

  async getMockEmailCredentials(): Promise<TestAccount> {
    const email = await this.email as MockEmailHandler;
    return email.account;
  }

  async create(options: CreateOptions) {
    let { create } = localOperations;
    create = create.bind(this);
    return create(options);
  }

  async find(options: FindOptions) {
    let { find } = localOperations;
    find = find.bind(this);
    return find(options);
  }

  async findGlobal(options: FindGlobalOptions) {
    let { findOne } = localGlobalOperations;
    findOne = findOne.bind(this);
    return findOne(options);
  }

  async updateGlobal(options: UpdateGlobalOptions) {
    let { update } = localGlobalOperations;
    update = update.bind(this);
    return update(options);
  }

  async findByID(options: FindByIDOptions) {
    let { findByID } = localOperations;
    findByID = findByID.bind(this);
    return findByID(options);
  }

  async update(options: UpdateOptions) {
    let { update } = localOperations;
    update = update.bind(this);
    return update(options);
  }

  async delete(options: DeleteOptions) {
    let { delete: deleteOperation } = localOperations;
    deleteOperation = deleteOperation.bind(this);
    return deleteOperation(options);
  }

  async login(options) {
    let { login } = localOperations.auth;
    login = login.bind(this);
    return login(options);
  }

  async forgotPassword(options) {
    let { forgotPassword } = localOperations.auth;
    forgotPassword = forgotPassword.bind(this);
    return forgotPassword(options);
  }

  async resetPassword(options) {
    let { resetPassword } = localOperations.auth;
    resetPassword = resetPassword.bind(this);
    return resetPassword(options);
  }

  async unlock(options) {
    let { unlock } = localOperations.auth;
    unlock = unlock.bind(this);
    return unlock(options);
  }

  async verifyEmail(options) {
    let { verifyEmail } = localOperations.auth;
    verifyEmail = verifyEmail.bind(this);
    return verifyEmail(options);
  }
}

module.exports = new Payload();
