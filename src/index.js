import mongoose from 'mongoose';
import connectMongoose from './init/connectMongoose';
import registerExpressMiddleware from './init/registerExpressMiddleware';
import initPassport from './init/passport';
import initCORS from './init/cors';
import initUploads from './init/uploads';
import initWebpack from './init/webpack';
import initUserAuth from './auth/init';
import baseUserFields from './auth/baseFields';
import baseUploadFields from './uploads/baseUploadFields';
import baseImageFields from './uploads/baseImageFields';
import registerUploadRoutes from './uploads/routes';
import registerConfigRoute from './routes/config';
import validateCollection from './collections/validate';
import buildCollectionSchema from './collections/buildSchema';
import registerCollectionRoutes from './collections/registerRoutes';
import validateGlobals from './globals/validate';
import registerGlobalSchema from './globals/registerSchema';
import registerGlobalRoutes from './globals/registerRoutes';

class Payload {
  collections = {};

  constructor(options) {
    // Setup & inititalization
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

  registerUser = () => {
    this.config.user.fields.push(...baseUserFields);
    const userSchema = buildCollectionSchema(this.config.user, this.config);

    this.User = mongoose.model(this.config.user.labels.singular, userSchema);
    initUserAuth(this.User, this.config, this.router);
    registerCollectionRoutes({
      model: this.User,
      config: this.config.user,
    }, this.router);
  }

  registerUpload = () => {
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
    this.Upload.discriminator('image', imageSchema);

    registerUploadRoutes(this.Upload, this.config, this.router);

    registerCollectionRoutes({
      model: this.Upload,
      config: this.config.upload,
    }, this.router);
  }

  registerGlobals = (globals) => {
    validateGlobals(globals);
    this.globals = registerGlobalSchema(globals, this.config);
    registerGlobalRoutes(this.globals.model, this.router);
  };

  getCollections = () => this.collections;

  getGlobals = () => this.globals;
}

module.exports = Payload;
