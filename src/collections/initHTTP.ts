import express from 'express';
import passport from 'passport';
import apiKeyStrategy from '../auth/strategies/apiKey';
import bindCollectionMiddleware from './bindCollection';
import { SanitizedCollectionConfig } from './config/types';
import mountEndpoints from '../express/mountEndpoints';
import buildEndpoints from './buildEndpoints';
import { Payload } from '../payload';

export default function initCollectionsHTTP(ctx: Payload): void {
  ctx.config.collections = ctx.config.collections.map((collection: SanitizedCollectionConfig) => {
    const formattedCollection = collection;

    const router = express.Router();
    const { slug } = collection;

    router.all('*', bindCollectionMiddleware(ctx.collections[formattedCollection.slug]));

    if (collection.auth) {
      const AuthCollection = ctx.collections[formattedCollection.slug];

      if (collection.auth.useAPIKey) {
        passport.use(`${AuthCollection.config.slug}-api-key`, apiKeyStrategy(ctx, AuthCollection));
      }

      if (Array.isArray(collection.auth.strategies)) {
        collection.auth.strategies.forEach(({ name, strategy }, index) => {
          const passportStrategy = typeof strategy === 'object' ? strategy : strategy(ctx);
          passport.use(`${AuthCollection.config.slug}-${name ?? index}`, passportStrategy);
        });
      }
    }

    const endpoints = buildEndpoints(collection);
    mountEndpoints(ctx.express, router, endpoints);

    ctx.router.use(`/${slug}`, router);

    return formattedCollection;
  });
}
