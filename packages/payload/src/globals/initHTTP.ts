import express from 'express';

import type { Payload } from '../payload.js';
import type { SanitizedGlobalConfig } from './config/types.js';

import mountEndpoints from '../express/mountEndpoints.js';
import buildEndpoints from './buildEndpoints.js';

export default function initGlobals(ctx: Payload): void {
  if (ctx.config.globals) {
    ctx.config.globals.forEach((global: SanitizedGlobalConfig) => {
      const router = express.Router();
      const { slug } = global;

      const endpoints = buildEndpoints(global);
      mountEndpoints(ctx.express, router, endpoints);

      ctx.router.use(`/globals/${slug}`, router);
    });
  }
}
