const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const connectMongoose = require('./init/connectMongoose');
const registerExpressMiddleware = require('./init/registerExpressMiddleware');
const initPassport = require('./init/passport');
const initCORS = require('./init/cors');
const initUploads = require('./init/uploads');
const initWebpack = require('./init/webpack');
const initUserAuth = require('./auth/init');
const baseUserFields = require('./auth/baseFields');
const baseUploadFields = require('./uploads/baseUploadFields');
const baseImageFields = require('./uploads/baseImageFields');
const registerUploadRoutes = require('./uploads/routes');
const registerConfigRoute = require('./routes/config');
const validateCollection = require('./collections/validate');
const buildCollectionSchema = require('./collections/buildSchema');
const registerCollectionRoutes = require('./collections/registerRoutes');
const validateGlobals = require('./globals/validate');
const registerGlobalSchema = require('./globals/registerSchema');
const registerGlobalRoutes = require('./globals/registerRoutes');

class Payload {
  constructor(options) {
    this.collections = {};
    this.registerUser.bind(this);
    this.registerUpload.bind(this);
    this.registerGlobals.bind(this);
    this.getCollections.bind(this);
    this.getGlobals.bind(this);

    // Setup & initialization
    connectMongoose(options.config.mongoURL);
    registerExpressMiddleware(options);
    initPassport(options.app);
    initUploads(options);
    initCORS(options);
    registerConfigRoute(options, this.getCollections, this.getGlobals);

    // Bind options, app, router
    this.config = options.config;
    this.app = options.app;
    this.router = options.router;

    // Register and bind required collections
    this.registerUser();
    this.registerUpload();

    // Register custom collections
    this.config.collections.forEach((collection) => {
      validateCollection(collection, this.collections);

      this.collections[collection.slug] = {
        model: mongoose.model(collection.slug, buildCollectionSchema(collection, this.config)),
        config: collection,
      };

      registerCollectionRoutes(this.collections[collection.slug], this.router);
    });

    // Register globals
    this.registerGlobals(this.config.globals);

    // Enable client webpack
    if (!this.config.disableAdmin) initWebpack(options);
  }

  registerUser() {
    this.config.user.fields.push(...baseUserFields);
    const userSchema = buildCollectionSchema(this.config.user, this.config);
    userSchema.plugin(passportLocalMongoose, { usernameField: this.config.user.useAsUsername });

    this.User = mongoose.model(this.config.user.labels.singular, userSchema);
    initUserAuth(this.User, this.config, this.router);
    registerCollectionRoutes({
      model: this.User,
      config: this.config.user,
    }, this.router);
  }

  registerUpload() {
    // TODO: mongooseHidden on our upload model is hiding all the fields
    const uploadSchema = buildCollectionSchema(
      this.config.upload,
      this.config,
      { discriminatorKey: 'type' },
    );

    uploadSchema.add(baseUploadFields);

    const imageSchema = new mongoose.Schema(baseImageFields, {
      discriminatorKey: 'type',
    });

    this.Upload = mongoose.model(this.config.upload.labels.singular, uploadSchema);
    // TODO: image type hard coded, but in the future we need some way of customizing how uploads are handled in customizable pattern
    this.Upload.discriminator('image', imageSchema);

    registerUploadRoutes(this.Upload, this.config, this.router);

    registerCollectionRoutes({
      model: this.Upload,
      config: this.config.upload,
    }, this.router);
  }

  registerGlobals(globals) {
    validateGlobals(globals);
    this.globals = registerGlobalSchema(globals, this.config);
    registerGlobalRoutes(this.globals.model, this.router);
  }

  getCollections() {
    return this.collections;
  }

  getGlobals() {
    return this.globals;
  }
}

module.exports = Payload;
