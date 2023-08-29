import express from 'express';
import passport from 'passport';

import type { Payload } from '../payload.js';
import type { SanitizedCollectionConfig } from './config/types.js';

import apiKeyStrategy from '../auth/strategies/apiKey.js';
import mountEndpoints from '../express/mountEndpoints.js';
import bindCollectionMiddleware from './bindCollection.js';
import buildEndpoints from './buildEndpoints.js';

export default function initCollectionsHTTP(ctx: Payload): void {
  ctx.config.collections = ctx.config.collections.map((collection: SanitizedCollectionConfig) => {
    const formattedCollection = collection;

    const router = express.Router();
    const { slug } = collection;

    router.all('*', bindCollectionMiddleware(ctx.collections[formattedCollection.slug]));

    if (collection.auth) {
      const { config } = ctx.collections[formattedCollection.slug];

      if (collection.auth.useAPIKey) {
        passport.use(`${config.slug}-api-key`, apiKeyStrategy(ctx, config));
      }

      if (Array.isArray(collection.auth.strategies)) {
        collection.auth.strategies.forEach(({ name, strategy }, index) => {
          const passportStrategy = typeof strategy === 'object' ? strategy : strategy(ctx);
          passport.use(`${config.slug}-${name ?? index}`, passportStrategy);
        });
      }
    }

    const endpoints = buildEndpoints(collection);
    mountEndpoints(ctx.express, router, endpoints);

    ctx.router.use(`/${slug}`, router);

    return formattedCollection;
  });
}
