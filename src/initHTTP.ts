/* eslint-disable no-param-reassign */
import express, { NextFunction, Response } from 'express';
import { InitOptions } from './config/types';

import authenticate from './express/middleware/authenticate';
import expressMiddleware from './express/middleware';
import initAdmin from './express/admin';
import initAuth from './auth/init';
import access from './auth/requestHandlers/access';
import initCollectionsHTTP from './collections/initHTTP';
import initPreferences from './preferences/init';
import initGlobalsHTTP from './globals/initHTTP';
import initGraphQLPlayground from './graphql/initPlayground';
import initStatic from './express/static';
import graphQLHandler from './graphql/graphQLHandler';
import identifyAPI from './express/middleware/identifyAPI';
import errorHandler from './express/middleware/errorHandler';
import { PayloadRequest } from './express/types';
import { getDataLoader } from './collections/dataloader';
import mountEndpoints from './express/mountEndpoints';
import { getPayload, Payload } from './payload';

export const initHTTP = async (options: InitOptions): Promise<Payload> => {
  if (typeof options.local === 'undefined') options.local = false;
  const payload = await getPayload(options);

  if (!options.local) {
    payload.router = express.Router();
    payload.router.use(...expressMiddleware(payload));
    initAuth(payload);

    initCollectionsHTTP(payload);
    initGlobalsHTTP(payload);

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
        (req: PayloadRequest, res: Response, next) => graphQLHandler(req, res)(req, res, next),
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

  return payload;
};
