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
const validateCollection = require('./collections/validate');
const buildCollectionSchema = require('./collections/buildSchema');
const registerCollectionRoutes = require('./collections/registerRoutes');
const validateGlobals = require('./globals/validate');
const registerGlobalSchema = require('./globals/registerSchema');
const registerGlobalRoutes = require('./globals/registerRoutes');
const sanitizeConfig = require('./utilities/sanitizeConfig');

class Payload {
  constructor(options) {
    this.collections = {};
    this.registerUser.bind(this);
    this.registerUpload.bind(this);
    this.registerGlobals.bind(this);
    this.registerCollections.bind(this);
    this.getCollections.bind(this);
    this.getGlobals.bind(this);

    // Bind options, app, router
    this.app = options.app;
    this.config = sanitizeConfig(options.config);
    this.router = options.router;

    // Setup & initialization
    connectMongoose(this.config.mongoURL);
    registerExpressMiddleware(this.app, this.config, this.router);
    initPassport(this.app);
    initUploads(this.app, this.config);
    initCORS(this.app, this.config);

    // Register and bind required collections
    this.registerUser();
    this.registerUpload();

    // Register collections
    this.registerCollections();

    // Register globals
    this.registerGlobals();

    // Enable client webpack
    if (!this.config.disableAdmin) initWebpack(this.app, this.config);
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

  registerCollections() {
    this.config.collections.forEach((collection) => {
      validateCollection(collection, this.collections);

      this.collections[collection.slug] = {
        model: mongoose.model(collection.slug, buildCollectionSchema(collection, this.config)),
        config: collection,
      };

      registerCollectionRoutes(this.collections[collection.slug], this.router);
    });
  }

  registerGlobals() {
    validateGlobals(this.config.globals);
    this.globals = registerGlobalSchema(this.config.globals, this.config);
    registerGlobalRoutes(this.globals, this.router);
  }

  getCollections() {
    return this.collections;
  }

  getGlobals() {
    return this.globals;
  }
}

module.exports = Payload;
