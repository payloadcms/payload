require('es6-promise').polyfill();
require('isomorphic-fetch');

const express = require('express');
const graphQLPlayground = require('graphql-playground-middleware-express').default;
const authenticate = require('./express/middleware/authenticate');
const connectMongoose = require('./mongoose/connect');
const expressMiddleware = require('./express/middleware');
const createAuthHeaderFromCookie = require('./express/middleware/createAuthHeaderFromCookie');
const initWebpack = require('./webpack/init');
const initCollections = require('./collections/init');
const initGlobals = require('./globals/init');
const initStatic = require('./express/static');
const GraphQL = require('./graphql');
const sanitizeConfig = require('./utilities/sanitizeConfig');
const buildEmail = require('./email/build');
const identifyAPI = require('./express/middleware/identifyAPI');

class Payload {
  constructor(options) {
    this.config = sanitizeConfig(options.config);
    this.express = options.express;
    this.router = express.Router();
    this.collections = {};

    this.initCollections = initCollections.bind(this);
    this.initGlobals = initGlobals.bind(this);
    this.buildEmail = buildEmail.bind(this);
    this.sendEmail = this.sendEmail.bind(this);
    this.getMockEmailCredentials = this.getMockEmailCredentials.bind(this);
    this.initStatic = initStatic.bind(this);

    // Configure email service
    this.email = this.buildEmail();

    // Setup & initialization
    connectMongoose(this.config.mongoURL);
    this.router.use(...expressMiddleware(this.config));

    // Register collections
    this.initCollections();

    // Register globals
    this.initGlobals();

    // Enable client
    if (!this.config.admin.disable && process.env.NODE_ENV !== 'test') {
      this.express.use(initWebpack(this.config));
    }

    // Init GraphQL
    this.router.use(
      this.config.routes.graphQL,
      identifyAPI('GraphQL'),
      createAuthHeaderFromCookie,
      authenticate,
      new GraphQL(this).init(),
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
  }

  async sendEmail(message) {
    try {
      const email = await this.email;
      const result = email.transport.sendMail(message);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getMockEmailCredentials() {
    const email = await this.email;
    return email.account;
  }
}

module.exports = Payload;
