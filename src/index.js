require('es6-promise').polyfill();
require('isomorphic-fetch');

const express = require('express');
const crypto = require('crypto');
const logger = require('./utilities/logger')();
const bindOperations = require('./init/bindOperations');
const bindRequestHandlers = require('./init/bindRequestHandlers');
const bindResolvers = require('./init/bindResolvers');
const getConfig = require('./utilities/getConfig');
const authenticate = require('./express/middleware/authenticate');
const connectMongoose = require('./mongoose/connect');
const expressMiddleware = require('./express/middleware');
const initAdmin = require('./express/admin');
const initAuth = require('./auth/init');
const initCollections = require('./collections/init');
const initGlobals = require('./globals/init');
const initGraphQLPlayground = require('./graphql/initPlayground');
const initStatic = require('./express/static');
const GraphQL = require('./graphql');
const sanitizeConfig = require('./utilities/sanitizeConfig');
const buildEmail = require('./email/build');
const identifyAPI = require('./express/middleware/identifyAPI');
const errorHandler = require('./express/middleware/errorHandler');
const performFieldOperations = require('./fields/performFieldOperations');
const localOperations = require('./collections/operations/local');
const localGlobalOperations = require('./globals/operations/local');
const { encrypt, decrypt } = require('./auth/crypto');

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
