import bodyParser from 'body-parser'
import compression from 'compression'
import express from 'express'
import fileUpload from 'express-fileupload'
import rateLimit from 'express-rate-limit'
import methodOverride from 'method-override'
import passport from 'passport'
import qsMiddleware from 'qs-middleware'

import type { Payload } from '../../payload.js'
import type { PayloadRequest } from '../types.js'

import localizationMiddleware from '../../localization/middleware.js'
import authenticate from './authenticate.js'
import convertPayload from './convertPayload.js'
import corsHeaders from './corsHeaders.js'
import defaultPayload from './defaultPayload.js'
import { i18nMiddleware } from './i18n.js'
import identifyAPI from './identifyAPI.js'

const middleware = (payload: Payload): any => {
  const rateLimitOptions: {
    max?: number
    skip?: (req: PayloadRequest) => boolean
    windowMs?: number
  } = {
    max: payload.config.rateLimit.max,
    windowMs: payload.config.rateLimit.window,
  }

  if (typeof payload.config.rateLimit.skip === 'function')
    rateLimitOptions.skip = payload.config.rateLimit.skip

  if (payload.config.express.middleware?.length) {
    payload.logger.warn(
      'express.middleware is deprecated. Please migrate to express.postMiddleware.',
    )
  }

  return [
    defaultPayload,
    ...(payload.config.express.preMiddleware || []),
    rateLimit(rateLimitOptions),
    passport.initialize(),
    i18nMiddleware(payload.config.i18n),
    identifyAPI('REST'),
    methodOverride('X-HTTP-Method-Override'),
    qsMiddleware({ arrayLimit: 1000, depth: 10 }),
    bodyParser.urlencoded({ extended: true }),
    compression(payload.config.express.compression),
    localizationMiddleware(payload.config.localization),
    express.json(payload.config.express.json),
    fileUpload({
      parseNested: true,
      ...payload.config.upload,
    }),
    convertPayload,
    corsHeaders(payload.config),
    authenticate(payload.config),
    ...(payload.config.express.middleware || []),
    ...(payload.config.express.postMiddleware || []),
  ]
}

export default middleware
