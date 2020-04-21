require('es6-promise').polyfill();
require('isomorphic-fetch');

const express = require('express');
const graphQLPlayground = require('graphql-playground-middleware-express').default;
const authenticate = require('./express/middleware/authenticate');
const connectMongoose = require('./mongoose/connect');
const expressMiddleware = require('./express/middleware');
const createAuthHeaderFromCookie = require('./express/middleware/createAuthHeaderFromCookie');
const initWebpack = require('./webpack/init');
const registerUser = require('./users/register');
const registerUpload = require('./uploads/register');
const registerCollections = require('./collections/register');
const registerGlobals = require('./globals/register');
const GraphQL = require('./graphql');
const sanitizeConfig = require('./utilities/sanitizeConfig');
const registerEmail = require('./email/register');

class Payload {
  constructor(options) {
    this.config = sanitizeConfig(options.config);
    this.express = options.express;
    this.router = express.Router();
    this.collections = {};

    this.registerUser = registerUser.bind(this);
    this.registerUpload = registerUpload.bind(this);
    this.registerCollections = registerCollections.bind(this);
    this.registerGlobals = registerGlobals.bind(this);
    this.registerEmail = registerEmail.bind(this);

    // Configure email service
    this.registerEmail();

    // Setup & initialization
    connectMongoose(this.config.mongoURL);
    this.router.use(...expressMiddleware(this.config));

    // Register and bind required collections
    this.registerUser();
    this.registerUpload();

    // Register collections
    this.registerCollections();

    // Register globals
    this.registerGlobals();

    // Enable client
    if (!this.config.disableAdmin && process.env.NODE_ENV !== 'test') {
      this.express.use(initWebpack(this.config));
    }

    // Init GraphQL
    this.router.use(
      this.config.routes.graphQL,
      createAuthHeaderFromCookie,
      authenticate,
      new GraphQL(this.config, this.collections, this.User, this.Upload, this.globals).init(),
    );

    this.router.get(this.config.routes.graphQLPlayground, graphQLPlayground({
      endpoint: `${this.config.routes.api}${this.config.routes.graphQL}`,
      settings: {
        'request.credentials': 'include',
      },
    }));

    // Bind router to API
    this.express.use(this.config.routes.api, this.router);

    // Bind static
    this.express.use(this.config.staticURL, express.static(this.config.staticDir));
  }
}

module.exports = Payload;
