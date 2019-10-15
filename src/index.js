import mongoose from 'mongoose';
import passport from 'passport';
import express from 'express';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import jwtStrategy from './auth/jwt';
import fileUpload from 'express-fileupload';
// import mediaRoutes from './media/media.routes';
import emailRoutes from './auth/passwordResets/email.routes';
import autopopulate from './mongoose/autopopulate.plugin';
import paginate from './mongoose/paginate.plugin';
import buildQueryPlugin from './mongoose/buildQuery.plugin';
import localizationPlugin from './localization/localization.plugin';
import bindModelMiddleware from './mongoose/bindModel.middleware';
import localizationMiddleware from './localization/localization.middleware';
import checkRoleMiddleware from './auth/checkRole.middleware';
import { query, create, findOne, destroy, update } from './mongoose/requestHandlers';
import { upsert, fetch } from './mongoose/requestHandlers/globals';
import { schemaBaseFields } from './mongoose/schemaBaseFields';
import fieldToSchemaMap from './mongoose/fieldToSchemaMap';
import authValidate from './auth/validate';
import authRequestHandlers from './auth/requestHandlers';
import passwordResetConfig from './auth/passwordResets/passwordReset.config';
import mediaConfig from './media/media.config';
import validateCollection from './utilities/validateCollection';
import validateGlobal from './utilities/validateGlobal';
import setModelLocaleMiddleware from './mongoose/setModelLocale.middleware';

class Payload {

  collections = {};
  globals = {};

  constructor(options) {
    mongoose.connect(options.config.mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }, (err) => {
      if (err) {
        console.log('Unable to connect to the Mongo server. Please start the server. Error:', err);
      } else {
        console.log('Connected to Mongo server successfully!');
      }
    });

    options.app.use(fileUpload());
    const staticUrl = options.config.staticUrl ? options.config.staticUrl : `/${options.config.staticDir}`;
    options.app.use(staticUrl, express.static(options.config.staticDir));

    // Configure passport for Auth
    options.app.use(passport.initialize());
    options.app.use(passport.session());

    if (options.config.cors) {
      options.app.use((req, res, next) => {
        if (options.config.cors.indexOf(req.headers.origin) > -1) {
          res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
          res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
        }

        res.header('Access-Control-Allow-Headers',
          'Origin X-Requested-With, Content-Type, Accept, Authorization');
        res.header('Content-Language', options.config.localization.locale);

        next();
      });
    }

    options.app.use(express.json());
    options.app.use(methodOverride('X-HTTP-Method-Override'));
    options.app.use(express.urlencoded({ extended: true }));
    options.app.use(bodyParser.urlencoded({ extended: true }));
    options.app.use(localizationMiddleware(options.config.localization));
    options.app.use(options.router);

    // TODO: Build safe config before initializing models and routes

    options.config.collections && Object.values(options.config.collections).forEach(config => {
      validateCollection(config, this.collections);
      this.collections[config.labels.singular] = config;
      const fields = { ...schemaBaseFields };

      // authentication
      if (config.auth && config.auth.passwordResets) {
        config.fields.push(...passwordResetConfig.fields);
      }

      // media
      // TODO: finish this idea
      if (config.media && config.media.static) {
        config.fields.push(...mediaConfig.fields);
      }

      config.fields.forEach(field => {
        const fieldSchema = fieldToSchemaMap[field.type];
        if (fieldSchema) fields[field.name] = fieldSchema(field);
      });

      const Schema = new mongoose.Schema(fields, { timestamps: config.timestamps });

      Schema.plugin(paginate);
      Schema.plugin(buildQueryPlugin);
      Schema.plugin(localizationPlugin, options.config.localization);
      Schema.plugin(autopopulate);

      if (config.plugins) {
        config.plugins.forEach(plugin => {
          Schema.plugin(plugin.plugin, plugin.options);
        });
      }
      const model = mongoose.model(config.labels.singular, Schema);

      // register passport with model
      if (config.auth) {
        passport.use(model.createStrategy());
        if (config.auth.strategy === 'jwt') {
          passport.use(jwtStrategy(model));
          passport.serializeUser(model.serializeUser());
          passport.deserializeUser(model.deserializeUser());
        }

        let auth = authRequestHandlers(model);

        options.router
          .route('/login')
          .post(authValidate.login, auth.login);

        options.router
          .route('/me')
          .post(passport.authenticate(config.auth.strategy, { session: false }), auth.me);

        options.config.roles.forEach((role) => {
          options.router
            .route(`/role/${role}`)
            .get(passport.authenticate(config.auth.strategy, { session: false }), checkRoleMiddleware(role), auth.me);
        });

        // password resets
        if (config.auth.passwordResets) {
          options.router.use('', emailRoutes(options.config.email, model));
        }

        if (config.auth.registration) {
          options.router
            .route(`${config.slug}/register`) // TODO: not sure how to incorporate url params like `:pageId`
            .post(config.auth.registrationValidation, auth.register);
        }
      }

      options.router.all(`/${config.slug}*`,
        bindModelMiddleware(model),
        setModelLocaleMiddleware()
      );

      options.router.route(`/${config.slug}`)
        .get(config.policies.read, query)
        .post(config.policies.create, create);

      options.router.route(`/${config.slug}/:id`)
        .get(config.policies.read, findOne)
        .put(config.policies.update, update)
        .delete(config.policies.destroy, destroy);
    });

    // Begin code for globals
    let globalSchemaGroups = {};
    const globalFields = {};
    let globalModel;
    options.config.globals && Object.keys(options.config.globals).forEach(key => {
      const config = options.config.globals[key];
      validateGlobal(config, this.globals);
      this.globals[config.label] = config;
      globalFields[config.slug] = {};

      if (config.media) {
        // TODO: handle media the same way as on a collection
      }

      config.fields.forEach(field => {
        const fieldSchema = fieldToSchemaMap[field.type];
        if (fieldSchema) globalFields[config.slug][field.name] = fieldSchema(field);
      });
      globalSchemaGroups[config.slug] = new mongoose.Schema(globalFields[config.slug], { _id : false });
  });

    if (options.config.globals) {
     globalModel = mongoose.model(
       'global',
       new mongoose.Schema({...globalSchemaGroups, timestamps: false})
         .plugin(localizationPlugin, options.config.localization)
         .plugin(autopopulate)
     );
    }

    options.router.all('/globals*',
      bindModelMiddleware(globalModel),
      setModelLocaleMiddleware()
    );

    options.router.route('/globals')
      .get(fetch)
      .post(upsert)
      .put(upsert);
  }
}

module.exports = Payload;
