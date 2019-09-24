import mongoose from 'mongoose';
import passport from 'passport';
import express from 'express';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import jwtStrategy from './auth/jwt';
import fileUpload from 'express-fileupload';
import mediaRoutes from './routes/media.routes';
import emailRoutes from './auth/passwordResets/email.routes';
import autopopulate from './plugins/autopopulate';
import paginate from './plugins/paginate';
import buildQuery from './plugins/buildQuery';
import internationalization from './plugins/internationalization';
import { bindModel, locale, checkRole } from './middleware';
import { query, create, findOne, destroy, update } from './requestHandlers';
import { schemaBaseFields } from './helpers/mongoose/schemaBaseFields';
import fieldToSchemaMap from './helpers/mongoose/fieldToSchemaMap';
import authValidate from './auth/validate';
import authRequestHandlers from './auth/requestHandlers';
import passwordResetConfig from './auth/passwordResets/passwordReset.config';
import validateConfig from './lib/validateConfig';

class Payload {

  models = {};

  constructor(options) {
    mongoose.connect(options.config.mongoURL, { useNewUrlParser: true }, (err) => {
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

    options.router.use(options.config.staticUrl, mediaRoutes(options.config));

    options.app.use(express.json());
    options.app.use(methodOverride('X-HTTP-Method-Override'));
    options.app.use(express.urlencoded({ extended: true }));
    options.app.use(bodyParser.urlencoded({ extended: true }));
    options.app.use(locale(options.config.localization));
    options.app.use(options.router);

    // TODO: Build safe config before initializing models and routes

    options.models && options.models.forEach(config => {
      validateConfig(config, this.models);
      // TODO: consider making schemaBaseFields a mongoose plugin for consistency
      const fields = { ...schemaBaseFields };

      if (config.auth && config.auth.passwordResets) {
        config.fields.push(...passwordResetConfig.fields);
      }

      config.fields.forEach(field => {
        const fieldSchema = fieldToSchemaMap[field.type];
        if (fieldSchema) fields[field.name] = fieldSchema(field);
      });

      const Schema = new mongoose.Schema(fields, { timestamps: config.timestamps });

      Schema.plugin(paginate);
      Schema.plugin(buildQuery);
      Schema.plugin(internationalization, options.config.localization);
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
            .get(passport.authenticate(config.auth.strategy, { session: false }), checkRole(role), auth.me);
        });

        // password resets
        if (config.auth.passwordResets) {
          options.router.use('', emailRoutes(options.config.email, model));
        }

        if (config.auth.registration) {
          options.router
            .route('/' + config.slug + '/register') // TODO: not sure how to incorporate url params like `:pageId`
            .post(config.auth.registrationValidation, auth.register);
        }
      }

      this.models[config.labels.singular] = model;
      options.router.all(`/${config.slug}*`, bindModel(model));

      options.router.route(`/${config.slug}`)
        .get(config.policies.read, query)
        .post(config.policies.create, create);

      options.router.route(`/${config.slug}/:id`)
        .get(config.policies.read, findOne)
        .put(config.policies.update, update)
        .delete(config.policies.destroy, destroy);
    });
  }
}

module.exports = Payload;
