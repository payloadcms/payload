import bodyParser from 'body-parser'
import compression from 'compression'
import express from 'express'
import fileUpload from 'express-fileupload'
import rateLimit from 'express-rate-limit'
import methodOverride from 'method-override'
import passport from 'passport'
import qsMiddleware from 'qs-middleware'

import type { Payload } from '../../payload'
import type { PayloadRequest } from '../types'

import localizationMiddleware from '../../localization/middleware'
import authenticate from './authenticate'
import convertPayload from './convertPayload'
import corsHeaders from './corsHeaders'
import defaultPayload from './defaultPayload'
import { i18nMiddleware } from './i18n'
import identifyAPI from './identifyAPI'

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
    localizationMiddleware,
    express.json(payload.config.express.json),
    fileUpload({
      defParamCharset: 'utf8',
      parseNested: true,
      ...payload.config.upload,
    }),
    convertPayload,
    authenticate(payload.config),
    corsHeaders(payload.config),
    ...(payload.config.express.middleware || []),
    ...(payload.config.express.postMiddleware || []),
  ]
}

export default middleware
