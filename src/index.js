import connectMongoose from './init/connectMongoose';
import registerExpressMiddleware from './init/registerExpressMiddleware';
import initUploads from './init/uploads';
import initPassport from './init/passport';
import initCORS from './init/cors';
import initWebpack from './init/webpack';
import registerConfigRoute from './routes/config';
import validateCollection from './collections/validate';
import registerCollectionSchema from './collections/registerSchema';
import registerCollectionRoutes from './collections/registerRoutes';
import validateGlobals from './globals/validate';
import registerGlobalSchema from './globals/registerSchema';
import registerGlobalRoutes from './globals/registerRoutes';

class Payload {
  collections = {};

  constructor(options) {
    this.config = options.config;
    this.app = options.app;
    this.router = options.router;

    connectMongoose(options.config.mongoURL);
    registerExpressMiddleware(options);
    initUploads(options);
    initPassport(this.app);
    initCORS(options);
    registerConfigRoute(options, this.getCollections, this.getGlobals);

    if (!this.config.disableAdmin) {
      initWebpack(options);
    }
  }

  registerCollection = (collection) => {
    validateCollection(collection, this.collections, this.User);
    const registeredCollection = registerCollectionSchema(collection, this.config);
    this.collections[collection.slug] = registeredCollection;
    registerCollectionRoutes(this.collections[collection.slug], this.router);
  }

  registerGlobals = (globals) => {
    validateGlobals(globals);
    this.globals = registerGlobalSchema(globals, this.config);
    registerGlobalRoutes(this.globals.model, this.router);
  }

  getCollections = () => this.collections;

  getGlobals = () => this.globals;
}

module.exports = Payload;
