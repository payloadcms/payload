require('es6-promise').polyfill();
require('isomorphic-fetch');

const express = require('express');
const graphQLPlayground = require('graphql-playground-middleware-express').default;
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
const initStatic = require('./express/static');
const GraphQL = require('./graphql');
const sanitizeConfig = require('./utilities/sanitizeConfig');
const buildEmail = require('./email/build');
const identifyAPI = require('./express/middleware/identifyAPI');
const errorHandler = require('./express/middleware/errorHandler');
const performFieldOperations = require('./fields/performFieldOperations');

const localOperations = require('./collections/operations/local');

class Payload {
  init(options) {
    logger.info('Starting Payload...');
    const config = getConfig(options);

    this.config = sanitizeConfig(config);

    if (typeof this.config.paths === 'undefined') this.config.paths = {};

    this.express = options.express;
    this.router = express.Router();
    this.collections = {};

    bindOperations(this);
    bindRequestHandlers(this);
    bindResolvers(this);

    this.initAuth = initAuth.bind(this);
    this.initCollections = initCollections.bind(this);
    this.initGlobals = initGlobals.bind(this);
    this.buildEmail = buildEmail.bind(this);
    this.sendEmail = this.sendEmail.bind(this);
    this.getMockEmailCredentials = this.getMockEmailCredentials.bind(this);
    this.initStatic = initStatic.bind(this);
    this.initAdmin = initAdmin.bind(this);
    this.performFieldOperations = performFieldOperations.bind(this);

    // Configure email service
    this.email = this.buildEmail();

    // Setup & initialization
    connectMongoose(this.config.mongoURL);

    this.router.use(...expressMiddleware(this));

    this.initAuth();
    this.initCollections();
    this.initGlobals();
    this.initAdmin();

    this.router.get('/access', this.requestHandlers.collections.auth.access);

    const graphQLHandler = new GraphQL(this);

    this.router.use(
      this.config.routes.graphQL,
      identifyAPI('GraphQL'),
      (req, res) => graphQLHandler.init(req, res)(req, res),
    );

    this.router.get(this.config.routes.graphQLPlayground, graphQLPlayground({
      endpoint: `${this.config.routes.api}${this.config.routes.graphQL}`,
      settings: {
        'request.credentials': 'include',
      },
    }));

    // Bind router to API
    this.express.use(this.config.routes.api, this.router);

    // Enable static routes for all collections permitting upload
    this.initStatic();

    this.errorHandler = errorHandler(this.config);
    this.router.use(this.errorHandler);

    this.authenticate = authenticate(this.config);

    this.create = this.create.bind(this);
    this.find = this.find.bind(this);
    this.findByID = this.findByID.bind(this);
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);

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

  async findByID(options) {
    let { findByID } = localOperations;
    findByID = findByID.bind(this);
    return findByID(options);
  }

  async register(options) {
    let { register } = localOperations.auth;
    register = register.bind(this);
    return register(options);
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
}

module.exports = new Payload();
