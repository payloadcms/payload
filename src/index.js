require('es6-promise').polyfill();
require('isomorphic-fetch');

const express = require('express');
// const graphQLPlayground = require('graphql-playground-middleware-express').default;
const bindOperations = require('./init/bindOperations');
const bindRequestHandlers = require('./init/bindRequestHandlers');
const getConfig = require('./utilities/getConfig');
const authenticate = require('./express/middleware/authenticate');
const connectMongoose = require('./mongoose/connect');
const expressMiddleware = require('./express/middleware');
const initAdmin = require('./express/admin');
const initAuth = require('./auth/init');
const initCollections = require('./collections/init');
const initGlobals = require('./globals/init');
const initStatic = require('./express/static');
// const GraphQL = require('./graphql');
const sanitizeConfig = require('./utilities/sanitizeConfig');
const buildEmail = require('./email/build');
// const identifyAPI = require('./express/middleware/identifyAPI');
const errorHandler = require('./express/middleware/errorHandler');
const performFieldOperations = require('./fields/performFieldOperations');

class Payload {
  constructor(options) {
    const config = getConfig(options);

    this.config = sanitizeConfig(config);

    if (typeof this.config.paths === 'undefined') this.config.paths = {};

    this.express = options.express;
    this.router = express.Router();
    this.collections = {};

    bindOperations(this);
    bindRequestHandlers(this);

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

    this.router.use(...expressMiddleware(this.config, this.collections));

    this.initAuth();
    this.initCollections();
    this.initGlobals();
    this.initAdmin();

    this.router.get('/access', this.requestHandlers.collections.auth.access);

    // const graphQLHandler = new GraphQL(this);

    // this.router.use(
    //   this.config.routes.graphQL,
    //   identifyAPI('GraphQL'),
    //   (req, res) => graphQLHandler.init(req, res)(req, res),
    // );

    // this.router.get(this.config.routes.graphQLPlayground, graphQLPlayground({
    //   endpoint: `${this.config.routes.api}${this.config.routes.graphQL}`,
    //   settings: {
    //     'request.credentials': 'include',
    //   },
    // }));

    // Bind router to API
    this.express.use(this.config.routes.api, this.router);

    // Enable static routes for all collections permitting upload
    this.initStatic();

    this.router.use(errorHandler(this.config));

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

  authenticate() {
    return authenticate(this.config);
  }
}

module.exports = Payload;
