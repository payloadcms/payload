import mongoose from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import express from 'express';
import passport from 'passport';
import passportLocalMongoose from 'passport-local-mongoose';
import Passport from 'passport-local';
import { UpdateQuery } from 'mongodb';
import { buildVersionCollectionFields } from '../versions/buildCollectionFields';
import buildQueryPlugin from '../mongoose/buildQuery';
import apiKeyStrategy from '../auth/strategies/apiKey';
import buildCollectionSchema from './buildSchema';
import buildSchema from '../mongoose/buildSchema';
import bindCollectionMiddleware from './bindCollection';
import { CollectionModel, SanitizedCollectionConfig } from './config/types';
import { Payload } from '../index';
import { getVersionsModelName } from '../versions/getVersionsModelName';

const LocalStrategy = Passport.Strategy;

export default function registerCollections(ctx: Payload): void {
  ctx.config.collections = ctx.config.collections.map((collection: SanitizedCollectionConfig) => {
    const formattedCollection = collection;

    const schema = buildCollectionSchema(formattedCollection, ctx.config);

    if (collection.auth) {
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
          if (this.loginAttempts + 1 >= maxLoginAttempts && !this.isLocked) {
            updates.$set = { lockUntil: Date.now() + lockTime };
          }
          return this.updateOne(updates as mongoose.Document, cb);
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

      router.all(`/${slug}*`, bindCollectionMiddleware(ctx.collections[formattedCollection.slug]));

      const {
        create,
        find,
        update,
        findByID,
        findVersions,
        findVersionByID,
        restoreVersion,
        delete: deleteHandler,
      } = ctx.requestHandlers.collections;

      if (collection.auth) {
        const AuthCollection = ctx.collections[formattedCollection.slug];
        passport.use(new LocalStrategy(AuthCollection.Model.authenticate()));

        if (collection.auth.useAPIKey) {
          passport.use(`${AuthCollection.config.slug}-api-key`, apiKeyStrategy(ctx, AuthCollection));
        }

        const {
          init,
          login,
          logout,
          refresh,
          me,
          registerFirstUser,
          forgotPassword,
          resetPassword,
          verifyEmail,
          unlock,
        } = ctx.requestHandlers.collections.auth;

        if (collection.auth.verify) {
          router
            .route(`/${slug}/verify/:token`)
            .post(verifyEmail);
        }

        if (collection.auth.maxLoginAttempts > 0) {
          router
            .route(`/${slug}/unlock`)
            .post(unlock);
        }

        router
          .route(`/${slug}/init`)
          .get(init);

        router
          .route(`/${slug}/login`)
          .post(login);

        router
          .route(`/${slug}/logout`)
          .post(logout);

        router
          .route(`/${slug}/refresh-token`)
          .post(refresh);

        router
          .route(`/${slug}/me`)
          .get(me);

        router
          .route(`/${slug}/first-register`)
          .post(registerFirstUser);

        router
          .route(`/${slug}/forgot-password`)
          .post(forgotPassword);

        router
          .route(`/${slug}/reset-password`)
          .post(resetPassword);
      }

      if (collection.versions) {
        router.route(`/${slug}/versions`)
          .get(findVersions);

        router.route(`/${slug}/versions/:id`)
          .get(findVersionByID)
          .post(restoreVersion);
      }

      router.route(`/${slug}`)
        .get(find)
        .post(create);

      router.route(`/${slug}/:id`)
        .put(update)
        .get(findByID)
        .delete(deleteHandler);

      ctx.router.use(router);
    }

    return formattedCollection;
  });
}
