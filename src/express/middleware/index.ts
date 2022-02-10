import express from 'express';
import passport from 'passport';
import compression from 'compression';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import qsMiddleware from 'qs-middleware';
import fileUpload from 'express-fileupload';
import rateLimit from 'express-rate-limit';
import localizationMiddleware from '../../localization/middleware';
import authenticate from './authenticate';
import identifyAPI from './identifyAPI';
import { Payload } from '../..';
import { PayloadRequest } from '../types';
import corsHeaders from './corsHeaders';
import convertPayload from './convertPayload';

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

  return [
    rateLimit(rateLimitOptions),
    passport.initialize(),
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
  ];
};

export default middleware;
