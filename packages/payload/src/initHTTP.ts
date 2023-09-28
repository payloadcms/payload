/* eslint-disable no-param-reassign */
import type { NextFunction, Response } from 'express'

import express from 'express'

import type { InitOptions } from './config/types'
import type { PayloadRequest } from './express/types'
import type { Payload } from './payload'

import initAuth from './auth/init'
import access from './auth/requestHandlers/access'
import { getDataLoader } from './collections/dataloader'
import initCollectionsHTTP from './collections/initHTTP'
import initAdmin from './express/admin'
import expressMiddleware from './express/middleware'
import authenticate from './express/middleware/authenticate'
import errorHandler from './express/middleware/errorHandler'
import identifyAPI from './express/middleware/identifyAPI'
import mountEndpoints from './express/mountEndpoints'
import initStatic from './express/static'
import initGlobalsHTTP from './globals/initHTTP'
import graphQLHandler from './graphql/graphQLHandler'
import initGraphQLPlayground from './graphql/initPlayground'
import { getPayload } from './payload'

export const initHTTP = async (incomingOptions: InitOptions): Promise<Payload> => {
  const options = { ...incomingOptions }
  if (typeof options.local === 'undefined') options.local = false

  // Disable onInit because it will be called in top-level Payload
  options.disableOnInit = true

  const payload = await getPayload(options)

  if (!options.local) {
    payload.router = express.Router()
    payload.router.use(...expressMiddleware(payload))
    initAuth(payload)

    initCollectionsHTTP(payload)
    initGlobalsHTTP(payload)

    options.express.use((req: PayloadRequest, res, next) => {
      req.payload = payload
      next()
    })

    options.express.use((req: PayloadRequest, res: Response, next: NextFunction): void => {
      req.payloadDataLoader = getDataLoader(req)
      return next()
    })

    payload.express = options.express

    if (payload.config.rateLimit.trustProxy) {
      payload.express.set('trust proxy', 1)
    }

    await initAdmin(payload)

    payload.router.get('/access', access)

    if (!payload.config.graphQL.disable) {
      payload.router.use(
        payload.config.routes.graphQL,
        (req, res, next): void => {
          if (req.method === 'OPTIONS') {
            res.sendStatus(204)
          } else {
            next()
          }
        },
        identifyAPI('GraphQL'),
        (req: PayloadRequest, res: Response, next) => graphQLHandler(req, res)(req, res, next),
      )
      initGraphQLPlayground(payload)
    }

    mountEndpoints(options.express, payload.router, payload.config.endpoints)

    // Bind router to API
    payload.express.use(payload.config.routes.api, payload.router)

    // Enable static routes for all collections permitting upload
    initStatic(payload)

    payload.errorHandler = errorHandler(payload.config, payload.logger)
    payload.router.use(payload.errorHandler)

    payload.authenticate = authenticate(payload.config)
  }

  return payload
}
