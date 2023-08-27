import express from 'express';
import passport from 'passport';
import compression from 'compression';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import qsMiddleware from 'qs-middleware';
import fileUpload from 'express-fileupload';
import rateLimit from 'express-rate-limit';
import localizationMiddleware from '../../localization/middleware.js';
import authenticate from './authenticate.js';
import identifyAPI from './identifyAPI.js';
import { Payload } from '../../payload.js';
import { PayloadRequest } from '../types.js';
import corsHeaders from './corsHeaders.js';
import convertPayload from './convertPayload.js';
import { i18nMiddleware } from './i18n.js';
import defaultPayload from './defaultPayload.js';

const middleware = (payload: Payload): any => {
  const rateLimitOptions: {
    windowMs?: number
    max?: number
    skip?: (req: PayloadRequest) => boolean
  } = {
    windowMs: payload.config.rateLimit.window,
    max: payload.config.rateLimit.max,
  };

  if (typeof payload.config.rateLimit.skip === 'function') rateLimitOptions.skip = payload.config.rateLimit.skip;

  if (payload.config.express.middleware?.length) {
    payload.logger.warn('express.middleware is deprecated. Please migrate to express.postMiddleware.');
  }

  return [
    defaultPayload,
    ...(payload.config.express.preMiddleware || []),
    rateLimit(rateLimitOptions),
    passport.initialize(),
    i18nMiddleware(payload.config.i18n as any),
    identifyAPI('REST'),
    methodOverride('X-HTTP-Method-Override'),
    qsMiddleware({ depth: 10, arrayLimit: 1000 }),
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
  ];
};

export default middleware;
