import express from 'express';
import crypto from 'crypto';
import logger from './utilities/logger';
import bindOperations from './init/bindOperations';
import bindRequestHandlers from './init/bindRequestHandlers';
import bindResolvers from './init/bindResolvers';
import getConfig from './utilities/getConfig';
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
import sanitizeConfig from './utilities/sanitizeConfig';
import buildEmail from './email/build';
import identifyAPI from './express/middleware/identifyAPI';
import errorHandler from './express/middleware/errorHandler';
import performFieldOperations from './fields/performFieldOperations';
import localOperations from './collections/operations/local';
import localGlobalOperations from './globals/operations/local';
import { encrypt, decrypt } from './auth/crypto';

require('es6-promise').polyfill();
require('isomorphic-fetch');

logger();

class Payload {
  init(options) {
    logger.info('Starting Payload...');

    if (!options.secret) {
      throw new Error('Error: missing secret key. A secret key is needed to secure Payload.');
    }

    if (!options.mongoURL) {
      throw new Error('Error: missing MongoDB connection URL.');
    }

    const config = getConfig(options);
    const email = { ...(config.email || {}), ...(options.email || {}) };

    this.config = sanitizeConfig({
      ...config,
      email,
      license: options.license,
      secret: crypto.createHash('sha256').update(options.secret).digest('hex').slice(0, 32),
      mongoURL: options.mongoURL,
      local: options.local,
    });

    if (typeof this.config.paths === 'undefined') this.config.paths = {};

    this.collections = {};

    bindOperations(this);
    bindRequestHandlers(this);
    bindResolvers(this);

    this.initAuth = initAuth.bind(this);
    this.encrypt = encrypt.bind(this);
    this.decrypt = decrypt.bind(this);
    this.initCollections = initCollections.bind(this);
    this.initGlobals = initGlobals.bind(this);
    this.initGraphQLPlayground = initGraphQLPlayground.bind(this);
    this.buildEmail = buildEmail.bind(this);
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
    this.email = this.buildEmail();

    // Initialize collections & globals
    this.initCollections();
    this.initGlobals();

    // Connect to database
    connectMongoose(this.config.mongoURL);

    options.express.use((req, res, next) => {
      req.payload = this;
      next();
    });

    // If not initializing locally, set up HTTP routing
    if (!this.config.local) {
      this.express = options.express;
      if (this.config.rateLimit && this.config.rateLimit.trustProxy) this.express.set('trust proxy', 1);

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

      this.errorHandler = errorHandler(this.config);
      this.router.use(this.errorHandler);

      this.authenticate = authenticate(this.config);
    }

    if (typeof options.onInit === 'function') options.onInit();
  }

  async sendEmail(message) {
    const email = await this.email;
    const result = email.transport.sendMail(message);
    return result;
  }

  async getMockEmailCredentials() {
    const email = await this.email;
    return email.account;
  }

  async create(options) {
    let { create } = localOperations;
    create = create.bind(this);
    return create(options);
  }

  async find(options) {
    let { find } = localOperations;
    find = find.bind(this);
    return find(options);
  }

  async findGlobal(options) {
    let { findOne } = localGlobalOperations;
    findOne = findOne.bind(this);
    return findOne(options);
  }

  async updateGlobal(options) {
    let { update } = localGlobalOperations;
    update = update.bind(this);
    return update(options);
  }

  async findByID(options) {
    let { findByID } = localOperations;
    findByID = findByID.bind(this);
    return findByID(options);
  }

  async update(options) {
    let { update } = localOperations;
    update = update.bind(this);
    return update(options);
  }

  async delete(options) {
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
