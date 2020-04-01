const express = require('express');

const connectMongoose = require('./mongoose/connect');
const expressMiddleware = require('./express/middleware');
const initWebpack = require('./webpack/init');
const registerUser = require('./auth/register');
const registerUpload = require('./uploads/register');
const registerCollections = require('./collections/register');
const registerGlobals = require('./globals/register');
const sanitizeConfig = require('./utilities/sanitizeConfig');

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
    if (!this.config.disableAdmin) {
      this.express.use(initWebpack(this.config));
    }

    // Bind router to API
    this.express.use(this.config.routes.api, this.router);

    // Bind static
    this.express.use(this.config.staticURL, express.static(this.config.staticDir));
  }
}

module.exports = Payload;
