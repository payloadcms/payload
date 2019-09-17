import mongoose from 'mongoose';
import passport from 'passport';
import express from 'express';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import jwtStrategy from './auth/jwt';
import User from '../demo/User/User.model';
import fileUpload from 'express-fileupload';
import mediaRoutes from './routes/media.routes';
import emailRoutes from './routes/email.routes';
import autopopulate from './plugins/autopopulate';
import paginate from './plugins/paginate';
import buildQuery from './plugins/buildQuery';
import internationalization from './plugins/internationalization';
import bindModel from './middleware/bindModel';
import locale from './middleware/locale';
import { query, create, findOne, destroy, update } from './requestHandlers';
import { schemaBaseFields } from './helpers/mongoose/schemaBaseFields';
import fieldToSchemaMap from './helpers/mongoose/fieldToSchemaMap';

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

    passport.use(options.user.createStrategy());
    passport.use(jwtStrategy(User));
    passport.serializeUser(options.user.serializeUser());
    passport.deserializeUser(options.user.deserializeUser());

    if (options.cors) {
      options.app.use((req, res, next) => {
        if (options.cors.indexOf(req.headers.origin) > -1) {
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

      const Schema = new mongoose.Schema({ ...schemaBaseFields }, { timestamps: true });
      Schema.plugin(paginate);
      Schema.plugin(buildQuery);
      Schema.plugin(internationalization, options.config.localization);
      Schema.plugin(autopopulate);

      config.fields.forEach(field => {
        const fieldSchema = fieldToSchemaMap[field.type];
        if (fieldSchema) Schema[field.name] = fieldSchema(field);
      });

      const model = mongoose.model(config.labels.singular, Schema);
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

    options.router.use('', emailRoutes(options.config.email, User));
  }
}

module.exports = Payload;
