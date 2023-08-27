/* eslint-disable no-param-reassign */
import express, { NextFunction, Response } from 'express';
import { InitOptions } from './config/types.js';

import authenticate from './express/middleware/authenticate.js';
import expressMiddleware from './express/middleware/index.js';
import initAdmin from './express/admin.js';
import initAuth from './auth/init.js';
import access from './auth/requestHandlers/access.js';
import initCollectionsHTTP from './collections/initHTTP.js';
import initGlobalsHTTP from './globals/initHTTP.js';
import initGraphQLPlayground from './graphql/initPlayground.js';
import initStatic from './express/static.js';
import graphQLHandler from './graphql/graphQLHandler.js';
import identifyAPI from './express/middleware/identifyAPI.js';
import errorHandler from './express/middleware/errorHandler.js';
import { PayloadRequest } from './express/types.js';
import { getDataLoader } from './collections/dataloader.js';
import mountEndpoints from './express/mountEndpoints.js';
import { getPayload, Payload } from './payload.js';

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

    await initAdmin(payload);

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
