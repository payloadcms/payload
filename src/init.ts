/* eslint-disable no-param-reassign */
import express, { NextFunction, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { InitOptions } from './config/types';

import authenticate from './express/middleware/authenticate';
import connectMongoose from './mongoose/connect';
import expressMiddleware from './express/middleware';
import initAdmin from './express/admin';
import initAuth from './auth/init';
import access from './auth/requestHandlers/access';
import initCollections from './collections/init';
import initPreferences from './preferences/init';
import initGlobals from './globals/init';
import initGraphQLPlayground from './graphql/initPlayground';
import initStatic from './express/static';
import registerSchema from './graphql/registerSchema';
import graphQLHandler from './graphql/graphQLHandler';
import buildEmail from './email/build';
import identifyAPI from './express/middleware/identifyAPI';
import errorHandler from './express/middleware/errorHandler';
import { PayloadRequest } from './express/types';
import sendEmail from './email/sendEmail';

import { serverInit as serverInitTelemetry } from './utilities/telemetry/events/serverInit';
import { Payload } from '.';
import loadConfig from './config/load';
import Logger from './utilities/logger';
import { getDataLoader } from './collections/dataloader';
import mountEndpoints from './express/mountEndpoints';

export const init = (payload: Payload, options: InitOptions): void => {
  payload.logger.info('Starting Payload...');
  if (!options.secret) {
    throw new Error(
      'Error: missing secret key. A secret key is needed to secure Payload.',
    );
  }

  if (options.mongoURL !== false && typeof options.mongoURL !== 'string') {
    throw new Error('Error: missing MongoDB connection URL.');
  }

  payload.emailOptions = { ...(options.email) };
  payload.secret = crypto
    .createHash('sha256')
    .update(options.secret)
    .digest('hex')
    .slice(0, 32);

  payload.local = options.local;

  payload.config = loadConfig(payload.logger);

  // If not initializing locally, scaffold router
  if (!payload.local) {
    payload.router = express.Router();
    payload.router.use(...expressMiddleware(payload));
    initAuth(payload);
  }

  // Configure email service
  payload.email = buildEmail(payload.emailOptions, payload.logger);
  payload.sendEmail = sendEmail.bind(payload);

  // Initialize collections & globals
  initCollections(payload);
  initGlobals(payload);

  if (!payload.config.graphQL.disable) {
    registerSchema(payload);
  }
  // If not initializing locally, set up HTTP routing
  if (!payload.local) {
    options.express.use((req: PayloadRequest, res, next) => {
      req.payload = payload;
      next();
    });

    options.express.use((req: PayloadRequest, res: Response, next: NextFunction): void => {
      req.payloadDataLoader = getDataLoader(req);
      return next();
    });

    payload.express = options.express;

    if (payload.config.rateLimit.trustProxy) {
      payload.express.set('trust proxy', 1);
    }

    initAdmin(payload);
    initPreferences(payload);

    payload.router.get('/access', access);

    if (!payload.config.graphQL.disable) {
      payload.router.use(
        payload.config.routes.graphQL,
        (req, res, next): void => {
          if (req.method === 'OPTIONS') {
            res.sendStatus(204);
          } else {
            next();
          }
        },
        identifyAPI('GraphQL'),
        (req: PayloadRequest, res: Response) => graphQLHandler(req, res)(req, res),
      );
      initGraphQLPlayground(payload);
    }

    mountEndpoints(options.express, payload.router, payload.config.endpoints);

    // Bind router to API
    payload.express.use(payload.config.routes.api, payload.router);

    // Enable static routes for all collections permitting upload
    initStatic(payload);

    payload.errorHandler = errorHandler(payload.config, payload.logger);
    payload.router.use(payload.errorHandler);

    payload.authenticate = authenticate(payload.config);
  }

  serverInitTelemetry(payload);
};

export const initAsync = async (payload: Payload, options: InitOptions): Promise<void> => {
  payload.logger = Logger('payload', options.loggerOptions);
  payload.mongoURL = options.mongoURL;

  if (payload.mongoURL) {
    mongoose.set('strictQuery', false);
    payload.mongoMemoryServer = await connectMongoose(payload.mongoURL, options.mongoOptions, payload.logger);
  }

  init(payload, options);

  if (typeof options.onInit === 'function') await options.onInit(payload);
  if (typeof payload.config.onInit === 'function') await payload.config.onInit(payload);
};

export const initSync = (payload: Payload, options: InitOptions): void => {
  payload.logger = Logger('payload', options.loggerOptions);
  payload.mongoURL = options.mongoURL;

  if (payload.mongoURL) {
    mongoose.set('strictQuery', false);
    connectMongoose(payload.mongoURL, options.mongoOptions, payload.logger);
  }

  init(payload, options);

  if (typeof options.onInit === 'function') options.onInit(payload);
  if (typeof payload.config.onInit === 'function') payload.config.onInit(payload);
};
