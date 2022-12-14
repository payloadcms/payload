import mongoose, { UpdateAggregationStage, UpdateQuery } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import express from 'express';
import passport from 'passport';
import passportLocalMongoose from 'passport-local-mongoose';
import { buildVersionCollectionFields } from '../versions/buildCollectionFields';
import buildQueryPlugin from '../mongoose/buildQuery';
import apiKeyStrategy from '../auth/strategies/apiKey';
import buildCollectionSchema from './buildSchema';
import buildSchema from '../mongoose/buildSchema';
import bindCollectionMiddleware from './bindCollection';
import { CollectionModel, SanitizedCollectionConfig } from './config/types';
import { Payload } from '../index';
import { getVersionsModelName } from '../versions/getVersionsModelName';
import mountEndpoints from '../express/mountEndpoints';
import buildEndpoints from './buildEndpoints';

export default function registerCollections(ctx: Payload): void {
  ctx.config.collections = ctx.config.collections.map((collection: SanitizedCollectionConfig) => {
    const formattedCollection = collection;

    const schema = buildCollectionSchema(formattedCollection, ctx.config);

    if (collection.auth && !collection.auth.disableLocalStrategy) {
      schema.plugin(passportLocalMongoose, {
        usernameField: 'email',
      });


      const { maxLoginAttempts, lockTime } = collection.auth;

      if (maxLoginAttempts > 0) {
        type LoginSchema = {
          loginAttempts: number
          lockUntil: number
          isLocked: boolean
        };

        // eslint-disable-next-line func-names
        schema.methods.incLoginAttempts = function (this: mongoose.Document & LoginSchema, cb) {
          // Expired lock, restart count at 1
          if (this.lockUntil && this.lockUntil < Date.now()) {
            return this.updateOne({
              $set: { loginAttempts: 1 },
              $unset: { lockUntil: 1 },
            }, cb);
          }

          const updates: UpdateQuery<LoginSchema> = { $inc: { loginAttempts: 1 } };
          // Lock the account if at max attempts and not already locked
          if (this.loginAttempts + 1 >= maxLoginAttempts) {
            updates.$set = { lockUntil: Date.now() + lockTime };
          }
          return this.updateOne(updates as UpdateAggregationStage, cb);
        };

        // eslint-disable-next-line func-names
        schema.methods.resetLoginAttempts = function (cb) {
          return this.updateOne({
            $set: { loginAttempts: 0 },
            $unset: { lockUntil: 1 },
          }, cb);
        };
      }
    }

    if (collection.versions) {
      const versionModelName = getVersionsModelName(collection);

      const versionSchema = buildSchema(
        ctx.config,
        buildVersionCollectionFields(collection),
        {
          disableUnique: true,
          draftsEnabled: true,
          options: {
            timestamps: true,
          },
        },
      );

      versionSchema.plugin(paginate, { useEstimatedCount: true })
        .plugin(buildQueryPlugin);

      ctx.versions[collection.slug] = mongoose.model(versionModelName, versionSchema) as CollectionModel;
    }


    ctx.collections[formattedCollection.slug] = {
      Model: mongoose.model(formattedCollection.slug, schema) as CollectionModel,
      config: formattedCollection,
    };

    // If not local, open routes
    if (!ctx.local) {
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
    }

    return formattedCollection;
  });
}
