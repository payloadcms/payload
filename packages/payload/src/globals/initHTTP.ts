import express from 'express';
import mountEndpoints from '../express/mountEndpoints.js';
import buildEndpoints from './buildEndpoints.js';
import { SanitizedGlobalConfig } from './config/types.js';
import { Payload } from '../payload.js';

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
